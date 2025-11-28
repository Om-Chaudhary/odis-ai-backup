"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { DischargeSettingsForm } from "./discharge-settings-form";
import type { DischargeSettings } from "~/types/dashboard";

interface DischargeSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DischargeSettings;
  onSave: (settings: DischargeSettings) => void;
  isLoading?: boolean;
}

export function DischargeSettingsPanel({
  open,
  onOpenChange,
  settings,
  onSave,
  isLoading = false,
}: DischargeSettingsPanelProps) {
  const handleSave = (newSettings: DischargeSettings) => {
    onSave(newSettings);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Discharge Settings</DialogTitle>
          <DialogDescription>
            Configure clinic details, vet information, and system behavior for
            discharge communications.
          </DialogDescription>
        </DialogHeader>

        <DischargeSettingsForm
          settings={settings}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
