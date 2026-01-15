import { redirect, notFound } from "next/navigation";
import { createClient } from "@odis-ai/data-access/db/server";
import {
  getClinicBySlug,
  getUserClinics,
  userHasClinicAccess,
} from "@odis-ai/domain/clinics";
import { ClinicProvider } from "@odis-ai/shared/ui/clinic-context";
import { OnboardingProvider } from "~/components/providers";

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
    const firstClinic = userClinics[0];
    if (firstClinic) {
      redirect(`/dashboard/${firstClinic.slug}`);
    }
    notFound();
  }

  return (
    <ClinicProvider clinic={clinic}>
      <OnboardingProvider>{children}</OnboardingProvider>
    </ClinicProvider>
  );
}
