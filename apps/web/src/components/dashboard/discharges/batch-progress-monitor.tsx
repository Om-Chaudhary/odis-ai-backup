"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import { Progress } from "@odis-ai/shared/ui/progress";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Minimize2,
  X,
  XCircle,
  Download,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { api } from "~/trpc/client";
import type { AppRouterOutputs } from "~/trpc/client";

type BatchStatusRaw = NonNullable<AppRouterOutputs["cases"]["getBatchStatus"]>;
type BatchItem = BatchStatusRaw["discharge_batch_items"][number];
type BatchStatus = Omit<BatchStatusRaw, "discharge_batch_items"> & {
  discharge_batch_items: BatchItem[];
};

interface BatchProgressMonitorProps {
  batchId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function BatchProgressMonitor({
  batchId,
  onComplete,
  onCancel,
}: BatchProgressMonitorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);

  // Query batch status with polling
  const { data, isLoading } = api.cases.getBatchStatus.useQuery(
    { batchId },
    {
      refetchInterval: 2000, // Poll every 2 seconds
    },
  );

  // Handle batch status updates
  useEffect(() => {
    if (data) {
      setBatchStatus(data);
      // Check if batch is complete
      if (
        data.status === "completed" ||
        data.status === "partial_success" ||
        data.status === "cancelled"
      ) {
        onComplete?.();
      }
    }
  }, [data, onComplete]);

  // Cancel batch mutation
  const cancelBatchMutation = api.cases.cancelBatch.useMutation({
    onSuccess: () => {
      onCancel?.();
    },
  });

  const handleCancel = () => {
    if (batchStatus?.status === "processing") {
      cancelBatchMutation.mutate({ batchId });
    }
  };

  const handleDownloadReport = () => {
    if (!batchStatus) return;

    // Create CSV report
    const items: BatchItem[] = Array.isArray(batchStatus.discharge_batch_items)
      ? batchStatus.discharge_batch_items
      : [];
    const rows: string[][] = [
      ["Patient Name", "Status", "Email Scheduled", "Call Scheduled", "Error"],
      ...items.map((item) => [
        item.patientName,
        item.status,
        item.email_scheduled ? "Yes" : "No",
        item.call_scheduled ? "Yes" : "No",
        item.error_message ?? "",
      ]),
    ];
    const csvContent = rows.map((row) => row.join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discharge-batch-${batchId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!batchStatus && !isLoading) {
    return null;
  }

  const progress = batchStatus
    ? (batchStatus.processed_cases / batchStatus.total_cases) * 100
    : 0;

  const isComplete =
    batchStatus?.status === "completed" ||
    batchStatus?.status === "partial_success" ||
    batchStatus?.status === "cancelled";

  // Minimized view
  if (isMinimized) {
    return (
      <div className="bg-background fixed right-4 bottom-4 z-50 w-80 rounded-lg border p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isComplete ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : batchStatus?.status === "completed" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : batchStatus?.status === "cancelled" ? (
              <XCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              Batch Processing: {batchStatus?.processed_cases ?? 0} of{" "}
              {batchStatus?.total_cases ?? 0}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(false)}
            className="h-6 w-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
              <path d="M9 12h12" />
            </svg>
          </Button>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </div>
    );
  }

  // Full dialog view
  return (
    <Dialog
      open={true}
      onOpenChange={() => {
        /* Dialog is always open */
      }}
    >
      <DialogContent
        className="max-w-3xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Batch Discharge Progress</DialogTitle>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogDescription>
            Processing discharge communications for multiple cases
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {batchStatus?.processed_cases ?? 0} of{" "}
                {batchStatus?.total_cases ?? 0} cases processed
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Total"
              value={batchStatus?.total_cases ?? 0}
              icon={<Clock className="h-4 w-4" />}
              variant="default"
            />
            <StatCard
              label="Successful"
              value={batchStatus?.successful_cases ?? 0}
              icon={<CheckCircle className="h-4 w-4" />}
              variant="success"
            />
            <StatCard
              label="Failed"
              value={batchStatus?.failed_cases ?? 0}
              icon={<XCircle className="h-4 w-4" />}
              variant="error"
            />
            <StatCard
              label="Pending"
              value={
                (batchStatus?.total_cases ?? 0) -
                (batchStatus?.processed_cases ?? 0)
              }
              icon={<Loader2 className="h-4 w-4" />}
              variant="pending"
            />
          </div>

          {/* Detailed Log */}
          <div className="space-y-2">
            <h3 className="font-medium">Processing Log</h3>
            <ScrollArea className="h-64 rounded-lg border">
              <div className="p-2">
                {batchStatus?.discharge_batch_items &&
                Array.isArray(batchStatus.discharge_batch_items)
                  ? batchStatus.discharge_batch_items.map(
                      (item, index: number) => (
                        <LogEntry key={item.id ?? index} item={item} />
                      ),
                    )
                  : null}
                {(!batchStatus?.discharge_batch_items ||
                  batchStatus.discharge_batch_items.length === 0) && (
                  <div className="text-muted-foreground py-8 text-center">
                    No items processed yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Batch Status:
              </span>
              <StatusBadge status={batchStatus?.status ?? "pending"} />
            </div>
            {batchStatus?.completed_at && (
              <span className="text-muted-foreground text-sm">
                Completed at{" "}
                {new Date(batchStatus.completed_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isComplete && (
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
          {batchStatus?.status === "processing" ? (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelBatchMutation.isPending}
            >
              {cancelBatchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Processing
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => onComplete?.()}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Log Entry Component
function LogEntry({ item }: { item: BatchItem }) {
  const getStatusIcon = () => {
    switch (item.status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b py-2 last:border-0",
        item.status === "failed" && "bg-red-50/50 dark:bg-red-950/20",
      )}
    >
      <div className="mt-0.5">{getStatusIcon()}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.patientName}</span>
          {item.email_scheduled && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              Email
            </Badge>
          )}
          {item.call_scheduled && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              Call
            </Badge>
          )}
        </div>
        {item.error_message && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {item.error_message}
          </p>
        )}
        {item.processed_at && (
          <p className="text-muted-foreground text-xs">
            {new Date(item.processed_at).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "default" | "success" | "error" | "pending";
}) {
  const variantClasses = {
    default: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    pending: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="bg-background rounded-lg border p-3">
      <div className={cn("flex items-center gap-2", variantClasses[variant])}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "completed":
        return "default"; // Changed from "success"
      case "partial_success":
        return "secondary"; // Changed from "warning"
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "partial_success":
        return "Partial Success";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge
      variant={
        getVariant() as "default" | "secondary" | "destructive" | "outline"
      }
    >
      {getLabel()}
    </Badge>
  );
}
