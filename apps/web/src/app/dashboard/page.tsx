import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { getUserClinics } from "@odis-ai/domain/clinics";
import { ExtensionAuthHandler } from "~/components/dashboard/shell/extension-auth-handler";
import { AUTH_PARAMS } from "@odis-ai/shared/constants/auth";

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
 * - Superadmins (role='admin') can access all clinics, redirects to first one
 * - Regular users redirect to their assigned clinic
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

  // Use service client to bypass RLS (needed for Clerk users who don't have Supabase session)
  const serviceClient = await createServiceClient();

  // Get user's clinics (admins get ALL clinics, regular users get their assigned clinics)
  const clinics = await getUserClinics(user.id, serviceClient);

  // Redirect to first clinic if available
  if (clinics.length > 0 && clinics[0]?.slug) {
    redirect(`/dashboard/${clinics[0].slug}`);
  }

  // Fallback: No clinics available
  return (
    <ExtensionAuthHandler>
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-700">
            Welcome to Odis AI
          </h2>
          <p className="mt-2 text-slate-500">
            No clinics available. Please contact support.
          </p>
        </div>
      </div>
    </ExtensionAuthHandler>
  );
}
