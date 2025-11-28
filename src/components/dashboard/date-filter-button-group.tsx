"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useQueryState } from "nuqs";
import type { DateRangePreset } from "~/lib/utils/date-ranges";

interface DateFilterButtonGroupProps {
  value?: DateRangePreset;
  onChange?: (preset: DateRangePreset) => void;
  className?: string;
}

export function DateFilterButtonGroup({
  value: controlledValue,
  onChange: controlledOnChange,
  className,
}: DateFilterButtonGroupProps) {
  const [urlValue, setUrlValue] = useQueryState("dateRange", {
    defaultValue: "all",
    parse: (value) => (value as DateRangePreset) || "all",
    serialize: (value) => value,
  });

  const value = controlledValue ?? urlValue;
  const handleChange = controlledOnChange ?? setUrlValue;

  const presets: Array<{ value: DateRangePreset; label: string }> = [
    { value: "all", label: "All Time" },
    { value: "1d", label: "Last Day" },
    { value: "3d", label: "3D" },
    { value: "30d", label: "30D" },
  ];

  return (
    <div
      className={cn(
        "transition-smooth inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1 backdrop-blur-sm",
        className,
      )}
    >
      {presets.map((preset) => {
        const isActive = value === preset.value;
        return (
          <Button
            key={preset.value}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleChange(preset.value)}
            className={cn(
              "transition-smooth hover:scale-[1.01] focus:ring-2 focus:ring-[#31aba3] focus:ring-offset-2",
              isActive &&
                "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
            )}
            aria-pressed={isActive}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
