"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { Loader2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { DischargeSettings } from "~/types/dashboard";

interface DischargeSettingsFormProps {
  settings: DischargeSettings;
  onSave: (settings: DischargeSettings) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DischargeSettingsForm({
  settings,
  onSave,
  onCancel,
  isLoading = false,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Clinic Information
        </h4>

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

      <Separator />

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
            This name is computed from your profile (first name + last name) and
            will be used as the sender for discharge emails.
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          System Configuration
        </h4>

        {/* Voicemail Detection Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
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
                      When enabled, calls will automatically detect voicemail
                      systems and leave a personalized message.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-muted-foreground text-sm">
              Leave message if call is not answered
            </p>
          </div>
          <Switch
            id="voicemail-detection"
            checked={watch("voicemailDetectionEnabled")}
            onCheckedChange={(checked) =>
              setValue("voicemailDetectionEnabled", checked, {
                shouldDirty: true,
              })
            }
          />
        </div>

        {/* Test Mode Toggle */}
        <div
          className={`flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-colors ${isTestMode ? "border-amber-200 bg-amber-50/50" : ""}`}
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
