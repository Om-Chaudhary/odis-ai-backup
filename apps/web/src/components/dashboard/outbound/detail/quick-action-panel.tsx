import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Alert, AlertDescription } from "@odis-ai/ui/alert";
import {
  Mail,
  Phone,
  Clock,
  Zap,
  Loader2,
  RotateCcw,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import type { DeliveryToggles, DischargeCaseStatus } from "../types";

type ActionState = "unsent" | "partial" | "failed";

interface QuickActionPanelProps {
  /** Current case status */
  status: DischargeCaseStatus;
  /** Whether discharge summary needs to be generated */
  needsGeneration: boolean;
  /** Delivery toggle state */
  deliveryToggles: DeliveryToggles;
  /** Toggle change handler */
  onToggleChange: (toggles: DeliveryToggles) => void;
  /** Approve/send handler */
  onApprove: () => void;
  /** Retry handler for failed cases */
  onRetry?: () => void;
  /** Loading state */
  isSubmitting: boolean;
  /** Test mode enabled */
  testModeEnabled?: boolean;
  /** Owner has phone number */
  hasOwnerPhone: boolean;
  /** Owner has email */
  hasOwnerEmail: boolean;
  /** Owner phone number for display */
  ownerPhone?: string | null;
  /** Owner email for display */
  ownerEmail?: string | null;
  /** Failure reason for failed cases */
  failureReason?: string | null;
  /** Phone delivery status */
  phoneStatus?: "sent" | "pending" | "failed" | "not_applicable" | null;
  /** Email delivery status */
  emailStatus?: "sent" | "pending" | "failed" | "not_applicable" | null;
}

/**
 * Get action state from case status
 */
function getActionState(
  status: DischargeCaseStatus,
  phoneStatus?: "sent" | "pending" | "failed" | "not_applicable" | null,
  emailStatus?: "sent" | "pending" | "failed" | "not_applicable" | null
): ActionState {
  if (status === "failed") return "failed";

  // Check for partial delivery (one sent, one not)
  const phoneSent = phoneStatus === "sent";
  const emailSent = emailStatus === "sent";
  if ((phoneSent && !emailSent) || (!phoneSent && emailSent)) {
    return "partial";
  }

  return "unsent";
}

/**
 * QuickActionPanel - Streamlined action panel for sending communications
 *
 * Features:
 * - Channel selection (phone/email)
 * - Timing selection (scheduled/immediate)
 * - Single primary action button
 * - Context-sensitive UI based on case state
 * - No skip button - cases stay in queue until action taken
 */
export function QuickActionPanel({
  status,
  needsGeneration,
  deliveryToggles,
  onToggleChange,
  onApprove,
  onRetry,
  isSubmitting,
  testModeEnabled = false,
  hasOwnerPhone,
  hasOwnerEmail,
  ownerPhone,
  ownerEmail,
  failureReason,
  phoneStatus,
  emailStatus,
}: QuickActionPanelProps) {
  const actionState = getActionState(status, phoneStatus, emailStatus);

  // For partial delivery, determine what can still be sent
  const phoneSent = phoneStatus === "sent";
  const emailSent = emailStatus === "sent";
  const canSendPhone = hasOwnerPhone && !phoneSent;
  const canSendEmail = hasOwnerEmail && !emailSent;

  // Get panel title based on state
  const getPanelTitle = () => {
    switch (actionState) {
      case "failed":
        return "Retry Options";
      case "partial":
        return "Send Remaining";
      default:
        return "Delivery Options";
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    if (isSubmitting) {
      return needsGeneration ? "Generating..." : "Scheduling...";
    }
    if (actionState === "failed") {
      return "Retry";
    }
    if (needsGeneration) {
      return "Generate & Send";
    }
    if (actionState === "partial") {
      return "Send Remaining";
    }
    return "Approve & Send";
  };

  // Get button icon
  const getButtonIcon = () => {
    if (isSubmitting) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }
    if (actionState === "failed") {
      return <RotateCcw className="mr-2 h-4 w-4" />;
    }
    if (needsGeneration) {
      return <Wand2 className="mr-2 h-4 w-4" />;
    }
    return null;
  };

  // Handle action button click
  const handleAction = () => {
    if (actionState === "failed" && onRetry) {
      onRetry();
    } else {
      onApprove();
    }
  };

  // Check if any delivery option is enabled
  const hasEnabledOption = deliveryToggles.phoneEnabled || deliveryToggles.emailEnabled;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{getPanelTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel Selection */}
        <div className="grid grid-cols-2 gap-2">
          {/* Phone Option */}
          <label
            htmlFor="quick-phone-checkbox"
            className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
              deliveryToggles.phoneEnabled && canSendPhone
                ? "border-teal-500 bg-teal-500/10"
                : canSendPhone
                  ? "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  : "cursor-not-allowed border-slate-200/50 bg-slate-100/50 opacity-60 dark:border-slate-700/50 dark:bg-slate-800/50"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="quick-phone-checkbox"
                checked={deliveryToggles.phoneEnabled}
                onCheckedChange={(checked) =>
                  onToggleChange({ ...deliveryToggles, phoneEnabled: checked as boolean })
                }
                disabled={!canSendPhone}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Call</span>
                </div>
                {canSendPhone ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {formatPhoneNumber(ownerPhone ?? null)}
                  </p>
                ) : phoneSent ? (
                  <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                    Already sent
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    No phone
                  </p>
                )}
              </div>
            </div>
          </label>

          {/* Email Option */}
          <label
            htmlFor="quick-email-checkbox"
            className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
              deliveryToggles.emailEnabled && canSendEmail
                ? "border-teal-500 bg-teal-500/10"
                : canSendEmail
                  ? "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  : "cursor-not-allowed border-slate-200/50 bg-slate-100/50 opacity-60 dark:border-slate-700/50 dark:bg-slate-800/50"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="quick-email-checkbox"
                checked={deliveryToggles.emailEnabled}
                onCheckedChange={(checked) =>
                  onToggleChange({ ...deliveryToggles, emailEnabled: checked as boolean })
                }
                disabled={!canSendEmail}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                {canSendEmail ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500" title={ownerEmail ?? undefined}>
                    {ownerEmail}
                  </p>
                ) : emailSent ? (
                  <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                    Already sent
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    No email
                  </p>
                )}
              </div>
            </div>
          </label>
        </div>

        {/* Timing Selection - Only show for unsent/partial states */}
        {actionState !== "failed" && (canSendPhone || canSendEmail) && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-slate-500">Delivery Timing</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Scheduled */}
              <label
                htmlFor="quick-scheduled-timing"
                className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                  !deliveryToggles.immediateDelivery
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  id="quick-scheduled-timing"
                  name="quick-delivery-timing"
                  checked={!deliveryToggles.immediateDelivery}
                  onChange={() =>
                    onToggleChange({ ...deliveryToggles, immediateDelivery: false })
                  }
                  className="sr-only"
                />
                <Clock
                  className={`h-4 w-4 ${
                    !deliveryToggles.immediateDelivery
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-slate-400"
                  }`}
                />
                <div>
                  <span className="text-sm font-medium">Scheduled</span>
                  <p className="text-xs text-slate-500">Use delay settings</p>
                </div>
              </label>

              {/* Immediate */}
              <label
                htmlFor="quick-immediate-timing"
                className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                  deliveryToggles.immediateDelivery
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  id="quick-immediate-timing"
                  name="quick-delivery-timing"
                  checked={deliveryToggles.immediateDelivery}
                  onChange={() =>
                    onToggleChange({ ...deliveryToggles, immediateDelivery: true })
                  }
                  className="sr-only"
                />
                <Zap
                  className={`h-4 w-4 ${
                    deliveryToggles.immediateDelivery
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-slate-400"
                  }`}
                />
                <div>
                  <span className="text-sm font-medium">Immediate</span>
                  <p className="text-xs text-slate-500">Send right away</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Failure reason for failed state */}
        {actionState === "failed" && failureReason && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {failureReason.replace(/-/g, " ")}
            </AlertDescription>
          </Alert>
        )}

        {/* Test mode warning */}
        {testModeEnabled && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
              Test mode: Will send to your test contacts
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button - Full width, prominent */}
        <Button
          className={`w-full ${
            needsGeneration
              ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              : "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
          }`}
          onClick={handleAction}
          disabled={isSubmitting || !hasEnabledOption}
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>

        {/* Help text when no option enabled */}
        {!hasEnabledOption && (
          <p className="text-center text-xs text-slate-500">
            Select at least one delivery method
          </p>
        )}
      </CardContent>
    </Card>
  );
}
