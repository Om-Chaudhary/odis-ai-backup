/**
 * DateRangePicker Component
 *
 * A reusable date range picker for schedule sync operations.
 * Uses Tailwind CSS for styling.
 */

import { getTodayLocalDate } from "@odis-ai/extension/shared";
import { Input, Label, Button } from "@odis-ai/shared/ui/extension";
import { useState, useCallback } from "react";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateRangePickerProps {
  /** Title for the picker */
  title: string;
  /** Description text */
  description: string;
  /** Action button label */
  actionLabel: string;
  /** Action button variant */
  actionVariant?: "default" | "secondary";
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Callback when action is triggered */
  onAction: (range: DateRange) => void;
  /** Callback when picker is closed */
  onClose: () => void;
}

export const DateRangePicker = ({
  title,
  description,
  actionLabel,
  actionVariant = "default",
  isLoading = false,
  onAction,
  onClose,
}: DateRangePickerProps) => {
  const [startDate, setStartDate] = useState(() => getTodayLocalDate());
  const [endDate, setEndDate] = useState(() => getTodayLocalDate());
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(() => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");

    if (start > end) {
      setError("Start date must be before end date");
      return;
    }

    setError(null);
    onAction({ startDate: start, endDate: end });
  }, [startDate, endDate, onAction]);

  return (
    <div className="border-border bg-card absolute right-0 bottom-[70px] z-50 min-w-[320px] rounded-xl border p-5 shadow-xl">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-foreground mb-1 text-base font-semibold">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Date Inputs */}
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="sync-start-date">Start Date</Label>
          <Input
            id="sync-start-date"
            type="date"
            value={startDate}
            disabled={isLoading}
            onChange={(e) => {
              setStartDate(e.target.value);
              setError(null);
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sync-end-date">End Date</Label>
          <Input
            id="sync-end-date"
            type="date"
            value={endDate}
            disabled={isLoading}
            onChange={(e) => {
              setEndDate(e.target.value);
              setError(null);
            }}
            className="w-full"
          />
        </div>

        {/* Error Message */}
        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Action Buttons */}
        <div className="mt-2 flex gap-2">
          <Button
            variant={actionVariant}
            onClick={handleAction}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Processing..." : actionLabel}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
