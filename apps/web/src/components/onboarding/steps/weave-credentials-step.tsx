"use client";

import { Input } from "@odis-ai/shared/ui";
import { Label } from "@odis-ai/shared/ui";
import { Info } from "lucide-react";

interface WeaveCredentialsStepProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  errors?: {
    username?: string;
    password?: string;
  };
}

/**
 * Step 2: Weave Credentials
 *
 * Collects Weave credentials during onboarding:
 * - Username
 * - Password
 */
export function WeaveCredentialsStep({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  errors,
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
          <Label htmlFor="weave-username">
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            id="weave-username"
            type="text"
            placeholder="Enter your Weave username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className={errors?.username ? "border-red-500" : ""}
            autoComplete="username"
          />
          {errors?.username && (
            <p className="text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weave-password">
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="weave-password"
            type="password"
            placeholder="Enter your Weave password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={errors?.password ? "border-red-500" : ""}
            autoComplete="current-password"
          />
          {errors?.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>
      </div>
    </div>
  );
}
