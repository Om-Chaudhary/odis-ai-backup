import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BulkScheduleClient } from "~/components/dashboard/outbound/bulk-schedule/bulk-schedule-client";

export const metadata: Metadata = {
  title: "Schedule Multiple Discharges | Dashboard",
  description: "Schedule multiple discharge calls and emails at once",
};

/**
 * Bulk Schedule Page
 *
 * Dedicated page for scheduling multiple discharges at once.
 * Receives case IDs via URL search params.
 */
export default function BulkSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <BulkScheduleClient />
    </Suspense>
  );
}
