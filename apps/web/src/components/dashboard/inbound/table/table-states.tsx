import { Phone, Calendar, MessageSquare } from "lucide-react";
import type { ViewMode } from "../types";

/**
 * Loading skeleton for table
 */
export function TableSkeleton({ viewMode: _viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="p-2">
      <div className="mb-3 flex gap-2 border-b pb-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-3 flex-1 animate-pulse rounded" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="border-border/50 flex items-center gap-2 border-b py-3"
        >
          <div className="w-[30%] space-y-1">
            <div className="bg-muted/60 h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted/40 h-3 w-32 animate-pulse rounded" />
          </div>
          <div className="bg-muted/40 h-5 w-18 animate-pulse rounded-md" />
          <div className="flex w-[14%] justify-center">
            <div className="bg-muted/40 h-5 w-14 animate-pulse rounded-full" />
          </div>
          <div className="flex w-[14%] justify-center">
            <div className="bg-muted/40 h-5 w-12 animate-pulse rounded-full" />
          </div>
          <div className="flex w-[12%] justify-center">
            <div className="bg-muted/40 h-7 w-16 animate-pulse rounded-md" />
          </div>
          <div className="bg-muted/40 h-3 w-16 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no items
 */
export function TableEmpty({ viewMode }: { viewMode: ViewMode }) {
  const config = {
    calls: {
      icon: Phone,
      title: "No calls yet",
      description: "Inbound calls will appear here when customers call in.",
    },
    appointments: {
      icon: Calendar,
      title: "No appointment requests",
      description:
        "Appointment requests from the AI assistant will appear here.",
    },
    messages: {
      icon: MessageSquare,
      title: "No messages",
      description: "Messages and callback requests will appear here.",
    },
  };

  const { icon: Icon, title, description } = config[viewMode];

  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
        <Icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
    </div>
  );
}
