"use client";

/**
 * Schedule Mode Toggle Component
 *
 * Switch between Simple and Advanced mode
 */

import { Button } from "@odis-ai/shared/ui/button";
import { Calendar, Code } from "lucide-react";
import type { ScheduleMode } from "./types";

interface ScheduleModeToggleProps {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  disabled?: boolean;
}

export function ScheduleModeToggle({
  mode,
  onModeChange,
  disabled = false,
}: ScheduleModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={mode === "simple" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("simple")}
        disabled={disabled}
        className="gap-1"
      >
        <Calendar className="h-3.5 w-3.5" />
        Simple
      </Button>
      <Button
        type="button"
        variant={mode === "advanced" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("advanced")}
        disabled={disabled}
        className="gap-1"
      >
        <Code className="h-3.5 w-3.5" />
        Advanced
      </Button>
    </div>
  );
}
