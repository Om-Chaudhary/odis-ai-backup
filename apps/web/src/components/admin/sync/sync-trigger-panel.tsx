"use client";

import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SyncTriggerPanelProps {
  clinicId: string;
}

export function SyncTriggerPanel({ clinicId }: SyncTriggerPanelProps) {
  const utils = api.useUtils();

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

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => {
          triggerInboundMutation.mutate({ clinicId, type: "inbound" });
        }}
        disabled={triggerInboundMutation.isPending}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw
          className={`h-4 w-4 ${
            triggerInboundMutation.isPending ? "animate-spin" : ""
          }`}
        />
        Inbound
      </Button>

      <Button
        onClick={() => {
          triggerCaseMutation.mutate({ clinicId, type: "cases" });
        }}
        disabled={triggerCaseMutation.isPending}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw
          className={`h-4 w-4 ${
            triggerCaseMutation.isPending ? "animate-spin" : ""
          }`}
        />
        Cases
      </Button>

      <Button
        onClick={() => {
          triggerReconciliationMutation.mutate({
            clinicId,
            type: "reconciliation",
          });
        }}
        disabled={triggerReconciliationMutation.isPending}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw
          className={`h-4 w-4 ${
            triggerReconciliationMutation.isPending ? "animate-spin" : ""
          }`}
        />
        Reconcile
      </Button>
    </div>
  );
}
