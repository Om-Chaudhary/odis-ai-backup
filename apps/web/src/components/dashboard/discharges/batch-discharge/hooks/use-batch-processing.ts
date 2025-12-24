import { toast } from "sonner";
import type { BatchEligibleCase } from "@odis-ai/shared/types";
import type { ProcessingResult, ProcessingStatus } from "../types";
import { BATCH_CONCURRENCY } from "../constants";

interface ProcessingCallbacks {
  onStatusUpdate: (caseId: string, status: ProcessingStatus) => void;
  onError: (caseId: string, error: string) => void;
}

interface ProcessCaseParams {
  caseId: string;
  patientId: string;
  patientData: {
    name: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
  };
  dischargeType: "email" | "call" | "both";
  scheduledAt: string;
}

export function useBatchProcessing(
  triggerDischargeMutation: {
    mutateAsync: (params: ProcessCaseParams) => Promise<unknown>;
  },
  callbacks: ProcessingCallbacks,
) {
  const processWithConcurrency = async (
    cases: BatchEligibleCase[],
    skippedCases: Set<string>,
    scheduledAt: string,
    dischargeType: "email" | "call" | "both",
  ): Promise<ProcessingResult[]> => {
    const results: ProcessingResult[] = [];
    const queue = [...cases];

    const processCase = async (caseData: BatchEligibleCase) => {
      // Check if user marked this case to skip
      if (skippedCases.has(caseData.id)) {
        callbacks.onStatusUpdate(caseData.id, "skipped");
        results.push({
          id: caseData.id,
          patientName: caseData.patientName,
          status: "skipped",
        });
        return;
      }

      // Mark as processing
      callbacks.onStatusUpdate(caseData.id, "processing");

      try {
        await triggerDischargeMutation.mutateAsync({
          caseId: caseData.id,
          patientId: caseData.patientId,
          patientData: {
            name: caseData.patientName,
            ownerName: caseData.ownerName ?? undefined,
            ownerEmail: caseData.ownerEmail ?? undefined,
            ownerPhone: caseData.ownerPhone ?? undefined,
          },
          dischargeType,
          scheduledAt,
        });

        callbacks.onStatusUpdate(caseData.id, "success");
        results.push({
          id: caseData.id,
          patientName: caseData.patientName,
          status: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        callbacks.onStatusUpdate(caseData.id, "failed");
        callbacks.onError(caseData.id, errorMessage);
        results.push({
          id: caseData.id,
          patientName: caseData.patientName,
          status: "failed",
          error: errorMessage,
        });
      }
    };

    // Process with concurrency limit using Promise.all for batches
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_CONCURRENCY);
      await Promise.all(batch.map((caseData) => processCase(caseData)));
    }

    return results;
  };

  const handleStartProcessing = async (params: {
    selectedCases: Set<string>;
    eligibleCases: BatchEligibleCase[];
    skippedCases: Set<string>;
    emailsEnabled: boolean;
    callsEnabled: boolean;
    emailScheduleMode: "datetime" | "minutes";
    callScheduleMode: "datetime" | "minutes";
    emailScheduleTime: Date | null;
    callScheduleTime: Date | null;
    emailMinutesFromNow: number;
    callMinutesFromNow: number;
    onBeforeStart: () => void;
    onComplete: (results: ProcessingResult[]) => void;
  }) => {
    if (params.selectedCases.size === 0) {
      toast.error("Please select at least one case");
      return;
    }

    if (!params.emailsEnabled && !params.callsEnabled) {
      toast.error("Please enable at least one communication type");
      return;
    }

    // Calculate final schedule time based on mode (use email time or call time)
    let finalScheduleTime: Date;
    if (params.emailsEnabled) {
      if (params.emailScheduleMode === "minutes") {
        finalScheduleTime = new Date(
          Date.now() + params.emailMinutesFromNow * 60 * 1000,
        );
      } else if (params.emailScheduleTime) {
        finalScheduleTime = params.emailScheduleTime;
      } else {
        toast.error("Please configure email schedule time");
        return;
      }
    } else if (params.callsEnabled) {
      if (params.callScheduleMode === "minutes") {
        finalScheduleTime = new Date(
          Date.now() + params.callMinutesFromNow * 60 * 1000,
        );
      } else if (params.callScheduleTime) {
        finalScheduleTime = params.callScheduleTime;
      } else {
        toast.error("Please configure call schedule time");
        return;
      }
    } else {
      return;
    }

    // Determine discharge type
    const dischargeType: "email" | "call" | "both" =
      params.emailsEnabled && params.callsEnabled
        ? "both"
        : params.emailsEnabled
          ? "email"
          : "call";

    // Get cases to process
    const casesToProcess = params.eligibleCases.filter((c) =>
      params.selectedCases.has(c.id),
    );

    params.onBeforeStart();

    try {
      const results = await processWithConcurrency(
        casesToProcess,
        params.skippedCases,
        finalScheduleTime.toISOString(),
        dischargeType,
      );

      params.onComplete(results);

      const successCount = results.filter((r) => r.status === "success").length;
      const failedCount = results.filter((r) => r.status === "failed").length;
      const skippedCount = results.filter((r) => r.status === "skipped").length;

      if (failedCount === 0) {
        toast.success(
          `Batch complete: ${successCount} scheduled${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
        );
      } else {
        toast.warning(
          `Batch complete: ${successCount} scheduled, ${failedCount} failed${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
        );
      }
    } catch (error) {
      toast.error("Batch processing failed");
      console.error("Batch processing error:", error);
    }
  };

  return {
    handleStartProcessing,
  };
}
