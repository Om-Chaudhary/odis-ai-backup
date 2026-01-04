import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Mail, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { PreviewText } from "./preview-text";
import { CallTabContent } from "./communication-tabs/call-tab-content";
import { EmailTabContent } from "./communication-tabs/email-tab-content";
import type { StructuredDischargeSummary } from "@odis-ai/shared/validators/discharge-summary";

interface ScheduledCallData {
  id: string;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  endedReason: string | null;
  transcript: string | null;
  summary: string | null;
  customerPhone: string | null;
  recordingUrl?: string | null;
  stereoRecordingUrl?: string | null;
}

interface CommunicationPreviewProps {
  callScript: string;
  emailContent: string;
  dischargeSummary: string;
  structuredContent: StructuredDischargeSummary | null;
  scheduledCall: ScheduledCallData | null;
  phoneSent: boolean;
  emailSent: boolean;
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
}

export function CommunicationPreview({
  callScript,
  emailContent,
  dischargeSummary,
  structuredContent,
  scheduledCall,
  phoneSent,
  emailSent,
  hasOwnerPhone,
  hasOwnerEmail,
}: CommunicationPreviewProps) {
  const [emailExpanded, setEmailExpanded] = useState(false);

  const phoneCanBeSent = hasOwnerPhone && !phoneSent;
  const emailCanBeSent = hasOwnerEmail && !emailSent;

  // If no contact info at all, show empty state
  if (!hasOwnerPhone && !hasOwnerEmail) {
    return (
      <div className="rounded-lg border border-slate-200/50 bg-slate-50/50 p-4 text-center dark:border-slate-700/50 dark:bg-slate-800/30">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No contact information available for this owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Call Script/Transcript - only show if phone contact exists */}
      {hasOwnerPhone && (
        <div>
          <CallTabContent
            caseData={{ scheduledCall }}
            callScript={callScript}
            phoneWasSent={phoneSent}
            phoneCanBeSent={phoneCanBeSent}
            hasOwnerPhone={hasOwnerPhone}
          />
        </div>
      )}

      {/* Email Preview - only show if email contact exists */}
      {hasOwnerEmail && (
        <Card
          className={cn(
            "rounded-xl border shadow-sm backdrop-blur-md transition-all duration-300",
            "bg-gradient-to-br from-white/80 via-slate-50/30 to-white/80",
            "dark:from-slate-900/80 dark:via-slate-800/30 dark:to-slate-900/80",
            "border-slate-200/50 dark:border-slate-700/50",
            "hover:shadow-md",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  "bg-gradient-to-br from-slate-100 to-slate-200",
                  "dark:from-slate-800/50 dark:to-slate-700/50",
                  "shadow-inner",
                )}
              >
                <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
                {emailSent ? "Email Sent" : "Email Preview"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                emailExpanded ? "opacity-100" : "opacity-100",
              )}
            >
              {!emailExpanded ? (
                <>
                  {structuredContent ? (
                    <div className="rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">
                          Patient:
                        </strong>{" "}
                        {structuredContent.patientName}
                        {structuredContent.diagnosis && (
                          <>
                            <br />
                            <strong className="text-slate-900 dark:text-white">
                              Diagnosis:
                            </strong>{" "}
                            {structuredContent.diagnosis}
                          </>
                        )}
                        {structuredContent.medications &&
                          structuredContent.medications.length > 0 && (
                            <>
                              <br />
                              <strong className="text-slate-900 dark:text-white">
                                Medications:
                              </strong>{" "}
                              {structuredContent.medications.length} prescribed
                            </>
                          )}
                      </p>
                    </div>
                  ) : (
                    <PreviewText
                      content={emailContent ?? dischargeSummary}
                      expanded={false}
                      maxLines={6}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEmailExpanded(true)}
                    className={cn(
                      "mt-2 w-full text-xs font-medium transition-all",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      "text-slate-600 dark:text-slate-400",
                    )}
                  >
                    <span>Show full content</span>
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <EmailTabContent
                    caseData={{
                      dischargeSummary,
                      structuredContent,
                      emailContent,
                    }}
                    emailWasSent={emailSent}
                    emailCanBeSent={emailCanBeSent}
                    hasOwnerEmail={hasOwnerEmail}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEmailExpanded(false)}
                    className={cn(
                      "mt-2 w-full text-xs font-medium transition-all",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      "text-slate-600 dark:text-slate-400",
                    )}
                  >
                    <span>Show less</span>
                    <ChevronUp className="ml-1 h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
