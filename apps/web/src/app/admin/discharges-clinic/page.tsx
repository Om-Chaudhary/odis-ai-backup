import { DischargeManagementClient } from "~/components/dashboard/discharges/discharge-management-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discharge Management | Odis AI",
  description: "Manage patient discharge summaries and follow-up calls.",
};

export default function ClinicDischargesPage() {
  return <DischargeManagementClient />;
}
