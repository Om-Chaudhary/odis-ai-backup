"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Palette, Settings as SettingsIcon } from "lucide-react";
import { DischargeSettingsForm } from "./discharge-settings-form";
import { api } from "~/trpc/client";
import type { DischargeSettings } from "~/types/dashboard";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent } from "~/components/ui/card";

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
            <TabsList className="grid w-full max-w-2xl grid-cols-3 lg:w-1/2">
              <TabsTrigger value="clinic" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span>Clinic Info</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" />
                <span>Email Branding</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span>System</span>
              </TabsTrigger>
            </TabsList>

            <div className="max-w-4xl">
              <TabsContent value="clinic" className="mt-0 space-y-4">
                <Card>
                  <CardContent className="pt-6">
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

              <TabsContent value="branding" className="mt-0 space-y-4">
                <Card>
                  <CardContent className="pt-6">
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

              <TabsContent value="system" className="mt-0 space-y-4">
                <Card>
                  <CardContent className="pt-6">
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
