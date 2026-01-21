"use client";
import { useState, useEffect } from "react";
import { Phone, X, PawPrint, User } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { CallDetailContent } from "../../shared/call-detail-content";
import { api } from "~/trpc/client";
import { getCallDataOverride } from "./mock-data";
import { getDemoCallerName } from "../mock-data";
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
    <div id="call-detail-panel" className="flex min-h-0 flex-1 flex-col">
      {/* Compact Patient Card Header */}
      <header className="border-b border-border/40 bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.02]">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              "bg-gradient-to-br from-primary/15 to-primary/5",
              "ring-1 ring-primary/10",
            )}
          >
            <User className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>

          {/* Info Stack */}
          <div className="min-w-0 flex-1">
            {/* Name Row */}
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                {callerName ?? "Unknown Caller"}
              </h2>
              {petName && (
                <>
                  <span className="text-border">·</span>
                  <div className="flex items-center gap-1">
                    <PawPrint className="h-3 w-3 text-primary" />
                    <span className="text-sm text-muted-foreground">{petName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Phone */}
            {call.customer_phone && (
              <div className="mt-0.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[13px] tabular-nums text-muted-foreground">
                  {call.customer_phone}
                </span>
              </div>
            )}
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                "text-muted-foreground/50 hover:text-foreground",
                "transition-colors hover:bg-muted/80",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

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
      <div className="border-t border-border/50 bg-card p-4">
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
