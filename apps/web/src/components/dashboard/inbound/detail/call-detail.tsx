"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@odis-ai/shared/ui/accordion";
import {
  Building2,
  Loader2,
  AlertTriangle,
  FileText,
  User,
  Mic,
  Clock,
} from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { getCallDataOverride } from "./demo-data";
import { InboundCallerCard } from "./caller-card";
import { getDemoCallerName } from "../demo-data";
import { OutcomeBadge } from "../table/outcome-badge";
import { AttentionBanner } from "./shared/attention-banner";
import { QuickActionsFooter } from "./shared/quick-actions-footer";
import { TimestampBadge } from "./shared/timestamp-badge";

// Import InboundCall type from shared types
import type { InboundCall } from "../types";

interface CallDetailProps {
  call: InboundCall;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Formats the end reason for display
 */
function formatEndReason(endedReason: string | null): string {
  if (!endedReason) return "Unknown";
  // Convert snake_case to Title Case
  return endedReason
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Format duration in seconds to a readable string
 */
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Check if call needs attention based on outcome
 */
function getAttentionType(
  call: InboundCall,
): {
  type: "urgent" | "callback" | "escalation";
  title: string;
  description?: string;
} | null {
  if (call.outcome === "Urgent") {
    return {
      type: "urgent",
      title: "Urgent Attention Required",
      description: call.summary ?? "This call was flagged as urgent",
    };
  }
  if (call.outcome === "Call Back") {
    return {
      type: "callback",
      title: "Callback Requested",
      description: call.summary ?? "The caller requested a callback",
    };
  }
  // Check attention types from intelligence data
  if (
    call.attention_types?.includes("escalation") ||
    call.escalation_data?.escalation_triggered
  ) {
    return {
      type: "escalation",
      title: "Escalation Required",
      description:
        call.attention_summary ??
        call.escalation_data?.escalation_summary ??
        "This call requires staff attention",
    };
  }
  return null;
}

export function CallDetail({ call, onDelete, isSubmitting }: CallDetailProps) {
  // Check static demo mapping first for caller name
  const demoCallerName = getDemoCallerName(call.customer_phone);

  // Query for caller info by phone number (skip if we found demo name)
  const { data: callerInfo } = api.inbound.getCallerNameByPhone.useQuery(
    { phone: call.customer_phone ?? "" },
    {
      enabled: !!call.customer_phone && !demoCallerName,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false,
    },
  );

  // Get caller name and pet name
  const callerName = demoCallerName ?? callerInfo?.name ?? null;
  const petName = callerInfo?.petName ?? null;

  // Fetch call data from VAPI if database data is missing critical fields
  const shouldFetchFromVAPI = !call.recording_url && !!call.vapi_call_id;
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: () => shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false, // Don't retry on error
    },
  );

  // Get demo data override if applicable
  const demoOverride = getCallDataOverride(call);

  // Merge database and VAPI data, prioritizing demo data
  const callData =
    demoOverride ??
    (shouldFetchFromVAPI && vapiQuery.data
      ? {
          ...call,
          recording_url: vapiQuery.data.recordingUrl ?? call.recording_url,
          transcript: vapiQuery.data.transcript ?? call.transcript,
          summary: vapiQuery.data.analysis?.summary ?? call.summary,
          duration_seconds: vapiQuery.data.duration ?? call.duration_seconds,
        }
      : call);

  // Check if this call needs attention
  const attention = getAttentionType(call);

  // Determine which accordion sections should be open by default
  const defaultOpenSections = ["summary"];
  if (callData.recording_url && (callData.duration_seconds ?? 0) < 120) {
    // Auto-expand recording for short calls (< 2 min)
    defaultOpenSections.push("recording");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with clinic, duration, and end reason */}
      <div className="flex items-center justify-between border-b border-teal-100/50 bg-gradient-to-r from-white/50 to-teal-50/30 px-4 py-3 dark:from-slate-900/50 dark:to-teal-950/30">
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">
              {call.clinic_name ?? "Unknown Clinic"}
            </span>
          </div>
          {callData.duration_seconds != null &&
            callData.duration_seconds > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(callData.duration_seconds)}</span>
                </div>
              </>
            )}
        </div>
        {call.ended_reason && (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            {formatEndReason(call.ended_reason)}
          </Badge>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Attention Banner - Top priority */}
          {attention && (
            <AttentionBanner
              type={attention.type}
              title={attention.title}
              description={attention.description}
            />
          )}

          {/* Accordion Sections */}
          <Accordion
            type="multiple"
            defaultValue={defaultOpenSections}
            className="space-y-3"
          >
            {/* Caller Information */}
            <AccordionItem
              value="caller"
              className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Caller Information
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <InboundCallerCard
                  variant="call"
                  phone={call.customer_phone}
                  callerName={callerName}
                  petName={petName}
                  callOutcome={call.outcome}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Call Summary */}
            <AccordionItem
              value="summary"
              className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Call Summary
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Timestamp */}
                  <TimestampBadge
                    timestamp={call.created_at}
                    duration={callData.duration_seconds}
                    size="sm"
                  />

                  {/* Outcome Badge */}
                  {call.outcome && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Outcome:
                      </span>
                      <OutcomeBadge outcome={call.outcome} />
                    </div>
                  )}

                  {/* Summary Text */}
                  {callData.summary ? (
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {callData.summary}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic dark:text-slate-500">
                      No summary available
                    </p>
                  )}

                  {/* Actions Taken */}
                  {call.actions_taken && call.actions_taken.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
                      <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        Actions Taken
                      </p>
                      <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {call.actions_taken.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-teal-500">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Call Recording */}
            <AccordionItem
              value="recording"
              className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mic className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Recording & Transcript
                  {vapiQuery.isLoading && shouldFetchFromVAPI && (
                    <Loader2 className="ml-2 h-3 w-3 animate-spin text-slate-400" />
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {vapiQuery.isLoading && shouldFetchFromVAPI ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call recording...
                  </div>
                ) : callData.recording_url ? (
                  <CallRecordingPlayer
                    recordingUrl={callData.recording_url}
                    transcript={callData.transcript ?? null}
                    durationSeconds={callData.duration_seconds}
                  />
                ) : vapiQuery.error && shouldFetchFromVAPI ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      Unable to load call recording
                    </span>
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                    No recording available for this call
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="border-t border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 p-4 dark:from-teal-950/30 dark:to-slate-900/50">
        <QuickActionsFooter
          variant="call"
          isSubmitting={isSubmitting}
          onDelete={onDelete ? () => onDelete(call.id) : undefined}
        />
      </div>
    </div>
  );
}
