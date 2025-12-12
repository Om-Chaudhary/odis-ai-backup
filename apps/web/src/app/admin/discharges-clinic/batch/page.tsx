import { BatchDischargePageClient } from "~/components/dashboard/discharges/batch-discharge-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batch Discharge | Odis AI",
  description:
    "Schedule discharge emails and follow-up calls for multiple cases at once.",
};

export default function ClinicBatchDischargePage() {
  return <BatchDischargePageClient />;
}
