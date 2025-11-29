"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { api } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Phone,
  Search,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { InboundCallDetail } from "./inbound-call-detail";
import { PaginationControls } from "./pagination-controls";
import { cn, formatDuration } from "~/lib/utils";
import { formatPhoneNumber } from "~/lib/utils/phone";
import { useDebounce } from "~/hooks/use-debounce";
import type { Database } from "~/database.types";

const PAGE_SIZE = 20;

// Use database types instead of manual interface
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];
// CallStatus from database is string, but we know the valid values
type CallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";
type UserSentiment = "positive" | "neutral" | "negative" | null;

export function InboundCallsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<UserSentiment | "all">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCall, setSelectedCall] = useState<InboundCall | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Refs to track polling state (prevents race conditions)
  const callsRef = useRef<InboundCall[]>([]);
  const hasActiveCallsRef = useRef(false);

  // Fetch calls
  const {
    data: callsData,
    isLoading,
    refetch,
  } = api.inboundCalls.listInboundCalls.useQuery(
    {
      page: currentPage,
      pageSize: PAGE_SIZE,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sentiment:
        sentimentFilter !== "all" && sentimentFilter !== null
          ? sentimentFilter
          : undefined,
      search: debouncedSearchTerm ?? undefined, // Use debounced search
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    },
    {
      refetchInterval: () => {
        // Use ref to check active calls (prevents race condition)
        const calls = callsRef.current;
        const hasActive = calls.some(
          (c) =>
            c.status === "ringing" ||
            c.status === "in_progress" ||
            c.status === "queued",
        );
        hasActiveCallsRef.current = hasActive;

        // Poll every 5s if there are active calls, 30s otherwise
        return hasActive ? 5000 : 30000;
      },
    },
  );

  // Update refs when data changes (prevents race conditions in polling)
  useEffect(() => {
    if (callsData?.calls) {
      callsRef.current = callsData.calls;
    }
  }, [callsData?.calls]);

  // Fetch statistics
  const { data: statsData } = api.inboundCalls.getInboundCallStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Memoize calls and pagination to prevent unnecessary re-renders
  const calls = useMemo(() => callsData?.calls ?? [], [callsData?.calls]);
  const pagination = useMemo(
    () =>
      callsData?.pagination ?? {
        page: 1,
        pageSize: PAGE_SIZE,
        total: 0,
        totalPages: 0,
      },
    [callsData?.pagination],
  );
  const stats = useMemo(
    () =>
      statsData ?? {
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        inProgressCalls: 0,
        avgDuration: 0,
        totalCost: 0,
        sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
        statusDistribution: {
          queued: 0,
          ringing: 0,
          in_progress: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        },
        callsByDay: [],
      },
    [statsData],
  );

  const handleViewCall = useCallback((call: InboundCall) => {
    setSelectedCall(call);
    setIsDetailOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    void refetch();
    toast.success("Calls refreshed");
  }, [refetch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Memoize badge functions to prevent recreation on every render
  const getStatusBadge = useCallback((status: CallStatus) => {
    const variants: Record<CallStatus, { label: string; className: string }> = {
      queued: { label: "Queued", className: "bg-yellow-100 text-yellow-800" },
      ringing: { label: "Ringing", className: "bg-blue-100 text-blue-800" },
      in_progress: {
        label: "In Progress",
        className: "bg-green-100 text-green-800",
      },
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-800",
      },
      failed: { label: "Failed", className: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-800" },
    };

    const variant = variants[status];
    if (!variant) {
      return (
        <Badge className="bg-gray-100 text-gray-800" variant="secondary">
          {status}
        </Badge>
      );
    }
    return (
      <Badge
        className={variant.className}
        variant="secondary"
        aria-label={`Call status: ${variant.label}`}
      >
        {variant.label}
      </Badge>
    );
  }, []);

  const getSentimentBadge = useCallback((sentiment: UserSentiment) => {
    if (!sentiment) return null;

    const variants: Record<string, { label: string; className: string }> = {
      positive: { label: "Positive", className: "bg-green-100 text-green-800" },
      neutral: { label: "Neutral", className: "bg-gray-100 text-gray-800" },
      negative: { label: "Negative", className: "bg-red-100 text-red-800" },
    };

    const variant = variants[sentiment];
    if (!variant) return null;

    return (
      <Badge
        className={variant.className}
        variant="secondary"
        aria-label={`Sentiment: ${variant.label}`}
      >
        {variant.label}
      </Badge>
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-muted-foreground text-xs">
              {stats.completedCalls} completed, {stats.failedCalls} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : "0s"}
            </div>
            <p className="text-muted-foreground text-xs">Average call length</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">All inbound calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressCalls}</div>
            <p className="text-muted-foreground text-xs">
              {stats.statusDistribution.ringing} ringing,{" "}
              {stats.statusDistribution.in_progress} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter inbound calls by status, sentiment, date, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as CallStatus | "all");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="ringing">Ringing</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sentiment</label>
              <Select
                value={sentimentFilter ?? "all"}
                onValueChange={(value) => {
                  setSentimentFilter(
                    value === "all" ? "all" : (value as UserSentiment),
                  );
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search
                className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4"
                aria-hidden="true"
              />
              <Input
                placeholder="Search by phone number or transcript..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8"
                aria-label="Search calls by phone number or transcript"
              />
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              aria-label="Refresh calls list"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
                aria-hidden="true"
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inbound Calls</CardTitle>
          <CardDescription>{pagination.total} total calls</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && calls.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No calls found</p>
              <p className="text-muted-foreground text-sm">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Caller</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sentiment</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => {
                      // Type assertion: tRPC returns status as string, but we know it's a valid CallStatus
                      const typedCall = call as InboundCall;
                      return (
                        <TableRow key={typedCall.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {format(
                                  new Date(typedCall.created_at),
                                  "MMM d, yyyy",
                                )}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {format(
                                  new Date(typedCall.created_at),
                                  "h:mm a",
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatPhoneNumber(typedCall.customer_phone)}
                              </span>
                              {typedCall.clinic_name && (
                                <span className="text-muted-foreground text-xs">
                                  {typedCall.clinic_name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {typedCall.duration_seconds
                              ? formatDuration(typedCall.duration_seconds)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(typedCall.status as CallStatus)}
                          </TableCell>
                          <TableCell>
                            {getSentimentBadge(
                              typedCall.user_sentiment as UserSentiment,
                            )}
                          </TableCell>
                          <TableCell>
                            {typedCall.cost
                              ? `$${typedCall.cost.toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCall(typedCall)}
                              aria-label={`View details for call from ${formatPhoneNumber(typedCall.customer_phone)}`}
                            >
                              <Eye
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    pageSize={pagination.pageSize}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Call Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
            <DialogDescription>
              Full details for inbound call {selectedCall?.vapi_call_id}
            </DialogDescription>
          </DialogHeader>
          {selectedCall && <InboundCallDetail call={selectedCall} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
