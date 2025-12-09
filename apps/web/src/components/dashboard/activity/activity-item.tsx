import { FileText, PhoneCall, Clock, FileCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@odis/utils";
import type { ActivityItem } from "~/types/dashboard";

const iconMap = {
  case_created: FileText,
  call_completed: PhoneCall,
  call_scheduled: Clock,
  discharge_summary: FileCheck,
} as const;

const colorMap = {
  case_created: "bg-blue-100 text-blue-600",
  call_completed: "bg-green-100 text-green-600",
  call_scheduled: "bg-amber-100 text-amber-600",
  discharge_summary: "bg-purple-100 text-purple-600",
} as const;

interface ActivityItemComponentProps {
  activity: ActivityItem;
  isLast?: boolean;
}

export function ActivityItemComponent({
  activity,
  isLast = false,
}: ActivityItemComponentProps) {
  const Icon = iconMap[activity.type];
  const colorClass = colorMap[activity.type];

  return (
    <div className="relative flex items-start gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute top-8 left-4 h-full w-px bg-slate-200" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          colorClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 pb-6">
        <p className="text-sm text-slate-900">{activity.description}</p>
        <p className="text-xs text-slate-500">
          {formatDistanceToNow(new Date(activity.timestamp), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
