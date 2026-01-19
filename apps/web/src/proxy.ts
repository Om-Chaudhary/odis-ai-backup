import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@odis-ai/data-access/supabase-client";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Proxy middleware for authentication
 *
 * Supports both Clerk (when configured) and Supabase Auth (fallback).
 * This enables incremental migration from Supabase Auth to Clerk.
 */

// Check if Clerk is configured
const isClerkConfigured = !!process.env.CLERK_SECRET_KEY;

// Public routes that don't require Clerk authentication
const isPublicRoute = createRouteMatcher([
  // Landing pages
  "/",
  "/pricing(.*)",
  "/about(.*)",
  "/contact(.*)",
  "/blog(.*)",
  "/support(.*)",
  "/privacy-policy(.*)",
  "/terms-of-service(.*)",
  "/cookie-policy(.*)",
  "/studio(.*)",

  // Auth pages (both Clerk and Supabase)
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/auth/(.*)",

  // Webhooks (must be public for external services)
  "/api/webhooks/(.*)",

  // Public API routes
  "/api/public/(.*)",

  // Health checks
  "/api/health(.*)",
]);

// Clerk middleware for when Clerk is configured
const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
  // For public routes, don't require authentication but still process
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, require Clerk authentication
  await auth.protect();
});

export async function proxy(request: NextRequest) {
  // Redirect legacy auth URLs to Clerk URLs (backward compatibility)
  const path = request.nextUrl.pathname;

  if (path === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (path === "/signup") {
    return NextResponse.redirect(new URL("/sign-up", request.url));
  }

  // If Clerk is configured, use Clerk middleware
  if (isClerkConfigured) {
    // Run Clerk middleware
    // Note: clerkMiddleware returns a function that takes (req, event)
    // We need to call it properly
    const clerkResponse = await clerkAuthMiddleware(request, {
      // Minimal event object for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // If Clerk returned a response (redirect, error, etc.), use it
    if (clerkResponse && clerkResponse.status !== 200) {
      return clerkResponse;
    }
  }

  // Always run Supabase session refresh (needed for iOS app compatibility
  // and during the migration period)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - fonts/ (public fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
