import { CasesDashboardClient } from "~/components/dashboard/cases-dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discharge Dashboard | Odis AI",
  description: "Manage patient discharge summaries and follow-up calls.",
};

/**
 * Cases Dashboard Page
 *
 * Displays a list of cases with patient information and discharge status.
 *
 * Placeholders for missing data:
 * - Patient name: "Unknown Patient"
 * - Species: "Unknown Species"
 * - Breed: "Unknown Breed"
 * - Owner name: "Unknown Owner"
 * - Owner email: "No email address"
 * - Owner phone: "No phone number"
 * - Discharge summary: undefined (not shown if missing)
 * - Scheduled call: undefined (shown as "Not scheduled")
 * - Scheduled email: undefined (shown as "Not scheduled")
 */
export default function CasesPage() {
  return <CasesDashboardClient />;
}
