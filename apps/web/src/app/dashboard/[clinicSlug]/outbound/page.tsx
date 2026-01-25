import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { OutboundDashboard } from "./_components/outbound-dashboard";
import { OutboundErrorBoundary } from "./_components/outbound-error-boundary";

export const metadata: Metadata = {
  title: "Outbound Discharges | Dashboard",
  description: "View and manage outbound discharge calls and communications",
};

/**
 * Clinic-Scoped Outbound Discharge Page
 *
 * Manages outgoing discharge-related calls and communications.
 * This page displays outbound discharge calls and emails initiated by the clinic.
 *
 * This route is clinic-scoped under /dashboard/[clinicSlug]/outbound
 * and uses the ClinicProvider from the parent layout.
 */
export default async function ClinicOutboundPage() {
  return (
    <div className="flex h-full flex-col">
      <OutboundErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-[50vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
                <p className="text-sm text-slate-500">Loading discharges...</p>
              </div>
            </div>
          }
        >
          <OutboundDashboard />
        </Suspense>
      </OutboundErrorBoundary>
    </div>
  );
}
