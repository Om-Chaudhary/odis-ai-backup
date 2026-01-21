"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save, Loader2 } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";

interface BusinessHoursFormData {
  open_time: string;
  close_time: string;
  days_of_week: number[];
  timezone: string;
}

interface BusinessHoursFormProps {
  initialData?: {
    open_time: string;
    close_time: string;
    days_of_week: number[];
    timezone: string;
  } | null;
  clinicSlug?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
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

export function BusinessHoursForm({
  initialData,
  clinicSlug,
}: BusinessHoursFormProps) {
  const utils = api.useUtils();

  const defaultValues: BusinessHoursFormData = {
    open_time: initialData?.open_time ?? "09:00",
    close_time: initialData?.close_time ?? "17:00",
    days_of_week: initialData?.days_of_week ?? [1, 2, 3, 4, 5], // Mon-Fri
    timezone: initialData?.timezone ?? "America/Los_Angeles",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<BusinessHoursFormData>({
    defaultValues,
  });

  const selectedDays = watch("days_of_week");
  const selectedTimezone = watch("timezone");

  // Reset form when initial data changes
  useEffect(() => {
    if (initialData) {
      reset({
        open_time: initialData.open_time,
        close_time: initialData.close_time,
        days_of_week: initialData.days_of_week,
        timezone: initialData.timezone,
      });
    }
  }, [initialData, reset]);

  const updateMutation = api.settings.schedule.updateScheduleConfig.useMutation(
    {
      onSuccess: () => {
        toast.success("Business hours updated successfully");
        void utils.settings.schedule.getScheduleConfig.invalidate();
        reset(watch()); // Reset dirty state
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update business hours");
      },
    },
  );

  const onSubmit = (data: BusinessHoursFormData) => {
    updateMutation.mutate({ ...data, clinicSlug });
  };

  const toggleDay = (day: number) => {
    const current = selectedDays;
    if (current.includes(day)) {
      setValue("days_of_week", current.filter((d) => d !== day), {
        shouldDirty: true,
      });
    } else {
      setValue("days_of_week", [...current, day].sort(), { shouldDirty: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="open_time">Open Time</Label>
          <Input
            id="open_time"
            type="time"
            {...register("open_time")}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="close_time">Close Time</Label>
          <Input
            id="close_time"
            type="time"
            {...register("close_time")}
            className="w-full"
          />
        </div>
      </div>

      {/* Days of Week */}
      <div className="space-y-2">
        <Label>Days Open</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${isSelected
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          value={selectedTimezone}
          onValueChange={(value) =>
            setValue("timezone", value, { shouldDirty: true })
          }
        >
          <SelectTrigger className="w-full">
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
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSubmitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
