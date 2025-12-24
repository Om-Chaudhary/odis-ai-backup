import { Badge } from "@odis-ai/shared/ui/badge";
import { Progress } from "@odis-ai/shared/ui/progress";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import { Separator } from "@odis-ai/shared/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@odis-ai/shared/ui/card";
import {
  Loader2,
  CheckCircle,
  XCircle,
  SkipForward,
  CircleDashed,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { BatchEligibleCase } from "@odis-ai/shared/types";
import type { ProcessingStatus } from "../types";

interface ProcessingStepProps {
  processingResults: Map<string, ProcessingStatus>;
  processingErrors: Map<string, string>;
  eligibleCases: BatchEligibleCase[];
}

export function ProcessingStep({
  processingResults,
  processingErrors,
  eligibleCases,
}: ProcessingStepProps) {
  const completedCount = Array.from(processingResults.values()).filter(
    (s) => s === "success" || s === "failed" || s === "skipped",
  ).length;
  const totalCount = processingResults.size;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const statusCounts = {
    pending: Array.from(processingResults.values()).filter(
      (s) => s === "pending",
    ).length,
    processing: Array.from(processingResults.values()).filter(
      (s) => s === "processing",
    ).length,
    success: Array.from(processingResults.values()).filter(
      (s) => s === "success",
    ).length,
    failed: Array.from(processingResults.values()).filter((s) => s === "failed")
      .length,
    skipped: Array.from(processingResults.values()).filter(
      (s) => s === "skipped",
    ).length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2.5">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
          <div>
            <CardTitle>Processing Discharges</CardTitle>
            <CardDescription>
              Scheduling communications for each case...
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedCount} / {totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CircleDashed className="h-4 w-4 text-slate-400" />
            <span>Pending ({statusCounts.pending})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span>Processing ({statusCounts.processing})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Success ({statusCounts.success})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Failed ({statusCounts.failed})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SkipForward className="h-4 w-4 text-amber-500" />
            <span>Skipped ({statusCounts.skipped})</span>
          </div>
        </div>

        <Separator />

        {/* Processing List */}
        <ScrollArea className="h-80 rounded-lg border">
          <div className="divide-y p-2">
            {Array.from(processingResults.entries()).map(([caseId, status]) => {
              const caseData = eligibleCases.find((c) => c.id === caseId);
              const errorMsg = processingErrors.get(caseId);
              return (
                <div
                  key={caseId}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5",
                    status === "skipped" && "opacity-60",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {status === "pending" && (
                      <CircleDashed className="h-4 w-4 text-slate-400" />
                    )}
                    {status === "processing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {status === "success" && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    {status === "failed" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {status === "skipped" && (
                      <SkipForward className="h-4 w-4 text-amber-500" />
                    )}
                    <div>
                      <span className="font-medium">
                        {caseData?.patientName ?? "Unknown"}
                      </span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        — {caseData?.ownerName ?? ""}
                      </span>
                      {errorMsg && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {errorMsg}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      status === "pending" && "border-slate-200 text-slate-500",
                      status === "processing" &&
                        "border-blue-200 bg-blue-50 text-blue-700",
                      status === "success" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      status === "failed" &&
                        "border-red-200 bg-red-50 text-red-700",
                      status === "skipped" &&
                        "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
