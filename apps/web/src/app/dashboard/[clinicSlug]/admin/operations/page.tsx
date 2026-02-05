import { redirect } from "next/navigation";

interface AdminOperationsPageProps {
  params: Promise<{ clinicSlug: string }>;
}

/**
 * Admin operations page - redirects to scheduled items
 * TODO: Enhance with bulk operations UI
 */
export default async function AdminOperationsPage({
  params,
}: AdminOperationsPageProps) {
  const { clinicSlug } = await params;
  redirect(`/dashboard/${clinicSlug}/admin/scheduled`);
}
