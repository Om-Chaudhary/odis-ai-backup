/**
 * Next.js mock utilities
 *
 * Provides mocks for Next.js specific functionality
 */
import { vi } from "vitest";

/**
 * Create mock Next.js router
 */
export function createMockRouter(overrides?: {
  pathname?: string;
  query?: Record<string, string>;
  asPath?: string;
  push?: ReturnType<typeof vi.fn>;
  replace?: ReturnType<typeof vi.fn>;
}) {
  return {
    pathname: overrides?.pathname ?? "/",
    query: overrides?.query ?? {},
    asPath: overrides?.asPath ?? "/",
    push: overrides?.push ?? vi.fn(),
    replace: overrides?.replace ?? vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    beforePopState: vi.fn(),
    isFallback: false,
    isReady: true,
    isPreview: false,
  };
}

/**
 * Create mock Next.js navigation hooks
 */
export function createMockNavigation(options?: {
  pathname?: string;
  searchParams?: URLSearchParams;
  router?: ReturnType<typeof createMockRouter>;
}) {
  const pathname = options?.pathname ?? "/";
  const searchParams = options?.searchParams ?? new URLSearchParams();
  const router = options?.router ?? createMockRouter({ pathname });

  return {
    useRouter: vi.fn(() => router),
    usePathname: vi.fn(() => pathname),
    useSearchParams: vi.fn(() => searchParams),
    useParams: vi.fn(() => ({})),
    useSelectedLayoutSegment: vi.fn(() => null),
    useSelectedLayoutSegments: vi.fn(() => []),
  };
}

/**
 * Setup Next.js navigation mocks for a test file
 *
 * @example
 * beforeAll(() => {
 *   setupNavigationMocks({ pathname: '/dashboard' });
 * });
 */
export function setupNavigationMocks(options?: {
  pathname?: string;
  searchParams?: URLSearchParams;
}): void {
  const mocks = createMockNavigation(options);

  vi.mock("next/navigation", () => ({
    useRouter: mocks.useRouter,
    usePathname: mocks.usePathname,
    useSearchParams: mocks.useSearchParams,
    useParams: mocks.useParams,
    useSelectedLayoutSegment: mocks.useSelectedLayoutSegment,
    useSelectedLayoutSegments: mocks.useSelectedLayoutSegments,
    redirect: vi.fn(),
    notFound: vi.fn(),
  }));
}

/**
 * Create mock Next.js headers
 */
export function createMockHeaders(
  headers?: Record<string, string>
): Headers {
  const h = new Headers();
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      h.set(key, value);
    });
  }
  return h;
}

/**
 * Create mock Next.js cookies
 */
export function createMockCookies(cookies?: Record<string, string>) {
  const cookieStore = new Map(Object.entries(cookies ?? {}));

  return {
    get: vi.fn((name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    }),
    getAll: vi.fn(() =>
      Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }))
    ),
    has: vi.fn((name: string) => cookieStore.has(name)),
    set: vi.fn((name: string, value: string) => {
      cookieStore.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      cookieStore.delete(name);
    }),
  };
}

/**
 * Mock next/image component
 */
export const MockNextImage = vi.fn(
  (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  }
);

/**
 * Mock next/link component
 */
export const MockNextLink = vi.fn(
  ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
);

import React from "react";
