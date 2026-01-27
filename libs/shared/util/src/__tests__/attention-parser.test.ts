/**
 * Tests for attention-parser.ts utilities
 * - parseAttentionSummary: Parse structured attention summaries
 * - isStructuredFormat: Check if summary follows structured format
 * - extractReason: Extract reason component
 * - extractAction: Extract action component
 */

import { describe, it, expect } from "vitest";
import {
  parseAttentionSummary,
  isStructuredFormat,
  extractReason,
  extractAction,
  type ParsedAttentionSummary,
} from "../lib/attention-parser";

describe("parseAttentionSummary", () => {
  describe("structured format parsing", () => {
    it("parses basic structured format correctly", () => {
      const summary = "**[MEDICATION] - Pain management needed: Contact owner about Rimadyl dosage**";
      const result = parseAttentionSummary(summary);

      expect(result).toEqual({
        reason: "MEDICATION",
        context: "Pain management needed",
        action: "Contact owner about Rimadyl dosage",
        raw: summary,
        isStructured: true,
      });
    });

    it("parses structured format with different reason categories", () => {
      const testCases = [
        {
          summary: "**[FOLLOW-UP] - Recheck needed: Schedule appointment in 2 weeks**",
          expected: {
            reason: "FOLLOW-UP",
            context: "Recheck needed",
            action: "Schedule appointment in 2 weeks",
          },
        },
        {
          summary: "**[URGENT] - Critical condition: Contact emergency vet immediately**",
          expected: {
            reason: "URGENT",
            context: "Critical condition",
            action: "Contact emergency vet immediately",
          },
        },
        {
          summary: "**[DISCHARGE] - Ready to go home: Call owner for pickup**",
          expected: {
            reason: "DISCHARGE",
            context: "Ready to go home",
            action: "Call owner for pickup",
          },
        },
      ];

      testCases.forEach(({ summary, expected }) => {
        const result = parseAttentionSummary(summary);
        expect(result?.reason).toBe(expected.reason);
        expect(result?.context).toBe(expected.context);
        expect(result?.action).toBe(expected.action);
        expect(result?.isStructured).toBe(true);
      });
    });

    it("handles extra whitespace in structured format", () => {
      const summary = "**[ MEDICATION ] -  Pain management needed :  Contact owner about Rimadyl dosage **";
      const result = parseAttentionSummary(summary);

      expect(result).toEqual({
        reason: "MEDICATION",
        context: "Pain management needed",
        action: "Contact owner about Rimadyl dosage",
        raw: summary,
        isStructured: true,
      });
    });

    it("parses multi-word reasons correctly", () => {
      const summary = "**[POST-OPERATIVE CARE] - Surgery recovery: Monitor incision site**";
      const result = parseAttentionSummary(summary);

      expect(result?.reason).toBe("POST-OPERATIVE CARE");
      expect(result?.context).toBe("Surgery recovery");
      expect(result?.action).toBe("Monitor incision site");
      expect(result?.isStructured).toBe(true);
    });

    it("handles complex context and actions", () => {
      const summary = "**[LAB RESULTS] - Blood work shows elevated liver enzymes: Discuss diet changes and rerun labs in 1 week**";
      const result = parseAttentionSummary(summary);

      expect(result?.reason).toBe("LAB RESULTS");
      expect(result?.context).toBe("Blood work shows elevated liver enzymes");
      expect(result?.action).toBe("Discuss diet changes and rerun labs in 1 week");
      expect(result?.isStructured).toBe(true);
    });
  });

  describe("unstructured format fallback", () => {
    it("handles legacy unstructured format", () => {
      const summary = "Call owner about medication side effects";
      const result = parseAttentionSummary(summary);

      expect(result).toEqual({
        reason: "ATTENTION",
        context: "Attention needed",
        action: "Call owner about medication side effects",
        raw: summary,
        isStructured: false,
      });
    });

    it("handles simple unstructured text", () => {
      const summary = "Follow up needed";
      const result = parseAttentionSummary(summary);

      expect(result).toEqual({
        reason: "ATTENTION",
        context: "Attention needed",
        action: "Follow up needed",
        raw: summary,
        isStructured: false,
      });
    });

    it("handles complex unstructured summaries", () => {
      const summary = "Patient showing signs of improvement but needs continued monitoring of respiratory rate and medication compliance";
      const result = parseAttentionSummary(summary);

      expect(result?.reason).toBe("ATTENTION");
      expect(result?.context).toBe("Attention needed");
      expect(result?.action).toBe(summary);
      expect(result?.raw).toBe(summary);
      expect(result?.isStructured).toBe(false);
    });
  });

  describe("malformed structured format", () => {
    it("treats incomplete structured format as unstructured", () => {
      const testCases = [
        "**[MEDICATION] - Missing colon**",
        "**Missing brackets - Context: Action**",
        "**[REASON] Missing dash: Action**",
        "**[REASON] - Context Missing action**",
        "[REASON] - Context: Action", // Missing asterisks
        "**[REASON] - Context: Action*", // Missing closing asterisk
        "*[REASON] - Context: Action**", // Wrong opening asterisk
      ];

      testCases.forEach((summary) => {
        const result = parseAttentionSummary(summary);
        expect(result?.isStructured).toBe(false);
        expect(result?.reason).toBe("ATTENTION");
        expect(result?.context).toBe("Attention needed");
        expect(result?.action).toBe(summary);
      });
    });

    it("handles empty brackets and fields", () => {
      const testCases = [
        "**[] - Context: Action**",
        "**[REASON] - : Action**",
        "**[REASON] - Context: **",
        "**[] - : **",
      ];

      testCases.forEach((summary) => {
        const result = parseAttentionSummary(summary);
        expect(result?.isStructured).toBe(false);
        expect(result?.action).toBe(summary);
      });
    });
  });

  describe("edge cases", () => {
    it("returns null for null input", () => {
      expect(parseAttentionSummary(null)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseAttentionSummary("")).toBeNull();
    });

    it("returns null for whitespace-only string", () => {
      expect(parseAttentionSummary("   ")).toBeNull();
    });

    it("handles strings with only asterisks", () => {
      const result = parseAttentionSummary("****");
      expect(result).toEqual({
        reason: "ATTENTION",
        context: "Attention needed",
        action: "****",
        raw: "****",
        isStructured: false,
      });
    });

    it("trims whitespace from input", () => {
      const summary = "  **[REASON] - Context: Action**  ";
      const result = parseAttentionSummary(summary);

      expect(result?.raw).toBe("**[REASON] - Context: Action**");
      expect(result?.isStructured).toBe(true);
    });
  });

  describe("special characters", () => {
    it("handles special characters in reason", () => {
      const summary = "**[POST-OP & RECOVERY] - Surgery complete: Monitor recovery**";
      const result = parseAttentionSummary(summary);

      expect(result?.reason).toBe("POST-OP & RECOVERY");
      expect(result?.isStructured).toBe(true);
    });

    it("handles special characters in context and action", () => {
      const summary = "**[MEDICATION] - 50mg/kg dosage: Give at 8:00 AM & 6:00 PM**";
      const result = parseAttentionSummary(summary);

      expect(result?.context).toBe("50mg/kg dosage");
      expect(result?.action).toBe("Give at 8:00 AM & 6:00 PM");
      expect(result?.isStructured).toBe(true);
    });

    it("handles colons in action (after first colon)", () => {
      const summary = "**[FOLLOW-UP] - Lab results pending: Schedule recheck at 2:00 PM: Room 3**";
      const result = parseAttentionSummary(summary);

      expect(result?.context).toBe("Lab results pending");
      expect(result?.action).toBe("Schedule recheck at 2:00 PM: Room 3");
      expect(result?.isStructured).toBe(true);
    });
  });
});

