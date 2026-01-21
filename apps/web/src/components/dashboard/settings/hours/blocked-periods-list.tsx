"use client";

import { useState } from "react";
import { Edit, Trash2, Coffee } from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Button } from "@odis-ai/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/shared/ui/alert-dialog";
import { BlockedPeriodDialog } from "./blocked-period-dialog";
import type { Database } from "@odis-ai/shared/types";

type BlockedPeriod =
  Database["public"]["Tables"]["clinic_blocked_periods"]["Row"];

interface BlockedPeriodsListProps {
  periods: BlockedPeriod[];
  clinicSlug?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDays(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 7) return "Every day";
  if (daysOfWeek.length === 5 && daysOfWeek.every((d) => d >= 1 && d <= 5)) {
    return "Weekdays";
  }
  return daysOfWeek
    .sort()
    .map((d) => DAYS_OF_WEEK[d])
    .join(", ");
}

function formatTime(time: string): string {
  // Parse time string (HH:MM or HH:MM:SS)
  const [hours, minutes] = time.split(":").map(Number);
  const period = (hours ?? 0) >= 12 ? "PM" : "AM";
  const displayHours = (hours ?? 0) % 12 || 12;
  return `${displayHours}:${String(minutes ?? 0).padStart(2, "0")} ${period}`;
}

export function BlockedPeriodsList({
  periods,
  clinicSlug,
}: BlockedPeriodsListProps) {
  const [editingPeriod, setEditingPeriod] = useState<BlockedPeriod | null>(
    null,
  );
  const [deletingPeriod, setDeletingPeriod] = useState<BlockedPeriod | null>(
    null,
  );

  const utils = api.useUtils();

  const deleteMutation = api.settings.schedule.deleteBlockedPeriod.useMutation({
    onSuccess: () => {
      toast.success("Time segment deleted successfully");
      void utils.settings.schedule.getBlockedPeriods.invalidate();
      setDeletingPeriod(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete time segment");
    },
  });

  if (periods.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center">
        <Coffee className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          No time segments defined
        </p>
        <p className="text-xs text-slate-500">
          Add segments like lunch breaks or staff meetings
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {periods.map((period) => (
          <div
            key={period.id}
            className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-4 transition-colors hover:bg-slate-50/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100/80 text-amber-600">
                <Coffee className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {period.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTime(period.start_time)} - {formatTime(period.end_time)}{" "}
                  · {formatDays(period.days_of_week)}
                </p>
              </div>
              {!period.is_active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPeriod(period)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingPeriod(period)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingPeriod && (
        <BlockedPeriodDialog
          open={!!editingPeriod}
          onOpenChange={(open) => !open && setEditingPeriod(null)}
          mode="edit"
          initialData={editingPeriod}
          clinicSlug={clinicSlug}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPeriod}
        onOpenChange={(open) => !open && setDeletingPeriod(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Segment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPeriod?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPeriod) {
                  deleteMutation.mutate({ id: deletingPeriod.id, clinicSlug });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
