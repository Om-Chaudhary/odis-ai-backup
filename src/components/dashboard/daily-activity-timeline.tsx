"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Activity } from "lucide-react";
import type { DailyActivityAggregate } from "~/types/dashboard";
import { cn } from "~/lib/utils";
import {
  FileText,
  PhoneCall,
  Mail,
  FileCheck,
  ClipboardList,
} from "lucide-react";

interface DailyActivityTimelineProps {
  activities: DailyActivityAggregate[];
}

const ActivityItem = ({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  icon: typeof FileText;
  color: string;
}) => {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded",
          color,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{count}</span>
    </div>
  );
};

export function DailyActivityTimeline({
  activities,
}: DailyActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Activity className="h-5 w-5 text-slate-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-card-content-in pt-0">
          <div className="py-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Activity className="h-5 w-5 text-slate-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="animate-card-content-in">
        <div className="space-y-6">
          {activities.map((day, index) => {
            const hasActivity =
              day.casesCreated > 0 ||
              day.dischargeSummariesGenerated > 0 ||
              day.callsCompleted > 0 ||
              day.callsScheduled > 0 ||
              day.emailsSent > 0 ||
              day.soapNotesCreated > 0;

            if (!hasActivity) {
              return null;
            }

            return (
              <div key={day.date} className="relative flex gap-4">
                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <div className="absolute top-8 left-3 h-full w-px bg-slate-200" />
                )}

                {/* Date indicator */}
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                  <div className="h-2 w-2 rounded-full bg-teal-600" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3 pb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {day.dateLabel}
                    </h4>
                  </div>

                  <div className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <ActivityItem
                      label="Cases created"
                      count={day.casesCreated}
                      icon={FileText}
                      color="bg-blue-100 text-blue-600"
                    />
                    <ActivityItem
                      label="Discharge summaries generated"
                      count={day.dischargeSummariesGenerated}
                      icon={FileCheck}
                      color="bg-purple-100 text-purple-600"
                    />
                    <ActivityItem
                      label="SOAP notes created"
                      count={day.soapNotesCreated}
                      icon={ClipboardList}
                      color="bg-amber-100 text-amber-600"
                    />
                    <ActivityItem
                      label="Calls completed"
                      count={day.callsCompleted}
                      icon={PhoneCall}
                      color="bg-green-100 text-green-600"
                    />
                    <ActivityItem
                      label="Calls scheduled"
                      count={day.callsScheduled}
                      icon={PhoneCall}
                      color="bg-amber-100 text-amber-600"
                    />
                    <ActivityItem
                      label="Emails sent"
                      count={day.emailsSent}
                      icon={Mail}
                      color="bg-indigo-100 text-indigo-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
