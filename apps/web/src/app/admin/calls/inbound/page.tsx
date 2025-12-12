import { redirect } from "next/navigation";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/db/server";
import { getClinicByUserId } from "@odis-ai/clinics/utils";

/**
 * Legacy inbound calls page - redirects to clinic-scoped route
 */
export default async function InboundCallsRedirectPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const clinic = await getClinicByUserId(user.id, supabase);

  if (clinic?.slug) {
    redirect(`/dashboard/${clinic.slug}/inbound-calls`);
  }

  // Fallback to main dashboard if no clinic
  redirect("/dashboard");
}
