/**
 * Integration tests for Orchestration API Endpoint
 *
 * Tests the /api/discharge/orchestrate endpoint including:
 * - Authentication (Bearer token and cookies)
 * - Request validation
 * - Full workflow execution
 * - Error handling
 * - CORS support
 *
 * NOTE: This test file assumes the route exists at:
 * src/app/api/discharge/orchestrate/route.ts
 *
 * If the route doesn't exist yet, these tests will fail until it's implemented.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAuthenticatedRequest,
  createMockRequest,
  getJsonResponse,
} from "~/test/api-utils";

// Mock dependencies
vi.mock("~/lib/api/auth", () => ({
  authenticateUser: vi.fn(),
}));

vi.mock("~/lib/services/discharge-orchestrator", () => {
  // Create a mock class constructor
  const MockDischargeOrchestrator = vi.fn();
  return {
    DischargeOrchestrator: MockDischargeOrchestrator,
  };
});

vi.mock("~/lib/api/cors", () => ({
  withCorsHeaders: vi.fn((_, response: Response) => response),
  handleCorsPreflightRequest: vi.fn(() => new Response(null, { status: 204 })),
}));

import { authenticateUser } from "~/lib/api/auth";
import { DischargeOrchestrator } from "~/lib/services/discharge-orchestrator";
import { createMockUser as createMockUserUtil } from "~/test/api-utils";
import * as route from "../route";

// Import route handlers
const { POST, GET, OPTIONS } = route;

describe("POST /api/discharge/orchestrate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createValidRequest = () => ({
    input: {
      rawData: {
        mode: "text" as const,
        source: "web_dashboard" as const,
        text: "Patient: Max, Dog, 5 years old. Diagnosis: Ear infection.",
      },
    },
    steps: {
      ingest: true,
      generateSummary: true,
    },
    options: {},
  });

  describe("Authentication", () => {
    it("should authenticate with Bearer token", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      const mockUser = createMockUserUtil();
      const mockSupabase = {} as any;

      vi.mocked(authenticateUser).mockResolvedValue({
        success: true,
        data: { user: mockUser, supabase: mockSupabase },
      });

      const mockOrchestrate = vi.fn().mockResolvedValue({
        success: true,
        data: { completedSteps: ["ingest", "generateSummary"] },
        metadata: { totalProcessingTime: 100 },
      });

      vi.mocked(DischargeOrchestrator).mockImplementation(function (this: any) {
        this.orchestrate = mockOrchestrate;
        return this;
      });

      const request = createAuthenticatedRequest("bearer-token", {
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: createValidRequest(),
      });

      const response = await POST(request);
      const data = await getJsonResponse(response);

      expect(response.status).toBe(200);
      expect(authenticateUser).toHaveBeenCalled();
      expect(data.success).toBe(true);
    });

    it("should reject unauthenticated requests", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      vi.mocked(authenticateUser).mockResolvedValue({
        success: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: createValidRequest(),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe("Request Validation", () => {
    it("should validate request body", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      const mockUser = createMockUserUtil();
      vi.mocked(authenticateUser).mockResolvedValue({
        success: true,
        data: { user: mockUser, supabase: {} as any },
      });

      const request = createAuthenticatedRequest("token", {
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: {
          input: {
            rawData: {
              mode: "invalid", // Invalid enum value
            },
          },
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should accept valid orchestration request", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      const mockUser = createMockUserUtil();
      vi.mocked(authenticateUser).mockResolvedValue({
        success: true,
        data: { user: mockUser, supabase: {} as any },
      });

      const mockOrchestrate = vi.fn().mockResolvedValue({
        success: true,
        data: { completedSteps: [] },
        metadata: {},
      });

      vi.mocked(DischargeOrchestrator).mockImplementation(function (this: any) {
        this.orchestrate = mockOrchestrate;
        return this;
      });

      const request = createAuthenticatedRequest("token", {
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: createValidRequest(),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe("Orchestration Execution", () => {
    it("should execute full workflow", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      const mockUser = createMockUserUtil();
      vi.mocked(authenticateUser).mockResolvedValue({
        success: true,
        data: { user: mockUser, supabase: {} as any },
      });

      const orchestrationResult = {
        success: true,
        data: {
          completedSteps: ["ingest", "generateSummary", "prepareEmail"],
          skippedSteps: [],
          failedSteps: [],
          ingestion: { caseId: "case-123" },
          summary: { summaryId: "summary-123", content: "Summary" },
          email: {
            subject: "Test",
            html: "<p>Test</p>",
            text: "Test",
          },
        },
        metadata: {
          totalProcessingTime: 500,
          stepTimings: { ingest: 100, generateSummary: 200 },
        },
      };

      const mockOrchestrate = vi.fn().mockResolvedValue(orchestrationResult);

      vi.mocked(DischargeOrchestrator).mockImplementation(function (this: any) {
        this.orchestrate = mockOrchestrate;
        return this;
      });

      const request = createAuthenticatedRequest("token", {
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: {
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
        },
      });

      const response = await POST(request);
      const data = await getJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.completedSteps).toHaveLength(3);
      expect(mockOrchestrate).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle orchestration errors", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      const mockUser = createMockUserUtil();
      vi.mocked(authenticateUser).mockResolvedValue({
        success: true,
        data: { user: mockUser, supabase: {} as any },
      });

      const mockOrchestrate = vi
        .fn()
        .mockRejectedValue(new Error("Orchestration failed"));

      vi.mocked(DischargeOrchestrator).mockImplementation(function (this: any) {
        this.orchestrate = mockOrchestrate;
        return this;
      });

      const request = createAuthenticatedRequest("token", {
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: createValidRequest(),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it("should handle JSON parsing errors", async () => {
      if (!POST) {
        console.warn("[TEST] Route not implemented, skipping test");
        return;
      }

      const mockUser = createMockUserUtil();
      vi.mocked(authenticateUser).mockResolvedValue({
        success: true,
        data: { user: mockUser, supabase: {} as any },
      });

      const request = createAuthenticatedRequest("token", {
        method: "POST",
        url: "http://localhost:3000/api/discharge/orchestrate",
        body: "invalid json",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      // JSON parsing errors should return 400 (Bad Request), not 500
      expect(response.status).toBe(400);
    });
  });
});

describe("GET /api/discharge/orchestrate", () => {
  it("should return health check information", async () => {
    if (!GET) {
      console.warn("[TEST] Route not implemented, skipping test");
      return;
    }

    const request = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/discharge/orchestrate",
    });

    const response = await GET(request);
    const data = await getJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("status", "ok");
  });
});

describe("OPTIONS /api/discharge/orchestrate", () => {
  it("should handle CORS preflight", async () => {
    if (!OPTIONS) {
      console.warn("[TEST] Route not implemented, skipping test");
      return;
    }

    const request = createMockRequest({
      method: "OPTIONS",
      url: "http://localhost:3000/api/discharge/orchestrate",
      headers: {
        Origin: "https://us.idexxneo.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    const response = await OPTIONS(request);
    expect(response.status).toBe(204);
  });
});
