import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { OutboundDischargesClient } from "~/components/dashboard/outbound/outbound-discharges-client";
import { OutboundErrorBoundary } from "~/components/dashboard/outbound/outbound-error-boundary";

export const metadata = {
  title: "Outbound Discharges | Dashboard",
  description: "View and manage outbound discharge calls and communications",
};

/**
 * Outbound Discharge Page
 *
 * Manages outgoing discharge-related calls and communications.
 * This page displays outbound discharge calls and emails initiated by the clinic.
 */
export default function OutboundDischargePage() {
  return (
    <div className="flex h-full flex-col px-6 py-4">
      <OutboundErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          }
        >
          <OutboundDischargesClient />
        </Suspense>
      </OutboundErrorBoundary>
    </div>
  );
}
