import { SettingsPageClient } from "~/components/dashboard/settings/settings-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Odis AI",
  description:
    "Configure clinic details, vet information, and system behavior for discharge communications.",
};

export default function ClinicSettingsPage() {
  return <SettingsPageClient />;
}
