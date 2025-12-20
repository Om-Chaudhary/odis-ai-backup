import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Calendar, Mail, Phone } from "lucide-react";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

interface ScheduleInfoCardProps {
  emailScheduledFor: string | null;
  callScheduledFor: string | null;
}

/**
 * Schedule info card for scheduled cases
 */
export function ScheduleInfoCard({
  emailScheduledFor,
  callScheduledFor,
}: ScheduleInfoCardProps) {
  const formatScheduleTime = (isoString: string | null) => {
    if (!isoString) return null;
    try {
      const date = parseISO(isoString);
      const isDatePast = isPast(date);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      const absoluteTime = format(date, "EEE, MMM d 'at' h:mm a");

      return {
        relative: isDatePast ? "Ready to send" : relativeTime,
        absolute: absoluteTime,
        isPast: isDatePast,
      };
    } catch {
      return null;
    }
  };

  const emailTime = formatScheduleTime(emailScheduledFor);
  const callTime = formatScheduleTime(callScheduledFor);

  return (
    <Card className="border-violet-500/20 bg-violet-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          Scheduled Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {emailTime && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
              <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground text-xs">
                {emailTime.absolute}
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                {emailTime.relative}
              </p>
            </div>
          </div>
        )}
        {callTime && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
              <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Phone Call</p>
              <p className="text-muted-foreground text-xs">
                {callTime.absolute}
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                {callTime.relative}
              </p>
            </div>
          </div>
        )}
        {!emailTime && !callTime && (
          <p className="text-muted-foreground text-sm">
            No communications scheduled.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
