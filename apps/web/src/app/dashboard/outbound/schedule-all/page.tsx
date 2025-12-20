import { BatchDischargeWizard } from "~/components/dashboard/discharges/batch-discharge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule All Discharges | Odis AI",
  description:
    "Schedule discharge emails and follow-up calls for multiple cases at once.",
};

export default function ScheduleAllDischargesPage() {
  return <BatchDischargeWizard />;
}
