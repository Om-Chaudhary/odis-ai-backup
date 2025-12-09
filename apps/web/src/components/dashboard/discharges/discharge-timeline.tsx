"use client";

import { format } from "date-fns";
import { Phone, Mail, Clock } from "lucide-react";
import { EmptyState } from "@odis/ui";
import { DischargeStatusBadge } from "./discharge-status-badge";
import type { DischargeTimeline as DischargeTimelineType } from "~/types/dashboard";

interface DischargeTimelineProps {
  items: DischargeTimelineType[];
}

export function DischargeTimeline({ items }: DischargeTimelineProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No discharge communications scheduled yet"
        description="Schedule calls or emails to see them appear here"
        size="sm"
        className="min-h-[150px]"
      />
    );
  }

  // Sort by creation date (newest first)
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      {sortedItems.map((item) => {
        const Icon = item.type === "call" ? Phone : Mail;
        const scheduledDate = item.scheduledFor
          ? new Date(item.scheduledFor)
          : null;
        const completedDate = item.completedAt
          ? new Date(item.completedAt)
          : null;

        return (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-lg border p-4"
          >
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{item.type}</span>
                  <DischargeStatusBadge status={item.status} type={item.type} />
                </div>
              </div>
              <div className="text-muted-foreground space-y-1 text-sm">
                {scheduledDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Scheduled:{" "}
                      {format(scheduledDate, "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
                {completedDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {item.type === "call" ? "Ended" : "Sent"}:{" "}
                      {format(completedDate, "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
                {!scheduledDate && !completedDate && (
                  <div className="text-muted-foreground text-xs italic">
                    Created:{" "}
                    {format(
                      new Date(item.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
