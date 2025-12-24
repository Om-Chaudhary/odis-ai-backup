/**
 * API testing utilities
 *
 * Provides helpers for testing Next.js API routes
 */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { NextRequest } from "next/server";
import { expect } from "vitest";

export interface MockRequestOptions {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  options: MockRequestOptions = {},
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

  const requestInit: RequestInit & { signal?: AbortSignal } = {
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
  options: MockRequestOptions = {},
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
  options: MockRequestOptions = {},
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
 * Extract JSON response from NextResponse/Response
 */
export async function getJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

/**
 * Type helper for Next.js route handler context
 */
export interface RouteContext<
  T extends Record<string, string> = Record<string, string>,
> {
  params: Promise<T>;
}

/**
 * Create a mock route context
 */
export function createMockContext<
  T extends Record<string, string> = Record<string, string>,
>(params: T = {} as T): RouteContext<T> {
  return {
    params: Promise.resolve(params),
  };
}

/**
 * Helper to test API error responses
 */
export async function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedMessageContains?: string,
): Promise<void> {
  expect(response.status).toBe(expectedStatus);
  const json = await getJsonResponse<{ error?: string; message?: string }>(
    response,
  );
  if (expectedMessageContains) {
    const message = json.error || json.message || "";
    expect(message.toLowerCase()).toContain(
      expectedMessageContains.toLowerCase(),
    );
  }
}

/**
 * Helper to test successful API responses
 */
export async function expectSuccessResponse<T>(
  response: Response,
  validator?: (data: T) => void,
): Promise<T> {
  expect(response.ok).toBe(true);
  const json = await getJsonResponse<T>(response);
  if (validator) {
    validator(json);
  }
  return json;
}
