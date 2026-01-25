"use client";

import { useEffect } from "react";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@odis-ai/shared/ui/tooltip";
import { RefreshCw, Building2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSyncAuditRealtime } from "./hooks";

interface ActiveSyncsCardProps {
  clinicId?: string;
}

export function ActiveSyncsCard({ clinicId }: ActiveSyncsCardProps) {
  const utils = api.useUtils();
  const { data: activeSyncs, refetch } = api.admin.sync.getActiveSyncs.useQuery(
    {
      clinicId,
    },
  );

  // Subscribe to realtime updates for instant UI refresh
  const { status: realtimeStatus, error: realtimeError, reconnect } = useSyncAuditRealtime({
    clinicId,
    onAnyChange: () => {
      // Invalidate the active syncs query on any change
      void utils.admin.sync.getActiveSyncs.invalidate();
    },
  });

  // Fallback polling: only poll when realtime is not connected
  useEffect(() => {
    if (realtimeStatus !== "connected") {
      const interval = setInterval(() => {
        void refetch();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [refetch, realtimeStatus]);

  // Connection status icon and tooltip
  const getConnectionStatusIcon = () => {
    switch (realtimeStatus) {
      case "connected":
        return <Wifi className="h-3 w-3 text-green-600" />;
      case "connecting":
        return <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case "disconnected":
      default:
        return <WifiOff className="h-3 w-3 text-slate-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (realtimeStatus) {
      case "connected":
        return "Live updates enabled";
      case "connecting":
        return "Connecting to live updates...";
      case "error":
        return realtimeError ?? "Connection error - using fallback polling";
      case "disconnected":
      default:
        return "Using fallback polling (10s)";
    }
  };

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Active Sync Operations
        </h3>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={reconnect}
                  className="rounded p-1 hover:bg-slate-100"
                  aria-label="Connection status"
                >
                  {getConnectionStatusIcon()}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{getConnectionStatusText()}</p>
                {realtimeStatus === "error" && (
                  <p className="mt-1 text-xs text-slate-400">Click to reconnect</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="outline" className="gap-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {activeSyncs?.length ?? 0} Running
          </Badge>
        </div>
      </div>

      {activeSyncs && activeSyncs.length > 0 ? (
        <div className="space-y-3">
          {}
          {activeSyncs.map((sync) => {
            const clinicData = sync.clinics as unknown as {
              id: string;
              name: string;
              slug: string;
            } | null;
            const clinic = clinicData ?? null;

            return (
              <div
                key={sync.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      {clinic && (
                        <Link
                          href={`/admin/clinics/${clinic.id}`}
                          className="font-medium text-slate-900 transition-colors hover:text-amber-700"
                        >
                          {clinic.name}
                        </Link>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {sync.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Started{" "}
                      {formatDistanceToNow(new Date(sync.created_at), {
                        addSuffix: true,
                      })}
                    </p>
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
          <p className="text-sm text-slate-500">No active sync operations</p>
        </div>
      )}
    </Card>
  );
}
