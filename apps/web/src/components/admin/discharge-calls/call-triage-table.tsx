"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/ui/table";
import { Button } from "@odis-ai/ui/button";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Badge } from "@odis-ai/ui/badge";
import {
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ReviewCategoryBadge } from "./review-category-badge";
import { QuickCategoryButtons } from "./review-category-selector";
import type { ReviewCategory } from "~/server/api/routers/admin-discharge-calls";
import { formatPhoneNumber } from "@odis-ai/utils/phone";

interface CallData {
  id: string;
  status: string;
  reviewCategory: ReviewCategory;
  createdAt: string;
  endedAt: string | null;
  endedReason: string | null;
  durationSeconds: number | null;
  cost: number | null;
  customerPhone: string | null;
  recordingUrl: string | null;
  transcript: string | null;
  summary: string | null;
  successEvaluation: string | null;
  userSentiment: string | null;
  vapiCallId: string | null;
  caseId: string | null;
  isTestCall?: boolean;
  patientName: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string | null;
}

interface CallTriageTableProps {
  calls: CallData[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onCategoryChange: (callId: string, category: ReviewCategory) => void;
  isUpdating: boolean;
  currentPlayingId: string | null;
  onPlayAudio: (callId: string, url: string) => void;
  onStopAudio: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getEndReasonLabel(reason: string | null): string {
  if (!reason) return "—";
  const labels: Record<string, string> = {
    "assistant-ended-call": "Completed",
    "customer-ended-call": "Hung up",
    "assistant-forwarded-call": "Transferred",
    "customer-did-not-answer": "No answer",
    "dial-no-answer": "No answer",
    voicemail: "Voicemail",
    "customer-busy": "Busy",
    "dial-busy": "Busy",
    "silence-timed-out": "Timeout",
    "dial-failed": "Failed",
    "assistant-error": "Error",
  };
  return labels[reason.toLowerCase()] ?? reason;
}

function getOutcomeBadge(reason: string | null) {
  if (!reason) return null;
  const r = reason.toLowerCase();

  if (["assistant-ended-call", "customer-ended-call"].includes(r)) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        {getEndReasonLabel(reason)}
      </Badge>
    );
  }
  if (r === "voicemail") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        Voicemail
      </Badge>
    );
  }
  if (["customer-did-not-answer", "dial-no-answer"].includes(r)) {
    return (
      <Badge
        variant="outline"
        className="border-orange-200 bg-orange-50 text-orange-700"
      >
        No Answer
      </Badge>
    );
  }
  if (["dial-failed", "assistant-error"].includes(r)) {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-slate-600">
      {getEndReasonLabel(reason)}
    </Badge>
  );
}

export function CallTriageTable({
  calls,
  selectedIds,
  onSelectionChange,
  onCategoryChange,
  isUpdating,
  currentPlayingId,
  onPlayAudio,
  onStopAudio,
}: CallTriageTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === calls.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(calls.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Get focused row if any
      const activeElement = document.activeElement;
      const focusedRow = activeElement?.closest("tr[data-call-id]");
      const callId = focusedRow?.getAttribute("data-call-id");

      if (!callId) return;

      const shortcuts: Record<string, ReviewCategory> = {
        g: "good",
        b: "bad",
        v: "voicemail",
        f: "failed",
        n: "no_answer",
        u: "needs_followup",
        r: "to_review",
      };

      const category = shortcuts[e.key.toLowerCase()];
      if (category && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onCategoryChange(callId, category);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCategoryChange]);

  return (
    <div className="h-full">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200 bg-slate-50/50">
            <TableHead className="w-10">
              <Checkbox
                checked={calls.length > 0 && selectedIds.size === calls.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-8"></TableHead>
            <TableHead className="w-40">Patient / Owner</TableHead>
            <TableHead className="w-24">Outcome</TableHead>
            <TableHead className="w-20">Duration</TableHead>
            <TableHead className="w-32">Review</TableHead>
            <TableHead className="w-44">Quick Actions</TableHead>
            <TableHead className="w-28">Date</TableHead>
            <TableHead className="w-16">Audio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => {
            const isExpanded = expandedIds.has(call.id);
            const isSelected = selectedIds.has(call.id);
            const isPlaying = currentPlayingId === call.id;

            return (
              <Fragment key={call.id}>
                <TableRow
                  data-call-id={call.id}
                  tabIndex={0}
                  className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 focus:bg-teal-50 focus:outline-none ${
                    isSelected
                      ? "bg-teal-50/50"
                      : call.isTestCall
                        ? "bg-emerald-50/30"
                        : ""
                  }`}
                  onClick={() => toggleExpanded(call.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(call.id)}
                      aria-label={`Select ${call.patientName}`}
                    />
                  </TableCell>
                  <TableCell>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {call.patientName}
                        </span>
                        {call.isTestCall && (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-100 text-emerald-700"
                          >
                            Test
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">
                        {call.ownerName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getOutcomeBadge(call.endedReason)}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">
                    {formatDuration(call.durationSeconds)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ReviewCategoryBadge
                      category={call.reviewCategory}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <QuickCategoryButtons
                      onSelect={(category) =>
                        onCategoryChange(call.id, category)
                      }
                      disabled={isUpdating}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="text-slate-600">
                        {format(new Date(call.createdAt), "MMM d, h:mm a")}
                      </span>
                      <span className="text-slate-400">
                        {formatDistanceToNow(new Date(call.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {call.recordingUrl ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 w-8 p-0 ${isPlaying ? "text-teal-600" : "text-slate-500"}`}
                        onClick={() =>
                          isPlaying
                            ? onStopAudio()
                            : onPlayAudio(call.id, call.recordingUrl!)
                        }
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-slate-50/50">
                    <TableCell colSpan={9} className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">
                            Contact Info
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="h-3.5 w-3.5" />
                              {call.customerPhone
                                ? formatPhoneNumber(call.customerPhone)
                                : "No phone"}
                            </div>
                            {call.caseId && (
                              <a
                                href={`/admin/discharges/${call.caseId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                              >
                                View Case
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">
                            Call Summary
                          </h4>
                          <p className="text-sm text-slate-600">
                            {call.summary ?? "No summary available"}
                          </p>
                        </div>
                        {call.transcript && (
                          <div className="md:col-span-2">
                            <h4 className="mb-2 text-sm font-semibold text-slate-700">
                              Transcript Preview
                            </h4>
                            <p className="line-clamp-4 text-sm text-slate-600">
                              {call.transcript}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      {calls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Phone className="mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-medium text-slate-700">No calls found</p>
          <p className="text-sm text-slate-500">
            Try adjusting your filters or date range
          </p>
        </div>
      )}
    </div>
  );
}
