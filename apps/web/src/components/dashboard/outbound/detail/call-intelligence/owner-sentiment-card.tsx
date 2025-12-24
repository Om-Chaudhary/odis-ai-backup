/**
 * Owner Sentiment Card
 *
 * Displays owner emotional tone and engagement level during the call
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  HelpCircle,
  Heart,
  ThumbsDown,
  Activity,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface OwnerSentimentData {
  owner_sentiment?: string;
  owner_engagement_level?: string;
  expressed_gratitude?: boolean;
  expressed_concern_about_care?: boolean;
}

interface OwnerSentimentCardProps {
  data: OwnerSentimentData | null;
}

const sentimentConfig: Record<
  string,
  { icon: typeof Smile; label: string; color: string; bgColor: string }
> = {
  positive: {
    icon: Smile,
    label: "Positive",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  neutral: {
    icon: Meh,
    label: "Neutral",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  negative: {
    icon: Frown,
    label: "Negative",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  frustrated: {
    icon: AlertTriangle,
    label: "Frustrated",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  anxious: {
    icon: HelpCircle,
    label: "Anxious",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  grateful: {
    icon: Heart,
    label: "Grateful",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
};

const engagementConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-green-600" },
  medium: { label: "Medium", color: "text-amber-600" },
  low: { label: "Low", color: "text-red-600" },
};

export function OwnerSentimentCard({ data }: OwnerSentimentCardProps) {
  if (!data?.owner_sentiment) {
    return null;
  }

  const sentiment = sentimentConfig[data.owner_sentiment] ?? {
    icon: Meh,
    label: data.owner_sentiment.replace(/_/g, " "),
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  };

  const engagement = data.owner_engagement_level
    ? engagementConfig[data.owner_engagement_level]
    : null;

  const Icon = sentiment.icon;

  return (
    <Card className="border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className={cn("rounded-md p-1.5", sentiment.bgColor)}>
            <Icon className={cn("h-4 w-4", sentiment.color)} />
          </div>
          Owner Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Tone
          </span>
          <Badge
            className={cn(
              "font-medium",
              sentiment.bgColor,
              sentiment.color,
              "border-0",
            )}
          >
            <Icon className="mr-1 h-3 w-3" />
            {sentiment.label}
          </Badge>
        </div>

        {engagement && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              <Activity className="mr-1 inline h-3 w-3" />
              Engagement
            </span>
            <span className={cn("text-sm font-medium", engagement.color)}>
              {engagement.label}
            </span>
          </div>
        )}

        {data.expressed_gratitude && (
          <div className="flex items-center gap-2 rounded-md bg-pink-50 p-2 dark:bg-pink-950/30">
            <Heart className="h-4 w-4 text-pink-600" />
            <span className="text-sm font-medium text-pink-700 dark:text-pink-400">
              Expressed Gratitude
            </span>
          </div>
        )}

        {data.expressed_concern_about_care && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 dark:bg-red-950/30">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Expressed Concern About Care
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
