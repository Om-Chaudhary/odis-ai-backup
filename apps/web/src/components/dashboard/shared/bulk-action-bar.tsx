"use client";

import { type LucideIcon, X, Loader2 } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";

/**
 * Single action item for the bulk action bar
 */
export interface BulkAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label */
  label: string;
  /** Optional Lucide icon component */
  icon?: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: "default" | "outline" | "destructive";
  /** Whether action is in loading state */
  loading?: boolean;
  /** Whether action is disabled */
  disabled?: boolean;
}

/**
 * Props for the BulkActionBar component
 */
interface BulkActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Array of action buttons */
  actions: BulkAction[];
  /** Whether the bar should be hidden (e.g., during background operation) */
  isHidden?: boolean;
  /** Additional class for the container */
  className?: string;
  /** Item label (singular) - default: "item" */
  itemLabel?: string;
  /** Item label (plural) - default: "items" */
  itemLabelPlural?: string;
}

/**
 * BulkActionBar - Floating action bar for multi-select operations
 *
 * Appears at bottom of screen when items are selected.
 * Provides configurable action buttons and selection count display.
 *
 * Features:
 * - Configurable action buttons with icons
 * - Loading states per action
 * - Destructive action styling
 * - Clear selection button
 * - Smooth slide-in animation
 *
 * Usage:
 * ```tsx
 * <BulkActionBar
 *   selectedCount={selectedIds.length}
 *   onClearSelection={() => setSelected(new Set())}
 *   actions={[
 *     {
 *       id: 'confirm',
 *       label: 'Confirm All',
 *       icon: CheckCircle,
 *       onClick: handleBulkConfirm,
 *     },
 *     {
 *       id: 'export',
 *       label: 'Export',
 *       icon: Download,
 *       onClick: handleExport,
 *       variant: 'outline',
 *     },
 *   ]}
 * />
 * ```
 */
export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  isHidden = false,
  className,
  itemLabel = "item",
  itemLabelPlural = "items",
}: BulkActionBarProps) {
  // Hide bar when no items selected or when explicitly hidden
  if (selectedCount === 0 || isHidden) return null;

  const displayLabel = selectedCount === 1 ? itemLabel : itemLabelPlural;

  return (
    <div
      className={cn(
        "animate-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-white px-6 py-3 shadow-lg backdrop-blur-sm">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-slate-700">
            {displayLabel} selected
          </span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Clear selection button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-9"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>

          {/* Dynamic action buttons */}
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = action.loading;
            const isDisabled = action.disabled ?? isLoading;

            // Determine button classes based on variant
            const variantClasses = {
              default: "bg-teal-600 hover:bg-teal-700 text-white",
              outline: "border-slate-200 hover:bg-slate-50",
              destructive:
                "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700",
            };

            return (
              <Button
                key={action.id}
                variant={
                  action.variant === "destructive" ? "outline" : action.variant
                }
                size="sm"
                onClick={action.onClick}
                disabled={isDisabled}
                className={cn(
                  "h-9 gap-2",
                  action.variant && variantClasses[action.variant],
                  isDisabled && "cursor-not-allowed opacity-60",
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : Icon ? (
                  <Icon className="h-4 w-4" />
                ) : null}
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
