"use client";

import { PhoneIncoming, Loader2, AlertCircle } from "lucide-react";
import { api } from "~/trpc/client";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { VapiConfigSection } from "~/components/dashboard/settings/discharge-settings/sections";

export default function InboundSettingsPage() {
  // Check system-level super admin role from database
  const { data: userRoleData } = api.dashboard.getCurrentUserRole.useQuery();
  const isAdmin = userRoleData?.role === "admin";

  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

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

  const { register } = useForm<DischargeSettings>({
    defaultValues: settings,
  });

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100/80 text-green-600">
            <PhoneIncoming className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Inbound Calls
            </h1>
            <p className="text-sm text-slate-500">
              VAPI configuration for handling incoming calls
            </p>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded-lg border border-slate-200/60 bg-white p-6 shadow-sm">
          <VapiConfigSection register={register} />
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-medium text-amber-900">
                Admin Access Required
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                VAPI configuration settings are only accessible to
                administrators. Please contact your clinic admin if you need to
                make changes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
