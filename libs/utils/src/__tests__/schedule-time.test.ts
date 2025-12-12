/**
 * Tests for calculateScheduleTime function
 *
 * Verifies timezone-aware scheduling, especially PST/PDT conversion
 * and edge cases around date boundaries and DST transitions.
 */

import { describe, it, expect } from "vitest";
import { calculateScheduleTime } from "../timezone";

describe("calculateScheduleTime", () => {
  describe("Basic Scheduling", () => {
    it("should return same day with 0 delay days", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z"); // Noon UTC on Dec 13
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      // 9 AM PST on Dec 13 = 5 PM UTC (UTC-8 during winter)
      expect(result.toISOString()).toBe("2024-12-13T17:00:00.000Z");
    });

    it("should add 1 delay day correctly", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      // 9 AM PST on Dec 14 = 5 PM UTC
      expect(result.toISOString()).toBe("2024-12-14T17:00:00.000Z");
    });

    it("should add 2 delay days correctly", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        2,
        "16:00",
        "America/Los_Angeles",
      );

      // 4 PM PST on Dec 15 = midnight UTC next day
      expect(result.toISOString()).toBe("2024-12-16T00:00:00.000Z");
    });

    it("should add 7 delay days correctly", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        7,
        "10:00",
        "America/Los_Angeles",
      );

      // 10 AM PST on Dec 20 = 6 PM UTC
      expect(result.toISOString()).toBe("2024-12-20T18:00:00.000Z");
    });

    it("should add 30 delay days correctly", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        30,
        "14:00",
        "America/Los_Angeles",
      );

      // 2 PM PST on Jan 12, 2025 = 10 PM UTC
      expect(result.toISOString()).toBe("2025-01-12T22:00:00.000Z");
    });
  });

  describe("Timezone Conversion - PST (Winter)", () => {
    it("should convert 9 AM PST to 5 PM UTC", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-13T17:00:00.000Z");
    });

    it("should convert 10 AM PST to 6 PM UTC", () => {
      const baseDate = new Date("2024-01-15T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "10:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-01-15T18:00:00.000Z");
    });

    it("should convert 4 PM PST to midnight UTC next day", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "16:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-14T00:00:00.000Z");
    });

    it("should convert midnight PST to 8 AM UTC", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "00:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-13T08:00:00.000Z");
    });

    it("should convert 11:59 PM PST to 7:59 AM UTC next day", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "23:59",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-14T07:59:00.000Z");
    });
  });

  describe("Timezone Conversion - PDT (Summer)", () => {
    it("should convert 9 AM PDT to 4 PM UTC", () => {
      const baseDate = new Date("2024-06-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      // PDT is UTC-7 during summer
      expect(result.toISOString()).toBe("2024-06-13T16:00:00.000Z");
    });

    it("should convert 10 AM PDT to 5 PM UTC", () => {
      const baseDate = new Date("2024-07-15T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "10:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-07-15T17:00:00.000Z");
    });

    it("should convert 4 PM PDT to 11 PM UTC", () => {
      const baseDate = new Date("2024-08-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "16:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-08-13T23:00:00.000Z");
    });

    it("should convert midnight PDT to 7 AM UTC", () => {
      const baseDate = new Date("2024-06-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "00:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-06-13T07:00:00.000Z");
    });
  });

  describe("DST Transitions", () => {
    it("should handle PST to PDT transition (March 2024)", () => {
      // March 10, 2024 is when DST starts (2 AM -> 3 AM)
      const beforeDST = new Date("2024-03-09T12:00:00Z");
      const afterDST = new Date("2024-03-11T12:00:00Z");

      const beforeResult = calculateScheduleTime(
        beforeDST,
        0,
        "09:00",
        "America/Los_Angeles",
      );
      const afterResult = calculateScheduleTime(
        afterDST,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      // Before DST: 9 AM PST = 5 PM UTC (UTC-8)
      expect(beforeResult.toISOString()).toBe("2024-03-09T17:00:00.000Z");
      // After DST: 9 AM PDT = 4 PM UTC (UTC-7)
      expect(afterResult.toISOString()).toBe("2024-03-11T16:00:00.000Z");
    });

    it("should handle PDT to PST transition (November 2024)", () => {
      // November 3, 2024 is when DST ends (2 AM -> 1 AM)
      const beforeDST = new Date("2024-11-02T12:00:00Z");
      const afterDST = new Date("2024-11-04T12:00:00Z");

      const beforeResult = calculateScheduleTime(
        beforeDST,
        0,
        "09:00",
        "America/Los_Angeles",
      );
      const afterResult = calculateScheduleTime(
        afterDST,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      // Before: 9 AM PDT = 4 PM UTC (UTC-7)
      expect(beforeResult.toISOString()).toBe("2024-11-02T16:00:00.000Z");
      // After: 9 AM PST = 5 PM UTC (UTC-8)
      expect(afterResult.toISOString()).toBe("2024-11-04T17:00:00.000Z");
    });

    it("should handle scheduling across DST transition with delay", () => {
      // Schedule 5 days after March 8 (crosses DST boundary on March 10)
      const baseDate = new Date("2024-03-08T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        5,
        "09:00",
        "America/Los_Angeles",
      );

      // March 13 is after DST starts, so 9 AM PDT = 4 PM UTC
      expect(result.toISOString()).toBe("2024-03-13T16:00:00.000Z");
    });
  });

  describe("Preferred Time Formats", () => {
    it("should accept HH:MM format", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-13T17:00:00.000Z");
    });

    it("should accept HH:MM:SS format", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-13T17:00:00.000Z");
    });

    it("should handle early morning times (00:00)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "00:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-13T08:00:00.000Z");
    });

    it("should handle late night times (23:59)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "23:59",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-14T07:59:00.000Z");
    });

    it("should handle business hours start (09:00)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-13T17:00:00.000Z");
    });

    it("should handle afternoon call window (16:00)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "16:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-12-14T00:00:00.000Z");
    });

    it("should handle malformed time format", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      // When splitting ":" we get [NaN, NaN] which becomes "00:00" via padStart
      const result = calculateScheduleTime(
        baseDate,
        0,
        ":",
        "America/Los_Angeles",
      );

      // NaN values get stringified as "00" by padStart, resulting in 00:00
      // 00:00 (midnight) PST = 08:00 UTC
      expect(result.toISOString()).toBe("2024-12-13T08:00:00.000Z");
    });
  });

  describe("Date Boundary Edge Cases", () => {
    it("should handle month boundary (Jan 31 -> Feb 1)", () => {
      const baseDate = new Date("2024-01-31T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      // Feb 1, 2024 at 9 AM PST = Feb 1, 2024 at 5 PM UTC
      expect(result.toISOString()).toBe("2024-02-01T17:00:00.000Z");
    });

    it("should handle year boundary (Dec 31 -> Jan 1)", () => {
      const baseDate = new Date("2024-12-31T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      // Jan 1, 2025 at 9 AM PST = Jan 1, 2025 at 5 PM UTC
      expect(result.toISOString()).toBe("2025-01-01T17:00:00.000Z");
    });

    it("should handle leap year (Feb 28 -> Feb 29)", () => {
      const baseDate = new Date("2024-02-28T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      // 2024 is a leap year, so Feb 29 exists
      expect(result.toISOString()).toBe("2024-02-29T17:00:00.000Z");
    });

    it("should handle non-leap year (Feb 28 -> Mar 1)", () => {
      const baseDate = new Date("2023-02-28T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      // 2023 is not a leap year, so Feb 28 + 1 = Mar 1
      expect(result.toISOString()).toBe("2023-03-01T17:00:00.000Z");
    });

    it("should handle end of February in leap year (Feb 29 -> Mar 1)", () => {
      const baseDate = new Date("2024-02-29T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-03-01T17:00:00.000Z");
    });

    it("should handle end of 31-day month (March 31 -> April 1)", () => {
      const baseDate = new Date("2024-03-31T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-04-01T16:00:00.000Z"); // PDT
    });

    it("should handle end of 30-day month (April 30 -> May 1)", () => {
      const baseDate = new Date("2024-04-30T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      expect(result.toISOString()).toBe("2024-05-01T16:00:00.000Z"); // PDT
    });
  });

  describe("Different Timezones", () => {
    it("should work with America/New_York (EST)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/New_York",
      );

      // 9 AM EST = 2 PM UTC (UTC-5 during winter)
      expect(result.toISOString()).toBe("2024-12-13T14:00:00.000Z");
    });

    it("should work with America/Chicago (CST)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Chicago",
      );

      // 9 AM CST = 3 PM UTC (UTC-6 during winter)
      expect(result.toISOString()).toBe("2024-12-13T15:00:00.000Z");
    });

    it("should work with America/Denver (MST)", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "09:00",
        "America/Denver",
      );

      // 9 AM MST = 4 PM UTC (UTC-7 during winter)
      expect(result.toISOString()).toBe("2024-12-13T16:00:00.000Z");
    });

    it("should work with UTC timezone", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(baseDate, 0, "09:00", "UTC");

      // 9 AM UTC = 9 AM UTC
      expect(result.toISOString()).toBe("2024-12-13T09:00:00.000Z");
    });
  });

  describe("Real-world Scenarios", () => {
    it("should schedule email 1 day after approval at 10 AM PST", () => {
      // Approval time: Dec 12 at 3 PM PST
      const approvalDate = new Date("2024-12-12T23:00:00Z");
      const emailDelayDays = 1;
      const preferredEmailTime = "10:00";

      const result = calculateScheduleTime(
        approvalDate,
        emailDelayDays,
        preferredEmailTime,
        "America/Los_Angeles",
      );

      // Should be Dec 13 at 10 AM PST = Dec 13 at 6 PM UTC
      expect(result.toISOString()).toBe("2024-12-13T18:00:00.000Z");
    });

    it("should schedule call 2 days after approval at 4 PM PST", () => {
      // Approval time: Dec 12 at 3 PM PST
      const approvalDate = new Date("2024-12-12T23:00:00Z");
      const callDelayDays = 2;
      const preferredCallTime = "16:00";

      const result = calculateScheduleTime(
        approvalDate,
        callDelayDays,
        preferredCallTime,
        "America/Los_Angeles",
      );

      // Should be Dec 14 at 4 PM PST = Dec 15 at midnight UTC
      expect(result.toISOString()).toBe("2024-12-15T00:00:00.000Z");
    });

    it("should handle immediate delivery (0 delay)", () => {
      const now = new Date("2024-12-13T20:00:00Z"); // 12 PM PST
      const result = calculateScheduleTime(
        now,
        0,
        "12:00",
        "America/Los_Angeles",
      );

      // Same day at noon PST = 8 PM UTC
      expect(result.toISOString()).toBe("2024-12-13T20:00:00.000Z");
    });

    it("should handle weekend scheduling (Saturday)", () => {
      // Saturday, Dec 14, 2024
      const saturday = new Date("2024-12-14T12:00:00Z");
      const result = calculateScheduleTime(
        saturday,
        1,
        "09:00",
        "America/Los_Angeles",
      );

      // Sunday, Dec 15 at 9 AM PST = 5 PM UTC
      expect(result.toISOString()).toBe("2024-12-15T17:00:00.000Z");
    });

    it("should preserve minutes when converting timezones", () => {
      const baseDate = new Date("2024-12-13T12:00:00Z");
      const result = calculateScheduleTime(
        baseDate,
        0,
        "10:30",
        "America/Los_Angeles",
      );

      // 10:30 AM PST = 6:30 PM UTC
      expect(result.toISOString()).toBe("2024-12-13T18:30:00.000Z");
    });
  });
});
