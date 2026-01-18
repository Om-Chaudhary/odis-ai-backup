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
 *   title="After-Hours Communications"
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
          "flex items-center justify-between gap-4",
          "border-b border-slate-200/60",
          "bg-white/70 backdrop-blur-sm",
          "px-5 py-3",
        )}
      >
        {/* Left: Icon + Title Area */}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/20">
              <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-base font-semibold text-slate-800">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
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
            "border-b border-slate-200/40",
            "bg-white/50 backdrop-blur-sm",
            "px-5 py-2.5",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
