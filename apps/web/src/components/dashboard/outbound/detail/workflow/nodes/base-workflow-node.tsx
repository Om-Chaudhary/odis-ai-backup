"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@odis-ai/shared/util";

export type NodeStatus = "completed" | "pending" | "failed" | "preview";

interface BaseWorkflowNodeProps {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  timestamp?: string;
  status: NodeStatus;
  children?: ReactNode;
  actions?: ReactNode;
  isLarge?: boolean;
  pulseAnimation?: boolean;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  className?: string;
  isClickable?: boolean;
}

const statusStyles: Record<NodeStatus, { border: string; bg: string }> = {
  completed: {
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50/80 dark:bg-emerald-950/50",
  },
  pending: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50/80 dark:bg-amber-950/50",
  },
  failed: {
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50/80 dark:bg-red-950/50",
  },
  preview: {
    border: "border-dashed border-slate-300 dark:border-slate-600",
    bg: "bg-slate-50/50 dark:bg-slate-900/50",
  },
};

/**
 * Base workflow node component that provides consistent styling
 * for all workflow node types.
 */
function BaseWorkflowNodeComponent({
  icon,
  title,
  subtitle,
  timestamp,
  status,
  children,
  actions,
  isLarge = false,
  pulseAnimation = false,
  showSourceHandle = true,
  showTargetHandle = true,
  className,
  isClickable = false,
}: BaseWorkflowNodeProps) {
  const styles = statusStyles[status];

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-200",
        styles.border,
        styles.bg,
        isLarge ? "min-w-[280px] p-4" : "min-w-[200px] p-3",
        pulseAnimation && "animate-pulse",
        isClickable &&
          "cursor-pointer hover:scale-[1.02] hover:border-teal-400 hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      {/* Target Handle (top) */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            "!h-2 !w-2 !border-2 !bg-white dark:!bg-slate-800",
            status === "completed" && "!border-emerald-400",
            status === "pending" && "!border-amber-400",
            status === "failed" && "!border-red-400",
            status === "preview" && "!border-slate-400",
          )}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg",
              status === "completed" && "bg-emerald-100 dark:bg-emerald-900/50",
              status === "pending" && "bg-amber-100 dark:bg-amber-900/50",
              status === "failed" && "bg-red-100 dark:bg-red-900/50",
              status === "preview" && "bg-slate-100 dark:bg-slate-800",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h4
              className={cn(
                "text-sm leading-tight font-semibold",
                status === "completed" &&
                  "text-emerald-800 dark:text-emerald-200",
                status === "pending" && "text-amber-800 dark:text-amber-200",
                status === "failed" && "text-red-800 dark:text-red-200",
                status === "preview" && "text-slate-600 dark:text-slate-300",
              )}
            >
              {title}
            </h4>
            {subtitle && (
              <p className="max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {timestamp && (
          <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
            {timestamp}
          </span>
        )}
      </div>

      {/* Content */}
      {children && <div className="mt-3">{children}</div>}

      {/* Actions */}
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}

      {/* Source Handle (bottom) */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            "!h-2 !w-2 !border-2 !bg-white dark:!bg-slate-800",
            status === "completed" && "!border-emerald-400",
            status === "pending" && "!border-amber-400",
            status === "failed" && "!border-red-400",
            status === "preview" && "!border-slate-400",
          )}
        />
      )}
    </div>
  );
}

export const BaseWorkflowNode = memo(BaseWorkflowNodeComponent);
