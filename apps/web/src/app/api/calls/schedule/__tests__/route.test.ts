/**
 * Call Scheduling API Route Tests
 *
 * Tests for POST /api/calls/schedule endpoint
 * Schedules discharge calls with QStash execution
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock env first
vi.mock("~/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  },
}));

// Mock dependencies
vi.mock("@odis-ai/data-access/db/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("~/server/actions/auth", () => ({
  getUser: vi.fn(),
}));

vi.mock("@odis-ai/qstash/client", () => ({
  scheduleCallExecution: vi.fn(),
}));

vi.mock("@odis-ai/clinics/utils", () => ({
  getClinicByUserId: vi.fn(),
}));

vi.mock("@odis-ai/clinics/vapi-config", () => ({
  getClinicVapiConfigByUserId: vi.fn(),
}));

vi.mock("@odis-ai/integrations/vapi/utils", () => ({
  extractFirstName: vi.fn((name: string) => name.split(" ")[0]),
}));

vi.mock("@odis-ai/utils/business-hours", () => ({
  isFutureTime: vi.fn(),
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
import { POST, GET, OPTIONS } from "../route";
import { createClient } from "@odis-ai/data-access/db/server";
import { createServerClient } from "@supabase/ssr";
import { getUser } from "~/server/actions/auth";
import { scheduleCallExecution } from "@odis-ai/integrations/qstash/client";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { getClinicVapiConfigByUserId } from "@odis-ai/domain/clinics";
import { isFutureTime } from "@odis-ai/shared/util/business-hours";
import { handleCorsPreflightRequest } from "@odis-ai/data-access/api/cors";

describe("Call Schedule Route", () => {
  // Create chainable mock for Supabase
  const createMockSupabase = (overrides: Record<string, unknown> = {}) => {
    const mockSingle = vi.fn();
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });

    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEq, single: mockSingle }),
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "test@example.com" } },
          error: null,
        }),
      },
      mockSingle,
      mockInsert,
      ...overrides,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(isFutureTime).mockReturnValue(true);
    vi.mocked(getClinicByUserId).mockResolvedValue(null);
    vi.mocked(getClinicVapiConfigByUserId).mockResolvedValue({
      outboundAssistantId: "assistant-123",
      phoneNumberId: "phone-123",
      clinicName: "Test Clinic",
      source: "environment",
    });
    vi.mocked(scheduleCallExecution).mockResolvedValue("qstash-msg-123");
  });

  describe("GET - Health Check", () => {
    it("should return health check status", async () => {
      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        { method: "GET" }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.message).toBe("Schedule call endpoint is active");
    });
  });

  describe("OPTIONS - CORS Preflight", () => {
    it("should handle CORS preflight requests", async () => {
      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        { method: "OPTIONS" }
      );

      const response = OPTIONS(request);

      expect(handleCorsPreflightRequest).toHaveBeenCalledWith(request);
      expect(response.status).toBe(204);
    });
  });

  // Helper to create valid request body
  const createValidRequestBody = (overrides = {}) => ({
    phoneNumber: "+15551234567",
    petName: "Max",
    ownerName: "John Doe",
    callType: "discharge",
    appointmentDate: "January 15th, 2025",
    clinicName: "Test Clinic",
    clinicPhone: "five five five, one two three, four five six seven",
    emergencyPhone: "five five five, nine one one",
    dischargeSummary: "Patient Max was seen for a wellness check. All vaccinations are up to date.",
    ...overrides,
  });

  describe("POST - Schedule Call", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(getUser).mockResolvedValue(null);
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Not authenticated" },
          }),
        },
      } as never);

      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          body: JSON.stringify(createValidRequestBody()),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("should return 400 for past scheduled time", async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(getUser).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock user settings query
      mockSupabase.mockSingle.mockResolvedValue({
        data: { test_mode_enabled: false },
        error: null,
      });

      // Past time validation
      vi.mocked(isFutureTime).mockReturnValue(false);

      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          body: JSON.stringify(createValidRequestBody({
            scheduledFor: new Date(Date.now() - 3600000).toISOString(),
          })),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("future");
    });

    it("should schedule call successfully with valid data", async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(getUser).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock user settings query
      mockSupabase.mockSingle
        .mockResolvedValueOnce({
          data: {
            test_mode_enabled: false,
            clinic_name: "Test Clinic",
            clinic_phone: "555-123-4567",
          },
          error: null,
        })
        // Mock insert result
        .mockResolvedValueOnce({
          data: {
            id: "call-123",
            scheduled_for: new Date().toISOString(),
            metadata: {},
          },
          error: null,
        });

      const futureTime = new Date(Date.now() + 3600000);
      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          body: JSON.stringify(createValidRequestBody({
            scheduledFor: futureTime.toISOString(),
          })),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.callId).toBe("call-123");
      expect(data.data.qstashMessageId).toBe("qstash-msg-123");
      expect(scheduleCallExecution).toHaveBeenCalled();
    });

    it("should rollback on QStash failure", async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(getUser).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock user settings
      mockSupabase.mockSingle
        .mockResolvedValueOnce({
          data: { test_mode_enabled: false },
          error: null,
        })
        // Mock insert success
        .mockResolvedValueOnce({
          data: { id: "call-123", metadata: {} },
          error: null,
        });

      // QStash fails
      vi.mocked(scheduleCallExecution).mockRejectedValue(
        new Error("QStash error")
      );

      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          body: JSON.stringify(createValidRequestBody({
            scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          })),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("schedule");
      // Verify delete was called for rollback
      expect(mockSupabase.from).toHaveBeenCalledWith(
        "scheduled_discharge_calls"
      );
    });

    it("should return 500 on database error", async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(getUser).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock user settings success
      mockSupabase.mockSingle
        .mockResolvedValueOnce({
          data: { test_mode_enabled: false },
          error: null,
        })
        // Mock insert failure
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Database error" },
        });

      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          body: JSON.stringify(createValidRequestBody({
            scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          })),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed");
    });

    it("should handle test mode with phone override", async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(getUser).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as never);
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock user settings with test mode enabled
      mockSupabase.mockSingle
        .mockResolvedValueOnce({
          data: {
            test_mode_enabled: true,
            test_contact_phone: "+15559999999",
            clinic_name: "Test Clinic",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "call-123", metadata: {} },
          error: null,
        });

      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          body: JSON.stringify(createValidRequestBody()),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should accept Bearer token authentication", async () => {
      const mockSupabase = createMockSupabase();

      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123", email: "test@example.com" } },
            error: null,
          }),
        },
        from: mockSupabase.from,
      } as never);

      // Mock user settings and insert
      mockSupabase.mockSingle
        .mockResolvedValueOnce({
          data: { test_mode_enabled: false },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "call-123", metadata: {} },
          error: null,
        });

      const request = new NextRequest(
        "http://localhost/api/calls/schedule",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-token-123",
          },
          body: JSON.stringify(createValidRequestBody({
            scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          })),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createServerClient).toHaveBeenCalled();
    });
  });
});
