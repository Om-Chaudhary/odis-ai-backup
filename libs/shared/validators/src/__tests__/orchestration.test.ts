/**
 * Tests for Orchestration Request Validation Schemas
 */

import { describe, it, expect } from "vitest";
import { OrchestrationRequestSchema } from "../orchestration";

describe("OrchestrationRequestSchema", () => {
  describe("raw data input", () => {
    describe("valid inputs", () => {
      it("accepts raw text data input", () => {
        const validRequest = {
          input: {
            rawData: {
              mode: "text" as const,
              source: "manual" as const,
              text: "Sample clinical text",
            },
          },
          steps: {
            ingest: true,
          },
        };
        const result = OrchestrationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it("accepts raw structured data input", () => {
        const validRequest = {
          input: {
            rawData: {
              mode: "structured" as const,
              source: "idexx_neo" as const,
              data: {
                patient: "Max",
                diagnosis: "Ear infection",
              },
            },
          },
          steps: {
            ingest: true,
          },
        };
        const result = OrchestrationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it("accepts all valid source values", () => {
        const sources = [
          "manual",
          "mobile_app",
          "web_dashboard",
          "idexx_neo",
          "idexx_extension",
          "ezyvet_api",
        ] as const;

        sources.forEach((source) => {
          const result = OrchestrationRequestSchema.safeParse({
            input: {
              rawData: {
                mode: "text",
                source,
                text: "Test text",
              },
            },
            steps: { ingest: true },
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe("invalid inputs", () => {
      it("rejects invalid mode", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            rawData: {
              mode: "invalid",
              source: "manual",
              text: "Test",
            },
          },
          steps: { ingest: true },
        });
        expect(result.success).toBe(false);
      });

      it("rejects invalid source", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            rawData: {
              mode: "text",
              source: "invalid_source",
              text: "Test",
            },
          },
          steps: { ingest: true },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("existing case input", () => {
    describe("valid inputs", () => {
      it("accepts valid existing case input with case ID only", () => {
        const validRequest = {
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            generateSummary: true,
          },
        };
        const result = OrchestrationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it("accepts existing case with summary ID", () => {
        const validRequest = {
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
              summaryId: "123e4567-e89b-12d3-a456-426614174001",
            },
          },
          steps: {
            prepareEmail: true,
          },
        };
        const result = OrchestrationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it("accepts existing case with email content", () => {
        const validRequest = {
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
              emailContent: {
                subject: "Discharge Instructions",
                html: "<p>Instructions here</p>",
                text: "Instructions here",
              },
            },
          },
          steps: {
            scheduleEmail: true,
          },
        };
        const result = OrchestrationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("rejects invalid case ID UUID", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "not-a-uuid",
            },
          },
          steps: { generateSummary: true },
        });
        expect(result.success).toBe(false);
      });

      it("rejects invalid summary ID UUID", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
              summaryId: "not-a-uuid",
            },
          },
          steps: { prepareEmail: true },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("step configurations", () => {
    describe("ingest step", () => {
      it("accepts boolean true", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            rawData: {
              mode: "text",
              source: "manual",
              text: "Test",
            },
          },
          steps: { ingest: true },
        });
        expect(result.success).toBe(true);
      });

      it("accepts boolean false", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            rawData: {
              mode: "text",
              source: "manual",
              text: "Test",
            },
          },
          steps: { ingest: false },
        });
        expect(result.success).toBe(true);
      });

      it("accepts object with options", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            rawData: {
              mode: "text",
              source: "manual",
              text: "Test",
            },
          },
          steps: {
            ingest: {
              options: {
                extractEntities: true,
                skipDuplicateCheck: false,
              },
            },
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe("extractEntities step", () => {
      it("accepts boolean", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: { extractEntities: true },
        });
        expect(result.success).toBe(true);
      });

      it("accepts object with forceRefresh", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            extractEntities: {
              forceRefresh: true,
            },
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe("generateSummary step", () => {
      it("accepts boolean", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: { generateSummary: true },
        });
        expect(result.success).toBe(true);
      });

      it("accepts object with templateId", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            generateSummary: {
              templateId: "123e4567-e89b-12d3-a456-426614174002",
              useLatestEntities: true,
            },
          },
        });
        expect(result.success).toBe(true);
      });

      it("rejects invalid templateId UUID", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            generateSummary: {
              templateId: "not-a-uuid",
            },
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe("prepareEmail step", () => {
      it("accepts boolean", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: { prepareEmail: true },
        });
        expect(result.success).toBe(true);
      });

      it("accepts object with templateId", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            prepareEmail: {
              templateId: "123e4567-e89b-12d3-a456-426614174002",
            },
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe("scheduleEmail step", () => {
      it("accepts boolean", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: { scheduleEmail: true },
        });
        expect(result.success).toBe(true);
      });

      it("accepts object with email and schedule", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            scheduleEmail: {
              recipientEmail: "owner@example.com",
              scheduledFor: new Date(),
            },
          },
        });
        expect(result.success).toBe(true);
      });

      it("rejects invalid email", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            scheduleEmail: {
              recipientEmail: "not-an-email",
            },
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe("scheduleCall step", () => {
      it("accepts boolean", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: { scheduleCall: true },
        });
        expect(result.success).toBe(true);
      });

      it("accepts object with phone and schedule", () => {
        const result = OrchestrationRequestSchema.safeParse({
          input: {
            existingCase: {
              caseId: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
          steps: {
            scheduleCall: {
              phoneNumber: "+15551234567",
              scheduledFor: new Date(),
            },
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("options", () => {
    it("accepts default options", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
        steps: { ingest: true },
        options: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options?.stopOnError).toBe(false);
        expect(result.data.options?.parallel).toBe(true);
        expect(result.data.options?.dryRun).toBe(false);
      }
    });

    it("accepts custom options", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
        steps: { ingest: true },
        options: {
          stopOnError: true,
          parallel: false,
          dryRun: true,
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options?.stopOnError).toBe(true);
        expect(result.data.options?.parallel).toBe(false);
        expect(result.data.options?.dryRun).toBe(true);
      }
    });

    it("accepts partial options", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
        steps: { ingest: true },
        options: {
          stopOnError: true,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("complete workflows", () => {
    it("accepts complete ingestion workflow", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "idexx_extension",
            text: "Patient visit notes...",
          },
        },
        steps: {
          ingest: true,
          extractEntities: true,
          generateSummary: true,
          prepareEmail: true,
          scheduleEmail: {
            recipientEmail: "owner@example.com",
            scheduledFor: new Date(),
          },
          scheduleCall: {
            phoneNumber: "+15551234567",
            scheduledFor: new Date(),
          },
        },
        options: {
          stopOnError: true,
          parallel: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts existing case workflow", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          existingCase: {
            caseId: "123e4567-e89b-12d3-a456-426614174000",
            summaryId: "123e4567-e89b-12d3-a456-426614174001",
          },
        },
        steps: {
          prepareEmail: true,
          scheduleEmail: {
            recipientEmail: "owner@example.com",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts minimal workflow", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
        steps: {
          ingest: true,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("accepts empty steps object", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
        steps: {},
      });
      expect(result.success).toBe(true);
    });

    it("accepts all steps as false", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
        steps: {
          ingest: false,
          extractEntities: false,
          generateSummary: false,
          prepareEmail: false,
          scheduleEmail: false,
          scheduleCall: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing input", () => {
      const result = OrchestrationRequestSchema.safeParse({
        steps: { ingest: true },
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing steps", () => {
      const result = OrchestrationRequestSchema.safeParse({
        input: {
          rawData: {
            mode: "text",
            source: "manual",
            text: "Test",
          },
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
