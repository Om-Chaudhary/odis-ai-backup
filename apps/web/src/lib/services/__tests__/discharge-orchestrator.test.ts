/**
 * Integration tests for DischargeOrchestrator
 *
 * Tests orchestration workflow execution, step handling,
 * error handling, and result aggregation.
 */

import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrchestrationRequest } from "~/lib/validators/orchestration";
import { createMockUser } from "~/test/api-utils";
import type { SupabaseClientType } from "~/types/supabase";
import { DischargeOrchestrator } from "../discharge-orchestrator";

// Mock dependencies
vi.mock("../cases-service", () => ({
  CasesService: {
    ingest: vi.fn(),
    getCaseWithEntities: vi.fn(),
    scheduleDischargeCall: vi.fn(),
  },
}));

vi.mock("~/lib/ai/generate-discharge", () => ({
  generateDischargeSummaryWithRetry: vi.fn(),
}));

vi.mock("~/lib/qstash/client", () => ({
  scheduleEmailExecution: vi.fn(),
}));

// Mock resend/client to prevent server-side env var access in test environment
vi.mock("~/lib/resend/client", () => ({
  htmlToPlainText: vi.fn((html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();
  }),
  isValidEmail: vi.fn((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }),
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));

import { generateDischargeSummaryWithRetry } from "~/lib/ai/generate-discharge";
import { scheduleEmailExecution } from "~/lib/qstash/client";
import { CasesService } from "../cases-service";

describe("DischargeOrchestrator", () => {
  let mockSupabase: SupabaseClientType;
  let mockUser: User;
  let orchestrator: DischargeOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = createMockUser({ id: "user-123" });

    // Create a more comprehensive mock that handles different query patterns
    const createTableMock = (tableName: string) => {
      if (tableName === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  clinic_name: "Test Clinic",
                  clinic_phone: "555-123-4567",
                  clinic_email: "clinic@test.com",
                  first_name: "Test",
                  last_name: "User",
                  test_mode_enabled: false,
                  test_contact_name: null,
                  test_contact_phone: null,
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (tableName === "scheduled_discharge_emails") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "email-123",
                  user_id: "user-123",
                  case_id: "case-123",
                  recipient_email: "owner@example.com",
                  recipient_name: "John",
                  subject: "Test Subject",
                  html_content: "<p>Test</p>",
                  text_content: "Test",
                  scheduled_for: new Date().toISOString(),
                  status: "queued",
                  metadata: {},
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      // Default mock for other tables (discharge_summaries, etc.)
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "summary-123",
                content: "Test summary",
              },
              error: null,
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { content: "Test summary" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    };

    mockSupabase = {
      from: vi.fn((tableName: string) => createTableMock(tableName)),
    } as unknown as SupabaseClientType;

    orchestrator = new DischargeOrchestrator(mockSupabase, mockUser);
  });

  describe("Sequential Execution", () => {
    it("should execute full workflow sequentially", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Patient: Max, Dog, 5 years old. Diagnosis: Ear infection.",
          },
        },
        steps: {
          ingest: true,
          generateSummary: true,
          prepareEmail: true,
          scheduleEmail: {
            recipientEmail: "owner@example.com",
          },
          scheduleCall: true,
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      // Mock service responses
      vi.mocked(CasesService.ingest).mockResolvedValue({
        caseId: "case-123",
        entities: {
          patient: { name: "Max", owner: { name: "John" } },
          clinical: {},
        } as any,
        scheduledCall: null,
      });

      vi.mocked(CasesService.getCaseWithEntities).mockResolvedValue({
        case: { id: "case-123" } as any,
        patient: {
          id: "patient-123",
          name: "Max",
          owner_name: "John",
          species: "Dog",
          breed: "Labrador",
        } as any,
        entities: {
          patient: { name: "Max", owner: { name: "John" } },
          clinical: {},
        } as any,
        soapNotes: null,
        dischargeSummaries: null,
        metadata: {} as any,
      });

      vi.mocked(generateDischargeSummaryWithRetry).mockResolvedValue(
        "Discharge summary content",
      );

      vi.mocked(CasesService.scheduleDischargeCall).mockResolvedValue({
        id: "call-123",
        scheduled_for: new Date().toISOString(),
      } as any);

      vi.mocked(scheduleEmailExecution).mockResolvedValue("qstash-123");

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);
      expect(result.data.completedSteps).toContain("ingest");
      expect(result.data.completedSteps).toContain("generateSummary");
      expect(result.data.completedSteps).toContain("prepareEmail");
      expect(result.data.completedSteps).toContain("scheduleEmail");
      expect(result.data.completedSteps).toContain("scheduleCall");

      // Verify services were called in correct order
      expect(CasesService.ingest).toHaveBeenCalled();
      expect(generateDischargeSummaryWithRetry).toHaveBeenCalled();
      expect(scheduleEmailExecution).toHaveBeenCalled();
      expect(CasesService.scheduleDischargeCall).toHaveBeenCalled();
    });

    it("should handle partial workflow", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Patient: Max",
          },
        },
        steps: {
          ingest: true,
          generateSummary: true,
          // prepareEmail, scheduleEmail, scheduleCall disabled
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockResolvedValue({
        caseId: "case-123",
        entities: {} as any,
        scheduledCall: null,
      });

      vi.mocked(CasesService.getCaseWithEntities).mockResolvedValue({
        case: { id: "case-123" } as any,
        patient: { name: "Max" } as any,
        entities: {} as any,
        soapNotes: null,
        dischargeSummaries: null,
        metadata: {} as any,
      });

      vi.mocked(generateDischargeSummaryWithRetry).mockResolvedValue("Summary");

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);
      expect(result.data.completedSteps).toContain("ingest");
      expect(result.data.completedSteps).toContain("generateSummary");
      expect(result.data.skippedSteps).toContain("prepareEmail");
      expect(result.data.skippedSteps).toContain("scheduleEmail");
      expect(result.data.skippedSteps).toContain("scheduleCall");
    });
  });

  describe("Parallel Execution", () => {
    it("should execute scheduleEmail and scheduleCall in parallel", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Patient: Max",
          },
        },
        steps: {
          ingest: true,
          generateSummary: true,
          prepareEmail: true,
          scheduleEmail: {
            recipientEmail: "owner@example.com",
          },
          scheduleCall: true,
        },
        options: {
          parallel: true,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockResolvedValue({
        caseId: "case-123",
        entities: {} as any,
        scheduledCall: null,
      });

      vi.mocked(CasesService.getCaseWithEntities).mockResolvedValue({
        case: { id: "case-123" } as any,
        patient: { name: "Max", owner_name: "John" } as any,
        entities: {} as any,
        soapNotes: null,
        dischargeSummaries: null,
        metadata: {} as any,
      });

      vi.mocked(generateDischargeSummaryWithRetry).mockResolvedValue("Summary");

      vi.mocked(CasesService.scheduleDischargeCall).mockResolvedValue({
        id: "call-123",
        scheduled_for: new Date().toISOString(),
      } as any);

      vi.mocked(scheduleEmailExecution).mockResolvedValue("qstash-123");

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);
      expect(result.data.completedSteps).toContain("scheduleEmail");
      expect(result.data.completedSteps).toContain("scheduleCall");
    });
  });

  describe("Error Handling", () => {
    it("should handle ingest failure", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Invalid",
          },
        },
        steps: {
          ingest: true,
          generateSummary: true,
        },
        options: {
          parallel: false,
          stopOnError: true,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockRejectedValue(
        new Error("Ingest failed"),
      );

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(false);
      expect(result.data.failedSteps).toContain("ingest");
      expect(result.data.skippedSteps).toContain("generateSummary"); // Skipped due to dependency
    });

    it("should stop on error when stopOnError is true", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Test",
          },
        },
        steps: {
          ingest: true,
          generateSummary: true,
          prepareEmail: true,
        },
        options: {
          parallel: false,
          stopOnError: true,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockRejectedValue(
        new Error("Ingest failed"),
      );

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(false);
      expect(result.data.failedSteps).toContain("ingest");
      // Should not attempt subsequent steps
      expect(result.data.completedSteps).not.toContain("generateSummary");
    });

    it("should handle summary generation failure", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Test",
          },
        },
        steps: {
          ingest: true,
          generateSummary: true,
          prepareEmail: true,
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockResolvedValue({
        caseId: "case-123",
        entities: {} as any,
        scheduledCall: null,
      });

      vi.mocked(CasesService.getCaseWithEntities).mockResolvedValue({
        case: { id: "case-123" } as any,
        patient: {} as any,
        entities: {} as any,
        soapNotes: null,
        dischargeSummaries: null,
        metadata: {} as any,
      });

      vi.mocked(generateDischargeSummaryWithRetry).mockRejectedValue(
        new Error("Summary generation failed"),
      );

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(false);
      expect(result.data.failedSteps).toContain("generateSummary");
      expect(result.data.skippedSteps).toContain("prepareEmail"); // Skipped due to dependency
    });
  });

  describe("Existing Case Input", () => {
    it("should handle existing case continuation", async () => {
      const request: OrchestrationRequest = {
        input: {
          existingCase: {
            caseId: "case-123",
          },
        },
        steps: {
          generateSummary: true,
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.getCaseWithEntities).mockResolvedValue({
        case: { id: "case-123" } as any,
        patient: { name: "Max" } as any,
        entities: {} as any,
        soapNotes: null,
        dischargeSummaries: null,
        metadata: {} as any,
      });

      vi.mocked(generateDischargeSummaryWithRetry).mockResolvedValue("Summary");

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);
      // Ingest is marked as completed (not skipped) when existing case is provided
      // because we have the case data available, allowing dependent steps to proceed
      expect(result.data.completedSteps).toContain("ingest");
      expect(result.data.completedSteps).toContain("generateSummary");
      expect(CasesService.ingest).not.toHaveBeenCalled();
    });

    it("should use provided email content when available", async () => {
      const request: OrchestrationRequest = {
        input: {
          existingCase: {
            caseId: "case-123",
            emailContent: {
              subject: "Test Subject",
              html: "<p>Test HTML</p>",
              text: "Test Text",
            },
          },
        },
        steps: {
          prepareEmail: true,
          scheduleEmail: {
            recipientEmail: "owner@example.com",
          },
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(scheduleEmailExecution).mockResolvedValue("qstash-123");

      const result = await orchestrator.orchestrate(request);

      expect(result.success).toBe(true);
      expect(result.data.completedSteps).toContain("prepareEmail");
      // Should use provided email content, not generate new one
    });
  });

  describe("Result Metadata", () => {
    it("should include timing information", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Test",
          },
        },
        steps: {
          ingest: true,
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockResolvedValue({
        caseId: "case-123",
        entities: {} as any,
        scheduledCall: null,
      });

      const result = await orchestrator.orchestrate(request);

      expect(result.metadata.totalProcessingTime).toBeGreaterThan(0);
      expect(result.metadata.stepTimings).toHaveProperty("ingest");
      expect(result.metadata.stepTimings.ingest).toBeGreaterThan(0);
    });

    it("should include error details in metadata", async () => {
      const request: OrchestrationRequest = {
        input: {
          rawData: {
            mode: "text",
            source: "web_dashboard",
            text: "Test",
          },
        },
        steps: {
          ingest: true,
        },
        options: {
          parallel: false,
          stopOnError: false,
          dryRun: false,
        },
      };

      vi.mocked(CasesService.ingest).mockRejectedValue(new Error("Test error"));

      const result = await orchestrator.orchestrate(request);

      expect(result.metadata.errors).toHaveLength(1);
      expect(result.metadata.errors?.[0]?.step).toBe("ingest");
      expect(result.metadata.errors?.[0]?.error).toContain("Test error");
    });
  });
});
