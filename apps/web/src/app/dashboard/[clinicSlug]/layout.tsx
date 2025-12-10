import { redirect, notFound } from "next/navigation";
import { createClient } from "@odis-ai/db/server";
import { getClinicBySlug, getClinicByUserId } from "@odis-ai/clinics/utils";
import { ClinicProvider } from "@odis-ai/ui/clinic-context";

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

  // Get user's clinic to verify access
  const userClinic = await getClinicByUserId(user.id, supabase);

  // Check if user has access to this clinic
  // For now, we only allow access to the user's own clinic
  // TODO: In the future, support multiple clinics per user via clinic_users table
  if (!userClinic || userClinic.id !== clinic.id) {
    // User doesn't have access to this clinic
    // Redirect to their own clinic if they have one, otherwise 404
    if (userClinic) {
      redirect(`/dashboard/${userClinic.slug}`);
    }
    notFound();
  }

  return <ClinicProvider clinic={clinic}>{children}</ClinicProvider>;
}
