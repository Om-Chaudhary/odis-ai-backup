/**
 * Tests for cn.ts utilities
 * - cn: Class name utility for Tailwind CSS
 * - formatDuration: Duration formatting
 */

import { describe, it, expect } from "vitest";
import { cn, formatDuration } from "../cn";

describe("cn", () => {
  describe("basic functionality", () => {
    it("merges simple class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles single class name", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("handles empty input", () => {
      expect(cn()).toBe("");
    });

    it("handles undefined values", () => {
      expect(cn("foo", undefined, "bar")).toBe("foo bar");
    });

    it("handles null values", () => {
      expect(cn("foo", null, "bar")).toBe("foo bar");
    });

    it("handles false values", () => {
      expect(cn("foo", false, "bar")).toBe("foo bar");
    });
  });

  describe("conditional classes", () => {
    it("includes truthy conditional classes", () => {
      expect(cn("base", true && "active")).toBe("base active");
    });

    it("excludes falsy conditional classes", () => {
      expect(cn("base", false && "active")).toBe("base");
    });

    it("handles object syntax", () => {
      expect(cn({ foo: true, bar: false })).toBe("foo");
    });

    it("handles mixed object and string", () => {
      expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });
  });

  describe("tailwind merge", () => {
    it("merges conflicting padding classes", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
    });

    it("merges conflicting margin classes", () => {
      expect(cn("m-2", "m-4")).toBe("m-4");
    });

    it("merges conflicting text colors", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("merges conflicting background colors", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("keeps non-conflicting classes", () => {
      expect(cn("p-2", "m-4")).toBe("p-2 m-4");
    });

    it("handles complex tailwind classes", () => {
      expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe(
        "hover:bg-blue-500",
      );
    });

    it("preserves responsive classes", () => {
      expect(cn("md:p-2", "lg:p-4")).toBe("md:p-2 lg:p-4");
    });
  });

  describe("array inputs", () => {
    it("handles array of classes", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("handles nested arrays", () => {
      expect(cn(["foo", ["bar", "baz"]])).toBe("foo bar baz");
    });
  });
});

describe("formatDuration", () => {
  describe("valid inputs", () => {
    it("formats zero seconds", () => {
      expect(formatDuration(0)).toBe("0:00");
    });

    it("formats single digit seconds", () => {
      expect(formatDuration(5)).toBe("0:05");
    });

    it("formats double digit seconds", () => {
      expect(formatDuration(45)).toBe("0:45");
    });

    it("formats one minute", () => {
      expect(formatDuration(60)).toBe("1:00");
    });

    it("formats minutes with seconds", () => {
      expect(formatDuration(90)).toBe("1:30");
    });

    it("formats multiple minutes", () => {
      expect(formatDuration(125)).toBe("2:05");
    });

    it("formats hour length durations", () => {
      expect(formatDuration(3600)).toBe("60:00");
    });

    it("formats long durations", () => {
      expect(formatDuration(3665)).toBe("61:05");
    });
  });

  describe("edge cases", () => {
    it("handles NaN", () => {
      expect(formatDuration(NaN)).toBe("0:00");
    });

    it("handles negative numbers", () => {
      const result = formatDuration(-60);
      expect(result).toBeDefined();
    });

    it("floors decimal seconds", () => {
      expect(formatDuration(65.7)).toBe("1:05");
    });

    it("handles very small decimals", () => {
      expect(formatDuration(0.5)).toBe("0:00");
    });
  });

  describe("boundary values", () => {
    it("formats 59 seconds correctly", () => {
      expect(formatDuration(59)).toBe("0:59");
    });

    it("formats 60 seconds as 1:00", () => {
      expect(formatDuration(60)).toBe("1:00");
    });

    it("formats 119 seconds correctly", () => {
      expect(formatDuration(119)).toBe("1:59");
    });
  });
});
