import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { ExtensionAuthHandler } from "~/components/dashboard/shell/extension-auth-handler";
import { AUTH_PARAMS } from "@odis-ai/constants/auth";
import { DashboardContent } from "~/components/dashboard/dashboard-content";

interface ClinicDashboardPageProps {
  params: Promise<{ clinicSlug: string }>;
  searchParams: Promise<{
    auth_token?: string;
    refresh_token?: string;
    return_url?: string;
  }>;
}

export default async function ClinicDashboardPage({
  params,
  searchParams,
}: ClinicDashboardPageProps) {
  const [, queryParams] = await Promise.all([params, searchParams]);
  const hasAuthToken = Boolean(queryParams[AUTH_PARAMS.AUTH_TOKEN]);

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

  return (
    <ExtensionAuthHandler>
      <DashboardContent />
    </ExtensionAuthHandler>
  );
}
