"use client";

import { type ReactNode } from "react";
import { type LucideIcon, FileText } from "lucide-react";
import { cn } from "@odis-ai/utils";

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
  title = "No items found",
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
      return `No items found for the ${filterLabel}. Try adjusting your date filter or check back later.`;
    }

    return "There are no items matching your criteria. Try adjusting your filters or check back later.";
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
        "animate-in fade-in-50 slide-in-from-bottom-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/60 bg-gradient-to-br from-white/40 via-white/30 to-white/20 text-center shadow-lg shadow-slate-200/20 backdrop-blur-md duration-500",
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
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-100/40 via-blue-100/30 to-purple-100/20 blur-xl"
          style={{
            animation: "float 3s ease-in-out infinite",
          }}
        />

        {/* Icon container with bounce animation */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-white/80 via-white/60 to-white/40 p-4 shadow-lg ring-1 shadow-teal-500/10 ring-white/50 backdrop-blur-sm"
          style={{
            animation: "bounce-gentle 2s ease-in-out infinite",
          }}
        >
          <Icon className={cn("text-slate-400", currentSize.icon)} />
        </div>

        {/* Sparkle effect */}
        <div className="absolute -top-1 -right-1 z-20">
          <div
            className="h-2 w-2 rounded-full bg-teal-400/60"
            style={{
              animation: "sparkle 2s ease-in-out infinite",
            }}
          />
        </div>
        <div className="absolute -bottom-1 -left-1 z-20">
          <div
            className="h-1.5 w-1.5 rounded-full bg-blue-400/60"
            style={{
              animation: "sparkle 2s ease-in-out infinite 0.5s",
            }}
          />
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
