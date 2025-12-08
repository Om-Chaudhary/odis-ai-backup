"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@odis/ui/button";
import { Input } from "@odis/ui/input";
import { Label } from "@odis/ui/label";
import { Switch } from "@odis/ui/switch";
import { Separator } from "@odis/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis/ui/select";
import { Loader2, Info, Clock, Mail, Phone, Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis/ui/tooltip";
import { Alert, AlertDescription } from "@odis/ui/alert";
import type { DischargeSettings } from "~/types/dashboard";

interface DischargeSettingsFormProps {
  settings: DischargeSettings;
  onSave: (settings: DischargeSettings) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  view?: "all" | "clinic" | "branding" | "system" | "outbound" | "inbound";
}

// Generate time options from 6 AM to 9 PM in 30-minute intervals
function generateTimeOptions() {
  const options = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = new Date(`2000-01-01T${time}:00`).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        },
      );
      options.push({ value: time, label });
    }
  }
  return options;
}

const timeOptions = generateTimeOptions();

export function DischargeSettingsForm({
  settings,
  onSave,
  onCancel,
  isLoading = false,
  view = "all",
}: DischargeSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors },
  } = useForm<DischargeSettings>({
    defaultValues: settings,
  });

  // Watch test mode to conditionally show contact fields
  const isTestMode = watch("testModeEnabled");

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = (data: DischargeSettings) => {
    onSave(data);
  };

  const showClinic = view === "all" || view === "clinic";
  const showBranding = view === "all" || view === "branding";
  const showSystem = view === "all" || view === "system";
  const showOutbound = view === "all" || view === "outbound";
  const showInbound = view === "all" || view === "inbound";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {showClinic && (
        <>
          <div className="space-y-4">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  placeholder="e.g. Happy Paws Veterinary"
                  {...register("clinicName", { required: true })}
                />
                {errors.clinicName && (
                  <p className="text-destructive text-xs">
                    Clinic name is required
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clinicPhone">Phone Number</Label>
                <Input
                  id="clinicPhone"
                  placeholder="e.g. +1 (555) 123-4567"
                  {...register("clinicPhone", { required: true })}
                />
                {errors.clinicPhone && (
                  <p className="text-destructive text-xs">
                    Phone number is required
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  This number will be displayed to pet owners for follow-up
                  questions.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clinicEmail">Email Address</Label>
                <Input
                  id="clinicEmail"
                  type="email"
                  placeholder="e.g. info@happypaws.com"
                  {...register("clinicEmail", { required: true })}
                />
                {errors.clinicEmail && (
                  <p className="text-destructive text-xs">
                    Email address is required
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emergencyPhone">Emergency Phone Number</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="e.g. +1 (555) 999-8888"
                  {...register("emergencyPhone")}
                />
                <p className="text-muted-foreground text-xs">
                  Optional emergency contact number for after-hours.
                </p>
              </div>
            </div>
          </div>

          {view === "all" && <Separator />}

          <div className="space-y-4">
            <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Veterinarian Details
            </h4>

            <div className="grid gap-2">
              <Label htmlFor="vetName">Default Veterinarian Name</Label>
              <Input
                id="vetName"
                placeholder="e.g. Dr. Sarah Smith"
                value={settings.vetName}
                disabled
                readOnly
              />
              <p className="text-muted-foreground text-xs">
                This name is computed from your profile (first name + last name)
                and will be used as the sender for discharge emails.
              </p>
            </div>
          </div>
        </>
      )}

      {showClinic && showBranding && <Separator />}

      {showOutbound && (
        <>
          <div className="space-y-6">
            {/* Email Scheduling Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-medium">Email Scheduling</h4>
              </div>

              <div className="grid gap-4 rounded-lg border p-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label>Preferred Email Window</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Discharge emails will be scheduled within this time
                            window. For batch operations, emails will be sent
                            during this period.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-muted-foreground mb-1 block text-xs">
                        Start Time
                      </Label>
                      <Select
                        value={watch("preferredEmailStartTime") ?? "09:00"}
                        onValueChange={(value) =>
                          setValue("preferredEmailStartTime", value, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-muted-foreground mt-5">to</span>
                    <div className="flex-1">
                      <Label className="text-muted-foreground mb-1 block text-xs">
                        End Time
                      </Label>
                      <Select
                        value={watch("preferredEmailEndTime") ?? "12:00"}
                        onValueChange={(value) =>
                          setValue("preferredEmailEndTime", value, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="emailDelayDays">
                      Days After Appointment
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Number of days to wait after an appointment before
                            sending the discharge email. Default is 1 day (next
                            day).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="emailDelayDays"
                      type="number"
                      min="0"
                      max="30"
                      className="w-24"
                      value={watch("emailDelayDays") ?? 1}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue(
                          "emailDelayDays",
                          value === "" ? 1 : Number.parseInt(value, 10),
                          { shouldDirty: true },
                        );
                      }}
                    />
                    <span className="text-muted-foreground text-sm">
                      day{(watch("emailDelayDays") ?? 1) !== 1 ? "s" : ""} after
                      appointment
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Call Scheduling Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-500" />
                <h4 className="text-sm font-medium">Call Scheduling</h4>
              </div>

              <div className="grid gap-4 rounded-lg border p-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label>Preferred Call Window</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Follow-up calls will be scheduled within this time
                            window. Calls are typically made in the afternoon
                            when pet owners are more available.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-muted-foreground mb-1 block text-xs">
                        Start Time
                      </Label>
                      <Select
                        value={watch("preferredCallStartTime") ?? "14:00"}
                        onValueChange={(value) =>
                          setValue("preferredCallStartTime", value, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-muted-foreground mt-5">to</span>
                    <div className="flex-1">
                      <Label className="text-muted-foreground mb-1 block text-xs">
                        End Time
                      </Label>
                      <Select
                        value={watch("preferredCallEndTime") ?? "17:00"}
                        onValueChange={(value) =>
                          setValue("preferredCallEndTime", value, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="callDelayDays">Days After Email</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Number of days to wait after sending the discharge
                            email before making a follow-up call. Default is 2
                            days.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="callDelayDays"
                      type="number"
                      min="0"
                      max="30"
                      className="w-24"
                      value={watch("callDelayDays") ?? 2}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue(
                          "callDelayDays",
                          value === "" ? 2 : Number.parseInt(value, 10),
                          { shouldDirty: true },
                        );
                      }}
                    />
                    <span className="text-muted-foreground text-sm">
                      day{(watch("callDelayDays") ?? 2) !== 1 ? "s" : ""} after
                      email
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="maxCallRetries">Max Retry Attempts</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Maximum number of times to retry a failed call
                            (busy, no answer, etc.). Default is 3 attempts.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxCallRetries"
                      type="number"
                      min="0"
                      max="10"
                      className="w-24"
                      value={watch("maxCallRetries") ?? 3}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue(
                          "maxCallRetries",
                          value === "" ? 3 : Number.parseInt(value, 10),
                          { shouldDirty: true },
                        );
                      }}
                    />
                    <span className="text-muted-foreground text-sm">
                      attempts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Batch Discharge Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <h4 className="text-sm font-medium">
                  Batch Discharge Preferences
                </h4>
              </div>

              <div className="grid gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="batch-idexx" className="text-sm">
                      Include IDEXX Neo Cases
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Auto-include IDEXX Neo cases with consultation notes in
                      batch discharge
                    </p>
                  </div>
                  <Switch
                    id="batch-idexx"
                    checked={watch("batchIncludeIdexxNotes") ?? true}
                    onCheckedChange={(checked) =>
                      setValue("batchIncludeIdexxNotes", checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="batch-manual" className="text-sm">
                      Include Manual Cases
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Auto-include manual cases with transcriptions or SOAP
                      notes
                    </p>
                  </div>
                  <Switch
                    id="batch-manual"
                    checked={watch("batchIncludeManualTranscriptions") ?? true}
                    onCheckedChange={(checked) =>
                      setValue("batchIncludeManualTranscriptions", checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Schedule Preview */}
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Default Schedule Preview:</strong> Based on your
                settings, batch discharges will:
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>
                    Send emails{" "}
                    <strong>
                      {watch("emailDelayDays") ?? 1} day
                      {(watch("emailDelayDays") ?? 1) !== 1 ? "s" : ""}
                    </strong>{" "}
                    after appointment between{" "}
                    <strong>
                      {watch("preferredEmailStartTime") ?? "9:00 AM"}
                    </strong>{" "}
                    and{" "}
                    <strong>
                      {watch("preferredEmailEndTime") ?? "12:00 PM"}
                    </strong>
                  </li>
                  <li>
                    Make follow-up calls{" "}
                    <strong>
                      {watch("callDelayDays") ?? 2} day
                      {(watch("callDelayDays") ?? 2) !== 1 ? "s" : ""}
                    </strong>{" "}
                    after email between{" "}
                    <strong>
                      {watch("preferredCallStartTime") ?? "2:00 PM"}
                    </strong>{" "}
                    and{" "}
                    <strong>
                      {watch("preferredCallEndTime") ?? "5:00 PM"}
                    </strong>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </>
      )}

      {showInbound && (
        <>
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure your VAPI phone numbers and assistants for handling
                inbound and outbound calls. These IDs can be found in your{" "}
                <a
                  href="https://dashboard.vapi.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  VAPI Dashboard
                </a>
                .
              </AlertDescription>
            </Alert>

            {/* Inbound Call Configuration */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4" />
                Inbound Call Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                Configure how incoming calls to your clinic are routed and
                handled by the AI assistant.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="inboundPhoneNumberId">
                      Inbound Phone Number ID
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            The VAPI Phone Number ID for receiving inbound
                            calls. Found in VAPI Dashboard → Phone Numbers.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="inboundPhoneNumberId"
                    placeholder="e.g. pn_abc123..."
                    {...register("inboundPhoneNumberId")}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="inboundAssistantId">
                      Inbound Assistant ID
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            The VAPI Assistant ID for handling inbound calls.
                            Found in VAPI Dashboard → Assistants.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="inboundAssistantId"
                    placeholder="e.g. ast_abc123..."
                    {...register("inboundAssistantId")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Outbound Call Configuration */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4" />
                Outbound Call Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                Configure the phone number and assistant used for outbound
                discharge follow-up calls. Leave blank to use system defaults.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="outboundPhoneNumberId">
                      Outbound Phone Number ID
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            The VAPI Phone Number ID for outbound caller ID.
                            This number will appear on the pet owner&apos;s
                            phone.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="outboundPhoneNumberId"
                    placeholder="e.g. pn_xyz789..."
                    {...register("outboundPhoneNumberId")}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="outboundAssistantId">
                      Outbound Assistant ID
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            The VAPI Assistant ID for outbound discharge calls.
                            Leave blank to use the shared system assistant.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="outboundAssistantId"
                    placeholder="e.g. ast_xyz789..."
                    {...register("outboundAssistantId")}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showBranding && (
        <>
          <div className="space-y-4">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          This color is used for the email header background,
                          buttons, and accent elements in discharge emails.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    className="h-10 w-16 cursor-pointer p-1"
                    {...register("primaryColor")}
                  />
                  <Input
                    type="text"
                    placeholder="#2563EB"
                    className="flex-1 font-mono"
                    value={watch("primaryColor") ?? "#2563EB"}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                        setValue("primaryColor", value || "#2563EB", {
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Used for headers, buttons, and accents in discharge emails.
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          URL to your clinic logo image. The logo will appear in
                          the header of discharge emails. Recommended size:
                          200x60 pixels.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  {...register("logoUrl")}
                />
                <p className="text-muted-foreground text-xs">
                  Optional: Display your clinic logo in email headers.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emailHeaderText">Custom Header Text</Label>
                <Input
                  id="emailHeaderText"
                  placeholder="Thank you for trusting us with your pet's care!"
                  {...register("emailHeaderText")}
                />
                <p className="text-muted-foreground text-xs">
                  Optional: Custom welcome message for discharge emails.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emailFooterText">Custom Footer Text</Label>
                <Input
                  id="emailFooterText"
                  placeholder="Questions? Call us at (555) 123-4567"
                  {...register("emailFooterText")}
                />
                <p className="text-muted-foreground text-xs">
                  Optional: Custom footer message for discharge emails.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {showBranding && showSystem && <Separator />}

      {showSystem && (
        <>
          <div className="space-y-4">
            {/* Default Schedule Delay Override */}
            <div className="grid gap-2 rounded-lg border border-slate-100 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="defaultScheduleDelayMinutes"
                  className="text-base"
                >
                  Default Schedule Delay (Minutes)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Override the default scheduling delay for calls and
                        emails. Leave empty to use system defaults (2 minutes
                        for calls, immediate for emails). This applies to all
                        new schedules.
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
                            When enabled, VAPI will automatically detect when a
                            call reaches voicemail.
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
                                When enabled, the call will hang up immediately
                                when voicemail is detected and retry later. When
                                disabled, a personalized message will be left on
                                the voicemail.
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
                                Customize the message left on voicemail. You can
                                use template variables like{" "}
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
                        Leave blank to use the default message. Available
                        variables:{" "}
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
                            When enabled, all calls and emails will be sent to
                            the test contact details configured below, instead
                            of the actual pet owner.
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
        </>
      )}

      <div className="flex justify-end gap-3 pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!isDirty || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
