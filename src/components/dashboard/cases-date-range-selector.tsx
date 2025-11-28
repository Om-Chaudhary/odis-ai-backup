"use client";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import type { DateRangePreset } from "~/lib/utils/date-ranges";
import { getDateRangeFromPreset } from "~/lib/utils/date-ranges";

const DATE_RANGE_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "all", label: "All Time" },
  { value: "1d", label: "Last Day" },
  { value: "3d", label: "3D" },
  { value: "30d", label: "30D" },
];

interface CasesDateRangeSelectorProps {
  selectedPreset: DateRangePreset | null;
  onPresetSelect: (preset: DateRangePreset) => void;
  className?: string;
}

export function CasesDateRangeSelector({
  selectedPreset,
  onPresetSelect,
  className,
}: CasesDateRangeSelectorProps) {
  const selectedOption = selectedPreset
    ? DATE_RANGE_OPTIONS.find((opt) => opt.value === selectedPreset)
    : null;

  const handleSelect = (preset: DateRangePreset) => {
    onPresetSelect(preset);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            className,
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>{selectedOption?.label ?? "Date Range"}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {DATE_RANGE_OPTIONS.map((option) => {
            const isSelected = selectedPreset === option.value;
            return (
              <Button
                key={option.value}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full justify-start text-left",
                  isSelected && "bg-[#31aba3] text-white hover:bg-[#2a9a92]",
                )}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Helper function to apply a date range preset to a date navigator
 * Returns the date that should be set based on the preset
 */
export function getDateFromPreset(preset: DateRangePreset): Date | null {
  if (preset === "all") {
    return null; // null means "all time"
  }

  const { endDate } = getDateRangeFromPreset(preset);
  return endDate; // Return the end date (most recent date) of the range
}
