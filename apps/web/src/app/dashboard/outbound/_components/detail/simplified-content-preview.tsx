"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";
import type { StructuredDischargeContent } from "../types";
import { CallTabContent } from "./communication-tabs/call-tab-content";
import { EmailTabContent } from "./communication-tabs/email-tab-content";

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
}

export function SimplifiedContentPreview({
  callScript,
  emailContent,
  dischargeSummary,
  structuredContent,
  scheduledCall,
  phoneSent,
  emailSent,
  hasOwnerPhone,
  hasOwnerEmail,
}: SimplifiedContentPreviewProps) {
  const [callOpen, setCallOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  // Determine if call was successful (completed with a transcript/summary)
  const callWasSuccessful = phoneSent && scheduledCall?.summary;

  return (
    <div className="space-y-3">
      {/* Call Summary Card - shown if call was successful and summary exists */}
      {callWasSuccessful && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-50 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-foreground text-sm font-semibold">
                Call Summary
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {scheduledCall.summary}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Call Transcript Section */}
      {phoneSent && (
        <Collapsible open={callOpen} onOpenChange={setCallOpen}>
          <CollapsibleTrigger className="border-border bg-card hover:bg-accent flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors">
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span>View Call Transcript</span>
            </div>
            {callOpen ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="border-border bg-card rounded-lg border">
              <CallTabContent
                caseData={{ scheduledCall }}
                callScript={callScript}
                phoneWasSent={phoneSent}
                phoneCanBeSent={!phoneSent}
                hasOwnerPhone={hasOwnerPhone}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
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
