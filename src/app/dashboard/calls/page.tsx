"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
import { ScheduledCallsSection } from "~/components/dashboard/scheduled-calls-section";
import { DateGroupSection } from "~/components/dashboard/date-group-section";
import { toast } from "sonner";

// Active call statuses
const ACTIVE_STATUSES = ["initiated", "ringing", "in_progress"];

export default function CallsPage() {
  const [calls, setCalls] = useState<CallDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickCallDialog, setShowQuickCallDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Use refs for stable references in polling
  const callsRef = useRef(calls);
  useEffect(() => {
    callsRef.current = calls;
  }, [calls]);

  // Helper function to get start and end of day in local timezone
  const getDateRange = useCallback((date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, []);

  // Navigate to previous day
  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  // Navigate to next day
  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  // Navigate to today
  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Check if selected date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  // Format date for display
  const formatDisplayDate = useCallback(
    (date: Date) => {
      if (isToday(date)) {
        return "Today";
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) {
        return "Yesterday";
      }

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    },
    [isToday],
  );

  // Load calls data with date filter
  const loadCalls = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setIsLoading(true);
      }

      try {
        const { start, end } = getDateRange(selectedDate);
        const result = await fetchCalls({
          status: "all",
          offset: 0,
          limit: 100,
          startDate: start,
          endDate: end,
        });

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
    },
    [selectedDate, getDateRange],
  );

  // Check if there are any active calls
  const hasActiveCalls = useCallback(() => {
    return callsRef.current.some((call) =>
      ACTIVE_STATUSES.includes(call.status),
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

  // Separate active, scheduled, and historical calls
  const activeCalls = calls.filter((call) =>
    ACTIVE_STATUSES.includes(call.status),
  );

  const scheduledCalls = calls.filter((call) => call.status === "scheduled");

  const historicalCalls = calls.filter(
    (call) =>
      !ACTIVE_STATUSES.includes(call.status) && call.status !== "scheduled",
  );

  // Handle successful call creation
  const handleCallSuccess = () => {
    void loadCalls();
    toast.success("Call initiated successfully!");
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
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
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          {/* New Call Button */}
          <Button
            onClick={() => setShowQuickCallDialog(true)}
            className="gap-2"
          >
            <Phone className="h-4 w-4" />
            New Call
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
              disabled={isLoading}
              title="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[200px] text-center">
              <p className="text-lg font-semibold">
                {formatDisplayDate(selectedDate)}
              </p>
              <p className="text-muted-foreground text-xs">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              disabled={isLoading || isToday(selectedDate)}
              title="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isToday(selectedDate) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={goToToday}
              disabled={isLoading}
            >
              Go to Today
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      {isRefreshing && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Refreshing calls...</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading calls...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Calls Section (pinned at top) */}
          {activeCalls.length > 0 && <ActiveCallsSection calls={activeCalls} />}

          {/* Scheduled Calls Section */}
          {scheduledCalls.length > 0 && (
            <ScheduledCallsSection
              calls={scheduledCalls}
              onCallInitiated={handleCallSuccess}
            />
          )}

          {/* Call History with Date Grouping */}
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                {historicalCalls.length > 0
                  ? `Showing ${historicalCalls.length} historical ${
                      historicalCalls.length === 1 ? "call" : "calls"
                    } for ${formatDisplayDate(selectedDate)}`
                  : `No historical calls for ${formatDisplayDate(selectedDate)}`}
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
                  <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
                    <Phone className="text-primary h-10 w-10" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-xl font-semibold">No calls yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Get started by creating your first patient and initiating
                      a call. You can manage patient information and make calls
                      directly from this dashboard.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowQuickCallDialog(true)}
                      className="gap-2"
                    >
                      <Phone className="h-4 w-4" />
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
