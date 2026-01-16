"use client";
import { useState, useEffect } from "react";
import { Card } from "@odis-ai/shared/ui/card";
import {
  Building2,
  Loader2,
  FileText,
  Mic,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { getCallDataOverride } from "./demo-data";
import { getDemoCallerName } from "../demo-data";
import { QuickActionsFooter } from "./shared/quick-actions-footer";
import { TimestampBadge } from "./shared/timestamp-badge";
import type { Database } from "@odis-ai/shared/types";

// Use Database type for compatibility with table data
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

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

  // Lazy loading: Only fetch VAPI data when needed (when detail panel is opened)
  // Use a small delay to ensure component is mounted and user is viewing it
  const [shouldFetchVAPI, setShouldFetchVAPI] = useState(false);
  const shouldFetchFromVAPI = !call.recording_url && !!call.vapi_call_id;

  // Enable fetching after component mounts (lazy load)
  useEffect(() => {
    if (shouldFetchFromVAPI) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        setShouldFetchVAPI(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFetchFromVAPI]);

  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: shouldFetchVAPI && shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 3, // Retry up to 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s, max 30s
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

  return (
    <div id="call-detail-panel" className="flex h-full flex-col">
      {/* Compact Caller Header - matches outbound patient header style */}
      <div className="bg-muted/30 relative border-b px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Caller icon avatar */}
            <div className="bg-background flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-2xl shadow-sm">
              📞
            </div>

            {/* Caller info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="truncate text-lg font-semibold">
                  {callerName ?? "Unknown Caller"}
                </h2>
                {petName && (
                  <span className="text-muted-foreground text-sm">
                    {petName}'s owner
                  </span>
                )}
              </div>

              {/* Call metadata */}
              {(call.clinic_name ?? callData.duration_seconds) && (
                <div className="flex flex-wrap gap-3 pt-0.5">
                  {call.clinic_name && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{call.clinic_name}</span>
                    </div>
                  )}
                  {callData.duration_seconds != null &&
                    callData.duration_seconds > 0 && (
                      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDuration(callData.duration_seconds)}</span>
                      </div>
                    )}
                </div>
              )}

              {/* Contact information */}
              {call.customer_phone && (
                <div className="flex flex-wrap gap-3 pt-0.5">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <span>📞</span>
                    <span className="font-medium">{call.customer_phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* End reason badge */}
          {call.ended_reason && (
            <Badge
              variant="outline"
              className="border-border/40 text-muted-foreground mt-1 mr-12 text-xs"
            >
              {formatEndReason(call.ended_reason)}
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Call Summary Card */}
        <Card className="border-border/40">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Call Summary
            </div>

            <div className="space-y-4">
              {/* Timestamp */}
              <TimestampBadge
                timestamp={call.created_at}
                duration={callData.duration_seconds}
                size="sm"
              />

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
              {Array.isArray(call.actions_taken) &&
                call.actions_taken.length > 0 && (
                  <div className="mt-3 rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
                    <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      Actions Taken
                    </p>
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {call.actions_taken.map(
                        (action: unknown, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-teal-500">•</span>
                            <span>
                              {typeof action === "string"
                                ? action
                                : JSON.stringify(action)}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </Card>

        {/* Recording & Transcript Card */}
        <Card className="border-border/40">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mic className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Recording & Transcript
              {vapiQuery.isLoading && shouldFetchFromVAPI && (
                <Loader2 className="ml-2 h-3 w-3 animate-spin text-slate-400" />
              )}
            </div>

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
                <span className="text-sm">Unable to load call recording</span>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                No recording available for this call
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions Footer */}
      <div className="border-t border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 p-4 dark:from-teal-950/30 dark:to-slate-900/50">
        <QuickActionsFooter
          variant="call"
          isSubmitting={isSubmitting}
          callerName={callerName}
          onDelete={onDelete ? () => onDelete(call.id) : undefined}
        />
      </div>
    </div>
  );
}
