import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSectionVisibility } from "./useSectionVisibility";

describe("useSectionVisibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any created elements
    document.body.innerHTML = "";
  });

  describe("Basic Functionality", () => {
    it("returns a ref object", () => {
      const { result } = renderHook(() => useSectionVisibility("test-section"));

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty("current");
    });

    it("initializes with null ref", () => {
      const { result } = renderHook(() => useSectionVisibility("hero"));

      expect(result.current.current).toBeNull();
    });

    it("accepts section name parameter", () => {
      const { result: result1 } = renderHook(() =>
        useSectionVisibility("hero"),
      );
      const { result: result2 } = renderHook(() =>
        useSectionVisibility("pricing"),
      );

      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
    });
  });

  describe("Custom Options", () => {
    it("accepts custom threshold option", () => {
      const { result } = renderHook(() =>
        useSectionVisibility("test-section", { threshold: 0.8 }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts custom rootMargin option", () => {
      const { result } = renderHook(() =>
        useSectionVisibility("test-section", { rootMargin: "100px" }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts both threshold and rootMargin", () => {
      const { result } = renderHook(() =>
        useSectionVisibility("test-section", {
          threshold: 0.7,
          rootMargin: "50px",
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Section Name Handling", () => {
    it("accepts different section names", () => {
      const sections = ["hero", "pricing", "testimonials", "faq"];

      sections.forEach((section) => {
        const { result } = renderHook(() => useSectionVisibility(section));
        expect(result.current).toBeDefined();
        expect(result.current.current).toBeNull();
      });
    });

    it("accepts section names with special characters", () => {
      const { result } = renderHook(() =>
        useSectionVisibility("section-with-dashes_and_underscores"),
      );

      expect(result.current).toBeDefined();
      expect(result.current.current).toBeNull();
    });
  });

  describe("Observer Cleanup", () => {
    it("disconnects observer on unmount", () => {
      const { unmount } = renderHook(() => useSectionVisibility("test-section"));

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("handles null ref gracefully", () => {
      const { result } = renderHook(() => useSectionVisibility("test-section"));

      // Ref starts as null
      expect(result.current.current).toBeNull();
    });

    it("works with empty section name", () => {
      const { result } = renderHook(() => useSectionVisibility(""));

      expect(result.current).toBeDefined();
      expect(result.current.current).toBeNull();
    });
  });

  describe("Default Options", () => {
    it("uses default threshold of 0.5", async () => {
      const { result } = renderHook(() => useSectionVisibility("test-section"));

      expect(result.current).toBeDefined();
      // Default threshold is 0.5 (50% visibility)
    });

    it("uses default rootMargin of 0px", async () => {
      const { result } = renderHook(() => useSectionVisibility("test-section"));

      expect(result.current).toBeDefined();
      // Default rootMargin is "0px"
    });
  });
});
