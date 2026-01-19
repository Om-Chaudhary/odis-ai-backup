"use client";
import { useState, useEffect } from "react";
import { Building2, Clock, Phone, X } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { CallDetailContent } from "../../shared/call-detail-content";
import { api } from "~/trpc/client";
import { getCallDataOverride } from "./demo-data";
import { getDemoCallerName } from "../demo-data";
import { QuickActionsFooter } from "./shared/quick-actions-footer";
import type { Database } from "@odis-ai/shared/types";

// Use Database type for compatibility with table data
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallDetailProps {
  call: InboundCall;
  onDelete?: (id: string) => Promise<void>;
  onClose?: () => void;
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

export function CallDetail({
  call,
  onDelete,
  onClose,
  isSubmitting,
}: CallDetailProps) {
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
      {/* Glassmorphic Caller Header */}
      <div className="relative overflow-hidden">
        {/* Glassmorphic background */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-br from-teal-500/[0.08] via-teal-400/[0.04] to-cyan-500/[0.06]",
            "dark:from-teal-500/[0.12] dark:via-teal-400/[0.06] dark:to-cyan-500/[0.08]",
          )}
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        {/* Subtle glow accents */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-cyan-400/8 blur-xl" />

        {/* Content */}
        <div className="relative px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Avatar + Info */}
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {/* Caller avatar - glassmorphic circle */}
              <div
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-2xl",
                  "bg-white/60 dark:bg-white/10",
                  "shadow-sm shadow-teal-500/10",
                  "ring-1 ring-teal-500/10",
                )}
              >
                📞
              </div>

              {/* Caller info */}
              <div className="min-w-0 flex-1 space-y-0.5">
                {/* Caller name */}
                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  {callerName ?? "Unknown Caller"}
                </h2>

                {/* Pet name if available */}
                {petName && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {petName}'s
                    </span>{" "}
                    owner
                  </p>
                )}

                {/* Clinic & Duration */}
                {(call.clinic_name ?? callData.duration_seconds) && (
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    {call.clinic_name && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <Building2 className="h-3 w-3" />
                        <span>{call.clinic_name}</span>
                      </div>
                    )}
                    {callData.duration_seconds != null &&
                      callData.duration_seconds > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDuration(callData.duration_seconds)}
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  "text-slate-400 hover:text-slate-600",
                  "transition-colors hover:bg-slate-500/10",
                  "dark:text-slate-500 dark:hover:text-slate-300",
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Contact chip & End reason */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {call.customer_phone && (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                  "bg-white/50 dark:bg-white/5",
                  "text-slate-600 dark:text-slate-300",
                  "ring-1 ring-slate-200/50 dark:ring-slate-700/50",
                )}
              >
                <Phone className="h-3 w-3 text-teal-500" />
                <span className="font-medium">{call.customer_phone}</span>
              </div>
            )}
            {call.ended_reason && (
              <div
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs",
                  "bg-slate-500/10 text-slate-500",
                  "dark:bg-slate-500/20 dark:text-slate-400",
                )}
              >
                {formatEndReason(call.ended_reason)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom border - subtle gradient line */}
        <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
      </div>

      {/* Scrollable Content - Using shared components */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <CallDetailContent
          callId={call.id}
          summary={callData.summary ?? null}
          timestamp={call.created_at}
          durationSeconds={callData.duration_seconds}
          actionsTaken={
            Array.isArray(call.actions_taken)
              ? (call.actions_taken as string[])
              : undefined
          }
          recordingUrl={callData.recording_url ?? null}
          transcript={callData.transcript ?? null}
          title={callerName ?? "Call Recording"}
          subtitle={call.clinic_name ?? undefined}
          isLoadingRecording={vapiQuery.isLoading && shouldFetchFromVAPI}
          isSuccessful={call.ended_reason !== "error"}
        />
      </div>

      {/* Quick Actions Footer */}
      <div className="relative overflow-hidden">
        {/* Glassmorphic background */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-r from-teal-500/[0.04] via-white/50 to-teal-500/[0.04]",
            "dark:from-teal-500/[0.08] dark:via-slate-900/50 dark:to-teal-500/[0.08]",
            "backdrop-blur-sm",
          )}
        />
        {/* Top border */}
        <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />

        <div className="relative p-4">
          <QuickActionsFooter
            variant="call"
            isSubmitting={isSubmitting}
            callerName={callerName}
            onDelete={onDelete ? () => onDelete(call.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
