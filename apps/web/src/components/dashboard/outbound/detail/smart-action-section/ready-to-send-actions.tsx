import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Alert, AlertDescription } from "@odis-ai/shared/ui/alert";
import { AlertCircle, Phone, Mail, Sparkles, Clock, Zap } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { DeliveryToggles } from "../../types";

interface ReadyToSendActionsProps {
  deliveryToggles: DeliveryToggles;
  onToggleChange: (toggles: DeliveryToggles) => void;
  onApprove: (immediate?: boolean) => void;
  isSubmitting: boolean;
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
  ownerPhone: string | null;
  ownerEmail: string | null;
  needsGeneration?: boolean;
  testModeEnabled?: boolean;
}

export function ReadyToSendActions({
  deliveryToggles,
  onToggleChange,
  onApprove,
  isSubmitting,
  hasOwnerPhone,
  hasOwnerEmail,
  ownerPhone,
  ownerEmail,
  needsGeneration,
  testModeEnabled,
}: ReadyToSendActionsProps) {
  const canSchedule =
    (deliveryToggles.phoneEnabled && hasOwnerPhone) ||
    (deliveryToggles.emailEnabled && hasOwnerEmail);

  return (
    <Card
      className={cn(
        "rounded-xl border shadow-sm backdrop-blur-md",
        "bg-gradient-to-br from-white/80 via-blue-50/30 to-white/80",
        "dark:from-slate-900/80 dark:via-blue-950/30 dark:to-slate-900/80",
        "border-blue-200/50 dark:border-blue-800/50",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          {/* Icon with gradient background */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              "bg-gradient-to-br from-blue-100 to-indigo-100",
              "dark:from-blue-900/50 dark:to-indigo-900/50",
              "shadow-inner",
            )}
          >
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
              Schedule Discharge
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose delivery channels
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsGeneration && (
          <Alert
            variant="destructive"
            className="border-red-200 dark:border-red-800"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please generate discharge summary before scheduling
            </AlertDescription>
          </Alert>
        )}

        {testModeEnabled && (
          <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Test mode enabled - communications will be sent to test
              numbers/emails
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {/* Phone Toggle */}
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 transition-all",
              deliveryToggles.phoneEnabled && hasOwnerPhone
                ? "bg-blue-50/50 ring-1 ring-blue-200/50 dark:bg-blue-950/30 dark:ring-blue-800/50"
                : "bg-slate-50/50 dark:bg-slate-800/50",
            )}
          >
            <Checkbox
              id="phone-toggle"
              checked={deliveryToggles.phoneEnabled}
              onCheckedChange={(checked) =>
                onToggleChange({
                  ...deliveryToggles,
                  phoneEnabled: checked === true,
                })
              }
              disabled={!hasOwnerPhone || isSubmitting}
              className="mt-0.5"
            />
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 dark:bg-slate-700/50">
                <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="phone-toggle"
                  className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Phone Call
                </label>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {hasOwnerPhone ? ownerPhone : "No phone number available"}
                </p>
              </div>
            </div>
          </div>

          {/* Email Toggle */}
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 transition-all",
              deliveryToggles.emailEnabled && hasOwnerEmail
                ? "bg-blue-50/50 ring-1 ring-blue-200/50 dark:bg-blue-950/30 dark:ring-blue-800/50"
                : "bg-slate-50/50 dark:bg-slate-800/50",
            )}
          >
            <Checkbox
              id="email-toggle"
              checked={deliveryToggles.emailEnabled}
              onCheckedChange={(checked) =>
                onToggleChange({
                  ...deliveryToggles,
                  emailEnabled: checked === true,
                })
              }
              disabled={!hasOwnerEmail || isSubmitting}
              className="mt-0.5"
            />
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 dark:bg-slate-700/50">
                <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="email-toggle"
                  className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Email
                </label>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {hasOwnerEmail ? ownerEmail : "No email address available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            onClick={() => onApprove(false)}
            disabled={!canSchedule || isSubmitting || needsGeneration}
            className={cn(
              "h-10 gap-2 font-semibold transition-all",
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600",
              "shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>...</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                <span>Schedule</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => onApprove(true)}
            disabled={!canSchedule || isSubmitting || needsGeneration}
            className={cn(
              "h-10 gap-2 font-semibold transition-all",
              "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
              "dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600",
              "shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Send Now</span>
              </>
            )}
          </Button>
        </div>

        {!canSchedule && !needsGeneration && (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Select at least one delivery method with valid contact info
          </p>
        )}
      </CardContent>
    </Card>
  );
}
