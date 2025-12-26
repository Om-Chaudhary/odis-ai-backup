"use client";

import { AlertTriangle, PhoneCall } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

type AttentionType = "urgent" | "callback" | "escalation";

interface AttentionBannerProps {
  type: AttentionType;
  title: string;
  description?: string;
}

const typeConfig: Record<
  AttentionType,
  {
    icon: typeof AlertTriangle;
    bgClass: string;
    borderClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
  urgent: {
    icon: AlertTriangle,
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    textClass: "text-red-800 dark:text-red-200",
    iconClass: "text-red-600 dark:text-red-400",
  },
  escalation: {
    icon: AlertTriangle,
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    textClass: "text-red-800 dark:text-red-200",
    iconClass: "text-red-600 dark:text-red-400",
  },
  callback: {
    icon: PhoneCall,
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-amber-200 dark:border-amber-800",
    textClass: "text-amber-800 dark:text-amber-200",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
};

/**
 * Attention Banner - Displays an urgent/callback/escalation alert at the top of detail panels
 */
export function AttentionBanner({
  type,
  title,
  description,
}: AttentionBannerProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        config.bgClass,
        config.borderClass,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClass)} />
        <div>
          <p className={cn("text-sm font-medium", config.textClass)}>{title}</p>
          {description && (
            <p className={cn("mt-0.5 text-xs opacity-80", config.textClass)}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
