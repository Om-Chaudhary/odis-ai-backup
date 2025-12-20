"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@odis-ai/ui/button";
import { Separator } from "@odis-ai/ui/separator";
import { Loader2 } from "lucide-react";
import type { DischargeSettings } from "@odis-ai/types";
import {
  ClinicInfoSection,
  EmailSchedulingSection,
  CallSchedulingSection,
  BatchPreferencesSection,
  VapiConfigSection,
  BrandingSection,
  SystemSettingsSection,
} from "./sections";

interface DischargeSettingsFormProps {
  settings: DischargeSettings;
  onSave: (settings: DischargeSettings) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  view?: "all" | "clinic" | "branding" | "system" | "outbound" | "inbound";
}

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
        <ClinicInfoSection
          register={register}
          errors={errors}
          settings={settings}
          showSeparator={view === "all"}
        />
      )}

      {showClinic && showBranding && <Separator />}

      {showOutbound && (
        <>
          <div className="space-y-6">
            {/* Email Scheduling Section */}
            <EmailSchedulingSection watch={watch} setValue={setValue} />

            <Separator />

            {/* Call Scheduling Section */}
            <CallSchedulingSection watch={watch} setValue={setValue} />

            <Separator />

            {/* Batch Discharge Preferences */}
            <BatchPreferencesSection watch={watch} setValue={setValue} />
          </div>
        </>
      )}

      {showInbound && (
        <>
          <VapiConfigSection register={register} />
        </>
      )}

      {showBranding && showSystem && <Separator />}

      {showBranding && (
        <BrandingSection
          register={register}
          watch={watch}
          setValue={setValue}
        />
      )}

      {showBranding && showSystem && <Separator />}

      {showSystem && (
        <SystemSettingsSection
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />
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
