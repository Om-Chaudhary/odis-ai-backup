import { AppSidebar } from "~/components/dashboard/shell/app-sidebar";
import { DashboardBreadcrumb } from "~/components/dashboard/shell/dashboard-breadcrumb";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/db/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { AUTH_PARAMS } from "@odis-ai/constants/auth";
import { getClinicByUserId } from "@odis-ai/clinics/utils";
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

  // Get full user profile and clinic from database for the sidebar
  const supabase = await createClient();
  const [{ data: profile }, clinic] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, role, clinic_name, avatar_url")
      .eq("id", user.id)
      .single(),
    getClinicByUserId(user.id, supabase),
  ]);

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Animated gradient overlays */}
        <div
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(49, 171, 163, 0.08) 0%, rgba(49, 171, 163, 0.04) 40%, transparent 70%)",
          }}
          className="animate-gradient-move absolute inset-0 opacity-50 blur-sm"
        />
        <div
          style={{
            background:
              "radial-gradient(circle at 70% 60%, rgba(49, 171, 163, 0.06) 0%, rgba(49, 171, 163, 0.03) 50%, transparent 80%)",
          }}
          className="animate-gradient-move-reverse absolute inset-0 opacity-40 blur-sm"
        />
        {/* Floating orbs */}
        <div
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.04) 0%, transparent 60%)",
          }}
          className="animate-float-slow absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-30 blur-3xl"
        />
        <div
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.03) 0%, transparent 60%)",
          }}
          className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-25 blur-3xl"
        />
      </div>
      {/* Dotted background pattern */}
      <div
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="pointer-events-none fixed inset-0 z-0 opacity-10"
      />

      {/* Sidebar - Icon Rail + Secondary Panel */}
      <AppSidebar
        user={user}
        profile={profile}
        clinicSlug={clinic?.slug ?? null}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/40 bg-white/40 backdrop-blur-sm">
          <div className="animate-fade-in-down flex items-center gap-2 px-6">
            <DashboardBreadcrumb />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {children}
        </div>
      </main>

      <Toaster richColors />
    </div>
  );
}
