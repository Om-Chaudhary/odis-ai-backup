"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import type {
  StructuredDischargeContent,
  OwnerSentimentData,
  PetHealthData,
  FollowUpData,
} from "../types";
import { EmailTabContent } from "./communication-tabs/email-tab-content";
import { CallIntelligenceIndicators } from "./call-intelligence-indicators";
import { CallDetailContent } from "../../shared/call-detail-content";

interface ScheduledCallData {
  id: string;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  endedReason: string | null;
  transcript: string | null;
  cleanedTranscript?: string | null;
  summary: string | null;
  customerPhone: string | null;
  recordingUrl?: string | null;
  stereoRecordingUrl?: string | null;
}

interface SimplifiedContentPreviewProps {
  callScript: string;
  emailContent: string;
  dischargeSummary: string;
  structuredContent: StructuredDischargeContent | null;
  scheduledCall: ScheduledCallData | null;
  phoneSent: boolean;
  emailSent: boolean;
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
  ownerSentimentData?: OwnerSentimentData | null;
  petHealthData?: PetHealthData | null;
  followUpData?: FollowUpData | null;
  patientName?: string;
  ownerName?: string;
}

export function SimplifiedContentPreview({
  emailContent,
  dischargeSummary,
  structuredContent,
  scheduledCall,
  phoneSent,
  emailSent,
  hasOwnerEmail,
  ownerSentimentData,
  petHealthData,
  followUpData,
  patientName,
  ownerName,
}: SimplifiedContentPreviewProps) {
  const [emailOpen, setEmailOpen] = useState(false);

  // Determine if call was successful (completed with a transcript/summary)
  const callWasSuccessful = phoneSent && scheduledCall?.summary;

  return (
    <div className="space-y-4">
      {/* Call Content Section - shown if call was sent */}
      {phoneSent && scheduledCall && (
        <>
          <CallDetailContent
            callId={scheduledCall.id}
            summary={scheduledCall.summary}
            timestamp={scheduledCall.endedAt ?? scheduledCall.startedAt}
            durationSeconds={scheduledCall.durationSeconds}
            recordingUrl={scheduledCall.recordingUrl ?? null}
            transcript={scheduledCall.transcript}
            cleanedTranscript={scheduledCall.cleanedTranscript}
            title={
              patientName ? `Discharge Call - ${patientName}` : "Discharge Call"
            }
            subtitle={ownerName ?? undefined}
            isSuccessful={
              scheduledCall.endedReason === "assistant-ended-call" ||
              scheduledCall.endedReason === "customer-ended-call"
            }
          />

          {/* Intelligence Indicators - shown separately for additional context */}
          {callWasSuccessful &&
            (ownerSentimentData ?? petHealthData ?? followUpData) && (
              <CallIntelligenceIndicators
                ownerSentimentData={ownerSentimentData}
                petHealthData={petHealthData}
                followUpData={followUpData}
              />
            )}
        </>
      )}

      {/* Email Content Section */}
      {emailSent && (
        <Collapsible open={emailOpen} onOpenChange={setEmailOpen}>
          <CollapsibleTrigger className="border-border bg-card hover:bg-accent flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors">
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span>View Email Content</span>
            </div>
            {emailOpen ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="border-border bg-card rounded-lg border">
              <EmailTabContent
                caseData={{
                  structuredContent,
                  emailContent: emailContent ?? "",
                  dischargeSummary: dischargeSummary ?? "",
                }}
                emailWasSent={emailSent}
                emailCanBeSent={!emailSent}
                hasOwnerEmail={hasOwnerEmail}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
