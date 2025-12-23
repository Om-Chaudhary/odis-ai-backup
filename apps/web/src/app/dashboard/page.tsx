import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { createClient } from "@odis-ai/db/server";
import { getClinicByUserId } from "@odis-ai/clinics/utils";
import { ExtensionAuthHandler } from "~/components/dashboard/shell/extension-auth-handler";
import { AUTH_PARAMS } from "@odis-ai/constants/auth";

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
  return (
    <ExtensionAuthHandler>
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-700">
            Welcome to Odis AI
          </h2>
          <p className="mt-2 text-slate-500">
            Your dashboard content will appear here
          </p>
        </div>
      </div>
    </ExtensionAuthHandler>
  );
}
