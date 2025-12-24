import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";

interface SystemSettingsSectionProps {
  register: UseFormRegister<DischargeSettings>;
  watch: UseFormWatch<DischargeSettings>;
  setValue: UseFormSetValue<DischargeSettings>;
  errors: FieldErrors<DischargeSettings>;
}

export function SystemSettingsSection({
  register,
  watch,
  setValue,
  errors,
}: SystemSettingsSectionProps) {
  const isTestMode = watch("testModeEnabled");

  return (
    <div className="space-y-4">
      {/* Default Schedule Delay Override */}
      <div className="grid gap-2 rounded-lg border border-slate-100 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Label htmlFor="defaultScheduleDelayMinutes" className="text-base">
            Default Schedule Delay (Minutes)
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Override the default scheduling delay for calls and emails.
                  Leave empty to use system defaults (2 minutes for calls,
                  immediate for emails). This applies to all new schedules.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="defaultScheduleDelayMinutes"
          type="number"
          min="0"
          placeholder="e.g. 5 (leave empty for defaults)"
          {...register("defaultScheduleDelayMinutes", {
            valueAsNumber: true,
            validate: (value) => {
              if (
                value === undefined ||
                value === null ||
                Number.isNaN(value)
              ) {
                return true; // Allow empty/null/NaN
              }
              return value >= 0 || "Delay must be 0 or greater";
            },
          })}
          onChange={(e) => {
            const value = e.target.value;
            setValue(
              "defaultScheduleDelayMinutes",
              value === "" ? null : Number.parseInt(value, 10),
              { shouldDirty: true },
            );
          }}
        />
        <p className="text-muted-foreground text-xs">
          {watch("defaultScheduleDelayMinutes") !== null &&
          watch("defaultScheduleDelayMinutes") !== undefined &&
          typeof watch("defaultScheduleDelayMinutes") === "number"
            ? `Calls and emails will be scheduled ${watch("defaultScheduleDelayMinutes")} minutes from now`
            : "Using system defaults (2 min for calls, immediate for emails)"}
        </p>
      </div>

      {/* Voicemail Detection Settings */}
      <div
        className={`flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-colors ${watch("voicemailDetectionEnabled") ? "border-blue-200 bg-blue-50/50" : "border-slate-100"}`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="voicemail-detection" className="text-base">
                Voicemail Detection
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      When enabled, VAPI will automatically detect when a call
                      reaches voicemail.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-muted-foreground text-sm">
              Detect when calls reach voicemail
            </p>
          </div>
          <Switch
            id="voicemail-detection"
            checked={watch("voicemailDetectionEnabled")}
            onCheckedChange={(checked) => {
              setValue("voicemailDetectionEnabled", checked, {
                shouldDirty: true,
              });
              // If disabling detection, also disable hangup
              if (!checked) {
                setValue("voicemailHangupOnDetection", false, {
                  shouldDirty: true,
                });
              }
            }}
          />
        </div>

        {watch("voicemailDetectionEnabled") && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-4 border-t border-blue-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="voicemail-hangup" className="text-base">
                    Hang Up on Voicemail
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          When enabled, the call will hang up immediately when
                          voicemail is detected and retry later. When disabled,
                          a personalized message will be left on the voicemail.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-muted-foreground text-sm">
                  {watch("voicemailHangupOnDetection")
                    ? "Hang up and retry later to reach a live person"
                    : "Leave a personalized voicemail message"}
                </p>
              </div>
              <Switch
                id="voicemail-hangup"
                checked={watch("voicemailHangupOnDetection")}
                onCheckedChange={(checked) =>
                  setValue("voicemailHangupOnDetection", checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            {/* Voicemail Message - only show when not hanging up */}
            {!watch("voicemailHangupOnDetection") && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="voicemail-message" className="text-sm">
                    Voicemail Message
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Customize the message left on voicemail. You can use
                          template variables like{" "}
                          <code className="rounded bg-slate-100 px-1">
                            {"{{owner_name}}"}
                          </code>
                          ,{" "}
                          <code className="rounded bg-slate-100 px-1">
                            {"{{pet_name}}"}
                          </code>
                          ,{" "}
                          <code className="rounded bg-slate-100 px-1">
                            {"{{clinic_name}}"}
                          </code>
                          ,{" "}
                          <code className="rounded bg-slate-100 px-1">
                            {"{{clinic_phone}}"}
                          </code>
                          , and{" "}
                          <code className="rounded bg-slate-100 px-1">
                            {"{{agent_name}}"}
                          </code>
                          .
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <textarea
                  id="voicemail-message"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}. I'm calling to check in on {{pet_name}} after the recent visit..."
                  value={watch("voicemailMessage") ?? ""}
                  onChange={(e) =>
                    setValue("voicemailMessage", e.target.value || null, {
                      shouldDirty: true,
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  Leave blank to use the default message. Available variables:{" "}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    {"{{owner_name}}"}
                  </code>{" "}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    {"{{pet_name}}"}
                  </code>{" "}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    {"{{clinic_name}}"}
                  </code>{" "}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    {"{{clinic_phone}}"}
                  </code>{" "}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    {"{{agent_name}}"}
                  </code>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Mode Toggle */}
      <div
        className={`flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-colors ${isTestMode ? "border-amber-200 bg-amber-50/50" : "border-slate-100"}`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="test-mode" className="text-base">
                Test Mode
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      When enabled, all calls and emails will be sent to the
                      test contact details configured below, instead of the
                      actual pet owner.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-muted-foreground text-sm">
              Redirect all communications to a test contact
            </p>
          </div>
          <Switch
            id="test-mode"
            checked={isTestMode}
            onCheckedChange={(checked) =>
              setValue("testModeEnabled", checked, { shouldDirty: true })
            }
          />
        </div>

        {isTestMode && (
          <div className="animate-in fade-in slide-in-from-top-2 grid gap-3 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="testContactName">Test Contact Name</Label>
              <Input
                id="testContactName"
                placeholder="e.g. Test User"
                {...register("testContactName", { required: isTestMode })}
              />
              {errors.testContactName && (
                <p className="text-destructive text-xs">
                  Test contact name is required in test mode
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="testContactEmail">Test Email</Label>
              <Input
                id="testContactEmail"
                type="email"
                placeholder="test@example.com"
                {...register("testContactEmail", {
                  required: isTestMode,
                })}
              />
              {errors.testContactEmail && (
                <p className="text-destructive text-xs">
                  Test email is required in test mode
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="testContactPhone">Test Phone</Label>
              <Input
                id="testContactPhone"
                placeholder="+1 (555) 000-0000"
                {...register("testContactPhone", {
                  required: isTestMode,
                })}
              />
              {errors.testContactPhone && (
                <p className="text-destructive text-xs">
                  Test phone is required in test mode
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
