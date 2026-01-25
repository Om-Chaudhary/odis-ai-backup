"use client";

/**
 * Advanced Schedule Input Component
 *
 * Raw cron expression input with validation
 */

import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { AlertCircle } from "lucide-react";
import { validateCron } from "./utils/schedule-validator";

interface AdvancedScheduleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AdvancedScheduleInput({
  value,
  onChange,
  disabled = false,
}: AdvancedScheduleInputProps) {
  const validation = validateCron(value);

  return (
    <div className="space-y-2">
      <Label htmlFor="cron-input" className="text-sm font-medium text-slate-700">
        Cron Expression
      </Label>

      <Input
        id="cron-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="0 9 * * 1-5"
        className={`font-mono text-sm ${!validation.valid ? "border-red-500 focus:ring-red-500" : ""}`}
      />

      {/* Validation errors */}
      {!validation.valid && validation.errors.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div className="flex-1 space-y-1">
            {validation.errors.map((error, i) => (
              <p key={i} className="text-xs text-red-700">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="space-y-1 text-xs text-slate-500">
        <p className="font-medium">Cron Format:</p>
        <p className="font-mono">minute hour day-of-month month day-of-week</p>
        <div className="mt-2 space-y-1">
          <p className="font-medium">Examples:</p>
          <p className="font-mono">0 9 * * * = Every day at 9 AM</p>
          <p className="font-mono">0 9,14,17 * * 1-5 = 9 AM, 2 PM, 5 PM on weekdays</p>
          <p className="font-mono">0 */4 * * * = Every 4 hours</p>
        </div>
      </div>
    </div>
  );
}
