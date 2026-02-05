"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PhoneIncoming, Loader2, Save, AlertCircle } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { VapiConfigSection } from "~/components/dashboard/settings/discharge-settings/sections";

interface ClinicVapiTabProps {
  clinicId: string;
}

export function ClinicVapiTab({ clinicId: _clinicId }: ClinicVapiTabProps) {
  // Check system-level super admin role from database
  const { data: userRoleData, isLoading: isLoadingRole } =
    api.dashboard.getCurrentUserRole.useQuery();
  const isAdmin = userRoleData?.role === "admin";

  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("VAPI configuration saved");
      void refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save VAPI configuration");
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
      inboundPhoneNumberId: data.inboundPhoneNumberId ?? null,
      inboundAssistantId: data.inboundAssistantId ?? null,
      outboundPhoneNumberId: data.outboundPhoneNumberId ?? null,
      outboundAssistantId: data.outboundAssistantId ?? null,
    });
  };

  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100/80 text-green-600">
            <PhoneIncoming className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              VAPI Configuration
            </h3>
            <p className="text-sm text-slate-500">
              Configure phone numbers and assistants for inbound and outbound
              calls
            </p>
          </div>
        </div>

        {isAdmin ? (
          <form onSubmit={handleSubmit(handleSave)}>
            <VapiConfigSection register={register} />

            {/* Save Button */}
            {isDirty && (
              <div className="mt-6 flex justify-end">
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
                  Save VAPI Settings
                </Button>
              </div>
            )}
          </form>
        ) : (
          <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-900">
                  Admin Access Required
                </h4>
                <p className="mt-1 text-sm text-amber-700">
                  VAPI configuration settings are only accessible to
                  administrators. Please contact your clinic admin if you need
                  to make changes.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
