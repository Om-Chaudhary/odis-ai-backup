import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import {
  Info,
  Clock,
  Voicemail,
  FlaskConical,
  AlertCircle,
  MessageSquare,
  PhoneOff,
  User,
  Mail,
  Phone,
} from "lucide-react";
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
  const voicemailDetectionEnabled = watch("voicemailDetectionEnabled");
  const voicemailHangupOnDetection = watch("voicemailHangupOnDetection");

  return (
    <div className="space-y-6">
      {/* Schedule Delay */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80 text-slate-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">
              Schedule Delay Override
            </h4>
            <p className="text-xs text-slate-500">
              Override default scheduling delays
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-teal-100/60 bg-white/50 p-4 backdrop-blur-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="defaultScheduleDelayMinutes"
                className="text-sm font-medium text-slate-700"
              >
                Default Schedule Delay (Minutes)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Override the default scheduling delay for calls and
                      emails. Leave empty to use system defaults (2 minutes for
                      calls, immediate for emails).
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
              className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
              {...register("defaultScheduleDelayMinutes", {
                valueAsNumber: true,
                validate: (value) => {
                  if (
                    value === undefined ||
                    value === null ||
                    Number.isNaN(value)
                  ) {
                    return true;
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
            <p className="text-xs text-slate-500">
              {watch("defaultScheduleDelayMinutes") !== null &&
              watch("defaultScheduleDelayMinutes") !== undefined &&
              typeof watch("defaultScheduleDelayMinutes") === "number"
                ? `Calls and emails will be scheduled ${watch("defaultScheduleDelayMinutes")} minutes from now`
                : "Using system defaults (2 min for calls, immediate for emails)"}
            </p>
          </div>
        </div>
      </div>

      {/* Voicemail Detection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
            <Voicemail className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">
              Voicemail Detection
            </h4>
            <p className="text-xs text-slate-500">
              Configure voicemail handling behavior
            </p>
          </div>
        </div>

        <div
          className={`rounded-lg border p-4 transition-all ${
            voicemailDetectionEnabled
              ? "border-blue-200 bg-blue-50/50"
              : "border-teal-100/60 bg-white/50"
          } backdrop-blur-sm`}
        >
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
                <Voicemail className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="voicemail-detection"
                    className="text-sm font-medium text-slate-700"
                  >
                    Enable Voicemail Detection
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          When enabled, VAPI will automatically detect when a
                          call reaches voicemail.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-slate-500">
                  Detect when calls reach voicemail
                </p>
              </div>
            </div>
            <Switch
              id="voicemail-detection"
              checked={voicemailDetectionEnabled}
              onCheckedChange={(checked) => {
                setValue("voicemailDetectionEnabled", checked, {
                  shouldDirty: true,
                });
                if (!checked) {
                  setValue("voicemailHangupOnDetection", false, {
                    shouldDirty: true,
                  });
                }
              }}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>

          {/* Nested Options */}
          {voicemailDetectionEnabled && (
            <div className="mt-4 space-y-4 border-t border-blue-100 pt-4">
              {/* Hang Up Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-white/60 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100/80 text-orange-600">
                    <PhoneOff className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="voicemail-hangup"
                        className="text-sm font-medium text-slate-700"
                      >
                        Hang Up on Voicemail
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 cursor-help text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              When enabled, the call will hang up immediately
                              when voicemail is detected and retry later. When
                              disabled, a personalized message will be left.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-slate-500">
                      {voicemailHangupOnDetection
                        ? "Hang up and retry later"
                        : "Leave a voicemail message"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="voicemail-hangup"
                  checked={voicemailHangupOnDetection}
                  onCheckedChange={(checked) =>
                    setValue("voicemailHangupOnDetection", checked, {
                      shouldDirty: true,
                    })
                  }
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>

              {/* Voicemail Message */}
              {!voicemailHangupOnDetection && (
                <div className="space-y-2 rounded-lg border border-blue-100 bg-white/60 p-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    <Label
                      htmlFor="voicemail-message"
                      className="text-sm font-medium text-slate-700"
                    >
                      Voicemail Message
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Customize the voicemail message. Variables:{" "}
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
                            ,{" "}
                            <code className="rounded bg-slate-100 px-1">
                              {"{{agent_name}}"}
                            </code>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <textarea
                    id="voicemail-message"
                    className="min-h-[80px] w-full resize-none rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 focus:outline-none"
                    placeholder="Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}..."
                    value={watch("voicemailMessage") ?? ""}
                    onChange={(e) =>
                      setValue("voicemailMessage", e.target.value || null, {
                        shouldDirty: true,
                      })
                    }
                  />
                  <div className="flex flex-wrap gap-1">
                    {[
                      "{{owner_name}}",
                      "{{pet_name}}",
                      "{{clinic_name}}",
                      "{{clinic_phone}}",
                      "{{agent_name}}",
                    ].map((variable) => (
                      <code
                        key={variable}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                      >
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test Mode */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/80 text-amber-600">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">Test Mode</h4>
            <p className="text-xs text-slate-500">
              Redirect communications for testing
            </p>
          </div>
        </div>

        <div
          className={`rounded-lg border p-4 transition-all ${
            isTestMode
              ? "border-amber-200 bg-amber-50/50"
              : "border-teal-100/60 bg-white/50"
          } backdrop-blur-sm`}
        >
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100/80 text-amber-600">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="test-mode"
                    className="text-sm font-medium text-slate-700"
                  >
                    Enable Test Mode
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          When enabled, all calls and emails will be sent to the
                          test contact details instead of actual pet owners.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-slate-500">
                  Redirect all communications to a test contact
                </p>
              </div>
            </div>
            <Switch
              id="test-mode"
              checked={isTestMode}
              onCheckedChange={(checked) =>
                setValue("testModeEnabled", checked, { shouldDirty: true })
              }
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          {/* Test Contact Fields */}
          {isTestMode && (
            <div className="mt-4 space-y-4 border-t border-amber-100 pt-4">
              <div className="grid gap-4 sm:grid-cols-1">
                <div className="grid gap-2">
                  <Label
                    htmlFor="testContactName"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Test Contact Name
                  </Label>
                  <Input
                    id="testContactName"
                    placeholder="e.g. Test User"
                    className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
                    {...register("testContactName", { required: isTestMode })}
                  />
                  {errors.testContactName && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      Required in test mode
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="testContactEmail"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Test Email
                  </Label>
                  <Input
                    id="testContactEmail"
                    type="email"
                    placeholder="test@example.com"
                    className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
                    {...register("testContactEmail", { required: isTestMode })}
                  />
                  {errors.testContactEmail && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      Required in test mode
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="testContactPhone"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    Test Phone
                  </Label>
                  <Input
                    id="testContactPhone"
                    placeholder="+1 (555) 000-0000"
                    className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20"
                    {...register("testContactPhone", { required: isTestMode })}
                  />
                  {errors.testContactPhone && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      Required in test mode
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
