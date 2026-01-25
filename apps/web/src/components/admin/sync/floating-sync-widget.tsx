"use client";

import { useState, useEffect, useMemo } from "react";
import { Minus, X, RefreshCw } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { Card } from "@odis-ai/shared/ui/card";
import { api } from "~/trpc/client";
import { useSyncAuditRealtime } from "./hooks/use-sync-audit-realtime";
import { useAdminContext } from "~/lib/admin-context";
import { SyncProgressItem } from "./sync-progress-item";

type WidgetState = "hidden" | "minimized" | "expanded";

export function FloatingSyncWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>("hidden");
  const { selectedClinicId, isGlobalView } = useAdminContext();

  // Fetch active syncs
  const { data: activeSyncs = [], refetch } =
    api.admin.sync.getActiveSyncs.useQuery(
      {
        clinicId: isGlobalView ? undefined : (selectedClinicId ?? undefined),
      },
      {
        refetchInterval: 5000, // Fallback polling every 5 seconds
      },
    );

  // Subscribe to real-time updates
  useSyncAuditRealtime({
    clinicId: isGlobalView ? undefined : (selectedClinicId ?? undefined),
    enabled: true,
    onAnyChange: () => {
      void refetch();
    },
  });

  // Update widget state based on active syncs
  useEffect(() => {
    if (activeSyncs.length > 0) {
      // Show widget when syncs exist
      if (widgetState === "hidden") {
        setWidgetState("minimized");
      }
    } else {
      // Hide widget when no syncs
      if (widgetState !== "hidden") {
        // Delay hiding to allow user to see completion
        const timeout = setTimeout(() => {
          setWidgetState("hidden");
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [activeSyncs.length, widgetState]);

  const toggleExpanded = () => {
    setWidgetState((prev) => (prev === "expanded" ? "minimized" : "expanded"));
  };

  const close = () => {
    setWidgetState("hidden");
  };

  // Memoize the syncs to prevent unnecessary re-renders
  const memoizedSyncs = useMemo(() => activeSyncs, [activeSyncs]);

  if (widgetState === "hidden") {
    return null;
  }

  if (widgetState === "minimized") {
    return (
      <Card
        className="fixed right-6 bottom-6 z-50 cursor-pointer overflow-hidden shadow-xl shadow-slate-900/20 backdrop-blur-md transition-all hover:shadow-2xl"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3 bg-linear-to-br from-teal-50 to-teal-100/50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/30">
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-900">
              {memoizedSyncs.length} sync{memoizedSyncs.length !== 1 ? "s" : ""}{" "}
              active
            </p>
            <p className="text-xs text-teal-700">Click to expand</p>
          </div>
        </div>
      </Card>
    );
  }

  // Expanded state
  return (
    <Card className="fixed right-6 bottom-6 z-50 w-96 overflow-hidden shadow-xl shadow-slate-900/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-linear-to-br from-teal-50 to-teal-100/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/30">
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-900">Active Syncs</p>
            <p className="text-xs text-teal-700">
              {memoizedSyncs.length} running
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sync List */}
      <div className="max-h-96 overflow-y-auto bg-white">
        {memoizedSyncs.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">
            No active syncs
          </div>
        ) : (
          memoizedSyncs.map((sync) => (
            <SyncProgressItem key={sync.id} sync={sync} />
          ))
        )}
      </div>
    </Card>
  );
}
