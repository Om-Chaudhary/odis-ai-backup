/**
 * VAPI Webhook Route Tests
 *
 * Tests for the VAPI webhook handler endpoint.
 * The route delegates processing to the modular webhook dispatcher.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before imports
vi.mock("@odis-ai/logger", () => ({
  loggers: {
    webhook: {
      child: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        logError: vi.fn(),
      })),
    },
  },
}));

vi.mock("@odis-ai/vapi/webhooks", () => ({
  handleVapiWebhook: vi.fn(),
  parseWebhookPayload: vi.fn(),
}));

vi.mock("@odis-ai/api/cors", () => ({
  handleCorsPreflightRequest: vi.fn(() =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    })
  ),
  withCorsHeaders: vi.fn((_, response) => response),
}));

// Import after mocks
import { POST, OPTIONS, GET } from "../route";
import { handleVapiWebhook, parseWebhookPayload } from "@odis-ai/vapi/webhooks";
import { handleCorsPreflightRequest } from "@odis-ai/api/cors";

describe("VAPI Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET - Health Check", () => {
    it("should return health check status", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.message).toBe("VAPI webhook endpoint is active");
    });

    it("should list all supported event types", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.supportedEvents).toBeInstanceOf(Array);
      expect(data.supportedEvents).toContain("status-update");
      expect(data.supportedEvents).toContain("end-of-call-report");
      expect(data.supportedEvents).toContain("hang");
      expect(data.supportedEvents).toContain("tool-calls");
      expect(data.supportedEvents).toContain("transcript");
    });
  });

  describe("OPTIONS - CORS Preflight", () => {
    it("should handle CORS preflight requests", async () => {
      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "OPTIONS",
      });

      const response = OPTIONS(request);

      expect(handleCorsPreflightRequest).toHaveBeenCalledWith(request);
      expect(response.status).toBe(204);
    });
  });

  describe("POST - Webhook Handler", () => {
    it("should return 400 for invalid payload", async () => {
      vi.mocked(parseWebhookPayload).mockReturnValue(null);

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify({ invalid: "data" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should process valid webhook and return success", async () => {
      const mockPayload = {
        message: {
          type: "status-update",
          call: { id: "call-123" },
          status: "in-progress",
        },
      };

      vi.mocked(parseWebhookPayload).mockReturnValue(mockPayload);
      vi.mocked(handleVapiWebhook).mockResolvedValue({ success: true });

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(handleVapiWebhook).toHaveBeenCalledWith(mockPayload);
    });

    it("should return handler response when provided", async () => {
      const mockPayload = {
        message: {
          type: "assistant-request",
          call: { id: "call-123" },
        },
      };

      const handlerResponse = {
        assistantId: "assistant-456",
        variableValues: { pet_name: "Max" },
      };

      vi.mocked(parseWebhookPayload).mockReturnValue(mockPayload);
      vi.mocked(handleVapiWebhook).mockResolvedValue(handlerResponse);

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assistantId).toBe("assistant-456");
    });

    it("should return 500 on handler error", async () => {
      vi.mocked(parseWebhookPayload).mockImplementation(() => {
        throw new Error("Processing failed");
      });

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify({ message: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle end-of-call-report events", async () => {
      const mockPayload = {
        message: {
          type: "end-of-call-report",
          call: {
            id: "call-123",
            status: "ended",
            endedReason: "assistant-ended-call",
          },
          transcript: "Hello, this is a test call.",
          recordingUrl: "https://example.com/recording.mp3",
        },
      };

      vi.mocked(parseWebhookPayload).mockReturnValue(mockPayload);
      vi.mocked(handleVapiWebhook).mockResolvedValue({ success: true });

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleVapiWebhook).toHaveBeenCalledWith(mockPayload);
    });

    it("should handle hang events", async () => {
      const mockPayload = {
        message: {
          type: "hang",
          call: { id: "call-123" },
        },
      };

      vi.mocked(parseWebhookPayload).mockReturnValue(mockPayload);
      vi.mocked(handleVapiWebhook).mockResolvedValue({ success: true });

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleVapiWebhook).toHaveBeenCalledWith(mockPayload);
    });

    it("should return default success when handler returns null", async () => {
      const mockPayload = {
        message: {
          type: "transcript",
          call: { id: "call-123" },
        },
      };

      vi.mocked(parseWebhookPayload).mockReturnValue(mockPayload);
      vi.mocked(handleVapiWebhook).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/webhooks/vapi", {
        method: "POST",
        body: JSON.stringify(mockPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
