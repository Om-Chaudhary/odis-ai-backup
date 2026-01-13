import { redirect } from "next/navigation";
import { createClient } from "@odis-ai/data-access/db/server";
import { getUserClinics } from "@odis-ai/domain/clinics";

/**
 * Legacy Outbound Page - Redirects to clinic-scoped route
 *
 * This page handles backwards compatibility for bookmarks and direct links
 * to /dashboard/outbound. It redirects to /dashboard/[clinicSlug]/outbound
 * using the user's primary clinic.
 */
export default async function LegacyOutboundPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's clinics and redirect to primary clinic's outbound page
  const userClinics = await getUserClinics(user.id, supabase);
  const primaryClinic = userClinics[0];

  if (primaryClinic) {
    redirect(`/dashboard/${primaryClinic.slug}/outbound`);
  }

  // If user has no clinics, redirect to main dashboard
  redirect("/dashboard");
}
