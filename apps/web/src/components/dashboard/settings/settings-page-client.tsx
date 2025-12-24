"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Palette,
  Settings as SettingsIcon,
  Send,
  PhoneIncoming,
  Loader2,
} from "lucide-react";
import { DischargeSettingsForm } from "./discharge-settings";
import { api } from "~/trpc/client";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { toast } from "sonner";
import { cn } from "@odis-ai/shared/util";
import {
  PageContainer,
  PageHeader,
  PageContent,
} from "../layout/page-container";

const TABS = [
  {
    id: "clinic",
    label: "Clinic Info",
    icon: Building2,
    description: "Basic clinic details and contact information",
  },
  {
    id: "outbound",
    label: "Outbound",
    icon: Send,
    description: "Discharge scheduling and follow-up preferences",
  },
  {
    id: "branding",
    label: "Branding",
    icon: Palette,
    description: "Email appearance and custom messaging",
  },
  {
    id: "inbound",
    label: "Inbound",
    icon: PhoneIncoming,
    description: "VAPI configuration for incoming calls",
  },
  {
    id: "system",
    label: "System",
    icon: SettingsIcon,
    description: "Advanced settings and test mode",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("clinic");

  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      void refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const settings: DischargeSettings = settingsData ?? {
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

  const handleSave = (newSettings: DischargeSettings) => {
    updateSettingsMutation.mutate({
      clinicName: newSettings.clinicName || undefined,
      clinicPhone: newSettings.clinicPhone || undefined,
      clinicEmail: newSettings.clinicEmail || undefined,
      emergencyPhone: newSettings.emergencyPhone || undefined,
      testModeEnabled: newSettings.testModeEnabled,
      testContactName: newSettings.testContactName ?? undefined,
      testContactEmail: newSettings.testContactEmail ?? undefined,
      testContactPhone: newSettings.testContactPhone ?? undefined,
      voicemailDetectionEnabled: newSettings.voicemailDetectionEnabled,
      defaultScheduleDelayMinutes:
        newSettings.defaultScheduleDelayMinutes ?? null,
      primaryColor: newSettings.primaryColor ?? undefined,
      logoUrl: newSettings.logoUrl ?? null,
      emailHeaderText: newSettings.emailHeaderText ?? null,
      emailFooterText: newSettings.emailFooterText ?? null,
      preferredEmailStartTime: newSettings.preferredEmailStartTime ?? null,
      preferredEmailEndTime: newSettings.preferredEmailEndTime ?? null,
      preferredCallStartTime: newSettings.preferredCallStartTime ?? null,
      preferredCallEndTime: newSettings.preferredCallEndTime ?? null,
      emailDelayDays: newSettings.emailDelayDays ?? null,
      callDelayDays: newSettings.callDelayDays ?? null,
      maxCallRetries: newSettings.maxCallRetries ?? null,
      batchIncludeIdexxNotes: newSettings.batchIncludeIdexxNotes,
      batchIncludeManualTranscriptions:
        newSettings.batchIncludeManualTranscriptions,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  const activeTabData = TABS.find((tab) => tab.id === activeTab);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader className="flex-col items-start gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">
            Manage your clinic profile and discharge preferences
          </p>
        </div>
        {updateSettingsMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-teal-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </PageHeader>

      {/* Tab Navigation */}
      <div className="shrink-0 border-b border-teal-100/50 bg-white/30 backdrop-blur-sm">
        <div className="flex overflow-x-auto px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  "hover:text-teal-700",
                  isActive
                    ? "text-teal-700"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-teal-600"
                      : "text-slate-400 group-hover:text-slate-500",
                  )}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <PageContent className="bg-gradient-to-b from-white/20 to-teal-50/10">
        <div className="mx-auto max-w-3xl p-6">
          {/* Tab Description Card */}
          <div className="mb-6 rounded-xl border border-teal-100/60 bg-gradient-to-br from-white/80 via-teal-50/30 to-white/80 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {activeTabData && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                    <activeTabData.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      {activeTabData.label}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {activeTabData.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="rounded-xl border border-teal-100/60 bg-gradient-to-br from-white/90 via-white/80 to-teal-50/40 p-6 shadow-lg shadow-teal-500/5 backdrop-blur-md">
            <DischargeSettingsForm
              settings={settings}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={updateSettingsMutation.isPending}
              view={activeTab}
            />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
