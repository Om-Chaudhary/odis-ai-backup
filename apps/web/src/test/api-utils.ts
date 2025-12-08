import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  const {
    method = "GET",
    url = "http://localhost:3000/api/test",
    body,
    headers = {},
    searchParams = {},
  } = options;

  // Build URL with search params
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj.toString(), requestInit);
}

/**
 * Create a mock NextRequest with Bearer token authentication
 */
export function createAuthenticatedRequest(
  token: string,
  options: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  return createMockRequest({
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Create a mock NextRequest with cookie-based authentication
 */
export function createCookieRequest(
  cookies: Record<string, string>,
  options: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return createMockRequest({
    ...options,
    headers: {
      Cookie: cookieString,
      ...options.headers,
    },
  });
}

/**
 * Extract JSON response from NextResponse
 */
export async function getJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

/**
 * Mock user data for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "test-user-id",
    email: "test@example.com",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    ...overrides,
  } as User;
}

/**
 * Type helper for route handler context
 */
export type RouteContext = {
  params: Promise<Record<string, string>>;
};

/**
 * Create a mock route context
 */
export function createMockContext(
  params: Record<string, string> = {},
): RouteContext {
  return {
    params: Promise.resolve(params),
  };
}