describe("isStructuredFormat", () => {
  it("returns true for valid structured format", () => {
    const validFormats = [
      "**[MEDICATION] - Context: Action**",
      "**[FOLLOW-UP] - Recheck needed: Schedule appointment**",
      "**[URGENT] - Critical: Call immediately**",
    ];

    validFormats.forEach((format) => {
      expect(isStructuredFormat(format)).toBe(true);
    });
  });

  it("returns false for unstructured format", () => {
    const unstructuredFormats = [
      "Call owner about results",
      "Follow up needed",
      "**[INCOMPLETE] - Missing action",
      "[REASON] - Context: Action", // Missing asterisks
      null,
      "",
      "   ",
    ];

    unstructuredFormats.forEach((format) => {
      expect(isStructuredFormat(format)).toBe(false);
    });
  });

  it("handles whitespace correctly", () => {
    expect(isStructuredFormat("  **[REASON] - Context: Action**  ")).toBe(true);
  });
});

describe("extractReason", () => {
  it("extracts reason from structured format", () => {
    expect(extractReason("**[MEDICATION] - Context: Action**")).toBe("MEDICATION");
    expect(extractReason("**[FOLLOW-UP] - Context: Action**")).toBe("FOLLOW-UP");
    expect(extractReason("**[URGENT CARE] - Context: Action**")).toBe("URGENT CARE");
  });

  it("returns default reason for unstructured format", () => {
    expect(extractReason("Call owner about results")).toBe("ATTENTION");
    expect(extractReason("Follow up needed")).toBe("ATTENTION");
  });

  it("handles edge cases", () => {
    expect(extractReason(null)).toBe("ATTENTION");
    expect(extractReason("")).toBe("ATTENTION");
    expect(extractReason("   ")).toBe("ATTENTION");
  });
});

