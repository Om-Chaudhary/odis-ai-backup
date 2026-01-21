import { UnifiedSidebar } from "~/components/dashboard/shell/unified-sidebar";
import { AudioPlayerWrapper } from "~/components/dashboard/shared";
import { getUser } from "~/server/actions/auth";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { AUTH_PARAMS } from "@odis-ai/shared/constants/auth";
import { getUserClinics } from "@odis-ai/domain/clinics";
import { Toaster } from "sonner";
import { auth } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Dashboard | Odis AI",
  description:
    "Access your veterinary practice management dashboard. View account information, manage settings, and get started with Odis AI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for auth_token parameter (Chrome extension auth)
  // Since layouts can't access searchParams directly in Next.js 15,
  // we check the referer header as a fallback
  let hasAuthToken = false;
  try {
    const headersList = await headers();
    const referer = headersList.get("referer");
    if (referer) {
      const refererUrl = new URL(referer);
      hasAuthToken = refererUrl.searchParams.has(AUTH_PARAMS.AUTH_TOKEN);
    }
  } catch {
    // If referer parsing fails, we'll rely on middleware and page-level checks
    // The middleware already allows /dashboard with auth_token, and the page
    // component will handle the token processing
  }

  const user = await getUser();

  // Allow access if auth_token is present (will be processed by ExtensionAuthHandler)
  // The middleware already allows /dashboard with auth_token parameter,
  // so we need to also allow it here to prevent redirect before token processing
  if (!user && !hasAuthToken) {
    // Check if user is authenticated with Clerk but not synced to Supabase
    // This prevents infinite redirect loop between /dashboard and /sign-in
    const clerkAuth = await auth();
    if (clerkAuth?.userId) {
      // User is Clerk-authenticated but not in Supabase yet
      // Show account setup message instead of redirecting
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-white">
          <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-4xl">⏳</div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">
              Setting up your account...
            </h1>
            <p className="mb-4 text-gray-600">
              Your account is being configured. This usually takes a few
              seconds.
            </p>
            <p className="text-sm text-gray-500">
              If this persists, please contact support or try signing out and
              back in.
            </p>
          </div>
        </div>
      );
    }
    redirect("/login");
  }

  // If we have auth_token but no user yet, render minimal layout
  // ExtensionAuthHandler will process the token and trigger a re-render
  if (hasAuthToken && !user) {
    return <div className="relative flex min-h-screen w-full">{children}</div>;
  }

  // At this point, user must be non-null (TypeScript assertion)
  if (!user) {
    redirect("/login");
  }

  // Get full user profile and all accessible clinics from database for the sidebar
  // Use service client to bypass RLS since Clerk users don't have Supabase Auth session
  const serviceClient = await createServiceClient();

  const [{ data: profile }, allClinics] = await Promise.all([
    serviceClient
      .from("users")
      .select("first_name, last_name, role, clinic_name, avatar_url")
      .eq("id", user.id)
      .single(),
    getUserClinics(user.id, serviceClient),
  ]);

  // Extract clinic slug from URL path (e.g., /dashboard/[clinicSlug]/inbound)
  // This is more reliable than getClinicByUserId which uses the legacy clinic_name field
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") ?? headersList.get("x-pathname") ?? "";
  const pathParts = pathname.split("/").filter(Boolean);
  // Path format: /dashboard/[clinicSlug]/...
  const urlClinicSlug =
    pathParts.length > 1 && pathParts[0] === "dashboard" ? pathParts[1] : null;

  // Find clinic by URL slug, or use first available clinic
  const clinic = urlClinicSlug
    ? (allClinics.find((c) => c.slug === urlClinicSlug) ?? allClinics[0])
    : allClinics[0];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Unified Sidebar */}
      <UnifiedSidebar
        profile={profile}
        clinicSlug={clinic?.slug ?? null}
        allClinics={
          profile?.role === "admin"
            ? // Admins: all clinics for switcher
              allClinics.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
              }))
            : // Non-admins: just current clinic for display
              clinic
              ? [{ id: clinic.id, name: clinic.name, slug: clinic.slug }]
              : undefined
        }
        isAdmin={profile?.role === "admin"}
      />

      {/* Main Content Area - Warm sage background for visual hierarchy */}
      <div className="bg-background relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Subtle gradient overlay for depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(150 10% 96%) 0%, hsl(150 8% 95%) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          <AudioPlayerWrapper>{children}</AudioPlayerWrapper>
        </div>
      </div>

      <Toaster richColors />
    </div>
  );
}
