import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeviceDetection } from "./useDeviceDetection";

describe("useDeviceDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Device Type Detection", () => {
    it("detects mobile device (width < 768)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("mobile");
      expect(result.current.viewport_width).toBe(375);
      expect(result.current.viewport_height).toBe(667);
    });

    it("detects tablet device (768 <= width <= 1024)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("tablet");
      expect(result.current.viewport_width).toBe(768);
      expect(result.current.viewport_height).toBe(1024);
    });

    it("detects desktop device (width > 1024)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1920,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 1080,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("desktop");
      expect(result.current.viewport_width).toBe(1920);
      expect(result.current.viewport_height).toBe(1080);
    });
  });

  describe("Resize Handling", () => {
    it("updates device type when window is resized from mobile to desktop", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("mobile");

      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 1920,
        });

        Object.defineProperty(window, "innerHeight", {
          writable: true,
          configurable: true,
          value: 1080,
        });

        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.device_type).toBe("desktop");
      expect(result.current.viewport_width).toBe(1920);
      expect(result.current.viewport_height).toBe(1080);
    });

    it("updates viewport dimensions on resize", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 600,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.viewport_width).toBe(800);
      expect(result.current.viewport_height).toBe(600);

      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 1024,
        });

        Object.defineProperty(window, "innerHeight", {
          writable: true,
          configurable: true,
          value: 768,
        });

        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.viewport_width).toBe(1024);
      expect(result.current.viewport_height).toBe(768);
    });
  });

  describe("Edge Cases", () => {
    it("handles exact tablet boundary (768px)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("tablet");
    });

    it("handles exact desktop boundary (1024px + 1)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1025,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("desktop");
    });

    it("handles very small mobile screens", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("mobile");
      expect(result.current.viewport_width).toBe(320);
    });

    it("handles very large desktop screens", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 3840,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 2160,
      });

      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.device_type).toBe("desktop");
      expect(result.current.viewport_width).toBe(3840);
      expect(result.current.viewport_height).toBe(2160);
    });
  });

  describe("Cleanup", () => {
    it("removes resize event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useDeviceDetection());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });
  });

  describe("Initial State", () => {
    it("has sensible default values before window is measured", () => {
      const { result } = renderHook(() => useDeviceDetection());

      // Should have device info (either from actual window or defaults)
      expect(result.current.device_type).toBeDefined();
      expect(result.current.viewport_width).toBeGreaterThan(0);
      expect(result.current.viewport_height).toBeGreaterThan(0);
    });
  });
});
