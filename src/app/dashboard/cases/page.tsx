import { DischargeManagementClient } from "~/components/dashboard/discharge-management-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discharge Management | Odis AI",
  description: "Manage patient discharge summaries and follow-up calls.",
};

/**
 * Discharge Management Page
 *
 * Displays a list of cases with patient information and discharge status.
 * Includes status filtering, date range presets, and discharge trigger functionality.
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
export default function DischargeManagementPage() {
  return <DischargeManagementClient />;
}
