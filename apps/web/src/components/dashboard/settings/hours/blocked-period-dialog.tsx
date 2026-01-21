"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import type { Database } from "@odis-ai/shared/types";

type BlockedPeriod =
  Database["public"]["Tables"]["clinic_blocked_periods"]["Row"];

interface BlockedPeriodFormData {
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
}

interface BlockedPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: BlockedPeriod | null;
  clinicSlug?: string;
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

export function BlockedPeriodDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  clinicSlug,
}: BlockedPeriodDialogProps) {
  const utils = api.useUtils();

  const defaultValues: BlockedPeriodFormData = {
    name: initialData?.name ?? "",
    start_time: initialData?.start_time ?? "12:00",
    end_time: initialData?.end_time ?? "13:00",
    days_of_week: initialData?.days_of_week ?? [1, 2, 3, 4, 5], // Mon-Fri
    is_active: initialData?.is_active ?? true,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<BlockedPeriodFormData>({
    defaultValues,
  });

  const selectedDays = watch("days_of_week");
  const isActive = watch("is_active");

  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (open) {
      reset(
        initialData
          ? {
              name: initialData.name,
              start_time: initialData.start_time,
              end_time: initialData.end_time,
              days_of_week: initialData.days_of_week,
              is_active: initialData.is_active,
            }
          : defaultValues,
      );
    }
  }, [open, initialData, reset]);

  const createMutation = api.settings.schedule.createBlockedPeriod.useMutation({
    onSuccess: () => {
      toast.success("Time segment created successfully");
      void utils.settings.schedule.getBlockedPeriods.invalidate();
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create time segment");
    },
  });

  const updateMutation = api.settings.schedule.updateBlockedPeriod.useMutation({
    onSuccess: () => {
      toast.success("Time segment updated successfully");
      void utils.settings.schedule.getBlockedPeriods.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update time segment");
    },
  });

  const onSubmit = (data: BlockedPeriodFormData) => {
    if (mode === "create") {
      createMutation.mutate({ ...data, clinicSlug });
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        ...data,
        clinicSlug,
      });
    }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Time Segment" : "Edit Time Segment"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new blocked period like lunch breaks or staff meetings"
              : "Update the blocked period details"}
          </DialogDescription>
        </DialogHeader>

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
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
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
                        ? "border-amber-500 bg-amber-50 text-amber-700"
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
          <div className="flex items-center justify-between rounded-lg border border-slate-200/60 p-3">
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              {mode === "create" ? "Create" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
