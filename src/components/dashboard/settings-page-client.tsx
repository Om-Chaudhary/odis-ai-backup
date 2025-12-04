"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Palette,
  Settings as SettingsIcon,
  Send,
  PhoneIncoming,
} from "lucide-react";
import { DischargeSettingsForm } from "./discharge-settings-form";
import { api } from "~/trpc/client";
import type { DischargeSettings } from "~/types/dashboard";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function SettingsPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("clinic");

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
    // Email branding defaults
    primaryColor: "#2563EB",
    logoUrl: null,
    emailHeaderText: null,
    emailFooterText: null,
    // Outbound discharge scheduling defaults
    preferredEmailStartTime: "09:00",
    preferredEmailEndTime: "12:00",
    preferredCallStartTime: "14:00",
    preferredCallEndTime: "17:00",
    emailDelayDays: 1,
    callDelayDays: 2,
    maxCallRetries: 3,
    // Batch discharge preferences
    batchIncludeIdexxNotes: true,
    batchIncludeManualTranscriptions: true,
  };

  const handleSave = (newSettings: DischargeSettings) => {
    // Only send non-empty values to avoid validation errors
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
      // Email branding settings
      primaryColor: newSettings.primaryColor ?? undefined,
      logoUrl: newSettings.logoUrl ?? null,
      emailHeaderText: newSettings.emailHeaderText ?? null,
      emailFooterText: newSettings.emailFooterText ?? null,
      // Outbound discharge scheduling settings
      preferredEmailStartTime: newSettings.preferredEmailStartTime ?? null,
      preferredEmailEndTime: newSettings.preferredEmailEndTime ?? null,
      preferredCallStartTime: newSettings.preferredCallStartTime ?? null,
      preferredCallEndTime: newSettings.preferredCallEndTime ?? null,
      emailDelayDays: newSettings.emailDelayDays ?? null,
      callDelayDays: newSettings.callDelayDays ?? null,
      maxCallRetries: newSettings.maxCallRetries ?? null,
      // Batch discharge preferences
      batchIncludeIdexxNotes: newSettings.batchIncludeIdexxNotes,
      batchIncludeManualTranscriptions:
        newSettings.batchIncludeManualTranscriptions,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="flex h-20 items-center px-8">
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your clinic profile and discharge preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-8"
          >
            <TabsList className="grid w-full max-w-4xl grid-cols-5">
              <TabsTrigger value="clinic" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clinic Info</span>
              </TabsTrigger>
              <TabsTrigger value="outbound" className="gap-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Outbound</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="inbound" className="gap-2">
                <PhoneIncoming className="h-4 w-4" />
                <span className="hidden sm:inline">Inbound</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>

            <div className="max-w-4xl">
              <TabsContent value="clinic" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Clinic Information</CardTitle>
                    <CardDescription>
                      Configure your clinic details that appear in discharge
                      communications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DischargeSettingsForm
                      settings={settings}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      isLoading={updateSettingsMutation.isPending}
                      view="clinic"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outbound" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Outbound Discharge Settings</CardTitle>
                    <CardDescription>
                      Configure scheduling preferences for discharge emails and
                      follow-up calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DischargeSettingsForm
                      settings={settings}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      isLoading={updateSettingsMutation.isPending}
                      view="outbound"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branding" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Branding</CardTitle>
                    <CardDescription>
                      Customize the appearance of your discharge emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DischargeSettingsForm
                      settings={settings}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      isLoading={updateSettingsMutation.isPending}
                      view="branding"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inbound" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inbound Call Settings</CardTitle>
                    <CardDescription>
                      Configure how incoming calls are handled (coming soon)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DischargeSettingsForm
                      settings={settings}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      isLoading={updateSettingsMutation.isPending}
                      view="inbound"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>
                      Advanced settings for testing and system behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DischargeSettingsForm
                      settings={settings}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      isLoading={updateSettingsMutation.isPending}
                      view="system"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
