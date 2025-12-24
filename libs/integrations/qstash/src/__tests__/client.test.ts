/**
 * Tests for qstash/client.ts
 * - scheduleCallExecution: Schedule calls with QStash
 * - scheduleEmailExecution: Schedule emails with QStash
 * - cancelScheduledExecution: Cancel scheduled jobs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables before importing
const originalEnv = process.env;

// Mock the QStash Client
const mockPublishJSON = vi.fn();
const mockMessagesDelete = vi.fn();

// Create a mock class that can be instantiated with `new`
class MockClient {
  publishJSON = mockPublishJSON;
  messages = {
    delete: mockMessagesDelete,
  };
}

vi.mock("@upstash/qstash", () => ({
  Client: MockClient,
}));

describe("qstash client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      QSTASH_TOKEN: "test-qstash-token",
      NEXT_PUBLIC_SITE_URL: "https://app.example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("scheduleCallExecution", () => {
    it("schedules a call with correct delay", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg-123" });

      const { scheduleCallExecution } = await import("../client");

      // Schedule for 60 seconds in the future
      const futureDate = new Date(Date.now() + 60000);
      const result = await scheduleCallExecution("call-abc", futureDate);

      expect(result).toBe("msg-123");
      expect(mockPublishJSON).toHaveBeenCalledTimes(1);
      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://app.example.com/api/webhooks/execute-call",
          body: { callId: "call-abc" },
          retries: 0,
          headers: { "Content-Type": "application/json" },
        }),
      );

      // Verify delay is approximately 60 seconds (allow for test execution time)
      const callArgs = mockPublishJSON.mock.calls[0][0];
      expect(callArgs.delay).toBeGreaterThanOrEqual(58);
      expect(callArgs.delay).toBeLessThanOrEqual(62);
    });

    it("throws error when scheduling in the past", async () => {
      const { scheduleCallExecution } = await import("../client");

      const pastDate = new Date(Date.now() - 60000);

      await expect(scheduleCallExecution("call-abc", pastDate)).rejects.toThrow(
        /Cannot schedule call in the past/,
      );
    });

    it("calculates delay correctly for various future times", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg-456" });

      const { scheduleCallExecution } = await import("../client");

      // Schedule for 5 minutes in the future
      const fiveMinutes = new Date(Date.now() + 5 * 60 * 1000);
      await scheduleCallExecution("call-xyz", fiveMinutes);

      const callArgs = mockPublishJSON.mock.calls[0][0];
      // Should be approximately 300 seconds
      expect(callArgs.delay).toBeGreaterThanOrEqual(298);
      expect(callArgs.delay).toBeLessThanOrEqual(302);
    });

    it("returns the message ID from QStash response", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "unique-msg-id-789" });

      const { scheduleCallExecution } = await import("../client");

      const futureDate = new Date(Date.now() + 30000);
      const result = await scheduleCallExecution("call-123", futureDate);

      expect(result).toBe("unique-msg-id-789");
    });
  });

  describe("scheduleEmailExecution", () => {
    it("schedules an email with correct delay", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "email-msg-123" });

      const { scheduleEmailExecution } = await import("../client");

      // Schedule for 2 minutes in the future
      const futureDate = new Date(Date.now() + 120000);
      const result = await scheduleEmailExecution("email-abc", futureDate);

      expect(result).toBe("email-msg-123");
      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://app.example.com/api/webhooks/execute-discharge-email",
          body: { emailId: "email-abc" },
          retries: 0,
          headers: { "Content-Type": "application/json" },
        }),
      );

      // Verify delay is approximately 120 seconds
      const callArgs = mockPublishJSON.mock.calls[0][0];
      expect(callArgs.delay).toBeGreaterThanOrEqual(118);
      expect(callArgs.delay).toBeLessThanOrEqual(122);
    });

    it("throws error when scheduling email in the past", async () => {
      const { scheduleEmailExecution } = await import("../client");

      const pastDate = new Date(Date.now() - 1000);

      await expect(
        scheduleEmailExecution("email-abc", pastDate),
      ).rejects.toThrow(/Cannot schedule email in the past/);
    });

    it("returns the message ID from QStash response", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "email-unique-id" });

      const { scheduleEmailExecution } = await import("../client");

      const futureDate = new Date(Date.now() + 60000);
      const result = await scheduleEmailExecution("email-456", futureDate);

      expect(result).toBe("email-unique-id");
    });
  });

  describe("cancelScheduledExecution", () => {
    it("returns true (placeholder implementation)", async () => {
      const { cancelScheduledExecution } = await import("../client");

      const result = await cancelScheduledExecution("msg-to-cancel");

      expect(result).toBe(true);
    });

    it("handles any message ID", async () => {
      const { cancelScheduledExecution } = await import("../client");

      const result1 = await cancelScheduledExecution("msg-123");
      const result2 = await cancelScheduledExecution("different-msg-456");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe("qstashClient initialization", () => {
    it("throws error when QSTASH_TOKEN is not defined", async () => {
      vi.resetModules();
      delete process.env.QSTASH_TOKEN;

      await expect(import("../client")).rejects.toThrow(
        /QSTASH_TOKEN is not defined/,
      );
    });
  });
});
