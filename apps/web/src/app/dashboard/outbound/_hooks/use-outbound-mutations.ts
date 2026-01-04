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
        toast.warning(`Cancelled ${totalCancelled}, ${errors.length} failed`);
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
      immediate?: boolean,
    ) => {
      await approveAndSchedule.mutateAsync({
        caseId,
        phoneEnabled: deliveryToggles.phoneEnabled,
        emailEnabled: deliveryToggles.emailEnabled,
        immediateDelivery:
          immediate ?? deliveryToggles.immediateDelivery ?? false,
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

  // Bulk schedule multiple cases immediately with 1-minute stagger
  const handleBulkScheduleImmediate = useCallback(
    async (caseIds: string[]) => {
      // Add all case IDs to scheduling state
      setSchedulingCaseIds((prev) => {
        const next = new Set(prev);
        caseIds.forEach((id) => next.add(id));
        return next;
      });

      try {
        // Schedule starting 1 minute from now to avoid past-time scheduling after generation
        const scheduleBaseTime = new Date(Date.now() + 60 * 1000).toISOString();

        await batchSchedule.mutateAsync({
          caseIds,
          phoneEnabled: true,
          emailEnabled: true,
          timingMode: "immediate", // Send now, staggered
          staggerIntervalSeconds: 60, // 1 minute between each case
          scheduleBaseTime, // Start scheduling 1 minute from now
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

  /**
   * Background bulk schedule with progress tracking.
   * This processes cases in the background and reports progress via callbacks.
   */
  const handleBulkScheduleImmediateBackground = useCallback(
    async (
      cases: Array<{ id: string; patientName: string }>,
      callbacks: {
        onStart: () => void;
        onCaseStart: (caseId: string) => void;
        onCaseComplete: (
          caseId: string,
          success: boolean,
          error?: string,
        ) => void;
        onPhaseChange: (
          phase: "generating" | "scheduling" | "complete" | "error",
        ) => void;
        onComplete: () => void;
      },
    ) => {
      const caseIds = cases.map((c) => c.id);

      // Add all case IDs to scheduling state
      setSchedulingCaseIds((prev) => {
        const next = new Set(prev);
        caseIds.forEach((id) => next.add(id));
        return next;
      });

      callbacks.onStart();

      try {
        // Mark all cases as generating
        callbacks.onPhaseChange("generating");
        for (const caseItem of cases) {
          callbacks.onCaseStart(caseItem.id);
        }

        // Schedule starting 1 minute from now to ensure generation completes before scheduling
        const scheduleBaseTime = new Date(Date.now() + 60 * 1000).toISOString();

        callbacks.onPhaseChange("scheduling");

        const result = await batchSchedule.mutateAsync({
          caseIds,
          phoneEnabled: true,
          emailEnabled: true,
          timingMode: "immediate",
          staggerIntervalSeconds: 60,
          scheduleBaseTime,
        });

        // Report individual case results
        for (const caseResult of result.results) {
          callbacks.onCaseComplete(
            caseResult.caseId,
            caseResult.success,
            caseResult.error,
          );
        }

        callbacks.onPhaseChange("complete");
        callbacks.onComplete();
      } catch (error) {
        callbacks.onPhaseChange("error");
        // Mark all pending cases as failed
        for (const caseItem of cases) {
          callbacks.onCaseComplete(
            caseItem.id,
            false,
            error instanceof Error ? error.message : "Unknown error",
          );
        }
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
    handleBulkScheduleImmediate,
    handleBulkScheduleImmediateBackground,
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
