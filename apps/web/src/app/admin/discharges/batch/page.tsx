import { redirect } from "next/navigation";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/db/server";
import { getClinicByUserId } from "@odis-ai/clinics/utils";

/**
 * Legacy batch discharges page - redirects to clinic-scoped route
 */
export default async function BatchDischargesRedirectPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const clinic = await getClinicByUserId(user.id, supabase);

  if (clinic?.slug) {
    redirect(`/dashboard/${clinic.slug}/discharges/batch`);
  }

  // Fallback to main dashboard if no clinic
  redirect("/dashboard");
}
