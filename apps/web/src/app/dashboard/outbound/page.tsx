import { getUser } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { getUserClinics } from "@odis-ai/domain/clinics";

interface OutboundRedirectPageProps {
  searchParams: Promise<{
    caseId?: string;
    consultationId?: string;
    openPanel?: string;
    date?: string;
    view?: string;
    page?: string;
    search?: string;
  }>;
}

/**
 * Outbound Redirect Page
 *
 * This page handles deep links from the Chrome extension and other sources.
 * It redirects to the clinic-scoped outbound dashboard while preserving
 * all query parameters.
 *
 * URL format: /dashboard/outbound?caseId=xxx&openPanel=true
 * Redirects to: /dashboard/[clinicSlug]/outbound?caseId=xxx&openPanel=true
 */
export default async function OutboundRedirectPage({
  searchParams,
}: OutboundRedirectPageProps) {
  const params = await searchParams;

  const user = await getUser();

  if (!user) {
    // Preserve the destination URL for post-login redirect
    const queryEntries = Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    );
    const queryString = new URLSearchParams(queryEntries).toString();
    const returnUrl = `/dashboard/outbound${queryString ? `?${queryString}` : ""}`;
    redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  // Get user's clinic
  const serviceClient = await createServiceClient();
  const clinics = await getUserClinics(user.id, serviceClient);

  if (clinics.length === 0 || !clinics[0]?.slug) {
    redirect("/dashboard");
  }

  // Build redirect URL with all query params preserved
  const clinicSlug = clinics[0]?.slug;
  if (!clinicSlug) {
    redirect("/dashboard");
  }
  const queryEntries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  const queryString = new URLSearchParams(queryEntries).toString();

  const redirectUrl = `/dashboard/${clinicSlug}/outbound${queryString ? `?${queryString}` : ""}`;
  redirect(redirectUrl);
}
