"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, PhoneCall, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { UpcomingItem } from "~/types/dashboard";
import { cn } from "~/lib/utils";

interface UpcomingItemsProps {
  items: UpcomingItem[];
}

export function UpcomingItems({ items }: UpcomingItemsProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-slate-600" />
          Upcoming Scheduled
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              No items scheduled in next 48 hours
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    item.type === "call"
                      ? "bg-[#31aba3]/10 text-[#31aba3]"
                      : "bg-blue-100 text-blue-600",
                  )}
                >
                  {item.type === "call" ? (
                    <PhoneCall className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {item.description}
                    </p>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {item.status}
                    </Badge>
                  </div>
                  {item.scheduledFor && (
                    <p className="text-xs text-slate-500">
                      {format(parseISO(item.scheduledFor), "MMM dd, h:mm a")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
