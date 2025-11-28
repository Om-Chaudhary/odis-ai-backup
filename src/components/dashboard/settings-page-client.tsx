"use client";

import { useRouter } from "next/navigation";
import { DischargeSettingsForm } from "./discharge-settings-form";
import { api } from "~/trpc/client";
import type { DischargeSettings } from "~/types/dashboard";
import { toast } from "sonner";

export function SettingsPageClient() {
  const router = useRouter();

  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      void refetchSettings();
      router.back();
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
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure clinic details, vet information, and system behavior for
          discharge communications.
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <DischargeSettingsForm
          settings={settings}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={updateSettingsMutation.isPending}
        />
      </div>
    </div>
  );
}
