import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { env } from "@odis-ai/env";
import { AUTH_PARAMS } from "@odis-ai/constants/auth";

/**
 * Proxy request interface - compatible with Next.js 16+ NextRequest
 * Using a custom interface to avoid version conflicts between different Next.js versions
 */
interface ProxyRequest {
  cookies: {
    getAll(): Array<{ name: string; value: string }>;
    set(name: string, value: string): void;
  };
  nextUrl: {
    pathname: string;
    searchParams: URLSearchParams;
    clone(): URL;
  };
}

export async function updateSession(request: ProxyRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabaseResponse = NextResponse.next({ request } as any);

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          // Debug: Log Supabase auth cookies in development
          if (process.env.NODE_ENV === "development") {
            const authCookies = cookies.filter((c) => c.name.startsWith("sb-"));
            if (
              authCookies.length === 0 &&
              request.nextUrl.pathname.startsWith("/api/trpc")
            ) {
              console.log(
                "[Proxy] No Supabase cookies found for tRPC request:",
                {
                  path: request.nextUrl.pathname,
                  allCookieCount: cookies.length,
                },
              );
            }
          }
          return cookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabaseResponse = NextResponse.next({ request } as any);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Refreshing the auth session here automatically handles refresh token expiry
  // This is critical for maintaining user sessions across server restarts
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Log auth errors for debugging (but only in development)
  if (authError && process.env.NODE_ENV === "development") {
    console.error("[Proxy] Auth error:", {
      code: authError.code,
      message: authError.message,
      path: request.nextUrl.pathname,
    });
  }

  // Check if dashboard route has auth_token parameter (Chrome extension auth)
  const hasAuthToken = request.nextUrl.searchParams.has(AUTH_PARAMS.AUTH_TOKEN);

  // List of paths that don't require authentication
  const publicPaths = [
    "/login",
    "/signup",
    "/auth",
    "/studio",
    "/blog",
    "/support",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
    "/case-studies",
    "/",
  ];

  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isApiWebhook = request.nextUrl.pathname.startsWith("/api/webhooks");
  const isDashboardWithAuthToken =
    request.nextUrl.pathname === "/dashboard" && hasAuthToken;

  // Don't redirect for public paths, API webhooks, or dashboard with auth token
  // Note: We DO want to process API routes through proxy for session refresh
  if (
    !user &&
    !isPublicPath &&
    !isApiWebhook &&
    !isDashboardWithAuthToken &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}
