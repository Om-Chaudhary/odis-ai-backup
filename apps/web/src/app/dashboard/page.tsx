import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { getClinicByUserId } from "~/lib/clinics/utils";
import DashboardProfileHeader from "~/components/dashboard/DashboardProfileHeader";
import { DashboardContentWithTabs } from "~/components/dashboard/dashboard-content-with-tabs";
import { ExtensionAuthHandler } from "~/components/dashboard/extension-auth-handler";
import { AUTH_PARAMS } from "~/lib/constants/auth";

interface DashboardPageProps {
  searchParams: Promise<{
    auth_token?: string;
    refresh_token?: string;
    return_url?: string;
  }>;
}

/**
 * Dashboard root page
 *
 * Redirects authenticated users to their clinic-scoped dashboard.
 * If user has no clinic, shows the default dashboard.
 *
 * Handles Chrome extension authentication via URL parameters.
 */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const hasAuthToken = Boolean(params[AUTH_PARAMS.AUTH_TOKEN]);

  const user = await getUser();

  if (!user && !hasAuthToken) {
    redirect("/login");
  }

  if (hasAuthToken && !user) {
    return (
      <ExtensionAuthHandler>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
            <p className="text-muted-foreground mt-4">
              Setting up your session...
            </p>
          </div>
        </div>
      </ExtensionAuthHandler>
    );
  }

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Get user's clinic to redirect to clinic-scoped dashboard
  const clinic = await getClinicByUserId(user.id, supabase);

  // If user has a clinic, redirect to clinic-scoped dashboard
  if (clinic?.slug) {
    redirect(`/dashboard/${clinic.slug}`);
  }

  // Fallback: If no clinic, show default dashboard
  // This allows users without a clinic to still access the dashboard
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, clinic_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <ExtensionAuthHandler>
      <div className="space-y-6">
        <div className="animate-fade-in-down">
          <DashboardProfileHeader user={user} profile={profile} />
        </div>

        <div className="animate-fade-in-up stagger-1 h-px bg-slate-200/50" />

        <div className="animate-fade-in-up stagger-2">
          <DashboardContentWithTabs />
        </div>
      </div>
    </ExtensionAuthHandler>
  );
}
