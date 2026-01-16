import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { InboundClient } from "~/components/dashboard/inbound";
import { InboundCallsErrorBoundary } from "~/components/dashboard/calls/inbound-calls-error-boundary";

export const metadata: Metadata = {
  title: "Inbound | Dashboard",
  description:
    "View and manage inbound calls, appointment requests, and messages",
};

/**
 * Clinic-Scoped Inbound Dashboard Page
 *
 * Manages incoming communications from VAPI AI assistants:
 * - Appointment requests from schedule-appointment tool
 * - Messages from leave-message tool
 * - Inbound call logs
 *
 * This route is clinic-scoped under /dashboard/[clinicSlug]/inbound
 * and uses the ClinicProvider from the parent layout.
 */
export default function ClinicInboundPage() {
  return (
    <div className="flex h-full flex-col">
      <InboundCallsErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-[50vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Loading inbound data...
                </p>
              </div>
            </div>
          }
        >
          <InboundClient />
        </Suspense>
      </InboundCallsErrorBoundary>
    </div>
  );
}
