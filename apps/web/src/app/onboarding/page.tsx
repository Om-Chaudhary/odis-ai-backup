import { redirect } from "next/navigation";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/data-access/db/server";
import { OnboardingFlow } from "~/components/onboarding/onboarding-flow";

interface OnboardingPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

/**
 * Onboarding Page
 *
 * Server component that:
 * 1. Checks authentication (redirects to /login if not authenticated)
 * 2. Checks if onboarding is already complete (redirects to dashboard)
 * 3. Passes invitation token from URL to client component
 */
export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const user = await getUser();

  // Redirect unauthenticated users to login
  if (!user) {
    const redirectUrl = params.token
      ? `/login?redirect=/onboarding?token=${params.token}`
      : "/login?redirect=/onboarding";
    redirect(redirectUrl);
  }

  const supabase = await createClient();

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  // If onboarding is complete, check for clinic and redirect
  if (profile?.onboarding_completed) {
    // Get user's primary clinic
    const { data: clinicAccess } = await supabase
      .from("user_clinic_access")
      .select(
        `
        clinics (
          slug
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .maybeSingle();

    // Extract slug from the joined clinic data
    const clinicsData = clinicAccess?.clinics;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clinic = clinicsData as any;
    const slug = clinic?.slug as string | undefined;

    if (slug) {
      redirect(`/dashboard/${slug}`);
    } else {
      redirect("/dashboard");
    }
  }

  return <OnboardingFlow initialToken={params.token} userEmail={user.email} />;
}
