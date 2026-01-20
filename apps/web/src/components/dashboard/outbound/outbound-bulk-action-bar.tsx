"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClinic } from "@odis-ai/shared/ui/clinic-context";
import { Button } from "@odis-ai/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/shared/ui/alert-dialog";
import { X, Send, Loader2, Ban } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface BulkActionBarProps {
  selectedCount: number;
  /** Selected case IDs for navigation */
  selectedCaseIds: string[];
  onCancelSelected?: () => void;
  onClearSelection: () => void;
  isCancelling?: boolean;
  /** Whether to show cancel button (only for scheduled cases) */
  showCancelAction?: boolean;
  /** Whether a background operation is active (hides the bar) */
  isBackgroundOperationActive?: boolean;
}

/**
 * Floating bulk action bar for multi-select operations
 * Appears at bottom of screen when cases are selected
 */
export function OutboundBulkActionBar({
  selectedCount,
  selectedCaseIds,
  onCancelSelected,
  onClearSelection,
  isCancelling = false,
  showCancelAction = false,
  isBackgroundOperationActive = false,
}: BulkActionBarProps) {
  const router = useRouter();
  const { clinicSlug } = useClinic();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Hide bar when no cases selected or when background operation is running
  if (selectedCount === 0 || isBackgroundOperationActive) return null;

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    onCancelSelected?.();
  };

  const handleScheduleMultiple = () => {
    // Navigate to bulk schedule page with case IDs
    const params = new URLSearchParams();
    params.set("cases", selectedCaseIds.join(","));
    router.push(`/dashboard/${clinicSlug}/outbound/bulk-schedule?${params.toString()}`);
  };

  return (
    <>
      <div className="animate-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-white px-6 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-slate-700">
              {selectedCount === 1 ? "case" : "cases"} selected
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isCancelling}
              className="h-9"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>

            {showCancelAction && onCancelSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                disabled={isCancelling}
                className={cn(
                  "h-9 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700",
                  isCancelling && "cursor-not-allowed opacity-60",
                )}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Cancel Scheduled
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleScheduleMultiple}
              disabled={isCancelling}
              className="h-9 gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Send className="h-4 w-4" />
              Schedule Multiple
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel {selectedCount} Scheduled{" "}
              {selectedCount === 1 ? "Delivery" : "Deliveries"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel all scheduled phone calls and emails for the
              selected cases. They will need to be rescheduled manually if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Scheduled
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
