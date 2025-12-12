import { redirect } from "next/navigation";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/db/server";
import { getClinicByUserId } from "@odis-ai/clinics/utils";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Discharge detail page - redirects to clinic-scoped route
 */
export default async function DischargeDetailRedirectPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const clinic = await getClinicByUserId(user.id, supabase);

  if (clinic?.slug) {
    redirect(`/dashboard/${clinic.slug}/discharges/${id}`);
  }

  // Fallback to main dashboard if no clinic
  redirect("/dashboard");
}
