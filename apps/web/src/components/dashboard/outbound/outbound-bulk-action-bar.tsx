"use client";

import { Button } from "@odis-ai/ui/button";
import { X, Send, Loader2 } from "lucide-react";
import { cn } from "@odis-ai/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onScheduleSelected: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}

/**
 * Floating bulk action bar for multi-select operations
 * Appears at bottom of screen when cases are selected
 */
export function OutboundBulkActionBar({
  selectedCount,
  onScheduleSelected,
  onClearSelection,
  isProcessing,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
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
            disabled={isProcessing}
            className="h-9"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>

          <Button
            size="sm"
            onClick={onScheduleSelected}
            disabled={isProcessing}
            className={cn(
              "h-9 gap-2 bg-teal-600 hover:bg-teal-700",
              isProcessing && "cursor-not-allowed opacity-60",
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Schedule Selected
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
