"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { fetchCalls } from "~/server/actions/retell";
import type { CallDetailResponse } from "~/server/actions/retell";
import { useCallPolling } from "~/hooks/use-call-polling";
import { QuickCallDialog } from "~/components/dashboard/quick-call-dialog";
import { ActiveCallsSection } from "~/components/dashboard/active-calls-section";
import { DateGroupSection } from "~/components/dashboard/date-group-section";
import { toast } from "sonner";

// Active call statuses
const ACTIVE_STATUSES = ["initiated", "ringing", "in_progress"];

export default function CallsPage() {
  const [calls, setCalls] = useState<CallDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickCallDialog, setShowQuickCallDialog] = useState(false);

  // Use refs for stable references in polling
  const callsRef = useRef(calls);
  useEffect(() => {
    callsRef.current = calls;
  }, [calls]);

  // Load calls data
  const loadCalls = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }

    try {
      const result = await fetchCalls();

      if (result.success && result.data) {
        setCalls(result.data as CallDetailResponse[]);
      } else {
        if (isInitial) {
          toast.error(result.error ?? "Failed to load calls");
        }
      }
    } catch {
      if (isInitial) {
        toast.error("Failed to load calls");
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, []);

  // Check if there are any active calls
  const hasActiveCalls = useCallback(() => {
    return callsRef.current.some((call) =>
      ACTIVE_STATUSES.includes(call.status)
    );
  }, []);

  // Auto-refresh with adaptive polling
  const { isRefreshing, refresh } = useCallPolling({
    onPoll: loadCalls,
    hasActiveCalls,
  });

  // Initial load
  useEffect(() => {
    void loadCalls(true);
  }, [loadCalls]);

  // Separate active and historical calls
  const activeCalls = calls.filter((call) =>
    ACTIVE_STATUSES.includes(call.status)
  );

  const historicalCalls = calls.filter(
    (call) => !ACTIVE_STATUSES.includes(call.status)
  );

  // Handle successful call creation
  const handleCallSuccess = () => {
    void loadCalls();
    toast.success("Call initiated successfully!");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call History</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your patient calls
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            title="Refresh calls"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          {/* New Call Button */}
          <Button onClick={() => setShowQuickCallDialog(true)} className="gap-2">
            <Phone className="w-4 h-4" />
            New Call
          </Button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Refreshing calls...</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading calls...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Calls Section (pinned at top) */}
          {activeCalls.length > 0 && (
            <ActiveCallsSection calls={activeCalls} />
          )}

          {/* Call History with Date Grouping */}
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                {historicalCalls.length > 0
                  ? `Showing ${historicalCalls.length} historical ${
                      historicalCalls.length === 1 ? "call" : "calls"
                    }`
                  : "No historical calls yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DateGroupSection calls={historicalCalls} />
            </CardContent>
          </Card>

          {/* Empty state for first-time users */}
          {calls.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center gap-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xl font-semibold">No calls yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Get started by creating your first patient and initiating a
                      call. You can manage patient information and make calls
                      directly from this dashboard.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowQuickCallDialog(true)} className="gap-2">
                      <Phone className="w-4 h-4" />
                      Start First Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Call Dialog */}
      <QuickCallDialog
        open={showQuickCallDialog}
        onOpenChange={setShowQuickCallDialog}
        onSuccess={handleCallSuccess}
      />
    </div>
  );
}
