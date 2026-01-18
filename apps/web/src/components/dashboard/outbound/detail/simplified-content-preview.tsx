"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
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
  scheduledCallFor?: string | null;
  scheduledEmailFor?: string | null;
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
          <CollapsibleTrigger className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-4 py-3">
            {/* Glassmorphic background */}
            <div
              className={cn(
                "absolute inset-0",
                "bg-gradient-to-r from-white/50 via-white/30 to-slate-50/40",
                "dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/40",
                "backdrop-blur-sm",
                "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
                "group-hover:ring-slate-300/40 dark:group-hover:ring-slate-600/40",
                "transition-all duration-200",
              )}
            />

            <div className="relative flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  "bg-gradient-to-br from-slate-100/80 to-slate-200/80",
                  "dark:from-slate-700/80 dark:to-slate-800/80",
                  "group-hover:from-teal-100/80 group-hover:to-teal-200/80",
                  "dark:group-hover:from-teal-900/50 dark:group-hover:to-teal-800/50",
                  "ring-1 ring-slate-200/30 dark:ring-slate-600/30",
                  "transition-colors duration-200",
                )}
              >
                <Mail className="h-4 w-4 text-slate-600 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                View Email Content
              </span>
            </div>

            <div className="relative">
              {emailOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="relative overflow-hidden rounded-xl">
              {/* Glassmorphic background */}
              <div
                className={cn(
                  "absolute inset-0",
                  "bg-gradient-to-br from-white/60 via-white/40 to-slate-50/50",
                  "dark:from-slate-900/60 dark:via-slate-800/40 dark:to-slate-900/50",
                  "backdrop-blur-sm",
                  "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
                )}
              />
              <div className="relative">
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
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
