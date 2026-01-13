"use client";

import { useState, useEffect } from "react";
import { TestTube, X, Settings2 } from "lucide-react";
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
import type { DischargeSettings } from "@odis-ai/shared/types";

interface TestModeBannerProps {
  settings: DischargeSettings;
  onUpdate: (settings: DischargeSettings) => void;
  isLoading?: boolean;
}

export function TestModeBanner({
  settings,
  onUpdate,
  isLoading = false,
}: TestModeBannerProps) {
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

  if (!settings.testModeEnabled) {
    return null;
  }

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
      <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-amber-500/50 bg-amber-50/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
            <TestTube className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-amber-900">Test Mode Active</h3>
            </div>
            <p className="text-sm text-amber-700">
              All discharges will be sent to:{" "}
              <span className="font-medium">
                {settings.testContactEmail ??
                  settings.testContactPhone ??
                  "test contact"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="border-amber-600/30 hover:bg-amber-100/50"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Edit Test Contact
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisable}
            className="text-amber-700 hover:bg-amber-100/50 hover:text-amber-900"
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

export function CompactTestModeBanner({
  settings,
  onUpdate,
  isLoading = false,
}: TestModeBannerProps) {
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

  if (!settings.testModeEnabled) {
    return null;
  }

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
      <div className="flex items-center justify-between gap-4 rounded-md border border-amber-500/30 bg-amber-50/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <TestTube className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-900">
            Test Mode Active
          </span>
          <span className="hidden text-xs text-amber-700 sm:inline-block">
            • Sends to:{" "}
            {settings.testContactEmail ??
              settings.testContactPhone ??
              "test contact"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-700 hover:bg-amber-100/50 hover:text-amber-900"
            onClick={() => setIsEditOpen(true)}
            title="Configure Test Contact"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-700 hover:bg-amber-100/50 hover:text-amber-900"
            onClick={handleDisable}
            title="Disable Test Mode"
          >
            <X className="h-3.5 w-3.5" />
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
