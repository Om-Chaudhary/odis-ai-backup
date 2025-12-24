import { Button } from "@odis-ai/shared/ui/button";
import { Timer, Calendar } from "lucide-react";
import type { ScheduleMode } from "../types";

interface ScheduleModeToggleProps {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
}

export function ScheduleModeToggle({
  mode,
  onModeChange,
}: ScheduleModeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={mode === "minutes" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("minutes")}
        className="flex-1 gap-2"
      >
        <Timer className="h-4 w-4" />
        Quick Send
      </Button>
      <Button
        type="button"
        variant={mode === "datetime" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("datetime")}
        className="flex-1 gap-2"
      >
        <Calendar className="h-4 w-4" />
        Schedule
      </Button>
    </div>
  );
}
