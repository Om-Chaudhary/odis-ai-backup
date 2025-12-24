/**
 * Pet Health Card
 *
 * Displays pet recovery status and any symptoms reported by the owner
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface PetHealthData {
  pet_recovery_status?: string;
  symptoms_reported?: string[];
  new_concerns_raised?: boolean;
  condition_resolved?: boolean;
}

interface PetHealthCardProps {
  data: PetHealthData | null;
}

const statusConfig: Record<
  string,
  { icon: typeof Heart; label: string; color: string; bgColor: string }
> = {
  fully_recovered: {
    icon: CheckCircle2,
    label: "Fully Recovered",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  improving: {
    icon: TrendingUp,
    label: "Improving",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  same: {
    icon: Minus,
    label: "Same",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  declining: {
    icon: TrendingDown,
    label: "Declining",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  unknown: {
    icon: HelpCircle,
    label: "Unknown",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  not_discussed: {
    icon: HelpCircle,
    label: "Not Discussed",
    color: "text-slate-500",
    bgColor: "bg-slate-100",
  },
};

export function PetHealthCard({ data }: PetHealthCardProps) {
  if (!data?.pet_recovery_status) {
    return null;
  }

  const status = statusConfig[data.pet_recovery_status] ?? {
    icon: Heart,
    label: data.pet_recovery_status.replace(/_/g, " "),
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  };

  const Icon = status.icon;
  const hasSymptoms =
    data.symptoms_reported && data.symptoms_reported.length > 0;

  return (
    <Card className="border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className={cn("rounded-md p-1.5", status.bgColor)}>
            <Heart className={cn("h-4 w-4", status.color)} />
          </div>
          Pet Health Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Recovery
          </span>
          <Badge
            className={cn(
              "font-medium",
              status.bgColor,
              status.color,
              "border-0",
            )}
          >
            <Icon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        {data.condition_resolved !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Condition Resolved
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                data.condition_resolved ? "text-green-600" : "text-amber-600",
              )}
            >
              {data.condition_resolved ? "Yes" : "No"}
            </span>
          </div>
        )}

        {data.new_concerns_raised && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              New Concerns Raised
            </span>
          </div>
        )}

        {hasSymptoms && (
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Symptoms Reported
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.symptoms_reported!.map((symptom) => (
                <Badge
                  key={symptom}
                  variant="outline"
                  className="bg-red-50 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400"
                >
                  {symptom
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
