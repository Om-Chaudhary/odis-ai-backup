"use client";

import { Input, Label } from "@odis-ai/shared/ui";
import { Info } from "lucide-react";

interface WeaveCredentialsStepProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSkip: () => void;
}

/**
 * Step 4 (Weave): Weave Credentials
 *
 * Collects Weave credentials during onboarding.
 * All fields are optional - user can skip.
 */
export function WeaveCredentialsStep({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSkip,
}: WeaveCredentialsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Connect Your Weave Account
        </h2>
        <p className="mt-2 text-slate-600">
          Enter your Weave credentials to enable phone call features and client
          communication.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Almost done!</p>
            <p className="mt-1">
              This is the last step before your account is ready for review.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weave-username">Username</Label>
          <Input
            id="weave-username"
            type="text"
            placeholder="Enter your Weave username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weave-password">Password</Label>
          <Input
            id="weave-password"
            type="password"
            placeholder="Enter your Weave password"
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
