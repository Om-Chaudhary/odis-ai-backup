"use client";

import { Input } from "@odis-ai/shared/ui";
import { Label } from "@odis-ai/shared/ui";
import { Info } from "lucide-react";

interface IdexxCredentialsStepProps {
  username: string;
  password: string;
  companyId: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onCompanyIdChange: (value: string) => void;
  errors?: {
    username?: string;
    password?: string;
    companyId?: string;
  };
}

/**
 * Step 1: IDEXX Neo Credentials
 *
 * Collects IDEXX Neo credentials during onboarding:
 * - Username
 * - Password
 * - Company ID
 */
export function IdexxCredentialsStep({
  username,
  password,
  companyId,
  onUsernameChange,
  onPasswordChange,
  onCompanyIdChange,
  errors,
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
          <Label htmlFor="idexx-username">
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            id="idexx-username"
            type="text"
            placeholder="Enter your IDEXX Neo username"
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
          <Label htmlFor="idexx-password">
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="idexx-password"
            type="password"
            placeholder="Enter your IDEXX Neo password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={errors?.password ? "border-red-500" : ""}
            autoComplete="current-password"
          />
          {errors?.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="idexx-company-id">
            Company ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="idexx-company-id"
            type="text"
            placeholder="Enter your IDEXX Neo company ID"
            value={companyId}
            onChange={(e) => onCompanyIdChange(e.target.value)}
            className={errors?.companyId ? "border-red-500" : ""}
            autoComplete="organization"
          />
          {errors?.companyId && (
            <p className="text-sm text-red-600">{errors.companyId}</p>
          )}
          <p className="text-sm text-slate-500">
            You can find your company ID in your IDEXX Neo account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
