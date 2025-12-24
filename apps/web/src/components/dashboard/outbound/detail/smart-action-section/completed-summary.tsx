import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { DischargeCaseStatus } from "../../types";

interface CompletedSummaryProps {
  status: DischargeCaseStatus;
  phoneStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  failureReason?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function CompletedSummary({
  status,
  phoneStatus,
  emailStatus,
  failureReason,
  onRetry,
  isRetrying,
}: CompletedSummaryProps) {
  const phoneSent = phoneStatus === "sent";
  const emailSent = emailStatus === "sent";
  const phoneFailed = phoneStatus === "failed";
  const emailFailed = emailStatus === "failed";

  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {isCompleted && (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Delivery Complete
            </>
          )}
          {isFailed && (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              Delivery Failed
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Summary */}
        <div className="space-y-2">
          {phoneSent && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Phone call completed</span>
            </div>
          )}
          {phoneFailed && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Phone call failed</span>
            </div>
          )}
          {emailSent && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Email sent</span>
            </div>
          )}
          {emailFailed && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Email failed</span>
            </div>
          )}
        </div>

        {/* Failure Reason */}
        {isFailed && failureReason && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  Failure Reason
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {failureReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Retry Button */}
        {isFailed && onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            variant="outline"
            className="w-full"
          >
            {isRetrying ? "Retrying..." : "Retry Delivery"}
          </Button>
        )}

        {/* Success Message */}
        {isCompleted && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            All selected communications have been delivered successfully.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
