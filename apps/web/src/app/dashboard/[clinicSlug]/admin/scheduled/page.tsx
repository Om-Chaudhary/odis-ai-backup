import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ScheduledTimelineClient } from "~/components/admin/scheduled/scheduled-timeline-client";

export const metadata: Metadata = {
  title: "Scheduled Items | Admin",
  description:
    "View and manage all scheduled discharge calls and emails across your clinic.",
};

export default function AdminScheduledPage() {
  return (
    <div className="flex h-full flex-col">
      <Suspense
        fallback={
          <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              </div>
              <p className="text-sm text-slate-500">
                Loading scheduled items...
              </p>
            </div>
          </div>
        }
      >
        <ScheduledTimelineClient />
      </Suspense>
    </div>
  );
}
