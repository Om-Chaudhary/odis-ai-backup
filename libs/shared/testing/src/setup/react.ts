/**
 * React test environment setup
 *
 * Use this setup file for testing React components.
 * Includes DOM environment setup, React Testing Library, and common mocks.
 */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { vi, afterEach, beforeAll } from "vitest";
import React from "react";

// Import node setup for environment variables
import { setupTestEnv } from "./node";

/**
 * Setup React testing environment
 */
export function createReactTestSetup(options?: {
  env?: Record<string, string>;
}): void {
  // Setup environment variables
  setupTestEnv(options?.env);

  // Cleanup after each test
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Setup Next.js mocks
  setupNextJsMocks();

  // Suppress specific console warnings
  suppressReactWarnings();
}

/**
 * Setup Next.js specific mocks
 */
export function setupNextJsMocks(): void {
  // Mock next/navigation
  vi.mock("next/navigation", () => ({
    useRouter() {
      return {
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
      };
    },
    useSearchParams() {
      return new URLSearchParams();
    },
    usePathname() {
      return "/";
    },
    useParams() {
      return {};
    },
    redirect: vi.fn(),
    notFound: vi.fn(),
  }));

  // Mock next/image
  vi.mock("next/image", () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      return React.createElement("img", props);
    },
  }));

  // Mock next/link
  vi.mock("next/link", () => ({
    default: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
    } & Record<string, unknown>) => {
      return React.createElement("a", { href, ...props }, children);
    },
  }));

  // Mock next/server for API route testing
  vi.mock("next/server", async () => {
    const actual = await vi.importActual("next/server");
    return {
      ...actual,
    };
  });
}

/**
 * Suppress common React warnings in tests
 */
export function suppressReactWarnings(): void {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      const message = typeof args[0] === "string" ? args[0] : "";

      // Suppress known warnings that don't affect tests
      const suppressedPatterns = [
        "Warning: ReactDOM.render",
        "Not implemented: HTMLFormElement.prototype.submit",
        "Warning: An update to",
        "act(...)",
      ];

      if (suppressedPatterns.some((pattern) => message.includes(pattern))) {
        return;
      }

      originalError.call(console, ...args);
    };

    console.warn = (...args: unknown[]) => {
      const message = typeof args[0] === "string" ? args[0] : "";

      // Suppress known warnings
      const suppressedPatterns = [
        "React does not recognize the",
        "Invalid prop",
      ];

      if (suppressedPatterns.some((pattern) => message.includes(pattern))) {
        return;
      }

      originalWarn.call(console, ...args);
    };
  });
}

/**
 * Mock window.matchMedia for responsive component tests
 */
export function mockMatchMedia(matches = false): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver(): void {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver(options?: {
  isIntersecting?: boolean;
}): void {
  const isIntersecting = options?.isIntersecting ?? true;

  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }]);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

/**
 * Setup common browser API mocks
 */
export function setupBrowserMocks(): void {
  mockMatchMedia();
  mockResizeObserver();
  mockIntersectionObserver();

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, "localStorage", { value: localStorageMock });

  // Mock sessionStorage
  Object.defineProperty(window, "sessionStorage", { value: localStorageMock });
}

// Export a convenience setup for use in vitest.config.ts setupFiles
export const reactSetup = () => {
  createReactTestSetup();
  setupBrowserMocks();
};

export default reactSetup;
