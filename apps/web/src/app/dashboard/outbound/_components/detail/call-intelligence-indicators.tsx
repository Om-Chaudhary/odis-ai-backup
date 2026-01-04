"use client";

import { cn } from "@odis-ai/shared/util";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import { Heart, Activity, Calendar } from "lucide-react";
import type { OwnerSentimentData, PetHealthData, FollowUpData } from "../types";

interface CallIntelligenceIndicatorsProps {
  ownerSentimentData?: OwnerSentimentData | null;
  petHealthData?: PetHealthData | null;
  followUpData?: FollowUpData | null;
  className?: string;
}

/**
 * Displays key call intelligence indicators:
 * - Owner sentiment (positive/neutral/negative)
 * - Pet recovery status
 * - Follow-up needed flag
 */
export function CallIntelligenceIndicators({
  ownerSentimentData,
  petHealthData,
  followUpData,
  className,
}: CallIntelligenceIndicatorsProps) {
  const sentiment = ownerSentimentData?.owner_sentiment?.toLowerCase();
  const recoveryStatus = petHealthData?.pet_recovery_status;
  const followUpNeeded = followUpData?.follow_up_call_needed;
  const followUpReason = followUpData?.follow_up_reason;

  // Don't render if no data
  if (!sentiment && !recoveryStatus && !followUpNeeded) {
    return null;
  }

  // Sentiment config
  const sentimentConfig = {
    positive: {
      emoji: "😊",
      label: "Positive",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    neutral: {
      emoji: "😐",
      label: "Neutral",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
    negative: {
      emoji: "😟",
      label: "Negative",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  };

  const sentimentInfo = sentiment
    ? (sentimentConfig[sentiment as keyof typeof sentimentConfig] ??
      sentimentConfig.neutral)
    : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {/* Owner Sentiment */}
      {sentimentInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
                  sentimentInfo.bgColor,
                  sentimentInfo.color,
                )}
              >
                <Heart className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {sentimentInfo.emoji} {sentimentInfo.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Owner Sentiment</p>
              {ownerSentimentData?.owner_engagement_level && (
                <p className="text-muted-foreground text-xs">
                  Engagement: {ownerSentimentData.owner_engagement_level}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Pet Recovery Status */}
      {recoveryStatus && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-xs font-medium capitalize">
                  {recoveryStatus.replace(/_/g, " ")}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pet Recovery Status</p>
              {petHealthData?.new_concerns_raised && (
                <p className="text-xs text-red-600">New concerns raised</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Follow-up Needed */}
      {followUpNeeded && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Follow-up Needed</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Follow-up Required</p>
              {followUpReason && (
                <p className="text-muted-foreground max-w-xs text-xs">
                  {followUpReason}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
