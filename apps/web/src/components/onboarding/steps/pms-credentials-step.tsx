"use client";

import { Input, Label } from "@odis-ai/shared/ui";
import { Info } from "lucide-react";
import { PMS_LABELS, type PmsType } from "~/app/api/onboarding/schemas";

interface PmsCredentialsStepProps {
  pmsType: PmsType;
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSkip: () => void;
}

/**
 * Step 2 (non-IDEXX): Generic PMS Credentials
 *
 * Collects username/password for non-IDEXX PMS systems.
 * All fields are skippable.
 */
export function PmsCredentialsStep({
  pmsType,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSkip,
}: PmsCredentialsStepProps) {
  const label = PMS_LABELS[pmsType];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Connect Your {label} Account
        </h2>
        <p className="mt-2 text-slate-600">
          Enter your {label} credentials to sync patient data and appointments.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Your credentials are secure</p>
            <p className="mt-1">
              We use industry-standard encryption to protect your sensitive
              information.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pms-username">Username</Label>
          <Input
            id="pms-username"
            type="text"
            placeholder={`Enter your ${label} username`}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pms-password">Password</Label>
          <Input
            id="pms-password"
            type="password"
            placeholder={`Enter your ${label} password`}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-slate-500 underline hover:text-slate-700"
      >
        Skip for now - I'll provide these later
      </button>
    </div>
  );
}
