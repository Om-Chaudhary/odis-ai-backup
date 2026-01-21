import { HoursPageClient } from "~/components/dashboard/settings/hours/hours-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hours of Operation | Settings | Odis AI",
  description: "Configure your clinic's business hours and time segments",
};

export default function HoursSettingsPage() {
  return <HoursPageClient />;
}
