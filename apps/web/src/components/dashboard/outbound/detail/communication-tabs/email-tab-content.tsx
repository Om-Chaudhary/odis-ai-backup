import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";
import { EmailStructuredPreview } from "../structured-preview";
import type { StructuredDischargeContent } from "../../types";

interface EmailTabContentProps {
  caseData: {
    structuredContent: StructuredDischargeContent | null;
    emailContent: string;
    dischargeSummary: string;
  };
  emailWasSent: boolean;
  emailCanBeSent: boolean;
  hasOwnerEmail: boolean;
  patientName?: string;
}

/**
 * Build a fallback StructuredDischargeContent when the DB has none,
 * so we always show the styled EmailStructuredPreview.
 */
function buildLocalFallback(
  patientName: string,
  emailContent: string,
  dischargeSummary: string,
): StructuredDischargeContent {
  const summaryText =
    dischargeSummary && dischargeSummary.length >= 20
      ? dischargeSummary
      : emailContent && emailContent.length >= 20
        ? emailContent
        : `Discharge instructions were provided for ${patientName} following the completed call.`;
  return {
    patientName,
    appointmentSummary: summaryText,
    visitSummary: summaryText,
    homeCare: {
      activity: "Follow all take-home instructions provided at discharge",
    },
    followUp: {
      required: true,
      date: "As directed by your veterinarian",
      reason: "Post-visit follow-up",
    },
    warningSigns: [
      "Lethargy or loss of appetite lasting more than 24 hours",
      "Vomiting, diarrhea, or other new symptoms",
      "Signs of pain or distress",
    ],
  };
}

/**
 * Try to extract a patient name from emailContent like
 * "DISCHARGE INSTRUCTIONS FOR DUSTY\n..."
 */
function extractPatientName(emailContent: string): string | null {
  const match = emailContent.match(
    /DISCHARGE INSTRUCTIONS FOR ([A-Z][A-Z\s'-]+)/i,
  );
  return match?.[1]?.trim() ?? null;
}

/**
 * Email Tab Content - shows sent email if sent, schedule button if not sent, or preview
 */
export function EmailTabContent({
  caseData,
  emailWasSent,
  emailCanBeSent,
  hasOwnerEmail,
  patientName,
}: EmailTabContentProps) {
  // Resolve structured content: use DB value, or build a fallback from available data
  const resolvedContent: StructuredDischargeContent | null = (() => {
    if (caseData.structuredContent) return caseData.structuredContent;
    const name =
      patientName ||
      extractPatientName(caseData.emailContent) ||
      null;
    if (!name) return null;
    return buildLocalFallback(
      name,
      caseData.emailContent,
      caseData.dischargeSummary,
    );
  })();

  // If email was sent, show the sent email content
  if (emailWasSent) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Email Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resolvedContent ? (
            <div className="max-h-96 overflow-auto">
              <EmailStructuredPreview content={resolvedContent} />
            </div>
          ) : (
            <div className="bg-muted/50 max-h-96 overflow-auto rounded-md p-3">
              <p className="text-sm whitespace-pre-wrap">
                {caseData.emailContent ||
                  caseData.dischargeSummary ||
                  "No email content available."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If email can be sent, show schedule button
  if (emailCanBeSent) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-slate-500" />
            Email Not Scheduled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            This email has not been scheduled yet.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // TODO: Implement schedule email functionality
              console.log("Schedule email");
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Schedule Email
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no email available, show not available message
  if (!hasOwnerEmail) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-slate-400" />
            Email Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-sm text-slate-600">
              No email address available for this owner.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback: show email preview
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-slate-500" />
          Email Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resolvedContent ? (
          <div className="max-h-96 overflow-auto">
            <EmailStructuredPreview content={resolvedContent} />
          </div>
        ) : (
          <div className="bg-muted/50 max-h-96 overflow-auto rounded-md p-3">
            <p className="text-sm whitespace-pre-wrap">
              {caseData.emailContent ||
                caseData.dischargeSummary ||
                "No email content available."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
