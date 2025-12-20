import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Mail, Phone, Clock, Zap } from "lucide-react";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import type { DeliveryToggles } from "../types";

interface DeliveryToggleSectionProps {
  toggles: DeliveryToggles;
  onChange: (toggles: DeliveryToggles) => void;
  hasPhone: boolean;
  hasEmail: boolean;
  phone: string | null;
  email: string | null;
  testModeEnabled?: boolean;
}

/**
 * Delivery toggle section with contact info display
 * Uses checkboxes with card-based layout for better UX
 */
export function DeliveryToggleSection({
  toggles,
  onChange,
  hasPhone,
  hasEmail,
  phone,
  email,
  testModeEnabled = false,
}: DeliveryToggleSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Delivery Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Delivery Method Selection - Card-based checkboxes */}
        <div className="grid grid-cols-2 gap-2">
          {/* Phone Call Option */}
          <label
            htmlFor="phone-checkbox"
            className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
              toggles.phoneEnabled && hasPhone
                ? "border-teal-500 bg-teal-500/10"
                : hasPhone
                  ? "border-border hover:border-border/80"
                  : "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="phone-checkbox"
                checked={toggles.phoneEnabled}
                onCheckedChange={(checked) =>
                  onChange({ ...toggles, phoneEnabled: checked as boolean })
                }
                disabled={!hasPhone}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Call</span>
                </div>
                {hasPhone ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {formatPhoneNumber(phone)}
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
            htmlFor="email-checkbox"
            className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
              toggles.emailEnabled && hasEmail
                ? "border-teal-500 bg-teal-500/10"
                : hasEmail
                  ? "border-border hover:border-border/80"
                  : "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="email-checkbox"
                checked={toggles.emailEnabled}
                onCheckedChange={(checked) =>
                  onChange({ ...toggles, emailEnabled: checked as boolean })
                }
                disabled={!hasEmail}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                {hasEmail ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {email}
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

        {/* Timing Selection - Available to all users */}
        <div className="space-y-2 border-t pt-2">
          <p className="text-muted-foreground text-xs font-medium">
            Delivery Timing
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Scheduled (default) */}
            <label
              htmlFor="scheduled-timing"
              className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                !toggles.immediateDelivery
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-border hover:border-border/80"
              }`}
            >
              <input
                type="radio"
                id="scheduled-timing"
                name="delivery-timing"
                checked={!toggles.immediateDelivery}
                onChange={() =>
                  onChange({ ...toggles, immediateDelivery: false })
                }
                className="sr-only"
              />
              <Clock
                className={`h-4 w-4 ${!toggles.immediateDelivery ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}
              />
              <div>
                <span className="text-sm font-medium">Scheduled</span>
                <p className="text-muted-foreground text-xs">
                  Use delay settings
                </p>
              </div>
            </label>

            {/* Immediate */}
            <label
              htmlFor="immediate-timing"
              className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                toggles.immediateDelivery
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-border hover:border-border/80"
              }`}
            >
              <input
                type="radio"
                id="immediate-timing"
                name="delivery-timing"
                checked={toggles.immediateDelivery}
                onChange={() =>
                  onChange({ ...toggles, immediateDelivery: true })
                }
                className="sr-only"
              />
              <Zap
                className={`h-4 w-4 ${toggles.immediateDelivery ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}
              />
              <div>
                <span className="text-sm font-medium">Immediate</span>
                <p className="text-muted-foreground text-xs">Send right away</p>
              </div>
            </label>
          </div>

          {/* Test mode indicator */}
          {testModeEnabled && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Test mode: Will send to your test contacts
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
