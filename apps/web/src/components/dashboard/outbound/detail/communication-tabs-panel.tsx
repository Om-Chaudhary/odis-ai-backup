"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@odis-ai/shared/ui/tabs";
import { cn } from "@odis-ai/shared/util";
import type {
  StructuredDischargeContent,
  OwnerSentimentData,
  PetHealthData,
  FollowUpData,
} from "../types";
import { CallDetailContent } from "../../shared/call-detail-content";
import { EmailTabContent } from "./communication-tabs/email-tab-content";
import { CallIntelligenceIndicators } from "./call-intelligence-indicators";

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

interface CommunicationTabsPanelProps {
  /** The scheduled call data if available */
  scheduledCall: ScheduledCallData | null;
  /** Whether the call was sent/completed */
  phoneSent: boolean;
  /** Whether the email was sent */
  emailSent: boolean;
  /** Whether the owner has a phone number */
  hasOwnerPhone: boolean;
  /** Whether the owner has an email address */
  hasOwnerEmail: boolean;
  /** Call script content */
  callScript: string;
  /** Email content */
  emailContent: string;
  /** Discharge summary content */
  dischargeSummary: string;
  /** Structured content for email preview */
  structuredContent: StructuredDischargeContent | null;
  /** Owner sentiment data from call */
  ownerSentimentData?: OwnerSentimentData | null;
  /** Pet health data from call */
  petHealthData?: PetHealthData | null;
  /** Follow-up data from call */
  followUpData?: FollowUpData | null;
  /** Patient name for display */
  patientName?: string;
  /** Owner name for display */
  ownerName?: string;
  /** Optional className */
  className?: string;
}

type TabValue = "phone" | "email";

/**
 * Communication Tabs Panel
 *
 * A tabbed interface for switching between phone call and email content.
 *
 * Phone Tab:
 * - Enabled ONLY when phoneSent is true (call completed)
 * - Shows call summary, audio player, transcript when enabled
 * - Greyed out and disabled when call not yet sent
 *
 * Email Tab:
 * - ALWAYS enabled
 * - Label: "Email" if sent, "Email Preview" if not
 * - Shows sent email content or preview
 *
 * Default Tab:
 * - Phone if phoneSent is true
 * - Email otherwise
 */
export function CommunicationTabsPanel({
  scheduledCall,
  phoneSent,
  emailSent,
  hasOwnerPhone,
  hasOwnerEmail,
  callScript,
  emailContent,
  dischargeSummary,
  structuredContent,
  ownerSentimentData,
  petHealthData,
  followUpData,
  patientName,
  ownerName,
  className,
}: CommunicationTabsPanelProps) {
  // Phone tab enabled only when call was actually sent/completed
  const phoneTabEnabled = phoneSent;

  // Default tab: phone if sent, otherwise email
  const defaultTab: TabValue = phoneSent ? "phone" : "email";
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  // Determine if call was successful for intelligence display
  const callWasSuccessful = phoneSent && scheduledCall?.summary;
  const hasIntelligenceData =
    ownerSentimentData ?? petHealthData ?? followUpData;

  // Email tab label: "Email" if sent, "Email Preview" if not
  const emailTabLabel = emailSent ? "Email" : "Email Preview";

  // Check if there's any content to show
  const hasEmailContent = [
    structuredContent?.patientName,
    emailContent?.trim(),
    dischargeSummary?.trim(),
  ].some(Boolean);

  // If no email content and no phone sent, nothing to show
  if (!hasEmailContent && !phoneSent) {
    return null;
  }

  // Handle tab change - prevent switching to disabled phone tab
  const handleTabChange = (value: string) => {
    if (value === "phone" && !phoneTabEnabled) {
      return; // Prevent switching to disabled tab
    }
    setActiveTab(value as TabValue);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger
          value="phone"
          className={cn(
            "gap-2",
            !phoneTabEnabled &&
              "cursor-not-allowed opacity-50 data-[state=active]:bg-transparent",
          )}
          disabled={!phoneTabEnabled}
        >
          <Phone className="h-4 w-4" />
          <span>Phone Call</span>
        </TabsTrigger>
        <TabsTrigger value="email" className="gap-2">
          <Mail className="h-4 w-4" />
          <span>{emailTabLabel}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="phone" className="mt-4 space-y-4">
        {phoneTabEnabled ? (
          <>
            <PhoneContent
              scheduledCall={scheduledCall}
              phoneSent={phoneSent}
              callScript={callScript}
              patientName={patientName}
              ownerName={ownerName}
              hasOwnerPhone={hasOwnerPhone}
            />
            {callWasSuccessful && hasIntelligenceData && (
              <CallIntelligenceIndicators
                ownerSentimentData={ownerSentimentData}
                petHealthData={petHealthData}
                followUpData={followUpData}
              />
            )}
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="h-4 w-4" />
              <span className="text-sm">
                Phone call details will appear here after the call is completed
              </span>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="email" className="mt-4">
        <EmailContent
          structuredContent={structuredContent}
          emailContent={emailContent}
          dischargeSummary={dischargeSummary}
          emailSent={emailSent}
          hasOwnerEmail={hasOwnerEmail}
        />
      </TabsContent>
    </Tabs>
  );
}

/**
 * Phone content section - shows call details when call completed
 */
interface PhoneContentProps {
  scheduledCall: ScheduledCallData | null;
  phoneSent: boolean;
  callScript: string;
  patientName?: string;
  ownerName?: string;
  hasOwnerPhone: boolean;
}

function PhoneContent({
  scheduledCall,
  phoneSent,
  callScript,
  patientName,
  ownerName,
  hasOwnerPhone,
}: PhoneContentProps) {
  // If call was completed, show full call details
  if (phoneSent && scheduledCall) {
    return (
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
    );
  }

  // No phone number - show not available
  if (!hasOwnerPhone) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 text-slate-500">
          <Phone className="h-4 w-4" />
          <span className="text-sm">
            No phone number available for this owner
          </span>
        </div>
      </div>
    );
  }

  // Phone available but not sent - show call script preview
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        <Phone className="h-4 w-4" />
        Call Script Preview
      </h4>
      <div className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
          {callScript || "No call script available."}
        </p>
      </div>
    </div>
  );
}

/**
 * Email content section - shows email preview or sent content
 */
interface EmailContentProps {
  structuredContent: StructuredDischargeContent | null;
  emailContent: string;
  dischargeSummary: string;
  emailSent: boolean;
  hasOwnerEmail: boolean;
}

function EmailContent({
  structuredContent,
  emailContent,
  dischargeSummary,
  emailSent,
  hasOwnerEmail,
}: EmailContentProps) {
  return (
    <EmailTabContent
      caseData={{
        structuredContent,
        emailContent: emailContent ?? "",
        dischargeSummary: dischargeSummary ?? "",
      }}
      emailWasSent={emailSent}
      emailCanBeSent={!emailSent && hasOwnerEmail}
      hasOwnerEmail={hasOwnerEmail}
    />
  );
}
