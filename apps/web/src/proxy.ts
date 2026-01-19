import { NextResponse } from "next/server";
import { updateSession } from "@odis-ai/data-access/supabase-client";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Proxy for authentication (Next.js 16)
 *
 * Uses Clerk's clerkMiddleware as the primary handler.
 * Supports both Clerk (when configured) and Supabase Auth (fallback for iOS).
 *
 * IMPORTANT: For Next.js 16, clerkMiddleware must be exported directly as `proxy`
 * to ensure Clerk's auth() function can detect that middleware ran.
 */

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
  "/demo(.*)",
  "/features(.*)",
  "/security(.*)",

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

/**
 * Clerk middleware exported directly as `proxy` for Next.js 16 compatibility.
 *
 * This is the correct pattern - clerkMiddleware returns a function that Next.js
 * calls as the proxy. Clerk's internal tracking works because the export is direct.
 */
export const proxy = clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Redirect legacy auth URLs to Clerk URLs (backward compatibility)
  if (path === "/login") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  if (path === "/signup") {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  // For public routes, don't require authentication
  if (isPublicRoute(req)) {
    // Still run Supabase session refresh for iOS compatibility
    return await updateSession(req);
  }

  // For protected routes, require Clerk authentication
  await auth.protect();

  // After Clerk auth passes, also refresh Supabase session for iOS compatibility
  return await updateSession(req);
});

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
