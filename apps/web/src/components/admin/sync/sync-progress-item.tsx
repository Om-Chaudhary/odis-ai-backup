"use client";

import { useEffect, useState, memo } from "react";
import { RefreshCw, X, Loader2 } from "lucide-react";
import { Progress } from "@odis-ai/shared/ui/progress";
import { Button } from "@odis-ai/shared/ui/button";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/client";
import { toast } from "sonner";

interface SyncProgressItemProps {
  sync: {
    id: string;
    clinic_id: string;
    sync_type: string;
    created_at: string;
    status: string;
    total_items: number | null;
    processed_items: number | null;
    progress_percentage: number | null;
    last_progress_update: string | null;
    clinics: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

/**
 * Individual sync progress item with client-side smoothing
 */
export const SyncProgressItem = memo(function SyncProgressItem({
  sync,
}: SyncProgressItemProps) {
  const [smoothProgress, setSmoothProgress] = useState(
    sync.progress_percentage ?? 0,
  );

  const utils = api.useUtils();
  const cancelMutation = api.admin.sync.cancelSync.useMutation({
    onSuccess: () => {
      toast.success("Sync cancelled");
      void utils.admin.sync.getActiveSyncs.invalidate();
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate({ syncId: sync.id });
  };

  // Smooth progress interpolation between server updates
  useEffect(() => {
    const target = sync.progress_percentage ?? 0;
    const current = smoothProgress;

    if (target === current) return;

    // Interpolate progress over 500ms for smooth animation
    const steps = 10;
    const increment = (target - current) / steps;
    const interval = 500 / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setSmoothProgress(target);
        clearInterval(timer);
      } else {
        setSmoothProgress(current + increment * step);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [sync.progress_percentage, smoothProgress]);

  const syncTypeLabel =
    sync.sync_type === "inbound"
      ? "Inbound Sync"
      : sync.sync_type === "cases"
        ? "Case Sync"
        : sync.sync_type === "reconciliation"
          ? "Reconciliation"
          : "Sync";

  const clinicName = sync.clinics?.name ?? "Unknown Clinic";

  const totalItems = sync.total_items ?? 0;
  const processedItems = sync.processed_items ?? 0;
  const progressPercent = Math.round(smoothProgress);

  // Calculate elapsed time
  const elapsedTime = formatDistanceToNow(new Date(sync.created_at), {
    addSuffix: false,
  });

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
          <span className="text-sm font-medium text-slate-900">
            {clinicName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{elapsedTime}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="h-6 w-6 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Cancel sync"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">{syncTypeLabel}</span>
          <span className="font-medium text-slate-700">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        {totalItems > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {processedItems} / {totalItems} items
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
