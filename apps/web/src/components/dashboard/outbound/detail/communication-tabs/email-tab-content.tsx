import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";
import { EmailStructuredPreview } from "../structured-preview";
import type { StructuredDischargeSummary } from "@odis-ai/shared/validators/discharge-summary";

interface EmailTabContentProps {
  caseData: {
    structuredContent: StructuredDischargeSummary | null;
    emailContent: string;
    dischargeSummary: string;
  };
  emailWasSent: boolean;
  emailCanBeSent: boolean;
  hasOwnerEmail: boolean;
}

/**
 * Email Tab Content - shows sent email if sent, schedule button if not sent, or preview
 */
export function EmailTabContent({
  caseData,
  emailWasSent,
  emailCanBeSent,
  hasOwnerEmail,
}: EmailTabContentProps) {
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
          {caseData.structuredContent ? (
            <div className="max-h-96 overflow-auto">
              <EmailStructuredPreview content={caseData.structuredContent} />
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
        {caseData.structuredContent ? (
          <div className="max-h-96 overflow-auto">
            <EmailStructuredPreview content={caseData.structuredContent} />
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
