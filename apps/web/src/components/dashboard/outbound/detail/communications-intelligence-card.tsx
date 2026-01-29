import { Card, CardContent, CardHeader } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Separator } from "@odis-ai/shared/ui/separator";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { cn, formatCallSummary, formatAttentionAction } from "@odis-ai/shared/util";

interface ScheduledCallData {
  id: string;
  status: string;
  durationSeconds: number | null;
  endedReason: string | null;
  transcript: string | null;
  summary: string | null;
  structuredData?: { urgent_case?: boolean; [key: string]: unknown } | null;
}

interface CommunicationsIntelligenceCardProps {
  scheduledCall: ScheduledCallData | null;
  urgentReasonSummary?: string | null;
  needsAttention?: boolean;
  attentionTypes?: string[] | null;
  attentionSeverity?: string | null;
  attentionSummary?: string | null;
}

/**
 * Communications Intelligence Card - AI-powered call insights with stunning visuals
 *
 * Showcases:
 * - Call sentiment/summary
 * - Urgent case detection
 * - Attention categories
 * - Key insights from VAPI analysis
 */
export function CommunicationsIntelligenceCard({
  scheduledCall,
  urgentReasonSummary,
  needsAttention,
  attentionTypes,
  attentionSeverity,
  attentionSummary,
}: CommunicationsIntelligenceCardProps) {
  // Don't show if no call data available
  if (!scheduledCall) {
    return null;
  }

  const hasIntelligence = Boolean(
    scheduledCall.summary ??
    urgentReasonSummary ??
    needsAttention ??
    (attentionTypes && attentionTypes.length > 0),
  );

  // Don't show if no intelligence available
  if (!hasIntelligence) {
    return null;
  }

  const isUrgent = scheduledCall.structuredData?.urgent_case === true;
  const hasCallCompleted = scheduledCall.transcript ?? scheduledCall.summary;

  // Determine sentiment configuration
  const getSentimentConfig = () => {
    if (needsAttention && attentionSeverity === "critical") {
      return {
        badge: "Critical Attention Required",
        badgeClass:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300",
        icon: AlertTriangle,
        iconClass: "text-red-600 dark:text-red-400",
        gradient:
          "from-red-50/50 via-white/80 to-red-50/50 dark:from-red-950/30 dark:via-slate-900/80 dark:to-red-950/30",
        borderClass: "border-red-200/50 dark:border-red-800/50",
      };
    }

    if (needsAttention && attentionSeverity === "high") {
      return {
        badge: "High Priority",
        badgeClass:
          "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300",
        icon: AlertTriangle,
        iconClass: "text-orange-600 dark:text-orange-400",
        gradient:
          "from-orange-50/50 via-white/80 to-orange-50/50 dark:from-orange-950/30 dark:via-slate-900/80 dark:to-orange-950/30",
        borderClass: "border-orange-200/50 dark:border-orange-800/50",
      };
    }

    if (needsAttention) {
      return {
        badge: "Needs Attention",
        badgeClass:
          "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300",
        icon: AlertTriangle,
        iconClass: "text-yellow-600 dark:text-yellow-400",
        gradient:
          "from-yellow-50/50 via-white/80 to-yellow-50/50 dark:from-yellow-950/30 dark:via-slate-900/80 dark:to-yellow-950/30",
        borderClass: "border-yellow-200/50 dark:border-yellow-800/50",
      };
    }

    if (isUrgent) {
      return {
        badge: "Urgent Case",
        badgeClass:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300",
        icon: AlertTriangle,
        iconClass: "text-red-600 dark:text-red-400",
        gradient:
          "from-red-50/50 via-white/80 to-red-50/50 dark:from-red-950/30 dark:via-slate-900/80 dark:to-red-950/30",
        borderClass: "border-red-200/50 dark:border-red-800/50",
      };
    }

    // Default: positive/completed
    return {
      badge: "Call Analyzed",
      badgeClass:
        "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300",
      icon: Sparkles,
      iconClass: "text-blue-600 dark:text-blue-400",
      gradient:
        "from-blue-50/50 via-white/80 to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900/80 dark:to-blue-950/30",
      borderClass: "border-blue-200/50 dark:border-blue-800/50",
    };
  };

  const config = getSentimentConfig();
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "rounded-xl border shadow-sm backdrop-blur-md",
        "bg-gradient-to-br",
        config.gradient,
        config.borderClass,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Icon with gradient background */}
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                "bg-gradient-to-br from-blue-100 to-purple-100",
                "dark:from-blue-900/50 dark:to-purple-900/50",
                "shadow-inner",
              )}
            >
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Communications Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-powered call insights
              </p>
            </div>
          </div>
          <Badge className={cn("text-xs font-medium", config.badgeClass)}>
            {config.badge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Call Summary */}
        {scheduledCall.summary && (
          <>
            <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "rounded-md p-1.5",
                    "bg-white/50 dark:bg-slate-800/50",
                  )}
                >
                  <PhoneCall className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  Call Summary
                </p>
              </div>
              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-1">
                {formatCallSummary(scheduledCall.summary)}
              </div>
            </div>
          </>
        )}

        {/* Urgent Case Info */}
        {isUrgent && urgentReasonSummary && (
          <>
            <Separator className="bg-red-200/50 dark:bg-red-700/50" />
            <div className="space-y-2 rounded-lg bg-red-50/50 p-3 dark:bg-red-950/30">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-red-100 p-1.5 dark:bg-red-900/50">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-xs font-semibold tracking-wide text-red-700 uppercase dark:text-red-400">
                  Urgent Reason
                </p>
              </div>
              <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                {urgentReasonSummary}
              </p>
            </div>
          </>
        )}

        {/* Attention Categories */}
        {needsAttention && attentionTypes && attentionTypes.length > 0 && (
          <>
            <Separator className="bg-orange-200/50 dark:bg-orange-700/50" />
            <div className="space-y-3 rounded-lg bg-orange-50/50 p-3 dark:bg-orange-950/30">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-orange-100 p-1.5 dark:bg-orange-900/50">
                  <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
                </div>
                <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase dark:text-orange-400">
                  Attention Required
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attentionTypes.map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="bg-white/80 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  >
                    {type
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
              {attentionSummary && (
                <p className="text-sm leading-relaxed text-orange-800 dark:text-orange-300">
                  {formatAttentionAction(attentionSummary).split('\n').map((line, index, array) => (
                    <span key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </>
        )}

        {/* Call Metrics */}
        {scheduledCall.durationSeconds && (
          <>
            <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="rounded-md bg-white/50 p-1.5 dark:bg-slate-800/50">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span>
                Duration: {Math.floor(scheduledCall.durationSeconds / 60)}m{" "}
                {scheduledCall.durationSeconds % 60}s
              </span>
              {hasCallCompleted && (
                <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
