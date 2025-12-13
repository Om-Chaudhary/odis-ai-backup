/**
 * Tests for business-hours.ts utilities
 * - isWithinBusinessHours: Check if time is within business hours
 * - getNextBusinessHourSlot: Get next available business hour
 * - isFutureTime: Check if time is in the future
 * - calculateDelay: Calculate delay in seconds
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isWithinBusinessHours,
  getNextBusinessHourSlot,
  isFutureTime,
  calculateDelay,
} from "../business-hours";

describe("isWithinBusinessHours", () => {
  describe("default config (9-17, Pacific, excludeWeekends)", () => {
    it("returns true for 9 AM on weekday", () => {
      // Monday 9:00 AM Pacific = Monday 17:00 UTC (during PST)
      const mondayMorning = new Date("2024-12-09T17:00:00Z"); // Monday 9 AM PST
      expect(isWithinBusinessHours(mondayMorning, "America/Los_Angeles")).toBe(
        true,
      );
    });

    it("returns true for 4 PM on weekday", () => {
      // Monday 4:00 PM Pacific = Tuesday 00:00 UTC (during PST)
      const mondayAfternoon = new Date("2024-12-10T00:00:00Z"); // Monday 4 PM PST
      expect(
        isWithinBusinessHours(mondayAfternoon, "America/Los_Angeles"),
      ).toBe(true);
    });

    it("returns false for 8 AM (before business hours)", () => {
      // Monday 8:00 AM Pacific = Monday 16:00 UTC (during PST)
      const earlyMorning = new Date("2024-12-09T16:00:00Z"); // Monday 8 AM PST
      expect(isWithinBusinessHours(earlyMorning, "America/Los_Angeles")).toBe(
        false,
      );
    });

    it("returns false for 5 PM (at end hour)", () => {
      // Monday 5:00 PM Pacific = Tuesday 01:00 UTC (during PST)
      const endOfDay = new Date("2024-12-10T01:00:00Z"); // Monday 5 PM PST
      expect(isWithinBusinessHours(endOfDay, "America/Los_Angeles")).toBe(
        false,
      );
    });

    it("returns false for 6 PM (after business hours)", () => {
      // Monday 6:00 PM Pacific = Tuesday 02:00 UTC (during PST)
      const evening = new Date("2024-12-10T02:00:00Z"); // Monday 6 PM PST
      expect(isWithinBusinessHours(evening, "America/Los_Angeles")).toBe(false);
    });

    it("returns false for Saturday", () => {
      // Saturday 12:00 PM Pacific
      const saturday = new Date("2024-12-14T20:00:00Z"); // Saturday 12 PM PST
      expect(isWithinBusinessHours(saturday, "America/Los_Angeles")).toBe(
        false,
      );
    });

    it("returns false for Sunday", () => {
      // Sunday 12:00 PM Pacific
      const sunday = new Date("2024-12-15T20:00:00Z"); // Sunday 12 PM PST
      expect(isWithinBusinessHours(sunday, "America/Los_Angeles")).toBe(false);
    });
  });

  describe("custom config", () => {
    it("respects custom start hour", () => {
      // Monday 8:00 AM Pacific (normally before business hours)
      const earlyMorning = new Date("2024-12-09T16:00:00Z"); // Monday 8 AM PST
      expect(
        isWithinBusinessHours(earlyMorning, "America/Los_Angeles", {
          startHour: 8,
        }),
      ).toBe(true);
    });

    it("respects custom end hour", () => {
      // Monday 6:00 PM Pacific (normally after business hours)
      const evening = new Date("2024-12-10T02:00:00Z"); // Monday 6 PM PST
      expect(
        isWithinBusinessHours(evening, "America/Los_Angeles", {
          endHour: 19,
        }),
      ).toBe(true);
    });

    it("allows weekends when excludeWeekends is false", () => {
      // Saturday 12:00 PM Pacific
      const saturday = new Date("2024-12-14T20:00:00Z"); // Saturday 12 PM PST
      expect(
        isWithinBusinessHours(saturday, "America/Los_Angeles", {
          excludeWeekends: false,
        }),
      ).toBe(true);
    });
  });

  describe("different timezones", () => {
    it("handles Eastern timezone", () => {
      // Monday 12:00 PM Eastern = Monday 17:00 UTC
      const noonEastern = new Date("2024-12-09T17:00:00Z");
      expect(isWithinBusinessHours(noonEastern, "America/New_York")).toBe(true);
    });

    it("handles UTC timezone", () => {
      // Monday 12:00 UTC
      const noonUTC = new Date("2024-12-09T12:00:00Z");
      expect(isWithinBusinessHours(noonUTC, "UTC")).toBe(true);
    });
  });
});

describe("getNextBusinessHourSlot", () => {
  describe("within business hours", () => {
    it("returns same time if already within business hours", () => {
      // Monday 10:00 AM Pacific = Monday 18:00 UTC (during PST)
      const mondayMidMorning = new Date("2024-12-09T18:00:00Z");
      const result = getNextBusinessHourSlot(
        mondayMidMorning,
        "America/Los_Angeles",
      );

      // Should return the same time
      expect(result.getTime()).toBe(mondayMidMorning.getTime());
    });
  });

  describe("before business hours", () => {
    it("moves to 9 AM same day if before business hours", () => {
      // Monday 7:00 AM Pacific = Monday 15:00 UTC (during PST)
      const earlyMorning = new Date("2024-12-09T15:00:00Z");
      const result = getNextBusinessHourSlot(
        earlyMorning,
        "America/Los_Angeles",
      );

      // Should move to 9 AM Pacific = 17:00 UTC
      expect(result.toISOString()).toBe("2024-12-09T17:00:00.000Z");
    });
  });

  describe("after business hours", () => {
    it("moves to 9 AM next day if after business hours", () => {
      // Monday 6:00 PM Pacific = Tuesday 02:00 UTC (during PST)
      const evening = new Date("2024-12-10T02:00:00Z");
      const result = getNextBusinessHourSlot(evening, "America/Los_Angeles");

      // Should move to Tuesday 9 AM Pacific = 17:00 UTC
      expect(result.toISOString()).toBe("2024-12-10T17:00:00.000Z");
    });
  });

  describe("weekend handling", () => {
    it("skips Saturday to Monday 9 AM", () => {
      // Saturday 12:00 PM Pacific = Saturday 20:00 UTC (during PST)
      const saturday = new Date("2024-12-14T20:00:00Z");
      const result = getNextBusinessHourSlot(saturday, "America/Los_Angeles");

      // Should move to Monday 9 AM Pacific = 17:00 UTC on Dec 16
      expect(result.toISOString()).toBe("2024-12-16T17:00:00.000Z");
    });

    it("skips Sunday to Monday 9 AM", () => {
      // Sunday 12:00 PM Pacific = Sunday 20:00 UTC (during PST)
      const sunday = new Date("2024-12-15T20:00:00Z");
      const result = getNextBusinessHourSlot(sunday, "America/Los_Angeles");

      // Should move to Monday 9 AM Pacific = 17:00 UTC on Dec 16
      expect(result.toISOString()).toBe("2024-12-16T17:00:00.000Z");
    });
  });

  describe("custom config", () => {
    it("respects custom start hour", () => {
      // Monday 7:00 AM Pacific = Monday 15:00 UTC (during PST)
      const earlyMorning = new Date("2024-12-09T15:00:00Z");
      const result = getNextBusinessHourSlot(
        earlyMorning,
        "America/Los_Angeles",
        {
          startHour: 8,
        },
      );

      // Should move to 8 AM Pacific = 16:00 UTC
      expect(result.toISOString()).toBe("2024-12-09T16:00:00.000Z");
    });
  });
});

describe("isFutureTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to Dec 12, 2024, 12:00 PM UTC
    vi.setSystemTime(new Date("2024-12-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for future timestamp", () => {
    const future = new Date("2024-12-12T13:00:00Z"); // 1 hour in future
    expect(isFutureTime(future)).toBe(true);
  });

  it("returns false for past timestamp", () => {
    const past = new Date("2024-12-12T11:00:00Z"); // 1 hour in past
    expect(isFutureTime(past)).toBe(false);
  });

  it("returns false for current time", () => {
    const now = new Date("2024-12-12T12:00:00Z");
    expect(isFutureTime(now)).toBe(false);
  });

  it("returns true for far future", () => {
    const farFuture = new Date("2025-12-12T12:00:00Z"); // 1 year in future
    expect(isFutureTime(farFuture)).toBe(true);
  });
});

describe("calculateDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to Dec 12, 2024, 12:00:00 PM UTC
    vi.setSystemTime(new Date("2024-12-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates correct delay for future time", () => {
    const future = new Date("2024-12-12T12:01:00Z"); // 1 minute in future
    expect(calculateDelay(future)).toBe(60);
  });

  it("returns 0 for past time", () => {
    const past = new Date("2024-12-12T11:00:00Z");
    expect(calculateDelay(past)).toBe(0);
  });

  it("returns 0 for current time", () => {
    const now = new Date("2024-12-12T12:00:00Z");
    expect(calculateDelay(now)).toBe(0);
  });

  it("calculates hours correctly", () => {
    const twoHoursLater = new Date("2024-12-12T14:00:00Z");
    expect(calculateDelay(twoHoursLater)).toBe(7200); // 2 hours = 7200 seconds
  });

  it("floors to nearest second", () => {
    const slightlyFuture = new Date("2024-12-12T12:00:00.500Z"); // 500ms in future
    expect(calculateDelay(slightlyFuture)).toBe(0); // Floors to 0
  });
});
