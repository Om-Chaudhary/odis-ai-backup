"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { BaseWorkflowNode } from "./base-workflow-node";
import { cn } from "@odis-ai/shared/util";

type AttentionSeverity = "critical" | "urgent" | "routine";

interface AttentionNodeData {
  severity: AttentionSeverity;
  summary: string;
  types?: string[];
  timestamp?: string;
}

const severityConfig: Record<
  AttentionSeverity,
  {
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeVariant: "destructive" | "default" | "secondary";
    pulse: boolean;
  }
> = {
  critical: {
    label: "CRITICAL",
    bgColor: "bg-red-50 dark:bg-red-950/50",
    borderColor: "border-red-300 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-300",
    badgeVariant: "destructive",
    pulse: true,
  },
  urgent: {
    label: "URGENT",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
    borderColor: "border-orange-300 dark:border-orange-800",
    textColor: "text-orange-700 dark:text-orange-300",
    badgeVariant: "default",
    pulse: true,
  },
  routine: {
    label: "ROUTINE",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-300 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    badgeVariant: "secondary",
    pulse: false,
  },
};

// Format attention type labels
function formatAttentionType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Attention Node - Prominently displays attention alerts from Vapi structured outputs.
 * Uses severity-based styling with pulsing animations for critical/urgent cases.
 */
function AttentionNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as AttentionNodeData;

  const severity = nodeData?.severity ?? "routine";
  const config = severityConfig[severity];

  return (
    <BaseWorkflowNode
      icon={
        <AlertTriangle
          className={cn(
            "h-5 w-5",
            severity === "critical" && "text-red-600",
            severity === "urgent" && "text-orange-600",
            severity === "routine" && "text-blue-600",
          )}
        />
      }
      title="Attention Required"
      subtitle={
        <Badge variant={config.badgeVariant} className="h-4 px-1.5 text-[10px]">
          {config.label}
        </Badge>
      }
      timestamp={nodeData?.timestamp}
      status={severity === "critical" ? "failed" : "pending"}
      isLarge={true}
      pulseAnimation={config.pulse}
      className={cn(config.borderColor, config.bgColor)}
      isClickable={true}
    >
      <div className="space-y-2">
        {/* Summary */}
        <div className={cn("rounded-lg bg-white/60 p-2 dark:bg-slate-800/60")}>
          <p className={cn("text-sm leading-relaxed", config.textColor)}>
            {nodeData?.summary ?? "This case requires your attention."}
          </p>
        </div>

        {/* Attention Types */}
        {nodeData?.types && nodeData.types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {nodeData.types.map((type) => (
              <Badge
                key={type}
                variant="outline"
                className={cn(
                  "h-5 text-[10px]",
                  config.textColor,
                  config.borderColor,
                )}
              >
                {formatAttentionType(type)}
              </Badge>
            ))}
          </div>
        )}

        {/* Click hint */}
        <div className="flex items-center justify-center gap-1 pt-1 text-[10px] text-slate-400 opacity-70">
          <ExternalLink className="h-3 w-3" />
          <span>Click to view details</span>
        </div>
      </div>
    </BaseWorkflowNode>
  );
}

export const AttentionNode = memo(AttentionNodeComponent);
