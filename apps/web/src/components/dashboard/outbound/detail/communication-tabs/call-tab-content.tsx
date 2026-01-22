import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { CallPlayer } from "@odis-ai/shared/ui/media";
import { Phone } from "lucide-react";

interface ScheduledCallData {
  id: string;
  recordingUrl?: string | null;
  transcript: string | null;
  cleanedTranscript?: string | null;
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
    const displayTranscript =
      caseData.scheduledCall.cleanedTranscript ??
      caseData.scheduledCall.transcript;

    return (
      <CallPlayer
        audioUrl={caseData.scheduledCall.recordingUrl ?? ""}
        plainTranscript={displayTranscript}
        duration={caseData.scheduledCall.durationSeconds ?? undefined}
        title="Discharge Call"
      />
    );
  }

  // If phone can be sent, show call script preview (not schedule button - that's handled by delivery toggles)
  if (phoneCanBeSent) {
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
