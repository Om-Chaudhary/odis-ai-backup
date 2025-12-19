import type { Metadata } from "next";
import { InboundCallsClient } from "~/components/dashboard/calls/inbound-calls-client";
import { InboundCallsErrorBoundary } from "~/components/dashboard/calls/inbound-calls-error-boundary";

export const metadata: Metadata = {
  title: "Inbound Calls | Dashboard",
  description: "View and manage inbound VAPI calls",
};

export default function ClinicInboundCallsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inbound Calls</h1>
        <p className="text-muted-foreground mt-2">
          View and manage incoming calls handled by your VAPI assistants
        </p>
      </div>
      <InboundCallsErrorBoundary>
        <InboundCallsClient />
      </InboundCallsErrorBoundary>
    </div>
  );
}
