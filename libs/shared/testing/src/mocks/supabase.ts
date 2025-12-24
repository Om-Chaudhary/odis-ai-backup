/**
 * Supabase mock utilities
 *
 * Provides mocks for Supabase client and its methods
 */
import { vi } from "vitest";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";

/**
 * Mock Supabase query builder
 * Chainable mock that simulates Supabase's fluent API
 */
export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  containedBy: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

/**
 * Create a chainable mock query builder
 */
export function createMockQueryBuilder(
  resolveWith: { data: unknown; error: null } | { data: null; error: Error } = {
    data: [],
    error: null,
  }
): MockQueryBuilder {
  const builder: MockQueryBuilder = {} as MockQueryBuilder;

  // All methods return the builder for chaining
  const chainableMethods = [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "is",
    "in",
    "contains",
    "containedBy",
    "range",
    "order",
    "limit",
  ] as const;

  chainableMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  // Terminal methods resolve the promise
  builder.single = vi.fn().mockResolvedValue(resolveWith);
  builder.maybeSingle = vi.fn().mockResolvedValue(resolveWith);
  builder.then = vi.fn((resolve) => resolve(resolveWith));

  return builder;
}

/**
 * Mock Supabase Auth
 */
export interface MockSupabaseAuth {
  getUser: ReturnType<typeof vi.fn>;
  getSession: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signInWithOAuth: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock Supabase auth object
 */
export function createMockSupabaseAuth(user?: User, session?: Session): MockSupabaseAuth {
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user, session },
      error: null,
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: "" }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user, session }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  };
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient(options?: {
  user?: User;
  session?: Session;
  queryBuilder?: MockQueryBuilder;
}): {
  client: Partial<SupabaseClient>;
  auth: MockSupabaseAuth;
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  storage: { from: ReturnType<typeof vi.fn> };
} {
  const {
    user,
    session,
    queryBuilder = createMockQueryBuilder(),
  } = options ?? {};

  const auth = createMockSupabaseAuth(user, session);
  const from = vi.fn().mockReturnValue(queryBuilder);
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

  const storage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.com/file" } }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  };

  const client = {
    auth,
    from,
    rpc,
    storage,
  } as Partial<SupabaseClient>;

  return { client, auth, from, rpc, storage };
}

/**
 * Helper to set up Supabase mock for a test suite
 */
export function setupSupabaseMock(options?: {
  user?: User;
  session?: Session;
}): {
  mock: ReturnType<typeof createMockSupabaseClient>;
  reset: () => void;
} {
  const mock = createMockSupabaseClient(options);

  const reset = () => {
    mock.auth.getUser.mockClear();
    mock.auth.getSession.mockClear();
    mock.from.mockClear();
    mock.rpc.mockClear();
  };

  return { mock, reset };
}
