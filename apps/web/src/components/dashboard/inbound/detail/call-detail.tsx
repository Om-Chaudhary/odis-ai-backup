"use client";

import { useState } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import {
  Building2,
  Loader2,
  AlertTriangle,
  Trash2,
  FileText,
} from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { CallIntelligenceSection } from "../../outbound/detail/call-intelligence";
import { api } from "~/trpc/client";
import { getCallDataOverride } from "./demo-data";
import { ActionsTakenCard } from "./actions-taken-card";

// Import InboundCall type from shared types
import type { InboundCall } from "../types";

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

export function CallDetail({ call, onDelete, isSubmitting }: CallDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch call data from VAPI if database data is missing critical fields
  const shouldFetchFromVAPI = !call.recording_url && !!call.vapi_call_id;
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: () => shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false, // Don't retry on error
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
    <div className="flex h-full flex-col">
      {/* Minimal Header - Only context not shown in table row */}
      <div className="flex items-center justify-between border-b border-teal-100/50 bg-gradient-to-r from-white/50 to-teal-50/30 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Building2 className="h-4 w-4" />
          <span>{call.clinic_name ?? "Unknown Clinic"}</span>
        </div>
        {call.ended_reason && (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-xs text-slate-600"
          >
            {formatEndReason(call.ended_reason)}
          </Badge>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {call.outcome && call.actions_taken && (
          <ActionsTakenCard
            outcome={call.outcome}
            actionsTaken={call.actions_taken}
          />
        )}

        {/* Call Recording and Transcript */}
        {vapiQuery.isLoading && shouldFetchFromVAPI ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading call recording...
              </div>
            </CardContent>
          </Card>
        ) : callData.recording_url ? (
          <CallRecordingPlayer
            recordingUrl={callData.recording_url}
            transcript={callData.transcript ?? null}
            durationSeconds={callData.duration_seconds}
          />
        ) : vapiQuery.error && shouldFetchFromVAPI ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Unable to load call recording from VAPI
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Call Intelligence Section - 6 Categories */}
        <CallIntelligenceSection
          callOutcomeData={call.call_outcome_data ?? null}
          petHealthData={call.pet_health_data ?? null}
          medicationComplianceData={call.medication_compliance_data ?? null}
          ownerSentimentData={call.owner_sentiment_data ?? null}
          escalationData={call.escalation_data ?? null}
          followUpData={call.follow_up_data ?? null}
        />

        {/* Call Summary - First position (primary content) */}
        {callData.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Call Summary
                {shouldFetchFromVAPI && vapiQuery.data && !call.summary && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    From VAPI
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {callData.summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Footer */}
      {onDelete && (
        <div className="border-t border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 p-4">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Are you sure you want to delete this call? This action cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  onClick={() => onDelete(call.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Confirm Delete
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Call
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
