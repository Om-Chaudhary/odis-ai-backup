"use client";

import { Palette, Loader2, Save } from "lucide-react";
import { api } from "~/trpc/client";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { Button } from "@odis-ai/shared/ui/button";
import { BrandingSection } from "~/components/dashboard/settings/discharge-settings/sections";

export default function BrandingSettingsPage() {
  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Branding settings saved successfully");
      void refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const defaultSettings: DischargeSettings = {
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    emergencyPhone: "",
    vetName: "",
    testModeEnabled: false,
    testContactName: "",
    testContactEmail: "",
    testContactPhone: "",
    voicemailDetectionEnabled: false,
    defaultScheduleDelayMinutes: null,
    primaryColor: "#2563EB",
    logoUrl: null,
    emailHeaderText: null,
    emailFooterText: null,
    preferredEmailStartTime: "09:00",
    preferredEmailEndTime: "12:00",
    preferredCallStartTime: "14:00",
    preferredCallEndTime: "17:00",
    emailDelayDays: 1,
    callDelayDays: 2,
    maxCallRetries: 3,
    batchIncludeIdexxNotes: true,
    batchIncludeManualTranscriptions: true,
  };

  const settings = useMemo(
    () => settingsData ?? defaultSettings,
    [settingsData],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<DischargeSettings>({
    defaultValues: settings,
  });

  useEffect(() => {
    if (settingsData) {
      reset(settingsData);
    }
  }, [settingsData, reset]);

  const handleSave = (data: DischargeSettings) => {
    updateSettingsMutation.mutate({
      primaryColor: data.primaryColor ?? undefined,
      logoUrl: data.logoUrl ?? null,
      emailHeaderText: data.emailHeaderText ?? null,
      emailFooterText: data.emailFooterText ?? null,
    });
  };

  if (!settingsData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100/80 text-pink-600">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Email Branding
            </h1>
            <p className="text-sm text-slate-500">
              Customize the appearance of your discharge emails
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSave)}>
        <div className="space-y-8">
          <div className="rounded-lg border border-slate-200/60 bg-white p-6 shadow-sm">
            <BrandingSection
              register={register}
              watch={watch}
              setValue={setValue}
            />
          </div>

          {/* Save Button */}
          {isDirty && (
            <div className="sticky bottom-4 flex justify-center">
              <div className="rounded-full border border-slate-200/60 bg-white/80 px-4 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-amber-600">
                    Unsaved changes
                  </span>
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    size="sm"
                    className="rounded-full bg-teal-600 px-4 hover:bg-teal-700"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
