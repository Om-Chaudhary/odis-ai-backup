import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock PostHog
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    isFeatureEnabled: vi.fn(() => false),
  }),
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  private observedElements = new Set<Element>();

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {}

  observe(element: Element) {
    this.observedElements.add(element);
    // Trigger callback asynchronously to simulate real behavior
    queueMicrotask(() => {
      this.callback(
        [
          {
            isIntersecting: true,
            target: element,
            intersectionRatio: 1,
            boundingClientRect: element.getBoundingClientRect(),
            intersectionRect: element.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
          },
        ],
        this,
      );
    });
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  takeRecords() {
    return [];
  }

  root = null;
  rootMargin = "";
  thresholds = [];
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
global.scrollTo = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Ensure timer functions are available globally
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;
