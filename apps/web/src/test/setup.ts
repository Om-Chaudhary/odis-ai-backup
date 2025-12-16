/**
 * Web app test setup file
 *
 * This file is automatically loaded before each test file
 * as configured in vitest.config.ts setupFiles
 */
import { vi, beforeAll, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Setup mock environment variables
const defaultEnv = {
  NODE_ENV: "test",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  VAPI_API_KEY: "test-vapi-key",
  VAPI_PRIVATE_KEY: "test-vapi-private-key",
  VAPI_WEBHOOK_SECRET: "test-webhook-secret",
  VAPI_ASSISTANT_ID: "test-assistant-id",
  VAPI_PHONE_NUMBER_ID: "test-phone-number-id",
  QSTASH_TOKEN: "test-qstash-token",
  QSTASH_CURRENT_SIGNING_KEY: "test-signing-key",
  QSTASH_NEXT_SIGNING_KEY: "test-next-signing-key",
  RESEND_API_KEY: "test-resend-key",
};

Object.entries(defaultEnv).forEach(([key, value]) => {
  process.env[key] = value;
});

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

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  headers: vi.fn(() => new Map()),
}));

// Setup browser mocks for happy-dom environment
beforeAll(() => {
  // Mock matchMedia
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
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

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock scrollTo
    window.scrollTo = vi.fn();
  }
});

// Clear mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
