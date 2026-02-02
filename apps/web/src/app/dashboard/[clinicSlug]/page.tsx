import { redirect } from "next/navigation";

interface ClinicDashboardPageProps {
  params: Promise<{ clinicSlug: string }>;
}

export default async function ClinicDashboardPage({
  params,
}: ClinicDashboardPageProps) {
  const { clinicSlug } = await params;

  // Redirect to overview page
  redirect(`/dashboard/${clinicSlug}/overview`);
}
