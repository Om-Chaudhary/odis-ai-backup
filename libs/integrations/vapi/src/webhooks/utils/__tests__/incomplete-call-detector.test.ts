import { describe, expect, it } from "vitest";
import {
  isIncompleteInboundCall,
  sanitizeIncompleteCallStructuredData,
} from "../incomplete-call-detector";
import type { VapiMessage } from "../../types";

describe("isIncompleteInboundCall", () => {
  const makeMessages = (
    userTexts: string[],
    assistantTexts: string[] = ["Hello, this is the veterinary clinic."],
  ): VapiMessage[] => [
    ...assistantTexts.map((text) => ({
      role: "assistant" as const,
      message: text,
    })),
    ...userTexts.map((text) => ({
      role: "user" as const,
      message: text,
    })),
  ];

  it("returns true for silence-timed-out endedReason", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 45,
        transcript:
          "AI: Hello\nUser: Hi there, I need to schedule an appointment",
        messages: makeMessages(["Hi there, I need to schedule an appointment"]),
        endedReason: "silence-timed-out",
      }),
    ).toBe(true);
  });

  it("returns true for customer-did-not-answer endedReason", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 10,
        transcript: null,
        messages: null,
        endedReason: "customer-did-not-answer",
      }),
    ).toBe(true);
  });

  it("returns true for calls under 15 seconds (hard cutoff)", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 5,
        transcript: "AI: Hello, thanks for calling.",
        messages: makeMessages([]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(true);
  });

  it("returns true for 14-second call even with some user speech", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 14,
        transcript: "AI: Hello\nUser: Hi",
        messages: makeMessages(["Hi"]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(true);
  });

  it("returns true when no user messages exist", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 20,
        transcript: "AI: Hello, thanks for calling the veterinary clinic.",
        messages: makeMessages([]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(true);
  });

  it("returns true for short call (< 30s) with minimal user speech (< 100 chars)", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 22,
        transcript: "AI: Hello\nUser: Hi, bye",
        messages: makeMessages(["Hi, bye"]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(true);
  });

  it("returns false for short call (< 30s) with substantial user speech (> 100 chars)", () => {
    const longMessage =
      "Hi, I need to schedule an appointment for my dog Max. He has been having some issues with his leg and I would like to get him seen as soon as possible.";
    expect(
      isIncompleteInboundCall({
        durationSeconds: 25,
        transcript: `AI: Hello\nUser: ${longMessage}`,
        messages: makeMessages([longMessage]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(false);
  });

  it("returns false for a 60-second normal call", () => {
    const userText =
      "Hi, I am calling about my cat Whiskers. She needs her annual checkup and vaccinations. Can I schedule something for next week?";
    expect(
      isIncompleteInboundCall({
        durationSeconds: 60,
        transcript: `AI: Hello\nUser: ${userText}`,
        messages: makeMessages([userText]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(false);
  });

  it("returns false when durationSeconds is null and there is user speech", () => {
    const userText =
      "I need to talk to someone about my pet's medication. This is really important and I need help right away.";
    expect(
      isIncompleteInboundCall({
        durationSeconds: null,
        transcript: `AI: Hello\nUser: ${userText}`,
        messages: makeMessages([userText]),
        endedReason: "customer-ended-call",
      }),
    ).toBe(false);
  });

  it("returns true when messages is null and transcript has no user speech", () => {
    expect(
      isIncompleteInboundCall({
        durationSeconds: 20,
        transcript: "AI: Hello, thanks for calling.",
        messages: null,
        endedReason: "customer-ended-call",
      }),
    ).toBe(true);
  });

  it("returns false for dial-busy when it's not in NO_CONVERSATION reasons", () => {
    // dial-busy IS in the no-conversation list, so it should return true
    expect(
      isIncompleteInboundCall({
        durationSeconds: 0,
        transcript: null,
        messages: null,
        endedReason: "dial-busy",
      }),
    ).toBe(true);
  });

  it("returns false for assistant-ended-call (normal ending)", () => {
    const userText =
      "Hi, I just wanted to check on the results from my dog's blood work that was done last Tuesday.";
    expect(
      isIncompleteInboundCall({
        durationSeconds: 120,
        transcript: `AI: Hello\nUser: ${userText}`,
        messages: makeMessages([userText]),
        endedReason: "assistant-ended-call",
      }),
    ).toBe(false);
  });
});

describe("sanitizeIncompleteCallStructuredData", () => {
  it("removes card_type and card data fields", () => {
    const result = sanitizeIncompleteCallStructuredData({
      card_type: "info",
      info_data: { reason: "General inquiry" },
      callback_data: { phone: "555-1234" },
      emergency_data: { level: "high" },
      appointment: { date: "2025-01-15", time: "10:00" },
    });

    expect(result).toEqual({
      appointment: { date: "2025-01-15", time: "10:00" },
    });
  });

  it("preserves appointment_data (from tool execution)", () => {
    const result = sanitizeIncompleteCallStructuredData({
      card_type: "callback",
      callback_data: { reason: "test" },
      appointment_data: { date: "2025-01-15", client_name: "John" },
    });

    expect(result).toEqual({
      appointment_data: { date: "2025-01-15", client_name: "John" },
    });
  });

  it("returns null for empty structured data", () => {
    expect(sanitizeIncompleteCallStructuredData(null)).toBeNull();
    expect(sanitizeIncompleteCallStructuredData(undefined)).toBeNull();
  });

  it("returns null when only card fields existed", () => {
    const result = sanitizeIncompleteCallStructuredData({
      card_type: "info",
      info_data: { reason: "test" },
    });

    expect(result).toBeNull();
  });
});
