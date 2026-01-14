"use client";

import { Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";

export interface DataTableEmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function DataTableEmptyState({
  title = "No data",
  description = "No items to display.",
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: DataTableEmptyStateProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-50 flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-teal-200/50 p-12 text-center",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50/50">
        <Icon className="h-7 w-7 text-teal-400/70" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-2 mb-5 max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
