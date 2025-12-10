"use client";

import { useQueryState } from "nuqs";
import { Button } from "@odis-ai/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/ui/dropdown-menu";
import { Calendar, Check } from "lucide-react";
import { subDays, format, endOfToday } from "date-fns";

type DateRange = "all" | "1d" | "3d" | "30d";

interface DatePreset {
  label: string;
  value: DateRange;
  description: string;
  getRange: () => { startDate: string; endDate: string } | null;
}

const presets: DatePreset[] = [
  {
    label: "All Time",
    value: "all",
    description: "View all data",
    getRange: () => null,
  },
  {
    label: "Last Day",
    value: "1d",
    description: "Past 24 hours",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 1);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Last 3 Days",
    value: "3d",
    description: "Past 3 days",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 3);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Last 30 Days",
    value: "30d",
    description: "Past month",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 30);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
];

export function DateRangePresets() {
  const [dateRange, setDateRange] = useQueryState("dateRange");
  const [, setStartDate] = useQueryState("startDate");
  const [, setEndDate] = useQueryState("endDate");

  const handleSelectPreset = (preset: DatePreset) => {
    const range = preset.getRange();
    void setDateRange(preset.value);

    if (range) {
      void setStartDate(range.startDate);
      void setEndDate(range.endDate);
    } else {
      void setStartDate(null);
      void setEndDate(null);
    }
  };

  const activePreset =
    presets.find((p) => p.value === dateRange) ?? presets[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="transition-smooth gap-2 hover:bg-slate-50"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">
            {activePreset.label}
          </span>
          <span className="sm:hidden">📅</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
          Date Range
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {presets.map((preset) => {
            const isActive = (dateRange ?? "all") === preset.value;
            return (
              <DropdownMenuItem
                key={preset.value}
                onClick={() => handleSelectPreset(preset)}
                className="cursor-pointer transition-colors"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span className="text-xs text-slate-500">
                      {preset.description ?? ""}
                    </span>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 flex-shrink-0 text-[#31aba3]" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
