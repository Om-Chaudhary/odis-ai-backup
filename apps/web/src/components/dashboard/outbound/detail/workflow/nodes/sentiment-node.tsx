"use client";

import { memo, useState } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { BaseWorkflowNode } from "./base-workflow-node";
import { cn } from "@odis-ai/utils";

type SentimentType = "positive" | "neutral" | "negative";

interface SentimentNodeData {
  sentiment: SentimentType;
  summary?: string;
  timestamp?: string;
}

const sentimentConfig: Record<
  SentimentType,
  {
    icon: typeof Smile;
    emoji: string;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  positive: {
    icon: Smile,
    emoji: "😊",
    label: "Positive",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
  },
  neutral: {
    icon: Meh,
    emoji: "😐",
    label: "Neutral",
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  negative: {
    icon: Frown,
    emoji: "😟",
    label: "Needs Attention",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/50",
  },
};

/**
 * Sentiment Node - Displays customer sentiment from call analysis.
 * Can be expanded to show the full summary.
 */
function SentimentNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as SentimentNodeData;
  const [isExpanded, setIsExpanded] = useState(false);

  const sentiment = nodeData?.sentiment ?? "neutral";
  const config = sentimentConfig[sentiment];

  return (
    <BaseWorkflowNode
      icon={
        <span className="text-lg" role="img" aria-label={config.label}>
          {config.emoji}
        </span>
      }
      title={`${config.label} Sentiment`}
      subtitle="Customer feedback"
      timestamp={nodeData?.timestamp}
      status="completed"
      isLarge={isExpanded && !!nodeData?.summary}
      isClickable={!!nodeData?.summary}
    >
      {nodeData?.summary && (
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <span>View summary</span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {isExpanded && (
            <div className={cn("rounded-lg p-2 text-xs", config.bgColor)}>
              <p className="leading-relaxed text-slate-700 dark:text-slate-200">
                {nodeData.summary}
              </p>
            </div>
          )}

          {/* Click hint */}
          <div className="flex items-center justify-center gap-1 pt-1 text-[10px] text-slate-400 opacity-70">
            <ExternalLink className="h-3 w-3" />
            <span>Click for full summary</span>
          </div>
        </div>
      )}
    </BaseWorkflowNode>
  );
}

export const SentimentNode = memo(SentimentNodeComponent);
