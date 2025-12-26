"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Dashboard Page Header
 *
 * Provides a consistent header structure for dashboard pages with:
 * - Icon + Title + Subtitle (left)
 * - Actions slot (right)
 * - Children slot for toolbar content below
 *
 * Usage:
 * ```tsx
 * <DashboardPageHeader
 *   title="Inbound Communications"
 *   subtitle="Manage incoming calls, appointments, and messages"
 *   icon={PhoneIncoming}
 *   actions={<Button>Schedule All</Button>}
 * >
 *   <DashboardToolbar ... />
 * </DashboardPageHeader>
 * ```
 */
export function DashboardPageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header Row */}
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          "border-b border-teal-100/50",
          "bg-gradient-to-r from-white/50 to-teal-50/30",
          "px-4 py-4",
        )}
      >
        {/* Left: Icon + Title Area */}
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100/50">
              <Icon className="h-5 w-5 text-teal-600" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Toolbar Row (children) */}
      {children && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-4",
            "border-b border-teal-100/30",
            "bg-white/40 backdrop-blur-sm",
            "px-4 py-3",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
