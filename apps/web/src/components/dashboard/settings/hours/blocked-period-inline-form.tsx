"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";

interface BlockedPeriodFormData {
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
}

interface BlockedPeriodInlineFormProps {
  clinicSlug?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function BlockedPeriodInlineForm({
  clinicSlug,
  onSuccess,
  onCancel,
}: BlockedPeriodInlineFormProps) {
  const utils = api.useUtils();

  const defaultValues: BlockedPeriodFormData = {
    name: "",
    start_time: "12:00",
    end_time: "13:00",
    days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
    is_active: true,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<BlockedPeriodFormData>({
    defaultValues,
  });

  const selectedDays = watch("days_of_week");
  const isActive = watch("is_active");

  const createMutation = api.settings.schedule.createBlockedPeriod.useMutation({
    onSuccess: async () => {
      toast.success("Time segment created successfully");
      await utils.settings.schedule.getBlockedPeriods.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create time segment");
    },
  });

  const onSubmit = (data: BlockedPeriodFormData) => {
    createMutation.mutate({ ...data, clinicSlug });
  };

  const toggleDay = (day: number) => {
    const current = selectedDays;
    if (current.includes(day)) {
      setValue("days_of_week", current.filter((d) => d !== day));
    } else {
      setValue("days_of_week", [...current, day].sort());
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g., Lunch Break, Staff Meeting"
          {...register("name", { required: "Name is required" })}
          className="bg-white"
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            {...register("start_time")}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            {...register("end_time")}
            className="bg-white"
          />
        </div>
      </div>

      {/* Days of Week */}
      <div className="space-y-2">
        <Label>Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
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

      {/* Active Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-3">
        <Label htmlFor="is_active" className="cursor-pointer">
          Active
        </Label>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Create Segment
        </Button>
      </div>
    </form>
  );
}
