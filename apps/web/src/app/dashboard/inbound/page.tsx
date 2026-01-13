import { redirect } from "next/navigation";
import { createClient } from "@odis-ai/data-access/db/server";
import { getUserClinics } from "@odis-ai/domain/clinics";

/**
 * Legacy Inbound Page - Redirects to clinic-scoped route
 *
 * This page handles backwards compatibility for bookmarks and direct links
 * to /dashboard/inbound. It redirects to /dashboard/[clinicSlug]/inbound
 * using the user's primary clinic.
 */
export default async function LegacyInboundPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's clinics and redirect to primary clinic's inbound page
  const userClinics = await getUserClinics(user.id, supabase);
  const primaryClinic = userClinics[0];

  if (primaryClinic) {
    redirect(`/dashboard/${primaryClinic.slug}/inbound`);
  }

  // If user has no clinics, redirect to main dashboard
  redirect("/dashboard");
}
