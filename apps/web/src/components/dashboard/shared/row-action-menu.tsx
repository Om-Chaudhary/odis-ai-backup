"use client";

import { type LucideIcon, MoreVertical } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import { cn } from "@odis-ai/shared/util";

/**
 * Single action item for the row action menu
 */
export interface RowAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Visual variant */
  variant?: "default" | "destructive";
  /** Whether action is disabled */
  disabled?: boolean;
  /** Optional description shown on hover */
  description?: string;
}

/**
 * Props for the RowActionMenu component
 */
interface RowActionMenuProps {
  /** Array of action items */
  actions: RowAction[];
  /** Additional class for the trigger button */
  triggerClassName?: string;
  /** Accessible label for the menu */
  ariaLabel?: string;
}

/**
 * RowActionMenu - Reusable dropdown for row-level actions
 *
 * Features:
 * - Configurable action items with icons
 * - Support for destructive variants
 * - Keyboard accessible
 * - Stops event propagation (won't trigger row selection)
 *
 * Usage:
 * ```tsx
 * <RowActionMenu
 *   actions={[
 *     { id: 'play', label: 'Play Recording', icon: Play, onClick: () => {} },
 *     { id: 'copy', label: 'Copy Phone', icon: Copy, onClick: handleCopy },
 *     { id: 'delete', label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' },
 *   ]}
 * />
 * ```
 */
export function RowActionMenu({
  actions,
  triggerClassName,
  ariaLabel = "Row actions",
}: RowActionMenuProps) {
  if (actions.length === 0) return null;

  // Split actions into regular and destructive
  const regularActions = actions.filter((a) => a.variant !== "destructive");
  const destructiveActions = actions.filter((a) => a.variant === "destructive");
  const hasDestructiveSection =
    destructiveActions.length > 0 && regularActions.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            "text-slate-400 hover:text-slate-600",
            "hover:bg-slate-100",
            "focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
            "transition-colors duration-150",
            triggerClassName,
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label={ariaLabel}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Regular actions */}
        {regularActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className="cursor-pointer gap-2"
            >
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </DropdownMenuItem>
          );
        })}

        {/* Separator before destructive actions */}
        {hasDestructiveSection && <DropdownMenuSeparator />}

        {/* Destructive actions */}
        {destructiveActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
            >
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
