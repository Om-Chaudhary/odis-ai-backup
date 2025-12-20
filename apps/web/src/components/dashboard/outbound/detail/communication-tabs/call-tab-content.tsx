import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Phone } from "lucide-react";
import { CallRecordingPlayer } from "../../../shared";

interface ScheduledCallData {
  id: string;
  recordingUrl?: string | null;
  transcript: string | null;
  durationSeconds: number | null;
}

interface CallTabContentProps {
  caseData: {
    scheduledCall: ScheduledCallData | null;
  };
  callScript: string;
  phoneWasSent: boolean;
  phoneCanBeSent: boolean;
  hasOwnerPhone: boolean;
}

/**
 * Call Tab Content - shows transcript if sent, schedule button if not sent, or script preview
 */
export function CallTabContent({
  caseData,
  callScript,
  phoneWasSent,
  phoneCanBeSent,
  hasOwnerPhone,
}: CallTabContentProps) {
  // If phone was sent, show audio player with transcript
  if (phoneWasSent && caseData.scheduledCall) {
    return (
      <CallRecordingPlayer
        recordingUrl={caseData.scheduledCall.recordingUrl ?? null}
        transcript={caseData.scheduledCall.transcript}
        durationSeconds={caseData.scheduledCall.durationSeconds}
      />
    );
  }

  // If phone can be sent, show schedule button
  if (phoneCanBeSent) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-slate-500" />
            Call Not Scheduled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            This call has not been scheduled yet.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // TODO: Implement schedule call functionality
              console.log("Schedule call");
            }}
          >
            <Phone className="mr-2 h-4 w-4" />
            Schedule Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no phone available, show not available message
  if (!hasOwnerPhone) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-slate-400" />
            Call Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-sm text-slate-600">
              No phone number available for this owner.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback: show call script
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-slate-500" />
          Call Script
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 max-h-80 overflow-auto rounded-md p-3">
          <p className="text-sm whitespace-pre-wrap">
            {callScript || "No call script available."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
