"use client";

import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface SyncTriggerPanelProps {
  clinicId: string;
}

export function SyncTriggerPanel({ clinicId }: SyncTriggerPanelProps) {
  const utils = api.useUtils();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const triggerFullSyncMutation = api.admin.sync.triggerFullSync.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.message ?? "Full sync triggered successfully",
        {
          description: "Syncing past 14 days + next 14 days",
        },
      );

      void utils.admin.sync.getActiveSyncs.invalidate();
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to trigger full sync");
    },
  });

  const triggerInboundMutation = api.admin.sync.triggerSync.useMutation({
    onSuccess: () => {
      toast.success("Inbound sync triggered successfully");
      void utils.admin.sync.getActiveSyncs.invalidate();
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to trigger inbound sync");
    },
  });

  const triggerCaseMutation = api.admin.sync.triggerSync.useMutation({
    onSuccess: () => {
      toast.success("Case sync triggered successfully");
      void utils.admin.sync.getActiveSyncs.invalidate();
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to trigger case sync");
    },
  });

  const triggerReconciliationMutation = api.admin.sync.triggerSync.useMutation({
    onSuccess: () => {
      toast.success("Reconciliation sync triggered successfully");
      void utils.admin.sync.getActiveSyncs.invalidate();
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to trigger reconciliation sync");
    },
  });

  const anyPending =
    triggerFullSyncMutation.isPending ||
    triggerInboundMutation.isPending ||
    triggerCaseMutation.isPending ||
    triggerReconciliationMutation.isPending;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Button
          onClick={() => {
            triggerFullSyncMutation.mutate({
              clinicId,
              lookbackDays: 14,
              forwardDays: 14,
            });
          }}
          disabled={anyPending}
          size="lg"
          className="gap-2"
        >
          <RefreshCw
            className={`h-5 w-5 ${
              triggerFullSyncMutation.isPending ? "animate-spin" : ""
            }`}
          />
          Full Sync
          <span className="text-xs opacity-80">(Past 14d + Next 14d)</span>
        </Button>
      </div>

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
            Advanced: Individual Sync Operations
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                triggerInboundMutation.mutate({ clinicId, type: "inbound" });
              }}
              disabled={anyPending}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  triggerInboundMutation.isPending ? "animate-spin" : ""
                }`}
              />
              Inbound Only
            </Button>

            <Button
              onClick={() => {
                triggerCaseMutation.mutate({ clinicId, type: "cases" });
              }}
              disabled={anyPending}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  triggerCaseMutation.isPending ? "animate-spin" : ""
                }`}
              />
              Cases Only
            </Button>

            <Button
              onClick={() => {
                triggerReconciliationMutation.mutate({
                  clinicId,
                  type: "reconciliation",
                });
              }}
              disabled={anyPending}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  triggerReconciliationMutation.isPending ? "animate-spin" : ""
                }`}
              />
              Reconcile Only
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
