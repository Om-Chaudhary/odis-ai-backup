/**
 * Call Outcome Card
 *
 * Displays how the call ended and what stage of conversation was reached
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  PhoneCall,
  PhoneOff,
  Voicemail,
  PhoneMissed,
  UserX,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface CallOutcomeData {
  call_outcome?: string;
  conversation_stage_reached?: string;
  owner_available?: boolean;
  call_duration_appropriate?: boolean;
}

interface CallOutcomeCardProps {
  data: CallOutcomeData | null;
}

const outcomeConfig: Record<
  string,
  { icon: typeof PhoneCall; label: string; color: string; bgColor: string }
> = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  voicemail: {
    icon: Voicemail,
    label: "Voicemail",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  no_answer: {
    icon: PhoneMissed,
    label: "No Answer",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  wrong_number: {
    icon: XCircle,
    label: "Wrong Number",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  declined_to_talk: {
    icon: UserX,
    label: "Declined",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  busy: {
    icon: PhoneOff,
    label: "Busy",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  pet_deceased: {
    icon: PhoneOff,
    label: "Pet Deceased",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  transferred: {
    icon: ArrowRightLeft,
    label: "Transferred",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  disconnected: {
    icon: PhoneOff,
    label: "Disconnected",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

const stageLabels: Record<string, string> = {
  opening: "Opening",
  checkin: "Check-In",
  assessment: "Assessment",
  medication_check: "Medication Check",
  recheck_reminder: "Recheck Reminder",
  closing: "Closing",
  none: "None",
};

export function CallOutcomeCard({ data }: CallOutcomeCardProps) {
  if (!data?.call_outcome) {
    return null;
  }

  const outcome = outcomeConfig[data.call_outcome] ?? {
    icon: PhoneCall,
    label: data.call_outcome.replace(/_/g, " "),
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  };

  const Icon = outcome.icon;
  const stageLabel = data.conversation_stage_reached
    ? (stageLabels[data.conversation_stage_reached] ??
      data.conversation_stage_reached)
    : null;

  return (
    <Card className="border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className={cn("rounded-md p-1.5", outcome.bgColor)}>
            <Icon className={cn("h-4 w-4", outcome.color)} />
          </div>
          Call Outcome
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Result
          </span>
          <Badge
            className={cn(
              "font-medium",
              outcome.bgColor,
              outcome.color,
              "border-0",
            )}
          >
            {outcome.label}
          </Badge>
        </div>

        {stageLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Stage Reached
            </span>
            <span className="text-sm font-medium">{stageLabel}</span>
          </div>
        )}

        {data.owner_available !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Owner Available
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                data.owner_available ? "text-green-600" : "text-amber-600",
              )}
            >
              {data.owner_available ? "Yes" : "No"}
            </span>
          </div>
        )}

        {data.call_duration_appropriate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Duration Appropriate
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                data.call_duration_appropriate
                  ? "text-green-600"
                  : "text-amber-600",
              )}
            >
              {data.call_duration_appropriate ? "Yes" : "No"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
