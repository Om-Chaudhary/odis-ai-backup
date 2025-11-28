"use client";

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  FileCheck,
  Phone,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";

interface CompletionIndicatorProps {
  type: "soap" | "discharge" | "call" | "email";
  completed?: boolean;
  scheduled?: boolean;
  timestamp?: string;
  size?: "sm" | "md";
}

const TYPE_CONFIG: Record<
  "soap" | "discharge" | "call" | "email",
  { label: string; icon: LucideIcon }
> = {
  soap: { label: "SOAP Note", icon: FileText },
  discharge: { label: "Discharge Summary", icon: FileCheck },
  call: { label: "Call", icon: Phone },
  email: { label: "Email", icon: Mail },
};

export function CompletionIndicator({
  type,
  completed,
  scheduled,
  timestamp,
  size = "md",
}: CompletionIndicatorProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (completed) {
    return (
      <div className={cn("flex items-center gap-2", textSize)}>
        <CheckCircle2
          className={cn(
            iconSize,
            "shrink-0 text-emerald-600 transition-colors",
          )}
        />
        <span className="text-slate-700">{config.label}</span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className={cn("flex items-center gap-2", textSize)}>
        <Clock
          className={cn(iconSize, "shrink-0 text-amber-600 transition-colors")}
        />
        <span className="text-slate-700">{config.label} Scheduled</span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", textSize)}>
      <AlertCircle
        className={cn(iconSize, "shrink-0 text-amber-600 transition-colors")}
      />
      <span className="text-amber-700">Missing {config.label}</span>
    </div>
  );
}
