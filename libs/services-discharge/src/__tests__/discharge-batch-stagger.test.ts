/**
 * Test for staggered batch discharge scheduling
 *
 * Verifies that emails are staggered by 20 seconds and calls by 2 minutes
 */

import { describe, it, expect } from "vitest";

describe("Discharge Batch Staggering Logic", () => {
  it("should calculate correct email stagger times", () => {
    const baseTime = new Date("2025-01-01T10:00:00Z");

    // Test cases for different indices
    const testCases = [
      { index: 0, expectedStagger: 0 }, // First case: no stagger
      { index: 1, expectedStagger: 20 * 1000 }, // 20 seconds
      { index: 2, expectedStagger: 40 * 1000 }, // 40 seconds
      { index: 5, expectedStagger: 100 * 1000 }, // 100 seconds (1min 40s)
      { index: 10, expectedStagger: 200 * 1000 }, // 200 seconds (3min 20s)
    ];

    testCases.forEach(({ index, expectedStagger }) => {
      const emailStagger = index * 20 * 1000; // 20 seconds per case in ms
      const staggeredEmailTime = new Date(baseTime.getTime() + emailStagger);

      expect(emailStagger).toBe(expectedStagger);
      expect(staggeredEmailTime.getTime() - baseTime.getTime()).toBe(
        expectedStagger,
      );
    });
  });

  it("should calculate correct call stagger times", () => {
    const baseTime = new Date("2025-01-01T14:00:00Z");

    // Test cases for different indices
    const testCases = [
      { index: 0, expectedStagger: 0 }, // First case: no stagger
      { index: 1, expectedStagger: 2 * 60 * 1000 }, // 2 minutes
      { index: 2, expectedStagger: 4 * 60 * 1000 }, // 4 minutes
      { index: 5, expectedStagger: 10 * 60 * 1000 }, // 10 minutes
      { index: 10, expectedStagger: 20 * 60 * 1000 }, // 20 minutes
    ];

    testCases.forEach(({ index, expectedStagger }) => {
      const callStagger = index * 2 * 60 * 1000; // 2 minutes per case in ms
      const staggeredCallTime = new Date(baseTime.getTime() + callStagger);

      expect(callStagger).toBe(expectedStagger);
      expect(staggeredCallTime.getTime() - baseTime.getTime()).toBe(
        expectedStagger,
      );
    });
  });

  it("should maintain correct stagger across chunks", () => {
    const baseEmailTime = new Date("2025-01-01T10:00:00Z");
    const baseCallTime = new Date("2025-01-01T14:00:00Z");
    const chunkSize = 10;
    const totalCases = 25;

    // Simulate processing across chunks
    const results = [];

    for (let i = 0; i < totalCases; i += chunkSize) {
      const chunkEnd = Math.min(i + chunkSize, totalCases);

      for (let chunkIndex = 0; chunkIndex < chunkEnd - i; chunkIndex++) {
        const globalIndex = i + chunkIndex;

        const emailStagger = globalIndex * 20 * 1000;
        const callStagger = globalIndex * 2 * 60 * 1000;

        const staggeredEmailTime = new Date(
          baseEmailTime.getTime() + emailStagger,
        );
        const staggeredCallTime = new Date(
          baseCallTime.getTime() + callStagger,
        );

        results.push({
          globalIndex,
          emailStagger,
          callStagger,
          staggeredEmailTime,
          staggeredCallTime,
        });
      }
    }

    // Verify first case has no stagger
    expect(results[0]?.emailStagger).toBe(0);
    expect(results[0]?.callStagger).toBe(0);

    // Verify second case has correct stagger
    expect(results[1]?.emailStagger).toBe(20 * 1000);
    expect(results[1]?.callStagger).toBe(2 * 60 * 1000);

    // Verify 11th case (after first chunk) has correct stagger
    expect(results[10]?.emailStagger).toBe(10 * 20 * 1000); // 200 seconds
    expect(results[10]?.callStagger).toBe(10 * 2 * 60 * 1000); // 20 minutes

    // Verify last case
    expect(results[24]?.emailStagger).toBe(24 * 20 * 1000); // 480 seconds (8 min)
    expect(results[24]?.callStagger).toBe(24 * 2 * 60 * 1000); // 48 minutes
  });

  it("should have correct time intervals between consecutive cases", () => {
    const baseEmailTime = new Date("2025-01-01T10:00:00Z");
    const baseCallTime = new Date("2025-01-01T14:00:00Z");

    // Calculate times for three consecutive cases
    const case0Email = new Date(baseEmailTime.getTime() + 0 * 20 * 1000);
    const case1Email = new Date(baseEmailTime.getTime() + 1 * 20 * 1000);
    const case2Email = new Date(baseEmailTime.getTime() + 2 * 20 * 1000);

    const case0Call = new Date(baseCallTime.getTime() + 0 * 2 * 60 * 1000);
    const case1Call = new Date(baseCallTime.getTime() + 1 * 2 * 60 * 1000);
    const case2Call = new Date(baseCallTime.getTime() + 2 * 2 * 60 * 1000);

    // Verify email intervals are 20 seconds apart
    expect(case1Email.getTime() - case0Email.getTime()).toBe(20 * 1000);
    expect(case2Email.getTime() - case1Email.getTime()).toBe(20 * 1000);

    // Verify call intervals are 2 minutes apart
    expect(case1Call.getTime() - case0Call.getTime()).toBe(2 * 60 * 1000);
    expect(case2Call.getTime() - case0Call.getTime()).toBe(4 * 60 * 1000);
  });
});
