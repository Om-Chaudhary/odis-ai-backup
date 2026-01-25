"use client";

/**
 * Simple Schedule Picker Component
 *
 * Visual day/time selection interface
 */

import { useState } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { Plus, X } from "lucide-react";
import { DAY_LABELS, type DayOfWeek } from "./types";
import {
  generateTimeOptions,
  formatTimeForDisplay,
} from "./utils/cron-builder";
import { cn } from "@odis-ai/shared/util";

interface SimpleSchedulePickerProps {
  days: number[];
  times: string[];
  onToggleDay: (day: number) => void;
  onAddTime: (time: string) => void;
  onRemoveTime: (time: string) => void;
  disabled?: boolean;
}

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: DayOfWeek[] = [1, 2, 3, 4, 5];
const WEEKEND: DayOfWeek[] = [0, 6];

export function SimpleSchedulePicker({
  days,
  times,
  onToggleDay,
  onAddTime,
  onRemoveTime,
  disabled = false,
}: SimpleSchedulePickerProps) {
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeOptions = generateTimeOptions();
  const availableTimeOptions = timeOptions.filter((t) => !times.includes(t));

  const handleAddTime = () => {
    if (selectedTime && !times.includes(selectedTime)) {
      onAddTime(selectedTime);
      setSelectedTime("");
    }
  };

  const selectWeekdays = () => {
    WEEKDAYS.forEach((day) => {
      if (!days.includes(day)) {
        onToggleDay(day);
      }
    });
  };

  const selectWeekend = () => {
    WEEKEND.forEach((day) => {
      if (!days.includes(day)) {
        onToggleDay(day);
      }
    });
  };

  const selectAllDays = () => {
    ALL_DAYS.forEach((day) => {
      if (!days.includes(day)) {
        onToggleDay(day);
      }
    });
  };

  const clearAllDays = () => {
    days.forEach((day) => {
      onToggleDay(day);
    });
  };

  return (
    <div className="space-y-4">
      {/* Day Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">
            Days of Week
          </Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectWeekdays}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              Weekdays
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectWeekend}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              Weekend
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllDays}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllDays}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {ALL_DAYS.map((day) => {
            const isSelected = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleDay(day)}
                disabled={disabled}
                className={cn(
                  "rounded-lg border-2 px-2 py-2 text-xs font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                {DAY_LABELS[day]}
              </button>
            );
          })}
        </div>

        {days.length === 0 && (
          <p className="text-xs text-amber-600">
            Please select at least one day
          </p>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Sync Times</Label>

        {/* Existing times */}
        {times.length > 0 ? (
          <div className="space-y-2">
            {times.map((time) => (
              <div
                key={time}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-900">
                  {formatTimeForDisplay(time)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveTime(time)}
                  disabled={disabled || times.length === 1}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove time</span>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-amber-600">
            Please add at least one sync time
          </p>
        )}

        {/* Add time */}
        <div className="flex gap-2">
          <Select
            value={selectedTime}
            onValueChange={setSelectedTime}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              {availableTimeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTimeForDisplay(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleAddTime}
            disabled={disabled || !selectedTime}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
