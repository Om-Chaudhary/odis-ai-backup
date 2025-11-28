"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useQueryState } from "nuqs";
import {
  type DateRangePreset,
  isValidDateRangePreset,
} from "~/lib/utils/date-ranges";

/**
 * DateFilterButtonGroup - A reusable button group for date range selection
 *
 * Supports both controlled and uncontrolled modes:
 * - **Uncontrolled** (default): Automatically syncs with URL query parameter "dateRange"
 * - **Controlled**: Use `value` and `onChange` props to manage state externally
 *
 * @example
 * // Uncontrolled (URL-synced)
 * <DateFilterButtonGroup />
 *
 * @example
 * // Controlled
 * <DateFilterButtonGroup
 *   value={selectedRange}
 *   onChange={setSelectedRange}
 * />
 */
interface DateFilterButtonGroupProps {
  /** Controlled value - when provided, component is controlled */
  value?: DateRangePreset;
  /** Callback when selection changes - when provided, component is controlled */
  onChange?: (preset: DateRangePreset) => void;
  /** Additional CSS classes */
  className?: string;
}

export function DateFilterButtonGroup({
  value: controlledValue,
  onChange: controlledOnChange,
  className,
}: DateFilterButtonGroupProps) {
  const [urlValue, setUrlValue] = useQueryState("dateRange", {
    defaultValue: "all",
    parse: (value) => {
      // Validate the value at runtime to prevent invalid states
      if (isValidDateRangePreset(value)) {
        return value;
      }
      // Invalid value - default to "all"
      console.warn(
        `Invalid dateRange query parameter: ${value}. Defaulting to "all".`,
      );
      return "all";
    },
    serialize: (value) => value,
  });

  const value = controlledValue ?? urlValue;
  const handleChange = controlledOnChange ?? setUrlValue;

  const presets: Array<{ value: DateRangePreset; label: string }> = [
    { value: "all", label: "All Time" },
    { value: "1d", label: "Day" },
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
