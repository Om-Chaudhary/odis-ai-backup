"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, X, Clock, Send, Loader2, Save } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { BusinessHoursForm } from "~/components/dashboard/settings/hours/business-hours-form";
import { BlockedPeriodsList } from "~/components/dashboard/settings/hours/blocked-periods-list";
import { BlockedPeriodInlineForm } from "~/components/dashboard/settings/hours/blocked-period-inline-form";
import {
  EmailSchedulingSection,
  CallSchedulingSection,
} from "~/components/dashboard/settings/discharge-settings/sections";

interface ClinicSchedulingTabProps {
  clinicId: string;
  clinicSlug: string;
}

export function ClinicSchedulingTab({
  clinicId,
  clinicSlug,
}: ClinicSchedulingTabProps) {
  const [showAddSegmentForm, setShowAddSegmentForm] = useState(false);

  // Fetch schedule config for business hours
  const { data: scheduleConfig, isLoading: isLoadingSchedule } =
    api.settings.schedule.getScheduleConfig.useQuery({
      clinicSlug,
      clinicId,
    });

  // Fetch blocked periods
  const { data: blockedPeriods = [], isLoading: isLoadingPeriods } =
    api.settings.schedule.getBlockedPeriods.useQuery({ clinicSlug });

  // Fetch discharge settings for email/call timing
  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Discharge timing settings saved");
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

  const settings = settingsData ?? defaultSettings;

  const {
    handleSubmit: handleDischargeSubmit,
    reset: resetDischargeForm,
    watch,
    setValue,
    formState: { isDirty: isDischargeFormDirty },
  } = useForm<DischargeSettings>({
    defaultValues: settings,
  });

  useEffect(() => {
    if (settingsData) {
      resetDischargeForm(settingsData);
    }
  }, [settingsData, resetDischargeForm]);

  const handleSaveDischargeSettings = (data: DischargeSettings) => {
    updateSettingsMutation.mutate({
      preferredEmailStartTime: data.preferredEmailStartTime ?? null,
      preferredEmailEndTime: data.preferredEmailEndTime ?? null,
      preferredCallStartTime: data.preferredCallStartTime ?? null,
      preferredCallEndTime: data.preferredCallEndTime ?? null,
      emailDelayDays: data.emailDelayDays ?? null,
      callDelayDays: data.callDelayDays ?? null,
      maxCallRetries: data.maxCallRetries ?? null,
    });
  };

  const isLoading = isLoadingSchedule || isLoadingPeriods;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Hours Section */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100/80 text-teal-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Business Hours
            </h3>
            <p className="text-sm text-slate-500">
              Set your regular operating hours and days
            </p>
          </div>
        </div>
        <BusinessHoursForm
          initialData={scheduleConfig}
          clinicSlug={clinicSlug}
          clinicId={clinicId}
        />
      </Card>

      {/* Time Segments (Blocked Periods) Section */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/80 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Time Segments
              </h3>
              <p className="text-sm text-slate-500">
                Manage blocked periods like lunch breaks and staff meetings
              </p>
            </div>
          </div>
          {!showAddSegmentForm && (
            <Button
              onClick={() => setShowAddSegmentForm(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Segment
            </Button>
          )}
        </div>

        {/* Inline Add Form */}
        {showAddSegmentForm && (
          <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Add Time Segment</h4>
              <Button
                onClick={() => setShowAddSegmentForm(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <BlockedPeriodInlineForm
              clinicSlug={clinicSlug}
              onSuccess={() => setShowAddSegmentForm(false)}
              onCancel={() => setShowAddSegmentForm(false)}
            />
          </div>
        )}

        <BlockedPeriodsList periods={blockedPeriods} clinicSlug={clinicSlug} />
      </Card>

      {/* Discharge Timing Section */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Discharge Timing
            </h3>
            <p className="text-sm text-slate-500">
              Configure when discharge emails and follow-up calls are sent
            </p>
          </div>
        </div>

        <form onSubmit={handleDischargeSubmit(handleSaveDischargeSettings)}>
          <div className="space-y-6">
            {/* Email Scheduling */}
            <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 p-4">
              <EmailSchedulingSection watch={watch} setValue={setValue} />
            </div>

            {/* Call Scheduling */}
            <div className="rounded-lg border border-slate-200/60 bg-slate-50/30 p-4">
              <CallSchedulingSection watch={watch} setValue={setValue} />
            </div>

            {/* Save Button */}
            {isDischargeFormDirty && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-4 w-4" />
                  )}
                  Save Timing Settings
                </Button>
              </div>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
