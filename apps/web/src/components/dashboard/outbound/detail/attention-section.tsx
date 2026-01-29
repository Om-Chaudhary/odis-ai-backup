import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn, formatAttentionAction } from "@odis-ai/shared/util";
import {
  AttentionTypeBadge,
  AttentionSeverityBadge,
} from "~/components/dashboard/shared";

interface AttentionSectionProps {
  caseData: {
    needsAttention?: boolean;
    attentionTypes?: string[] | null;
    attentionSeverity?: string | null;
    attentionSummary?: string | null;
    attentionFlaggedAt?: string | null;
  };
}

/**
 * Attention Section
 * Displays attention data for flagged cases with new structured outputs
 */
export function AttentionSection({ caseData }: AttentionSectionProps) {
  if (!caseData.needsAttention) return null;

  const severityColors: Record<string, string> = {
    critical: "border-red-500/30 bg-red-500/5",
    urgent: "border-orange-500/20 bg-orange-500/5",
    routine: "border-blue-500/20 bg-blue-500/5",
  };

  const severity = caseData.attentionSeverity ?? "routine";
  const cardClass = severityColors[severity] ?? severityColors.routine;

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              severity === "critical" && "text-red-600",
              severity === "urgent" && "text-orange-600",
              severity === "routine" && "text-blue-600",
            )}
          />
          Needs Attention
          <AttentionSeverityBadge severity={severity} size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Attention Types */}
        {caseData.attentionTypes && caseData.attentionTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {caseData.attentionTypes.map((type) => (
              <AttentionTypeBadge key={type} type={type} size="md" />
            ))}
          </div>
        )}

        {/* AI Summary */}
        {caseData.attentionSummary && (
          <div className="rounded-md bg-white/50 p-3">
            <p className="text-sm leading-relaxed">
              {formatAttentionAction(caseData.attentionSummary).split('\n').map((line, index, array) => (
                <span key={index}>
                  {line}
                  {index < array.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Flagged timestamp */}
        {caseData.attentionFlaggedAt && (
          <p className="text-muted-foreground text-xs">
            Flagged{" "}
            {formatDistanceToNow(parseISO(caseData.attentionFlaggedAt), {
              addSuffix: true,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
