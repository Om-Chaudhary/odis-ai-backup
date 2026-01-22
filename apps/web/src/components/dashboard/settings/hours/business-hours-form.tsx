"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, Copy, RotateCcw } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Button } from "@odis-ai/shared/ui/button";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import type { DailyHours } from "@odis-ai/shared/types";

interface BusinessHoursFormData {
  daily_hours: DailyHours;
  timezone: string;
}

interface BusinessHoursFormProps {
  initialData?: {
    daily_hours?: DailyHours;
    timezone?: string;
  } | null;
  clinicSlug?: string;
  clinicId?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
];

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const DEFAULT_DAILY_HOURS: DailyHours = {
  "0": { enabled: false },
  "1": { enabled: true, open: "09:00", close: "17:00" },
  "2": { enabled: true, open: "09:00", close: "17:00" },
  "3": { enabled: true, open: "09:00", close: "17:00" },
  "4": { enabled: true, open: "09:00", close: "17:00" },
  "5": { enabled: true, open: "09:00", close: "17:00" },
  "6": { enabled: false },
};

/**
 * Convert 12-hour time to 24-hour format (HH:MM)
 */
function convertTo24Hour(time12: string, period: "AM" | "PM"): string {
  const [hoursStr, minutesStr] = time12.split(":");
  const hours = Number(hoursStr ?? 0);
  const minutes = Number(minutesStr ?? 0);
  let hours24 = hours;

  if (period === "PM" && hours !== 12) {
    hours24 = hours + 12;
  } else if (period === "AM" && hours === 12) {
    hours24 = 0;
  }

  return `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Time input component with AM/PM selector
 */
function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr ?? 0);
  const minutes = Number(minutesStr ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(hours >= 12 ? "PM" : "AM");
  const hours12 = (hours % 12 || 12).toString().padStart(2, "0");
  const minutesFormatted = minutes.toString().padStart(2, "0");

  const handleTimeChange = (newTime: string) => {
    const updated24 = convertTo24Hour(newTime, period);
    onChange(updated24);
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod);
    const updated24 = convertTo24Hour(`${hours12}:${minutesFormatted}`, newPeriod);
    onChange(updated24);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={`${hours12}:${minutesFormatted}`}
        onChange={(e) => handleTimeChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-[110px] rounded-md border border-stone-200 bg-white px-3 font-mono text-sm text-stone-900 transition-colors focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400"
      />
      <div className="flex rounded-md border border-stone-200 bg-white">
        <button
          type="button"
          onClick={() => handlePeriodChange("AM")}
          disabled={disabled}
          className={`px-2.5 py-1.5 text-xs font-medium transition-all ${period === "AM"
            ? "bg-emerald-50 text-emerald-700"
            : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
            } rounded-l-md disabled:cursor-not-allowed disabled:opacity-50`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => handlePeriodChange("PM")}
          disabled={disabled}
          className={`px-2.5 py-1.5 text-xs font-medium transition-all ${period === "PM"
            ? "bg-emerald-50 text-emerald-700"
            : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
            } rounded-r-md disabled:cursor-not-allowed disabled:opacity-50`}
        >
          PM
        </button>
      </div>
    </div>
  );
}

export function BusinessHoursForm({
  initialData,
  clinicSlug,
  clinicId,
}: BusinessHoursFormProps) {
  const utils = api.useUtils();

  const defaultValues: BusinessHoursFormData = {
    daily_hours: initialData?.daily_hours ?? DEFAULT_DAILY_HOURS,
    timezone: initialData?.timezone ?? "America/Los_Angeles",
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<BusinessHoursFormData>({
    defaultValues,
  });

  const dailyHours = watch("daily_hours");
  const selectedTimezone = watch("timezone");

  // Reset form when initial data changes
  useEffect(() => {
    if (initialData) {
      reset({
        daily_hours: initialData.daily_hours ?? DEFAULT_DAILY_HOURS,
        timezone: initialData.timezone ?? "America/Los_Angeles",
      });
    }
  }, [initialData, reset]);

  const updateMutation = api.settings.schedule.updateScheduleConfig.useMutation(
    {
      onSuccess: async (savedData) => {
        // Validate saved data
        if (!savedData?.daily_hours || !savedData?.timezone) {
          toast.error("Save succeeded but data format unexpected");
          return;
        }

        toast.success("Business hours updated successfully");

        // Invalidate cache with explicit clinic context
        await utils.settings.schedule.getScheduleConfig.invalidate({
          clinicSlug,
          clinicId,
        });

        // Reset form with saved data (defensive - don't wait for cache)
        reset({
          daily_hours: savedData.daily_hours,
          timezone: savedData.timezone,
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update business hours");
      },
    },
  );

  const onSubmit = (data: BusinessHoursFormData) => {
    updateMutation.mutate({ ...data, clinicSlug, clinicId });
  };

  const toggleDay = (dayValue: number) => {
    const dayKey = String(dayValue);
    const currentDay = dailyHours[dayKey];

    setValue(
      `daily_hours.${dayKey}`,
      {
        enabled: !currentDay?.enabled,
        open: currentDay?.open ?? "09:00",
        close: currentDay?.close ?? "17:00",
      },
      { shouldDirty: true },
    );
  };

  const copyMondayToWeekdays = () => {
    const mondayHours = dailyHours["1"];
    if (!mondayHours?.enabled) {
      toast.error("Monday must be open to copy its hours");
      return;
    }

    // Copy Monday hours to Tuesday-Friday
    [2, 3, 4, 5].forEach((day) => {
      setValue(
        `daily_hours.${day}`,
        {
          enabled: true,
          open: mondayHours.open,
          close: mondayHours.close,
        },
        { shouldDirty: true },
      );
    });

    toast.success("Copied Monday hours to weekdays");
  };

  const resetAll = () => {
    reset(defaultValues);
    toast.success("Reset to default hours");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 shadow-sm">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyMondayToWeekdays}
          className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy Mon to Weekdays
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetAll}
          className="border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset All
        </Button>
      </div>

      {/* Days Grid */}
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day, index) => {
          const dayKey = String(day.value);
          const dayConfig = dailyHours[dayKey];
          const isOpen = dayConfig?.enabled ?? false;

          return (
            <div
              key={day.value}
              className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
              style={{
                animation: `slideIn 0.4s ease-out ${index * 0.05}s both`,
              }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r transition-opacity duration-300 ${isOpen
                  ? "from-emerald-50/50 via-transparent to-transparent opacity-100"
                  : "from-stone-50/50 via-transparent to-transparent opacity-50"
                  }`}
              />

              <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Day Name & Toggle */}
                <div className="flex items-center gap-4 sm:w-48">
                  <div
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${isOpen
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      : "bg-stone-300"
                      }`}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-stone-900">
                      {day.label}
                    </div>
                    <div className="text-xs text-stone-500">
                      {isOpen ? "Open" : "Closed"}
                    </div>
                  </div>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                </div>

                {/* Time Inputs */}
                <div
                  className={`flex flex-1 items-center gap-4 transition-all duration-300 ${isOpen
                    ? "opacity-100"
                    : "pointer-events-none opacity-30 blur-[2px]"
                    }`}
                >
                  <Controller
                    name={`daily_hours.${dayKey}.open`}
                    control={control}
                    render={({ field }) => (
                      <TimeInput
                        value={field.value ?? "09:00"}
                        onChange={field.onChange}
                        disabled={!isOpen}
                      />
                    )}
                  />

                  {/* Connector */}
                  <div className="hidden items-center sm:flex">
                    <div className="h-[2px] w-8 bg-gradient-to-r from-emerald-300 to-emerald-400" />
                    <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-emerald-400" />
                  </div>

                  <Controller
                    name={`daily_hours.${dayKey}.close`}
                    control={control}
                    render={({ field }) => (
                      <TimeInput
                        value={field.value ?? "17:00"}
                        onChange={field.onChange}
                        disabled={!isOpen}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timezone Selector */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm font-medium text-stone-700">
          Timezone
        </Label>
        <Select
          value={selectedTimezone}
          onValueChange={(value) =>
            setValue("timezone", value, { shouldDirty: true })
          }
        >
          <SelectTrigger className="w-full border-stone-200 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </form>
  );
}
