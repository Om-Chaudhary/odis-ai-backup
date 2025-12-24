"use client";

import { Button } from "@odis-ai/shared/ui/button";
import type { DashboardSection } from "./dashboard-customization";

export type DashboardPreset = {
  name: string;
  sections: Set<DashboardSection>;
};

export const DASHBOARD_PRESETS: Record<string, DashboardPreset> = {
  comprehensive: {
    name: "Comprehensive",
    sections: new Set([
      "stats",
      "activity",
      "chart",
      "upcoming",
      "performance",
      "actions",
    ] as DashboardSection[]),
  },
  analytics: {
    name: "Analytics",
    sections: new Set([
      "stats",
      "chart",
      "performance",
      "actions",
    ] as DashboardSection[]),
  },
  activity: {
    name: "Activity",
    sections: new Set([
      "stats",
      "activity",
      "upcoming",
      "actions",
    ] as DashboardSection[]),
  },
  minimal: {
    name: "Minimal",
    sections: new Set(["stats", "actions"] as DashboardSection[]),
  },
};

interface DashboardPresetsProps {
  currentSections: Set<DashboardSection>;
  onApplyPreset: (sections: Set<DashboardSection>) => void;
}

export function DashboardPresets({
  currentSections,
  onApplyPreset,
}: DashboardPresetsProps) {
  const getCurrentPreset = () => {
    for (const [, preset] of Object.entries(DASHBOARD_PRESETS)) {
      if (
        preset.sections.size === currentSections.size &&
        Array.from(preset.sections).every((s) => currentSections.has(s))
      ) {
        return preset.name;
      }
    }
    return "Custom";
  };

  const currentPreset = getCurrentPreset();

  return (
    <div className="flex gap-2">
      {Object.entries(DASHBOARD_PRESETS).map(([, preset]) => (
        <Button
          key={preset.name}
          variant={currentPreset === preset.name ? "default" : "outline"}
          size="sm"
          onClick={() => onApplyPreset(preset.sections)}
          className={
            currentPreset === preset.name
              ? "bg-[#31aba3] text-white hover:bg-[#31aba3]/90"
              : "text-xs"
          }
        >
          {preset.name}
        </Button>
      ))}
    </div>
  );
}
