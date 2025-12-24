"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@odis-ai/shared/ui/button";
import { Loader2, Save, X } from "lucide-react";
import type { DischargeSettings } from "@odis-ai/shared/types";
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

      {showOutbound && (
        <div className="space-y-6">
          <EmailSchedulingSection watch={watch} setValue={setValue} />
          <CallSchedulingSection watch={watch} setValue={setValue} />
          <BatchPreferencesSection watch={watch} setValue={setValue} />
        </div>
      )}

      {showInbound && <VapiConfigSection register={register} />}

      {showBranding && (
        <BrandingSection
          register={register}
          watch={watch}
          setValue={setValue}
        />
      )}

      {showSystem && (
        <SystemSettingsSection
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 border-t border-teal-100/50 pt-6">
        <div className="text-xs text-slate-400">
          {isDirty ? (
            <span className="text-amber-600">You have unsaved changes</span>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isDirty || isLoading}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
