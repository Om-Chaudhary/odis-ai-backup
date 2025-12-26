"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@odis-ai/shared/ui/accordion";
import {
  MessageSquare,
  Loader2,
  AlertTriangle,
  FileText,
  Mic,
  PawPrint,
  Phone,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Badge } from "@odis-ai/shared/ui/badge";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { AttentionBanner } from "./shared/attention-banner";
import { QuickActionsFooter } from "./shared/quick-actions-footer";
import { TimestampBadge } from "./shared/timestamp-badge";
import { PetContextCard } from "./shared/pet-context-card";

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

/**
 * Get status badge config
 */
function getStatusConfig(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    new: {
      label: "New",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    },
    read: {
      label: "Read",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    },
    resolved: {
      label: "Resolved",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    },
  };
  return config[status] ?? { label: status, className: "bg-slate-100" };
}

export function MessageDetail({
  message,
  onMarkRead,
  onResolve,
  onDelete,
  isSubmitting,
}: MessageDetailProps) {
  const isNew = message.status === "new";
  const isResolved = message.status === "resolved";
  const isUrgent = message.priority === "urgent";
  const statusConfig = getStatusConfig(message.status);

  // Check for demo call data in metadata (for static demo messages)
  const demoCallData = message.metadata?.demoCallData;

  // Fetch call data dynamically for messages with a vapiCallId (skip if we have demo data)
  const callDataQuery = api.inboundCalls.getCallDataForAppointment.useQuery(
    { vapiCallId: message.vapiCallId! },
    {
      enabled: !!message.vapiCallId && !demoCallData,
      staleTime: 5 * 60 * 1000,
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

  // Determine which accordion sections should be open by default
  const defaultOpenSections = ["message"];
  if (callData?.summary) {
    defaultOpenSections.push("summary");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Urgent Banner */}
          {isUrgent && (
            <AttentionBanner
              type="urgent"
              title="Urgent Message"
              description="This message has been marked as urgent priority"
            />
          )}

          {/* Caller Header Card */}
          <div
            className={cn(
              "rounded-xl border p-4 pr-12",
              "bg-gradient-to-br from-white/80 via-teal-50/30 to-white/80",
              "dark:from-slate-900/80 dark:via-teal-950/30 dark:to-slate-900/80",
              "shadow-sm backdrop-blur-md",
              isUrgent && "border-red-200/50 dark:border-red-800/50",
              !isUrgent && "border-teal-200/50 dark:border-teal-800/50",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Phone Avatar */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner",
                    "bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50",
                    isUrgent &&
                      "from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50",
                  )}
                >
                  <Phone
                    className={cn(
                      "h-6 w-6",
                      isUrgent
                        ? "text-red-600 dark:text-red-400"
                        : "text-teal-600 dark:text-teal-400",
                    )}
                  />
                </div>
                {/* Caller Info */}
                <div>
                  <a
                    href={`tel:${message.callerPhone}`}
                    className="text-lg font-bold text-slate-800 hover:text-teal-600 dark:text-white dark:hover:text-teal-400"
                  >
                    {message.callerPhone}
                  </a>
                  {message.callerName && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {message.callerName}
                    </p>
                  )}
                </div>
              </div>
              {/* Badges */}
              <div className="flex flex-col items-end gap-1.5">
                <Badge
                  className={cn("text-xs font-medium", statusConfig.className)}
                >
                  {statusConfig.label}
                </Badge>
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Accordion Sections */}
          <Accordion
            type="multiple"
            defaultValue={defaultOpenSections}
            className="space-y-3"
          >
            {/* Message Content - Always visible */}
            <AccordionItem
              value="message"
              className={cn(
                "rounded-lg border bg-white/50 backdrop-blur-sm dark:bg-slate-900/50",
                isUrgent
                  ? "border-red-200/50 dark:border-red-800/50"
                  : "border-slate-200/50 dark:border-slate-700/50",
              )}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare
                    className={cn(
                      "h-4 w-4",
                      isUrgent
                        ? "text-red-600 dark:text-red-400"
                        : "text-teal-600 dark:text-teal-400",
                    )}
                  />
                  Message
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {/* Timestamp */}
                  <TimestampBadge
                    timestamp={message.createdAt}
                    duration={callData?.duration_seconds}
                    size="sm"
                    label="Received"
                  />

                  {/* Message Text */}
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      isUrgent
                        ? "bg-red-50/50 dark:bg-red-950/30"
                        : "bg-slate-50/50 dark:bg-slate-800/30",
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {message.messageContent}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* AI Summary */}
            {callData?.summary && (
              <AccordionItem
                value="summary"
                className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    AI Summary
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {callData.summary}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Pet Context */}
            <AccordionItem
              value="pet"
              className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PawPrint className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Known Pet Information
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <PetContextCard phone={message.callerPhone} />
              </AccordionContent>
            </AccordionItem>

            {/* Call Recording */}
            {hasCallData && (
              <AccordionItem
                value="recording"
                className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Mic className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Call Recording
                    {isLoadingCallData && (
                      <Loader2 className="ml-2 h-3 w-3 animate-spin text-slate-400" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {isLoadingCallData ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading call recording...
                    </div>
                  ) : callData?.recording_url ? (
                    <CallRecordingPlayer
                      recordingUrl={callData.recording_url}
                      transcript={callData.transcript ?? null}
                      durationSeconds={callData.duration_seconds ?? null}
                    />
                  ) : callDataQuery.error ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        Unable to load call recording
                      </span>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                      No recording available
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div
        className={cn(
          "border-t p-4",
          isUrgent
            ? "border-red-200/50 bg-gradient-to-r from-red-50/30 to-white/50 dark:from-red-950/30 dark:to-slate-900/50"
            : "border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 dark:from-teal-950/30 dark:to-slate-900/50",
        )}
      >
        <QuickActionsFooter
          variant="message"
          status={message.status}
          isSubmitting={isSubmitting}
          onMarkRead={isNew ? () => onMarkRead(message.id) : undefined}
          onResolve={!isResolved ? () => onResolve(message.id) : undefined}
          onDelete={
            isResolved && onDelete ? () => onDelete(message.id) : undefined
          }
        />
      </div>
    </div>
  );
}
