"use client";

import { useState, useEffect } from "react";
import { SidebarTrigger } from "@odis-ai/shared/ui/sidebar";
import { Separator } from "@odis-ai/shared/ui/separator";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { api } from "~/trpc/client";
import { TestTube, Settings2, X } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { toast } from "sonner";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { cn } from "@odis-ai/shared/util";

export function DashboardHeader() {
  const { data: settings, refetch } = api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update settings");
    },
  });

  const handleUpdate = (newSettings: DischargeSettings) => {
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

  const isTestMode = settings?.testModeEnabled ?? false;

  return (
    <>
      <header
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm transition-colors duration-300",
          isTestMode && "border-amber-500/30 bg-amber-50/50",
        )}
      >
        <div className="flex flex-1 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DashboardBreadcrumb />
          </div>

          {isTestMode && settings && (
            <TestModeControls
              settings={settings}
              onUpdate={handleUpdate}
              isLoading={updateSettingsMutation.isPending}
            />
          )}
        </div>
      </header>
    </>
  );
}

interface TestModeControlsProps {
  settings: DischargeSettings;
  onUpdate: (settings: DischargeSettings) => void;
  isLoading?: boolean;
}

function TestModeControls({
  settings,
  onUpdate,
  isLoading = false,
}: TestModeControlsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [testContactName, setTestContactName] = useState(
    settings.testContactName ?? "",
  );
  const [testContactPhone, setTestContactPhone] = useState(
    settings.testContactPhone ?? "",
  );
  const [testContactEmail, setTestContactEmail] = useState(
    settings.testContactEmail ?? "",
  );

  // Sync local state when settings change
  useEffect(() => {
    setTestContactName(settings.testContactName ?? "");
    setTestContactPhone(settings.testContactPhone ?? "");
    setTestContactEmail(settings.testContactEmail ?? "");
  }, [
    settings.testContactName,
    settings.testContactPhone,
    settings.testContactEmail,
  ]);

  const handleSave = () => {
    onUpdate({
      ...settings,
      testContactName,
      testContactPhone,
      testContactEmail,
    });
    setIsEditOpen(false);
  };

  const handleDisable = () => {
    onUpdate({
      ...settings,
      testModeEnabled: false,
    });
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-amber-900">
          <TestTube className="h-3.5 w-3.5 text-amber-600" />
          <span className="font-medium">Test Mode Active</span>
          <span className="hidden text-amber-700 sm:inline-block">
            • Sends to:{" "}
            <span className="ml-1 font-medium">
              {settings.testContactEmail ??
                settings.testContactPhone ??
                "test contact"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-amber-700 hover:bg-amber-100/50 hover:text-amber-900"
            onClick={() => setIsEditOpen(true)}
            title="Configure Test Contact"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-amber-700 hover:bg-amber-100/50 hover:text-amber-900"
            onClick={handleDisable}
            title="Disable Test Mode"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-amber-600" />
              Test Mode Configuration
            </DialogTitle>
            <DialogDescription>
              Configure test contact information. All discharge communications
              will be sent to these details instead of actual pet owners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-name">Test Contact Name</Label>
              <Input
                id="test-name"
                placeholder="e.g. John Doe"
                value={testContactName}
                onChange={(e) => setTestContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-phone">Test Phone Number</Label>
              <Input
                id="test-phone"
                placeholder="e.g. +1 (555) 123-4567"
                value={testContactPhone}
                onChange={(e) => setTestContactPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="e.g. test@example.com"
                value={testContactEmail}
                onChange={(e) => setTestContactEmail(e.target.value)}
              />
            </div>

            <div className="rounded-md bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Test mode is currently enabled. Disable
                it from this banner to send discharges to actual pet owners.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
