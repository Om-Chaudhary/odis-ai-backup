"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Phone,
  Pill,
  Calendar,
  MessageCircle,
  DollarSign,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/ui/tooltip";

/**
 * Attention type configuration
 */
interface AttentionTypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
}

/**
 * Get configuration for an attention type
 */
export function getAttentionTypeConfig(type: string): AttentionTypeConfig {
  const configs: Record<string, AttentionTypeConfig> = {
    health_concern: {
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Health Concern",
    },
    callback_request: {
      icon: Phone,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Callback Request",
    },
    medication_question: {
      icon: Pill,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      label: "Medication Question",
    },
    appointment_needed: {
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "Appointment Needed",
    },
    dissatisfaction: {
      icon: MessageCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      label: "Dissatisfaction",
    },
    billing_question: {
      icon: DollarSign,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      label: "Billing Question",
    },
    emergency_signs: {
      icon: AlertOctagon,
      color: "text-red-700",
      bgColor: "bg-red-200",
      label: "Emergency Signs",
    },
  };

  return (
    configs[type] ?? {
      icon: AlertTriangle,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  );
}

/**
 * Props for AttentionTypeBadge
 */
interface AttentionTypeBadgeProps {
  type: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

/**
 * Single attention type badge with icon
 */
export function AttentionTypeBadge({
  type,
  size = "sm",
  showLabel = true,
}: AttentionTypeBadgeProps) {
  const config = getAttentionTypeConfig(type);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-5 px-1.5 text-xs gap-1",
    md: "h-6 px-2 text-xs gap-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center rounded-full font-medium",
              config.bgColor,
              config.color,
              sizeClasses[size],
            )}
          >
            <Icon className={iconSizes[size]} />
            {showLabel && <span className="truncate">{config.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Props for AttentionSeverityBadge
 */
interface AttentionSeverityBadgeProps {
  severity: string;
  size?: "sm" | "md";
}

/**
 * Severity badge with color coding
 * - Critical: red with pulse animation
 * - Urgent: orange
 * - Routine: blue
 */
export function AttentionSeverityBadge({
  severity,
  size = "sm",
}: AttentionSeverityBadgeProps) {
  const sizeClasses = {
    sm: "h-5 px-2 text-xs",
    md: "h-6 px-2.5 text-xs",
  };

  const severityConfig: Record<
    string,
    { label: string; className: string; pulse?: boolean }
  > = {
    critical: {
      label: "Critical",
      className: "bg-red-100 text-red-700 border border-red-200",
      pulse: true,
    },
    urgent: {
      label: "Urgent",
      className: "bg-orange-100 text-orange-700 border border-orange-200",
    },
    routine: {
      label: "Routine",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
    },
  };

  const config = severityConfig[severity] ?? severityConfig.routine;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        sizeClasses[size],
        config?.className,
        config?.pulse && "animate-pulse",
      )}
    >
      {config?.label}
    </span>
  );
}

/**
 * Props for AttentionBadgeGroup
 */
interface AttentionBadgeGroupProps {
  types: string[];
  maxVisible?: number;
  size?: "sm" | "md";
}

/**
 * Group of attention type badges with overflow handling
 */
export function AttentionBadgeGroup({
  types,
  maxVisible = 3,
  size = "sm",
}: AttentionBadgeGroupProps) {
  if (!types || types.length === 0) {
    return null;
  }

  const visibleTypes = types.slice(0, maxVisible);
  const hiddenCount = types.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleTypes.map((type) => (
        <AttentionTypeBadge
          key={type}
          type={type}
          size={size}
          showLabel={size === "md"}
        />
      ))}
      {hiddenCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600",
                  size === "sm" ? "h-5 px-1.5 text-xs" : "h-6 px-2 text-xs",
                )}
              >
                +{hiddenCount}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                {types.slice(maxVisible).map((type) => (
                  <span key={type}>{getAttentionTypeConfig(type).label}</span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Pulsing dot indicator for critical severity
 */
export function CriticalPulsingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}
