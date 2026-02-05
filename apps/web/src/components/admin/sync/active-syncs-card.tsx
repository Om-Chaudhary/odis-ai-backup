"use client";

import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { CheckCircle2, XCircle, Building2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@odis-ai/shared/util";
import Link from "next/link";
import { useSyncAuditRealtime } from "./hooks";

interface ActiveSyncsCardProps {
  clinicId?: string;
  clinicSlug: string;
}

/**
 * Shows recent completed sync operations (last 5).
 * Active syncs are now displayed in the FloatingSyncWidget.
 */
export function ActiveSyncsCard({
  clinicId,
  clinicSlug,
}: ActiveSyncsCardProps) {
  const utils = api.useUtils();
  const { data: syncHistory } = api.admin.sync.getSyncHistory.useQuery({
    clinicId,
    limit: 5,
    offset: 0,
  });

  // Subscribe to realtime updates to refresh when syncs complete
  useSyncAuditRealtime({
    clinicId,
    onSyncCompleted: () => {
      // Invalidate sync history when a sync completes
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onSyncFailed: () => {
      void utils.admin.sync.getSyncHistory.invalidate();
    },
  });

  const recentSyncs = syncHistory?.syncs ?? [];

  const getSyncTypeLabel = (syncType: string) => {
    switch (syncType) {
      case "inbound":
        return "Inbound";
      case "cases":
        return "Case Sync";
      case "reconciliation":
        return "Reconciliation";
      default:
        return syncType;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent Sync Operations
        </h3>
        {recentSyncs.length > 0 && (
          <Badge variant="outline" className="gap-2">
            Last {recentSyncs.length}
          </Badge>
        )}
      </div>

      {recentSyncs.length > 0 ? (
        <div className="space-y-3">
          {recentSyncs.map((sync) => {
            const clinicData = sync.clinics as unknown as {
              id: string;
              name: string;
              slug: string;
            } | null;
            const clinic = clinicData ?? null;

            const stats = [
              sync.cases_created ? `${sync.cases_created} created` : null,
              sync.cases_updated ? `${sync.cases_updated} updated` : null,
              sync.cases_skipped ? `${sync.cases_skipped} skipped` : null,
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <div
                key={sync.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <RefreshCw
                      className={cn(
                        "h-5 w-5",
                        sync.status === "completed"
                          ? "text-green-600"
                          : sync.status === "failed"
                            ? "text-red-600"
                            : "text-slate-600",
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {clinic && (
                        <Link
                          href={`/dashboard/${clinicSlug}/admin/clinics/${clinic.id}`}
                          className="font-medium text-slate-900 transition-colors hover:text-teal-700"
                        >
                          {clinic.name}
                        </Link>
                      )}
                      {getStatusBadge(sync.status)}
                      <span className="text-xs text-slate-500">
                        {getSyncTypeLabel(sync.sync_type)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span>
                        {formatDistanceToNow(new Date(sync.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {stats && <span>• {stats}</span>}
                    </div>
                  </div>
                </div>

                {clinic && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{clinic.slug}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <RefreshCw className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm text-slate-500">No recent sync operations</p>
        </div>
      )}
    </Card>
  );
}
