import { Tabs, TabsContent, TabsList, TabsTrigger } from "@odis-ai/shared/ui/tabs";
import { Mail, Phone } from "lucide-react";
import { CallTabContent } from "./call-tab-content";
import { EmailTabContent } from "./email-tab-content";
import type { PreviewTab } from "../../types";
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
  structuredData?: { urgent_case?: boolean; [key: string]: unknown } | null;
  urgentReasonSummary?: string | null;
  recordingUrl?: string | null;
  stereoRecordingUrl?: string | null;
}

interface CaseData {
  emailSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  phoneSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  owner: {
    email: string | null;
    phone: string | null;
  };
  scheduledCall: ScheduledCallData | null;
  structuredContent: StructuredDischargeSummary | null;
  emailContent: string;
  dischargeSummary: string;
}

interface CommunicationSummarySectionProps {
  caseData: CaseData;
  callScript: string;
  activeTab: PreviewTab;
  setActiveTab: (tab: PreviewTab) => void;
}

/**
 * Communication Summary Section - intelligent display based on actual delivery status
 */
export function CommunicationSummarySection({
  caseData,
  callScript,
  activeTab,
  setActiveTab,
}: CommunicationSummarySectionProps) {
  const emailStatus = caseData.emailSent;
  const phoneStatus = caseData.phoneSent;
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const hasOwnerPhone = Boolean(caseData.owner.phone);

  // Determine what to show for each tab
  const emailWasSent = emailStatus === "sent";
  const phoneWasSent = phoneStatus === "sent";
  const emailCanBeSent = hasOwnerEmail && !emailWasSent;
  const phoneCanBeSent = hasOwnerPhone && !phoneWasSent;

  // Determine tab labels
  const getCallTabLabel = () => {
    if (phoneWasSent && caseData.scheduledCall?.transcript)
      return "Call Transcript";
    if (phoneWasSent) return "Call Sent";
    if (phoneCanBeSent) return "Call Script";
    return "Call Script";
  };

  const getEmailTabLabel = () => {
    if (emailWasSent) return "Email Sent";
    if (emailCanBeSent) return "Email Preview";
    return "Email";
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PreviewTab)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="call_script" className="gap-2">
            <Phone className="h-4 w-4" />
            {getCallTabLabel()}
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            {getEmailTabLabel()}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="call_script" className="mt-4">
          <CallTabContent
            caseData={caseData}
            callScript={callScript}
            phoneWasSent={phoneWasSent}
            phoneCanBeSent={phoneCanBeSent}
            hasOwnerPhone={hasOwnerPhone}
          />
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <EmailTabContent
            caseData={caseData}
            emailWasSent={emailWasSent}
            emailCanBeSent={emailCanBeSent}
            hasOwnerEmail={hasOwnerEmail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
