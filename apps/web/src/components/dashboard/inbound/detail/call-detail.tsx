"use client";
import { useState, useEffect } from "react";
import { Phone, X, PawPrint, User } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { ActionCardSelector } from "../../shared/action-cards";
import { CallDetailTabs } from "../../shared/tabbed-panel";
import { api } from "~/trpc/client";
import { getCallDataOverride } from "./mock-data";
import { getDemoCallerName } from "../mock-data";
import { QuickActionsFooter } from "./shared/quick-actions-footer";
import { toast } from "sonner";
import type { Database } from "@odis-ai/shared/types";
import type { CallOutcome } from "../types";

// Use Database type for compatibility with table data
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface CallDetailProps {
  call: InboundCall;
  onDelete?: (id: string) => Promise<void>;
  onClose?: () => void;
  isSubmitting: boolean;
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

  // Query for booking data by vapi_call_id
  const { data: bookingData } = api.inbound.getBookingByVapiCallId.useQuery(
    { vapiCallId: call.vapi_call_id || "placeholder" }, // Provide fallback for disabled queries
    {
      enabled: !!call.vapi_call_id,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false,
    },
  );

  // Get caller name and pet name
  // Prioritize VAPI booking data, then fall back to database lookup
  const callerName = demoCallerName ?? callerInfo?.name ?? null;
  const petName = bookingData?.patient_name ?? callerInfo?.petName ?? null;

  // Action confirmation state - track locally for optimistic updates
  const [isActionConfirmed, setIsActionConfirmed] = useState(
    call.action_confirmed ?? false,
  );

  // Sync with prop changes (reset when switching between calls)
  useEffect(() => {
    setIsActionConfirmed(call.action_confirmed ?? false);
  }, [call.id, call.action_confirmed]);

  // Get utils for cache invalidation
  const utils = api.useUtils();

  // Confirm action mutation
  const confirmActionMutation = api.inbound.confirmCallAction.useMutation({
    onSuccess: () => {
      toast.success("Action confirmed");

      // Invalidate queries to update cache
      void utils.inboundCalls.listInboundCalls.invalidate();
    },
    onError: (error) => {
      // Revert optimistic update
      setIsActionConfirmed(call.action_confirmed ?? false);
      toast.error(`Failed to confirm action: ${error.message}`);
    },
  });

  // Handle confirm action
  const handleConfirmAction = () => {
    // Optimistic update
    setIsActionConfirmed(true);

    // Call mutation
    confirmActionMutation.mutate({ callId: call.id });
  };

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
    { vapiCallId: call.vapi_call_id || "placeholder" }, // Provide fallback for disabled queries
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

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Action Card - Outcome-specific display */}
        <ActionCardSelector
          call={{
            id: call.id,
            outcome: (call.outcome as CallOutcome) ?? null,
            summary: callData.summary ?? null,
            structured_data: call.structured_data as Record<string, unknown> | null,
            call_outcome_data: call.call_outcome_data as {
              call_outcome?: string;
              outcome_summary?: string;
              key_topics_discussed?: string[];
            } | null,
            escalation_data: call.escalation_data as {
              escalation_triggered?: boolean;
              escalation_summary?: string;
              escalation_type?: string;
              staff_action_needed?: string;
            } | null,
            follow_up_data: call.follow_up_data as {
              follow_up_needed?: boolean;
              follow_up_summary?: string;
              appointment_status?: string;
              next_steps?: string;
            } | null,
            customer_phone: call.customer_phone,
          }}
          booking={bookingData}
          isConfirmed={isActionConfirmed}
          onConfirm={handleConfirmAction}
          isConfirming={confirmActionMutation.isPending}
        />

        {/* Tabbed Panel - Call & Summary */}
        <CallDetailTabs
          summary={callData.summary ?? null}
          recordingUrl={callData.recording_url ?? null}
          transcript={callData.transcript ?? null}
          cleanedTranscript={call.cleaned_transcript ?? null}
          durationSeconds={callData.duration_seconds}
          isLoadingRecording={vapiQuery.isLoading && shouldFetchFromVAPI}
          actionsTaken={
            Array.isArray(call.actions_taken)
              ? (call.actions_taken as string[])
              : undefined
          }
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