describe("extractAction", () => {
  it("extracts action from structured format", () => {
    expect(extractAction("**[MEDICATION] - Context: Call owner about dosage**")).toBe("Call owner about dosage");
    expect(extractAction("**[FOLLOW-UP] - Context: Schedule in 2 weeks**")).toBe("Schedule in 2 weeks");
  });

  it("returns full summary for unstructured format", () => {
    const unstructured = "Call owner about results";
    expect(extractAction(unstructured)).toBe(unstructured);
  });

  it("handles edge cases", () => {
    expect(extractAction(null)).toBe("");
    expect(extractAction("")).toBe("");
    expect(extractAction("   ")).toBe("");
  });

  it("handles complex actions with special characters", () => {
    const summary = "**[MEDICATION] - Context: Give 50mg at 8:00 AM & 6:00 PM**";
    expect(extractAction(summary)).toBe("Give 50mg at 8:00 AM & 6:00 PM");
  });
});

describe("integration scenarios", () => {
  it("handles real-world veterinary attention summaries", () => {
    const realWorldCases: Array<{
      summary: string;
      expectedStructured: boolean;
      expectedReason: string;
    }> = [
      {
        summary: "**[POST-SURGICAL] - Spay recovery monitoring: Check incision site daily for 10 days**",
        expectedStructured: true,
        expectedReason: "POST-SURGICAL",
      },
      {
        summary: "**[MEDICATION COMPLIANCE] - Owner missed last dose: Remind about importance of full course**",
        expectedStructured: true,
        expectedReason: "MEDICATION COMPLIANCE",
      },
      {
        summary: "Patient seems lethargic, owner concerned about appetite",
        expectedStructured: false,
        expectedReason: "ATTENTION",
      },
      {
        summary: "**[DIET RESTRICTION] - Weight management program: Discuss low-calorie options with owner**",
        expectedStructured: true,
        expectedReason: "DIET RESTRICTION",
      },
      {
        summary: "Follow up on blood work results from Tuesday",
        expectedStructured: false,
        expectedReason: "ATTENTION",
      },
    ];

    realWorldCases.forEach(({ summary, expectedStructured, expectedReason }) => {
      const result = parseAttentionSummary(summary);
      expect(result?.isStructured).toBe(expectedStructured);
      expect(result?.reason).toBe(expectedReason);
      expect(result?.raw).toBe(summary);
    });
  });

  it("maintains consistency across all helper functions", () => {
    const testSummary = "**[FOLLOW-UP] - Lab results pending: Schedule recheck in 1 week**";

    const parsed = parseAttentionSummary(testSummary);
    const isStructured = isStructuredFormat(testSummary);
    const reason = extractReason(testSummary);
    const action = extractAction(testSummary);

    expect(parsed?.isStructured).toBe(isStructured);
    expect(parsed?.reason).toBe(reason);
    expect(parsed?.action).toBe(action);
  });
});