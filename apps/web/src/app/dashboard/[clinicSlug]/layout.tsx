import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@odis-ai/data-access/db/server";
import {
  getClinicBySlug,
  getUserClinics,
  userHasClinicAccess,
} from "@odis-ai/domain/clinics";
import { ClinicProvider } from "@odis-ai/shared/ui/clinic-context";
import { isActiveSubscription } from "@odis-ai/shared/constants";
import type { SubscriptionStatus } from "@odis-ai/shared/constants";
import { Paywall } from "~/components/dashboard/subscription/paywall";
import { DashboardHeader } from "~/components/dashboard/shell/dashboard-header";

interface ClinicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ clinicSlug: string }>;
}

/**
 * Clinic-scoped layout
 *
 * Validates that:
 * 1. The clinic slug exists and is active
 * 2. The current user has access to this clinic
 *
 * Provides clinic context to all child routes.
 * Note: Subscription checks are handled at the page/component level.
 */
export default async function ClinicLayout({
  children,
  params,
}: ClinicLayoutProps) {
  const { clinicSlug } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get clinic by slug
  const clinic = await getClinicBySlug(clinicSlug, supabase);

  if (!clinic) {
    notFound();
  }

  // Check if user has access to this clinic (supports multi-clinic access)
  const hasAccess = await userHasClinicAccess(user.id, clinic.id, supabase);

  if (!hasAccess) {
    // User doesn't have access to this clinic
    // Redirect to a clinic they do have access to, otherwise 404
    const userClinics = await getUserClinics(user.id, supabase);
    // If user has no clinics, redirect to
    const firstClinic = userClinics[0];
    if (firstClinic) {
      redirect(`/dashboard/${firstClinic.slug}`);
    }
    notFound();
  }

  // Fetch user profile for header
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  // Check subscription status - cast to access fields not yet in types
  const clinicWithSub = clinic as typeof clinic & {
    subscription_status?: string | null;
  };
  const subscriptionStatus = (clinicWithSub.subscription_status ??
    "none") as SubscriptionStatus;
  const hasActiveSubscription = isActiveSubscription(subscriptionStatus);

  // Check if we're on the billing page (always allow access for subscription management)
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") ?? headersList.get("x-pathname") ?? "";
  const isBillingPage = pathname.includes("/billing");

  // Show paywall for clinics without active subscription
  // Exception: billing page is always accessible so users can subscribe
  if (!hasActiveSubscription && !isBillingPage) {
    return (
      <ClinicProvider clinic={clinic}>
        <DashboardHeader user={user} profile={profile} />
        <Paywall clinicId={clinic.id} clinicName={clinic.name} />
      </ClinicProvider>
    );
  }

  return (
    <ClinicProvider clinic={clinic}>
      <DashboardHeader user={user} profile={profile} />
      {children}
    </ClinicProvider>
  );
}
