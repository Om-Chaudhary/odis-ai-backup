import { redirect } from "next/navigation";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis/db/server";
import { getClinicByUserId } from "@odis/clinics/utils";

/**
 * Legacy settings page - redirects to clinic-scoped route
 */
export default async function SettingsRedirectPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const clinic = await getClinicByUserId(user.id, supabase);

  if (clinic?.slug) {
    redirect(`/dashboard/${clinic.slug}/settings`);
  }

  // Fallback to main dashboard if no clinic
  redirect("/dashboard");
}
