/**
 * Node.js test environment setup
 *
 * Use this setup file for testing pure functions, services, and utilities
 * that don't require a DOM environment.
 */
import { vi, beforeAll, afterEach } from "vitest";

/**
 * Setup mock environment variables for tests
 */
export function setupTestEnv(env?: Record<string, string>): void {
  const defaultEnv = {
    NODE_ENV: "test",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    VAPI_API_KEY: "test-vapi-key",
    QSTASH_TOKEN: "test-qstash-token",
    QSTASH_CURRENT_SIGNING_KEY: "test-signing-key",
    QSTASH_NEXT_SIGNING_KEY: "test-next-signing-key",
    RESEND_API_KEY: "test-resend-key",
    ...env,
  };

  Object.entries(defaultEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Create a standard Node.js test setup
 */
export function createNodeTestSetup(options?: {
  env?: Record<string, string>;
  mockDate?: Date;
}): void {
  // Setup environment
  setupTestEnv(options?.env);

  // Mock date if specified
  if (options?.mockDate) {
    vi.useFakeTimers();
    vi.setSystemTime(options.mockDate);
  }

  // Clear mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });
}

/**
 * Mock console methods to suppress output during tests
 */
export function suppressConsole(
  methods: ("log" | "warn" | "error" | "info" | "debug")[] = ["log", "warn", "error"]
): { restore: () => void } {
  const originalMethods: Record<string, typeof console.log> = {};

  methods.forEach((method) => {
    originalMethods[method] = console[method];
    console[method] = vi.fn();
  });

  return {
    restore: () => {
      methods.forEach((method) => {
        console[method] = originalMethods[method]!;
      });
    },
  };
}

/**
 * Mock fetch globally
 */
export function mockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response>
): { restore: () => void } {
  const originalFetch = global.fetch;

  global.fetch = vi.fn(handler);

  return {
    restore: () => {
      global.fetch = originalFetch;
    },
  };
}

/**
 * Create a mock fetch that returns JSON
 */
export function createJsonFetchMock<T>(
  data: T,
  options?: { status?: number; headers?: Record<string, string> }
): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), {
      status: options?.status ?? 200,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  );
}

/**
 * Wait for all pending promises to resolve
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Run a test with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]);
}

// Export a convenience setup for use in vitest.config.ts setupFiles
export const nodeSetup = () => {
  setupTestEnv();

  beforeAll(() => {
    // Any global beforeAll setup
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
};

export default nodeSetup;
