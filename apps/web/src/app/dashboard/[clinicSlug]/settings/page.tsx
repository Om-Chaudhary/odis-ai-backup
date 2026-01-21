import { redirect } from "next/navigation";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  // Redirect to the Hours page by default
  redirect(`/dashboard/${clinicSlug}/settings/hours`);
}
