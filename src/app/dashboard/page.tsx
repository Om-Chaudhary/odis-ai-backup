import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import DashboardProfileHeader from "~/components/dashboard/DashboardProfileHeader";
import { DashboardContentWithTabs } from "~/components/dashboard/dashboard-content-with-tabs";
import { ExtensionAuthHandler } from "~/components/dashboard/extension-auth-handler";
import { AUTH_PARAMS } from "~/lib/constants/auth";

interface DashboardPageProps {
  /**
   * URL search parameters (Next.js 15 async format)
   * Supports Chrome extension authentication via auth_token parameter
   */
  searchParams: Promise<{
    auth_token?: string;
    refresh_token?: string;
    return_url?: string;
  }>;
}

/**
 * Dashboard page with Chrome extension authentication support.
 *
 * Handles authentication tokens passed from Chrome extension via URL parameters.
 * If auth_token is present, the ExtensionAuthHandler component will process it
 * client-side and set the Supabase session.
 *
 * @param searchParams - URL search parameters containing optional auth tokens
 */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const hasAuthToken = Boolean(params[AUTH_PARAMS.AUTH_TOKEN]);

  const user = await getUser();

  // If no user and no auth_token, redirect to login
  // If auth_token is present, ExtensionAuthHandler will process it client-side
  if (!user && !hasAuthToken) {
    redirect("/login");
  }

  // If we have auth_token but no user yet, render handler to process token
  // The handler will set the session and refresh, then this component will re-run with user
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

  // At this point, user must be non-null (TypeScript assertion)
  // We've already handled the cases where user is null
  if (!user) {
    redirect("/login");
  }

  // Get full user profile from database
  const supabase = await createClient();
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
