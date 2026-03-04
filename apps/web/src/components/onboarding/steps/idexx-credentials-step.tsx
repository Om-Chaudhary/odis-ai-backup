"use client";

import { Input, Label } from "@odis-ai/shared/ui";
import { Info } from "lucide-react";

interface IdexxCredentialsStepProps {
  username: string;
  password: string;
  companyId: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onCompanyIdChange: (value: string) => void;
  onSkip: () => void;
}

/**
 * Step 2 (IDEXX): IDEXX Neo Credentials
 *
 * Collects IDEXX Neo credentials during onboarding.
 * All fields are optional - user can skip.
 */
export function IdexxCredentialsStep({
  username,
  password,
  companyId,
  onUsernameChange,
  onPasswordChange,
  onCompanyIdChange,
  onSkip,
}: IdexxCredentialsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Connect Your IDEXX Neo Account
        </h2>
        <p className="mt-2 text-slate-600">
          Enter your IDEXX Neo credentials to sync patient data and
          appointments.
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
          <Label htmlFor="idexx-username">Username</Label>
          <Input
            id="idexx-username"
            type="text"
            placeholder="Enter your IDEXX Neo username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idexx-password">Password</Label>
          <Input
            id="idexx-password"
            type="password"
            placeholder="Enter your IDEXX Neo password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idexx-company-id">Company ID</Label>
          <Input
            id="idexx-company-id"
            type="text"
            placeholder="Enter your IDEXX Neo company ID"
            value={companyId}
            onChange={(e) => onCompanyIdChange(e.target.value)}
            autoComplete="organization"
          />
          <p className="text-sm text-slate-500">
            You can find your company ID in your IDEXX Neo account settings.
          </p>
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
