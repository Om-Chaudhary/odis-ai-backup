import { Suspense } from "react";
import { PhoneOutgoing, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { EmptyState } from "@odis-ai/ui";

/**
 * Outbound Discharge Page
 *
 * Manages outgoing discharge-related calls and communications.
 * This page displays outbound discharge calls and emails initiated by the clinic.
 */
export default function OutboundDischargePage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <PhoneOutgoing className="h-8 w-8 text-teal-600" />
            Outbound Discharges
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage outgoing discharge calls and communications
          </p>
        </div>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        }
      >
        <OutboundDischargeContent />
      </Suspense>
    </div>
  );
}

/**
 * Content component for outbound discharges
 */
function OutboundDischargeContent() {
  // TODO: Implement outbound discharge data fetching
  const outboundCalls = [];

  return (
    <div className="space-y-4">
      {outboundCalls.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Outbound Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState />
            <p className="text-muted-foreground mt-4 text-center text-sm">
              There are currently no outbound discharge calls to display.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* TODO: Map through outbound calls and display them */}
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Outbound call items will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
