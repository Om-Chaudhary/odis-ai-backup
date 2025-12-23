"use client";

import { useState } from "react";
import { Button } from "@odis-ai/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/ui/dropdown-menu";
import {
  X,
  Send,
  Loader2,
  Ban,
  ChevronDown,
  Calendar,
  Zap,
} from "lucide-react";
import { cn } from "@odis-ai/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onScheduleSelected: () => void;
  onSendInstantly: () => void;
  onCancelSelected?: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
  isCancelling?: boolean;
  /** Whether to show cancel button (only for scheduled cases) */
  showCancelAction?: boolean;
}

/**
 * Floating bulk action bar for multi-select operations
 * Appears at bottom of screen when cases are selected
 */
export function OutboundBulkActionBar({
  selectedCount,
  onScheduleSelected,
  onSendInstantly,
  onCancelSelected,
  onClearSelection,
  isProcessing,
  isCancelling = false,
  showCancelAction = false,
}: BulkActionBarProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (selectedCount === 0) return null;

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    onCancelSelected?.();
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
              disabled={isProcessing || isCancelling}
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
                disabled={isProcessing || isCancelling}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={isProcessing || isCancelling}
                  className={cn(
                    "h-9 gap-2 bg-teal-600 hover:bg-teal-700",
                    isProcessing && "cursor-not-allowed opacity-60",
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onScheduleSelected}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSendInstantly}>
                  <Zap className="mr-2 h-4 w-4" />
                  Send All Instantly
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
