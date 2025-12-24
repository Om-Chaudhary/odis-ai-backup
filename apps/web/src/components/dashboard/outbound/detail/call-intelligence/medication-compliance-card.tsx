/**
 * Medication Compliance Card
 *
 * Displays medication adherence status and any issues reported
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Pill,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface MedicationComplianceData {
  medication_discussed?: boolean;
  medication_compliance?: string;
  medication_issues?: string[];
  medication_guidance_provided?: boolean;
}

interface MedicationComplianceCardProps {
  data: MedicationComplianceData | null;
}

const complianceConfig: Record<
  string,
  { icon: typeof Pill; label: string; color: string; bgColor: string }
> = {
  compliant: {
    icon: CheckCircle2,
    label: "Compliant",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  partial: {
    icon: AlertCircle,
    label: "Partial",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  non_compliant: {
    icon: XCircle,
    label: "Non-Compliant",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  not_applicable: {
    icon: HelpCircle,
    label: "N/A",
    color: "text-slate-500",
    bgColor: "bg-slate-100",
  },
  not_discussed: {
    icon: HelpCircle,
    label: "Not Discussed",
    color: "text-slate-500",
    bgColor: "bg-slate-100",
  },
};

const issueLabels: Record<string, string> = {
  difficulty_administering: "Difficulty Administering",
  pet_refusing: "Pet Refusing",
  side_effects: "Side Effects",
  ran_out: "Ran Out",
  forgot_doses: "Forgot Doses",
  cost_concern: "Cost Concern",
  other: "Other Issue",
};

export function MedicationComplianceCard({
  data,
}: MedicationComplianceCardProps) {
  if (!data || data.medication_discussed === false) {
    return null;
  }

  const compliance = data.medication_compliance
    ? (complianceConfig[data.medication_compliance] ?? {
        icon: Pill,
        label: data.medication_compliance.replace(/_/g, " "),
        color: "text-slate-600",
        bgColor: "bg-slate-100",
      })
    : null;

  const hasIssues = data.medication_issues && data.medication_issues.length > 0;
  const Icon = compliance?.icon ?? Pill;

  return (
    <Card className="border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              "rounded-md p-1.5",
              compliance?.bgColor ?? "bg-purple-100",
            )}
          >
            <Pill
              className={cn("h-4 w-4", compliance?.color ?? "text-purple-600")}
            />
          </div>
          Medication Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {compliance && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Status
            </span>
            <Badge
              className={cn(
                "font-medium",
                compliance.bgColor,
                compliance.color,
                "border-0",
              )}
            >
              <Icon className="mr-1 h-3 w-3" />
              {compliance.label}
            </Badge>
          </div>
        )}

        {data.medication_guidance_provided && (
          <div className="flex items-center gap-2 rounded-md bg-blue-50 p-2 dark:bg-blue-950/30">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Guidance Provided
            </span>
          </div>
        )}

        {hasIssues && (
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Issues Reported
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.medication_issues!.map((issue) => (
                <Badge
                  key={issue}
                  variant="outline"
                  className="bg-amber-50 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                >
                  {issueLabels[issue] ?? issue.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
