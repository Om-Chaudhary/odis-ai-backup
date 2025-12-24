"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { Label } from "@odis-ai/shared/ui/label";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/shared/ui/table";
import {
  Phone,
  ExternalLink,
  Play,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Voicemail,
  PhoneMissed,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { CallStatus } from "@odis-ai/shared/types";

/**
 * Human-readable labels for call end reasons
 */
const END_REASON_LABELS: Record<string, string> = {
  "assistant-ended-call": "Completed",
  "customer-ended-call": "Customer hung up",
  "assistant-forwarded-call": "Transferred",
  "customer-did-not-answer": "No answer",
  "dial-no-answer": "No answer",
  voicemail: "Voicemail",
  "customer-busy": "Line busy",
  "dial-busy": "Line busy",
  "silence-timed-out": "No response",
  "dial-failed": "Dial failed",
  "assistant-error": "System error",
  "exceeded-max-duration": "Timeout",
};

/**
 * Get human-readable label for end reason
 */
function getEndReasonLabel(endedReason: string | null): string {
  if (!endedReason) return "—";
  return (
    END_REASON_LABELS[endedReason.toLowerCase()] ??
    endedReason.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Get badge variant for call status
 */
function getStatusBadge(status: CallStatus, endedReason: string | null) {
  const reason = endedReason?.toLowerCase();

  // Check for no-contact outcomes
  const isNoContact =
    reason &&
    [
      "customer-did-not-answer",
      "dial-no-answer",
      "voicemail",
      "customer-busy",
      "dial-busy",
      "silence-timed-out",
    ].includes(reason);

  // Check for successful outcomes
  const isSuccessful =
    reason &&
    [
      "assistant-ended-call",
      "customer-ended-call",
      "assistant-forwarded-call",
    ].includes(reason);

  if (status === "completed") {
    if (isNoContact) {
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          {reason === "voicemail" ? (
            <Voicemail className="mr-1 h-3 w-3" />
          ) : (
            <PhoneMissed className="mr-1 h-3 w-3" />
          )}
          {getEndReasonLabel(endedReason)}
        </Badge>
      );
    }
    if (isSuccessful) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {getEndReasonLabel(endedReason)}
        </Badge>
      );
    }
  }

  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        <AlertCircle className="mr-1 h-3 w-3" />
        {getEndReasonLabel(endedReason) || "Failed"}
      </Badge>
    );
  }

  if (status === "queued") {
    return (
      <Badge
        variant="outline"
        className="border-slate-200 bg-slate-50 text-slate-700"
      >
        <Clock className="mr-1 h-3 w-3" />
        Queued
      </Badge>
    );
  }

  if (status === "in_progress" || status === "ringing") {
    return (
      <Badge
        variant="outline"
        className="border-blue-200 bg-blue-50 text-blue-700"
      >
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        In Progress
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-slate-200 text-slate-600">
      {status ?? "Unknown"}
    </Badge>
  );
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

type EndReasonFilter =
  | "all"
  | "successful"
  | "voicemail"
  | "no_answer"
  | "busy"
  | "failed";
type StatusFilter = "all" | "completed" | "queued" | "in_progress" | "failed";

/**
 * VapiCallHistory - Display call history with filtering and clickable rows
 */
export function VapiCallHistory() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [endReasonFilter, setEndReasonFilter] =
    useState<EndReasonFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isFetching } = api.dashboard.getCallHistory.useQuery(
    {
      page,
      pageSize: 20,
      endReasonFilter,
      statusFilter,
    },
  );

  const handleRowClick = (caseId: string | null) => {
    if (caseId) {
      router.push(`/dashboard/outbound/${caseId}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5" />
            Call History
          </CardTitle>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-slate-500">Outcome</Label>
              <Select
                value={endReasonFilter}
                onValueChange={(v) => {
                  setEndReasonFilter(v as EndReasonFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="busy">Line Busy</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !data?.calls.length ? (
          <div className="py-8 text-center text-slate-500">
            No calls found matching your filters
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Patient</TableHead>
                    <TableHead className="w-[150px]">Owner</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                    <TableHead className="w-[80px]">Duration</TableHead>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.calls.map((call) => (
                    <TableRow
                      key={call.id}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        !call.caseId ? "opacity-60" : ""
                      }`}
                      onClick={() => handleRowClick(call.caseId)}
                    >
                      <TableCell className="font-medium">
                        {call.patientName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {call.ownerName}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(call.status, call.endedReason)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDuration(call.durationSeconds)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex flex-col">
                          <span className="text-xs">
                            {call.createdAt
                              ? format(
                                  new Date(call.createdAt),
                                  "MMM d, h:mm a",
                                )
                              : "—"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {call.createdAt
                              ? formatDistanceToNow(new Date(call.createdAt), {
                                  addSuffix: true,
                                })
                              : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {call.hasTranscript && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View transcript"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (call.caseId) {
                                  router.push(
                                    `/dashboard/outbound/${call.caseId}`,
                                  );
                                }
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {call.recordingUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Play recording"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(call.recordingUrl, "_blank");
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {call.caseId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View case"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/outbound/${call.caseId}`,
                                );
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Showing {(page - 1) * 20 + 1}-
                  {Math.min(page * 20, data.pagination.total)} of{" "}
                  {data.pagination.total} calls
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1),
                      )
                    }
                    disabled={page >= data.pagination.totalPages || isFetching}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
