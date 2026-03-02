"use client";

import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AutoSyncStatusProps {
  clinicId: string;
}

/**
 * Shows the health of automated nightly syncs at a glance.
 * Displays when the last sync of each type ran and whether it succeeded.
 * Highlights when syncs are overdue (>25 hours since last run).
 */
export function AutoSyncStatus({ clinicId }: AutoSyncStatusProps) {
  const { data: scheduleConfig } = api.admin.sync.getClinicSyncConfig.useQuery({
    clinicId,
  });

  const { data: history } = api.admin.sync.getSyncHistory.useQuery({
    clinicId,
    limit: 50,
    offset: 0,
  });

  const schedules = scheduleConfig?.config?.schedules ?? [];
  const syncs = history?.syncs ?? [];

  // If no schedules configured, don't show this component
  if (schedules.length === 0) {
    return null;
  }

  const enabledSchedules = schedules.filter((s) => s.enabled);
  if (enabledSchedules.length === 0) {
    return null;
  }

  // For each schedule type, find the most recent sync of that type
  const syncTypes = ["inbound", "cases", "reconciliation"] as const;
  const typeLabels: Record<string, string> = {
    inbound: "Appointments Pull",
    cases: "Case Enrichment",
    reconciliation: "Reconciliation",
  };

  const statusItems = syncTypes
    .filter((type) => enabledSchedules.some((s) => s.type === type))
    .map((type) => {
      const lastSync = syncs.find((s) => s.sync_type === type);
      const schedule = enabledSchedules.find((s) => s.type === type);

      if (!lastSync) {
        return {
          type,
          label: typeLabels[type] ?? type,
          status: "never" as const,
          cron: schedule?.cron ?? "",
          lastRun: null,
          error: null,
        };
      }

      const lastRunDate = new Date(lastSync.created_at);
      const hoursSinceRun =
        (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60);
      const isOverdue = hoursSinceRun > 25; // More than 25 hours = missed a nightly run

      return {
        type,
        label: typeLabels[type] ?? type,
        status:
          lastSync.status === "completed"
            ? isOverdue
              ? ("overdue" as const)
              : ("healthy" as const)
            : ("failed" as const),
        cron: schedule?.cron ?? "",
        lastRun: lastRunDate,
        error: lastSync.error_message ?? null,
        stats: {
          found: lastSync.appointments_found,
          created: lastSync.cases_created,
          updated: lastSync.cases_updated,
        },
      };
    });

  // Overall health
  const allHealthy = statusItems.every((s) => s.status === "healthy");
  const anyFailed = statusItems.some((s) => s.status === "failed");
  const anyOverdue = statusItems.some(
    (s) => s.status === "overdue" || s.status === "never",
  );

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Automated Sync Status
          </h3>
        </div>
        {allHealthy && (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            All Syncs Healthy
          </Badge>
        )}
        {anyFailed && (
          <Badge
            variant="outline"
            className="border-red-200 bg-red-50 text-red-700"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Sync Failed — Run Manually
          </Badge>
        )}
        {!anyFailed && anyOverdue && (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Sync Overdue
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {statusItems.map((item) => (
          <div
            key={item.type}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {item.status === "healthy" && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {item.status === "failed" && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {item.status === "overdue" && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              {item.status === "never" && (
                <Clock className="h-4 w-4 text-slate-400" />
              )}

              <div>
                <span className="text-sm font-medium text-slate-900">
                  {item.label}
                </span>
                {item.status === "failed" && item.error && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-red-600">
                    {item.error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-500">
              {item.lastRun ? (
                <>
                  {item.stats && (item.stats.created || item.stats.updated) && (
                    <span className="text-xs text-slate-400">
                      {[
                        item.stats.created ? `${item.stats.created} new` : null,
                        item.stats.updated
                          ? `${item.stats.updated} updated`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                  <span>
                    {formatDistanceToNow(item.lastRun, { addSuffix: true })}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Never run</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
