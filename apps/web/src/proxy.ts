import { NextResponse } from "next/server";
import { updateSession } from "@odis-ai/data-access/supabase-client";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Proxy for authentication (Next.js 16)
 *
 * Auth flow:
 * - Public routes: No auth required
 * - Protected routes: Clerk auth required
 * - Superadmins (role='admin'): Bypass organization requirement, can view all clinics
 * - Regular users: Must have a Clerk organization membership
 */

// Public routes - no authentication required
const isPublicRoute = createRouteMatcher([
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
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/auth/(.*)",
  "/api/webhooks/(.*)",
  "/api/public/(.*)",
  "/api/health(.*)",
  "/api/vapi/(.*)",
  "/sitemap.xml",
  "/robots.txt",
  "/integrations(.*)",
]);

/**
 * Check if user is a superadmin (role='admin' in users table)
 */
async function checkSuperAdmin(clerkUserId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  try {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("clerk_user_id", clerkUserId)
      .single();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

export const proxy = clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Legacy redirects
  if (path === "/login")
    return NextResponse.redirect(new URL("/sign-in", req.url));
  if (path === "/signup")
    return NextResponse.redirect(new URL("/sign-up", req.url));

  // Public routes - allow through
  if (isPublicRoute(req)) {
    return await updateSession(req);
  }

  // Get auth state
  const authState = await auth();

  // Not authenticated - redirect to sign in
  if (!authState.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Superadmins bypass organization requirement
  if (await checkSuperAdmin(authState.userId)) {
    return await updateSession(req);
  }

  // Regular users need an organization
  if (!authState.orgId) {
    // Redirect to Clerk's organization selection
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return await updateSession(req);
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (sitemap file)
     * - robots.txt (robots file)
     * - images/ (public images)
     * - fonts/ (public fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
