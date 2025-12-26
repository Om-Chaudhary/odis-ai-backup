import { Phone, Calendar, MessageSquare } from "lucide-react";
import type { ViewMode } from "../types";

/**
 * Loading skeleton for table
 * Styled to match outbound dashboard with teal-based colors
 */
export function TableSkeleton({ viewMode: _viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="w-full overflow-hidden p-2">
      {/* Header skeleton */}
      <div className="mb-3 flex gap-2 border-b border-teal-100/50 pb-2.5">
        <div className="h-3 w-[32%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[14%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[12%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[14%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[22%] animate-pulse rounded bg-teal-100/50" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 border-b border-teal-50 py-3"
        >
          <div className="w-[32%] space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-teal-100/40" />
            <div className="h-3 w-32 animate-pulse rounded bg-teal-50" />
          </div>
          <div className="flex w-[14%] justify-center">
            <div className="h-5 w-14 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div className="flex w-[12%] justify-center">
            <div className="h-5 w-12 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div className="flex w-[14%] justify-center">
            <div className="h-5 w-12 animate-pulse rounded-md bg-teal-50" />
          </div>
          <div className="flex w-[22%] justify-end pr-3">
            <div className="h-3 w-16 animate-pulse rounded bg-teal-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no items
 * Styled to match outbound dashboard with gradient icon background
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
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100">
        <Icon className="h-6 w-6 text-teal-600" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  );
}
