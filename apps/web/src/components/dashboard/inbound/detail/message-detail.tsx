"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import {
  MessageSquare,
  Mail,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { MessageStatusBadge } from "./badges";

interface ClinicMessage {
  id: string;
  vapiCallId?: string | null;
  status: string;
  priority: string | null;
  callerName: string | null;
  callerPhone: string;
  messageContent: string;
  createdAt: string;
  readAt?: string | null;
  metadata?: {
    demoCallData?: {
      recordingUrl: string;
      transcript: string;
      durationSeconds: number;
      summary: string;
    };
  } | null;
}

interface MessageDetailProps {
  message: ClinicMessage;
  onMarkRead: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

export function MessageDetail({
  message,
  onMarkRead,
  onResolve,
  onDelete,
  isSubmitting,
}: MessageDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isNew = message.status === "new";
  const isRead = message.status === "read";
  const isResolved = message.status === "resolved";
  const isUrgent = message.priority === "urgent";

  // Check for demo call data in metadata (for static demo messages like Eric Silva, Maria Serpa)
  const demoCallData = message.metadata?.demoCallData;

  // Fetch call data dynamically for messages with a vapiCallId (skip if we have demo data)
  const callDataQuery = api.inboundCalls.getCallDataForAppointment.useQuery(
    { vapiCallId: message.vapiCallId! },
    {
      enabled: !!message.vapiCallId && !demoCallData,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 1,
    },
  );

  // Get call data from demo metadata or query result
  const callData = demoCallData
    ? {
        recording_url: demoCallData.recordingUrl,
        transcript: demoCallData.transcript,
        duration_seconds: demoCallData.durationSeconds,
        summary: demoCallData.summary,
      }
    : callDataQuery.data
      ? {
          recording_url: callDataQuery.data.recordingUrl,
          transcript: callDataQuery.data.transcript,
          duration_seconds: callDataQuery.data.duration,
          summary: callDataQuery.data.summary,
        }
      : null;

  const isLoadingCallData =
    callDataQuery.isLoading && !!message.vapiCallId && !demoCallData;
  const hasCallData = !!demoCallData || !!message.vapiCallId;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          "flex items-start justify-between border-b p-4",
          isUrgent ? "bg-destructive/5" : "bg-muted/20",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isUrgent ? "bg-destructive/10" : "bg-teal-500/10",
            )}
          >
            <MessageSquare
              className={cn(
                "h-5 w-5",
                isUrgent
                  ? "text-destructive"
                  : "text-teal-600 dark:text-teal-400",
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {message.callerName ?? "Unknown Caller"}
              </h3>
              {isUrgent && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {formatPhoneNumber(message.callerPhone)}
            </p>
          </div>
        </div>
        <MessageStatusBadge status={message.status} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Message Content */}
        <Card className={isUrgent ? "border-destructive/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {message.messageContent}
            </p>
          </CardContent>
        </Card>

        {/* Call Recording and Transcript */}
        {hasCallData && (
          <>
            {isLoadingCallData ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call recording...
                  </div>
                </CardContent>
              </Card>
            ) : callData?.recording_url ? (
              <CallRecordingPlayer
                recordingUrl={callData.recording_url}
                transcript={callData.transcript ?? null}
                durationSeconds={callData.duration_seconds ?? null}
              />
            ) : callDataQuery.error ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Unable to load call recording
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        {/* Call Summary */}
        {callData?.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Call Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {callData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Message Info */}
        <Card>
          <CardContent className="py-3">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                Received{" "}
                <span className="font-medium">
                  {format(
                    new Date(message.createdAt),
                    "MMMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </span>
              {message.readAt && (
                <span>
                  Read{" "}
                  <span className="font-medium">
                    {format(new Date(message.readAt), "h:mm a")}
                  </span>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div
        className={cn(
          "border-t p-4",
          isUrgent ? "bg-destructive/5" : "bg-muted/10",
        )}
      >
        {isNew || isRead ? (
          <div className="flex gap-2">
            {isNew && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onMarkRead(message.id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Mark as Read
              </Button>
            )}
            <Button
              className={cn(
                "flex-1",
                isUrgent
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-teal-600 hover:bg-teal-700",
              )}
              onClick={() => onResolve(message.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Resolved
            </Button>
          </div>
        ) : isResolved && onDelete ? (
          <>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Are you sure you want to delete this message? This action
                  cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => onDelete(message.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Confirm Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Message
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
