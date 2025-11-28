"use client";

import { type ReactNode } from "react";
import { type LucideIcon, FileText } from "lucide-react";
import { cn } from "~/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  showFilterHint?: boolean;
  activeDateFilter?: string | null;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  title = "No cases found",
  description,
  icon: Icon = FileText,
  showFilterHint = false,
  activeDateFilter,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const getDescription = () => {
    if (description) return description;

    if (showFilterHint && activeDateFilter && activeDateFilter !== "all") {
      const filterLabels: Record<string, string> = {
        "1d": "last 24 hours",
        "3d": "last 3 days",
        "30d": "last 30 days",
      };
      const filterLabel =
        filterLabels[activeDateFilter] ?? "selected date range";
      return `No cases found for the ${filterLabel}. Try adjusting your date filter or check back later for new cases.`;
    }

    return "There are no cases matching your criteria. Try adjusting your filters or check back later for new discharge summaries.";
  };

  const sizeClasses = {
    sm: {
      container: "min-h-[200px] p-6",
      icon: "h-10 w-10",
      iconContainer: "h-16 w-16",
      title: "text-base",
      description: "text-xs",
    },
    md: {
      container: "min-h-[400px] p-8",
      icon: "h-12 w-12",
      iconContainer: "h-20 w-20",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "min-h-[500px] p-12",
      icon: "h-16 w-16",
      iconContainer: "h-24 w-24",
      title: "text-xl",
      description: "text-base",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "animate-in fade-in-50 slide-in-from-bottom-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 text-center duration-500",
        currentSize.container,
        className,
      )}
    >
      {/* Animated Icon Container */}
      <div
        className={cn(
          "relative mb-6 flex items-center justify-center",
          currentSize.iconContainer,
        )}
      >
        {/* Floating background circle */}
        <div className="absolute inset-0 animate-[float_3s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-teal-100/40 via-blue-100/30 to-purple-100/20 blur-xl" />

        {/* Icon container with bounce animation */}
        <div className="relative z-10 flex animate-[bounce-gentle_2s_ease-in-out_infinite] items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-50 p-4 shadow-lg ring-1 shadow-teal-500/10 ring-slate-200/50">
          <Icon className={cn("text-slate-400", currentSize.icon)} />
        </div>

        {/* Sparkle effect */}
        <div className="absolute -top-1 -right-1 z-20">
          <div className="h-2 w-2 animate-[sparkle_2s_ease-in-out_infinite] rounded-full bg-teal-400/60" />
        </div>
        <div className="absolute -bottom-1 -left-1 z-20">
          <div className="h-1.5 w-1.5 animate-[sparkle_2s_ease-in-out_infinite_0.5s] rounded-full bg-blue-400/60" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-sm space-y-2">
        <h3 className={cn("font-semibold text-slate-700", currentSize.title)}>
          {title}
        </h3>
        <p
          className={cn(
            "leading-relaxed text-slate-500",
            currentSize.description,
          )}
        >
          {getDescription()}
        </p>
      </div>

      {/* Action Button */}
      {action && (
        <div className="animate-in fade-in-50 slide-in-from-bottom-2 mt-6 delay-300">
          {action}
        </div>
      )}
    </div>
  );
}
