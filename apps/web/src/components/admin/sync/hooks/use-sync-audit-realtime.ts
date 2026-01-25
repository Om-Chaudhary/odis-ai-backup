"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useClerkSupabaseClient } from "@odis-ai/data-access/supabase-client";
import type { Database } from "@odis-ai/shared/types";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type CaseSyncAudit = Database["public"]["Tables"]["case_sync_audits"]["Row"];

type PostgresChangeEvent = RealtimePostgresChangesPayload<CaseSyncAudit>;

export type RealtimeStatus = "connecting" | "connected" | "disconnected" | "error";

export interface UseSyncAuditRealtimeOptions {
  /**
   * Filter events by clinic ID. If not provided, all events are received.
   */
  clinicId?: string;

  /**
   * Callback fired for any change event (INSERT, UPDATE, DELETE).
   */
  onAnyChange?: (payload: PostgresChangeEvent) => void;

  /**
   * Callback fired when a new sync is started (INSERT with status 'in_progress').
   */
  onSyncStarted?: (audit: CaseSyncAudit) => void;

  /**
   * Callback fired when a sync completes (UPDATE from 'in_progress' to 'completed').
   */
  onSyncCompleted?: (audit: CaseSyncAudit) => void;

  /**
   * Callback fired when a sync fails (UPDATE from 'in_progress' to 'failed').
   */
  onSyncFailed?: (audit: CaseSyncAudit) => void;

  /**
   * Enable/disable the realtime subscription. Defaults to true.
   */
  enabled?: boolean;
}

export interface UseSyncAuditRealtimeReturn {
  /**
   * Current connection status.
   */
  status: RealtimeStatus;

  /**
   * Error message if status is 'error'.
   */
  error: string | null;

  /**
   * Manually reconnect the subscription.
   */
  reconnect: () => void;
}

/**
 * Hook to subscribe to real-time updates on case_sync_audits table.
 *
 * Provides instant notifications when sync operations start, complete, or fail.
 * Automatically filters by clinic ID if provided.
 *
 * @example
 * ```tsx
 * const { status, error, reconnect } = useSyncAuditRealtime({
 *   clinicId: 'clinic-123',
 *   onSyncStarted: (audit) => {
 *     console.log('Sync started:', audit.id);
 *   },
 *   onSyncCompleted: (audit) => {
 *     console.log('Sync completed:', audit.id);
 *     // Invalidate queries, show notification, etc.
 *   },
 *   onSyncFailed: (audit) => {
 *     console.error('Sync failed:', audit.error_message);
 *   }
 * });
 * ```
 */
export function useSyncAuditRealtime(
  options: UseSyncAuditRealtimeOptions = {}
): UseSyncAuditRealtimeReturn {
  const {
    clinicId,
    onAnyChange,
    onSyncStarted,
    onSyncCompleted,
    onSyncFailed,
    enabled = true,
  } = options;

  const supabase = useClerkSupabaseClient();
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Use refs to avoid stale closures in subscription callbacks
  const onAnyChangeRef = useRef(onAnyChange);
  const onSyncStartedRef = useRef(onSyncStarted);
  const onSyncCompletedRef = useRef(onSyncCompleted);
  const onSyncFailedRef = useRef(onSyncFailed);

  // Update refs when callbacks change
  useEffect(() => {
    onAnyChangeRef.current = onAnyChange;
    onSyncStartedRef.current = onSyncStarted;
    onSyncCompletedRef.current = onSyncCompleted;
    onSyncFailedRef.current = onSyncFailed;
  }, [onAnyChange, onSyncStarted, onSyncCompleted, onSyncFailed]);

  // Handler for postgres_changes events
  const handleChange = useCallback((payload: PostgresChangeEvent) => {
    // Call the generic callback
    onAnyChangeRef.current?.(payload);

    // Handle INSERT events (sync started)
    if (payload.eventType === "INSERT") {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const audit = payload.new as CaseSyncAudit;
      if (audit.status === "in_progress") {
        onSyncStartedRef.current?.(audit);
      }
    }

    // Handle UPDATE events (status transitions)
    if (payload.eventType === "UPDATE") {
      const oldAudit = payload.old as CaseSyncAudit;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const newAudit = payload.new as CaseSyncAudit;

      // Detect status transitions from in_progress
      if (oldAudit.status === "in_progress") {
        if (newAudit.status === "completed") {
          onSyncCompletedRef.current?.(newAudit);
        } else if (newAudit.status === "failed") {
          onSyncFailedRef.current?.(newAudit);
        }
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    setError(null);

    // Create channel name (clinic-specific or global)
    const channelName = clinicId
      ? `sync-audits-clinic-${clinicId}`
      : "sync-audits-all";

    // Create the channel and subscribe to postgres_changes
    const channel = supabase
      .channel(channelName)
      .on<CaseSyncAudit>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_sync_audits",
          // Filter by clinic_id if provided
          ...(clinicId && { filter: `clinic_id=eq.${clinicId}` }),
        },
        handleChange
      )
      .subscribe((status, err) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (status === "SUBSCRIBED") {
          setStatus("connected");
          setError(null);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        } else if (status === "CHANNEL_ERROR") {
          setStatus("error");
          setError(err?.message ?? "Channel subscription error");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        } else if (status === "TIMED_OUT") {
          setStatus("error");
          setError("Subscription timed out");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        } else if (status === "CLOSED") {
          setStatus("disconnected");
        }
      });

    channelRef.current = channel;
  }, [enabled, clinicId, supabase, handleChange]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setStatus("disconnected");
  }, [supabase]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Connect/disconnect based on enabled flag
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    error,
    reconnect,
  };
}
