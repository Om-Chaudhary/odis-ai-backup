import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import type { DeliveryToggles } from "../../types";

interface PendingReviewActionsProps {
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
  deliveryToggles: DeliveryToggles;
  onApprove: (immediate?: boolean) => void;
  isSubmitting: boolean;
  testModeEnabled?: boolean;
}

/**
 * PendingReviewActions - Schedule button UI for pending_review/ready cases
 *
 * Shows the schedule button. Channel toggles and delay configuration
 * are handled by CommunicationStatusCards above.
 * For cases without contact info, shows a warning message.
 */
export function PendingReviewActions({
  hasOwnerPhone,
  hasOwnerEmail,
  deliveryToggles,
  onApprove,
  isSubmitting,
  testModeEnabled,
}: PendingReviewActionsProps) {
  const hasAnyContact = hasOwnerPhone || hasOwnerEmail;
  const canSchedule =
    hasAnyContact &&
    ((hasOwnerPhone && deliveryToggles.phoneEnabled) ||
      (hasOwnerEmail && deliveryToggles.emailEnabled));

  // No contact information available
  if (!hasAnyContact) {
    return (
      <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Missing Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No phone number or email address is available for this case.
            Contact information is required to schedule outreach.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-200/50 bg-teal-50/30 dark:border-teal-800/50 dark:bg-teal-950/20">
      <CardContent className="space-y-3 p-4">
        {/* Header */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Schedule Discharge Outreach
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use the toggles above to configure delivery channels
          </p>
        </div>

        {/* Schedule button */}
        <Button
          onClick={() => onApprove(false)}
          disabled={!canSchedule || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            "Schedule Outreach"
          )}
        </Button>

        {/* Test mode warning */}
        {testModeEnabled && (
          <p className="text-center text-xs text-amber-600 dark:text-amber-400">
            Test mode enabled - will use test contacts
          </p>
        )}
      </CardContent>
    </Card>
  );
}
