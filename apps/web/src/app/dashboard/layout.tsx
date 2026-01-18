import { UnifiedSidebar } from "~/components/dashboard/shell/unified-sidebar";
import { AudioPlayerWrapper } from "~/components/dashboard/shared";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/data-access/db/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { AUTH_PARAMS } from "@odis-ai/shared/constants/auth";
import { getClinicByUserId, getUserClinics } from "@odis-ai/domain/clinics";
import { Toaster } from "sonner";

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

  // Get full user profile, primary clinic, and all accessible clinics from database for the sidebar
  const supabase = await createClient();

  const [{ data: profile }, clinic, allClinics] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, role, clinic_name, avatar_url")
      .eq("id", user.id)
      .single(),
    getClinicByUserId(user.id, supabase),
    getUserClinics(user.id, supabase),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Unified Sidebar */}
      <UnifiedSidebar
        user={user}
        profile={profile}
        clinicSlug={clinic?.slug ?? null}
        allClinics={allClinics.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        currentClinicName={clinic?.name}
      />

      {/* Main Content Area */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Layered background for depth */}
        <div className="pointer-events-none absolute inset-0">
          {/* Base gradient - warm white to subtle teal tint */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #fafbfc 0%, #f8fafa 25%, #f5f9f9 50%, #f3f8f8 75%, #f0f7f6 100%)",
            }}
          />
          {/* Subtle radial glow from top-left corner (where sidebar meets content) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 0% 0%, rgba(49, 171, 163, 0.04) 0%, transparent 50%)",
            }}
          />
          {/* Subtle ambient glow */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 80% 20%, rgba(49, 171, 163, 0.025) 0%, transparent 40%)",
            }}
          />
          {/* Subtle dot pattern for texture */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          <AudioPlayerWrapper>{children}</AudioPlayerWrapper>
        </div>
      </div>

      <Toaster richColors />
    </div>
  );
}
