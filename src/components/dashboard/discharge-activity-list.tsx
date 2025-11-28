import { format, formatDistanceToNow } from "date-fns";
import { Phone, Mail, FileText, PlayCircle, Clock } from "lucide-react";
import { DischargeStatusBadge } from "./discharge-status-badge";
import { Button } from "~/components/ui/button";
import type { DashboardCase } from "~/types/dashboard";
import { cn } from "~/lib/utils";

interface DischargeActivityListProps {
  caseData: DashboardCase;
  className?: string;
}

export function DischargeActivityList({
  caseData,
  className,
}: DischargeActivityListProps) {
  // Combine calls and emails into a single timeline
  const activities = [
    ...(caseData.scheduled_discharge_calls?.map((call) => ({
      id: call.id,
      type: "call" as const,
      status: call.status,
      createdAt: call.created_at,
      scheduledFor: call.scheduled_for,
      endedAt: call.ended_at,
      // Call specific props
      transcript: call.transcript,
      recordingUrl: call.recording_url,
      duration: call.duration_seconds,
    })) ?? []),
    ...(caseData.scheduled_discharge_emails?.map((email) => ({
      id: email.id,
      type: "email" as const,
      status: email.status,
      createdAt: email.created_at,
      scheduledFor: email.scheduled_for,
      endedAt: email.sent_at,
      // Email specific props (none extra for now)
      transcript: null,
      recordingUrl: null,
      duration: null,
    })) ?? []),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (activities.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-4 text-center">
        <div className="bg-muted rounded-full p-2">
          <Clock className="text-muted-foreground h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">No discharge activity</p>
          <p className="text-muted-foreground text-xs">
            Start by calling or emailing the owner
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-[240px] w-full overflow-y-auto pr-4", className)}>
      <div className="relative ml-3 space-y-6 border-l pl-6">
        {activities.map((activity) => {
          const isCall = activity.type === "call";
          const Icon = isCall ? Phone : Mail;
          const date = new Date(activity.createdAt);

          return (
            <div key={activity.id} className="relative">
              {/* Timeline dot */}
              <span className="bg-background absolute top-1 -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border ring-4 ring-white dark:ring-slate-950">
                <Icon className="text-muted-foreground h-3 w-3" />
              </span>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Discharge {isCall ? "Call" : "Email"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {format(date, "PPP p")}
                    </span>
                  </div>
                  <DischargeStatusBadge
                    status={activity.status}
                    type={activity.type}
                  />
                </div>

                {/* Call Specific Details */}
                {isCall && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {activity.duration && (
                      <div className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                        <Clock className="mr-1 h-3 w-3" />
                        {Math.floor(activity.duration / 60)}:
                        {(activity.duration % 60).toString().padStart(2, "0")}
                      </div>
                    )}

                    {activity.transcript && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        // In a real app, this would open a modal or navigate
                        title="View Transcript"
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        Transcript
                      </Button>
                    )}

                    {activity.recordingUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        asChild
                      >
                        <a
                          href={activity.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <PlayCircle className="mr-1 h-3 w-3" />
                          Recording
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
