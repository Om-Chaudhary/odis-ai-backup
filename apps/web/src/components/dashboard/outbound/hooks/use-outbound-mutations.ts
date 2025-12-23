/**
 * Custom hook for outbound discharge mutations
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/client";

interface UseOutboundMutationsOptions {
  onSuccess?: () => void;
}

/**
 * Hook for managing outbound mutations (approve, skip, retry, star, cancel)
 */
export function useOutboundMutations(
  options: UseOutboundMutationsOptions = {},
) {
  const { onSuccess } = options;

  // Track which cases are being scheduled (supports concurrent scheduling)
  const [schedulingCaseIds, setSchedulingCaseIds] = useState<Set<string>>(
    new Set(),
  );
  // Track which cases are having their star toggled
  const [togglingStarCaseIds, setTogglingStarCaseIds] = useState<Set<string>>(
    new Set(),
  );
  // Track which cases are being cancelled
  const [cancellingCaseIds, setCancellingCaseIds] = useState<Set<string>>(
    new Set(),
  );

  // Mutations
  const approveAndSchedule = api.outbound.approveAndSchedule.useMutation({
    onSuccess: (data) => {
      const message = data.summaryGenerated
        ? "Discharge generated and scheduled"
        : "Discharge scheduled";
      toast.success(message);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to schedule", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const skipCase = api.outbound.skipCase.useMutation({
    onSuccess: () => {
      toast.success("Case skipped");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to skip", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const retryDelivery = api.outbound.retryFailedDelivery.useMutation({
    onSuccess: () => {
      toast.success("Retry scheduled");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to retry", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const toggleStarred = api.dashboard.toggleStarred.useMutation({
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update star", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const batchSchedule = api.outbound.batchSchedule.useMutation({
    onSuccess: (data) => {
      const { totalSuccess, totalFailed } = data;
      if (totalFailed === 0) {
        toast.success(
          `Successfully scheduled ${totalSuccess} case${totalSuccess > 1 ? "s" : ""}`,
        );
      } else if (totalSuccess > 0) {
        toast.warning(
          `Scheduled ${totalSuccess} case${totalSuccess > 1 ? "s" : ""}, ${totalFailed} failed`,
        );
      } else {
        toast.error("Failed to schedule any cases");
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Batch scheduling failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Cancel mutations
  const cancelScheduledDelivery =
    api.outbound.cancelScheduledDelivery.useMutation({
      onSuccess: (data) => {
        const cancelled: string[] = [];
        if (data.callCancelled) cancelled.push("call");
        if (data.emailCancelled) cancelled.push("email");
        toast.success(`Cancelled scheduled ${cancelled.join(" and ")}`);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error("Failed to cancel", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });

  const batchCancel = api.outbound.batchCancel.useMutation({
    onSuccess: (data) => {
      const { callsCancelled, emailsCancelled, errors } = data;
      const totalCancelled = callsCancelled + emailsCancelled;
      if (errors.length === 0) {
        toast.success(
          `Cancelled ${totalCancelled} scheduled deliver${totalCancelled > 1 ? "ies" : "y"}`,
        );
      } else if (totalCancelled > 0) {
        toast.warning(
          `Cancelled ${totalCancelled}, ${errors.length} failed`,
        );
      } else {
        toast.error("Failed to cancel any scheduled deliveries");
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Batch cancellation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Action handlers
  const handleApproveAndSend = useCallback(
    async (
      caseId: string,
      deliveryToggles: {
        phoneEnabled: boolean;
        emailEnabled: boolean;
        immediateDelivery?: boolean;
      },
    ) => {
      await approveAndSchedule.mutateAsync({
        caseId,
        phoneEnabled: deliveryToggles.phoneEnabled,
        emailEnabled: deliveryToggles.emailEnabled,
        immediateDelivery: deliveryToggles.immediateDelivery ?? false,
      });
    },
    [approveAndSchedule],
  );

  const handleSkip = useCallback(
    async (caseId: string) => {
      await skipCase.mutateAsync({ caseId });
    },
    [skipCase],
  );

  const handleRetry = useCallback(
    async (
      caseId: string,
      retryOptions: {
        retryCall: boolean;
        retryEmail: boolean;
      },
    ) => {
      await retryDelivery.mutateAsync({
        caseId,
        retryCall: retryOptions.retryCall,
        retryEmail: retryOptions.retryEmail,
      });
    },
    [retryDelivery],
  );

  // Quick schedule from table row (supports concurrent scheduling)
  const handleQuickSchedule = useCallback(
    async (caseItem: {
      id: string;
      owner: { phone: string | null; email: string | null };
    }) => {
      setSchedulingCaseIds((prev) => new Set(prev).add(caseItem.id));
      try {
        await approveAndSchedule.mutateAsync({
          caseId: caseItem.id,
          phoneEnabled: !!caseItem.owner.phone,
          emailEnabled: !!caseItem.owner.email,
        });
      } finally {
        setSchedulingCaseIds((prev) => {
          const next = new Set(prev);
          next.delete(caseItem.id);
          return next;
        });
      }
    },
    [approveAndSchedule],
  );

  // Toggle star on a case
  const handleToggleStar = useCallback(
    async (caseId: string, starred: boolean) => {
      setTogglingStarCaseIds((prev) => new Set(prev).add(caseId));
      try {
        await toggleStarred.mutateAsync({ caseId, starred });
      } finally {
        setTogglingStarCaseIds((prev) => {
          const next = new Set(prev);
          next.delete(caseId);
          return next;
        });
      }
    },
    [toggleStarred],
  );

  // Bulk schedule multiple cases in parallel
  const handleBulkSchedule = useCallback(
    async (caseIds: string[]) => {
      // Add all case IDs to scheduling state
      setSchedulingCaseIds((prev) => {
        const next = new Set(prev);
        caseIds.forEach((id) => next.add(id));
        return next;
      });

      try {
        await batchSchedule.mutateAsync({
          caseIds,
          phoneEnabled: true,
          emailEnabled: true,
          timingMode: "scheduled", // Use user's delay settings
          staggerIntervalSeconds: 60,
        });
      } finally {
        // Remove all case IDs from scheduling state
        setSchedulingCaseIds((prev) => {
          const next = new Set(prev);
          caseIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [batchSchedule],
  );

  // Cancel a single case's scheduled deliveries
  const handleCancelScheduled = useCallback(
    async (
      caseId: string,
      options: { cancelCall: boolean; cancelEmail: boolean },
    ) => {
      setCancellingCaseIds((prev) => new Set(prev).add(caseId));
      try {
        await cancelScheduledDelivery.mutateAsync({
          caseId,
          cancelCall: options.cancelCall,
          cancelEmail: options.cancelEmail,
        });
      } finally {
        setCancellingCaseIds((prev) => {
          const next = new Set(prev);
          next.delete(caseId);
          return next;
        });
      }
    },
    [cancelScheduledDelivery],
  );

  // Bulk cancel multiple cases' scheduled deliveries
  const handleBulkCancel = useCallback(
    async (caseIds: string[]) => {
      // Add all case IDs to cancelling state
      setCancellingCaseIds((prev) => {
        const next = new Set(prev);
        caseIds.forEach((id) => next.add(id));
        return next;
      });

      try {
        await batchCancel.mutateAsync({
          caseIds,
          cancelCalls: true,
          cancelEmails: true,
        });
      } finally {
        // Remove all case IDs from cancelling state
        setCancellingCaseIds((prev) => {
          const next = new Set(prev);
          caseIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [batchCancel],
  );

  const isSubmitting =
    approveAndSchedule.isPending ||
    skipCase.isPending ||
    retryDelivery.isPending;

  const isBulkScheduling = batchSchedule.isPending;
  const isBulkCancelling = batchCancel.isPending;

  return {
    // Mutations
    approveAndSchedule,
    skipCase,
    retryDelivery,
    toggleStarred,
    batchSchedule,
    cancelScheduledDelivery,
    batchCancel,
    // Handlers
    handleApproveAndSend,
    handleSkip,
    handleRetry,
    handleQuickSchedule,
    handleToggleStar,
    handleBulkSchedule,
    handleCancelScheduled,
    handleBulkCancel,
    // State
    isSubmitting,
    isBulkScheduling,
    isBulkCancelling,
    schedulingCaseIds,
    togglingStarCaseIds,
    cancellingCaseIds,
  };
}
