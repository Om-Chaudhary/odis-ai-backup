"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@odis-ai/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import {
  Phone,
  Clock,
  Loader2,
  AlertTriangle,
  Trash2,
  FileText,
} from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { formatPhoneNumber } from "@odis-ai/shared/util/phone";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { CallStatusBadge, SentimentBadge } from "./badges";
import { formatDuration } from "./utils";
import { getCallDataOverride } from "./demo-data";

interface InboundCall {
  id: string;
  vapi_call_id: string;
  customer_phone: string | null;
  created_at: string;
  status: string;
  user_sentiment: string | null;
  cost: number | null;
  clinic_name: string | null;
  ended_reason: string | null;
  recording_url?: string | null;
  transcript?: string | null;
  duration_seconds?: number | null;
  summary?: string | null;
}

interface CallDetailProps {
  call: InboundCall;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
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
      {/* Header */}
      <div className="bg-muted/20 flex items-start justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
            <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {formatPhoneNumber(call.customer_phone ?? "") || "Unknown Caller"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {format(new Date(call.created_at), "EEEE, MMMM d 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CallStatusBadge status={call.status} />
          {call.user_sentiment && (
            <SentimentBadge sentiment={call.user_sentiment} />
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Call Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Call Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {callData.duration_seconds ? (
                    formatDuration(callData.duration_seconds)
                  ) : vapiQuery.isLoading ? (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost</p>
                <p className="font-medium">
                  {call.cost ? `$${call.cost.toFixed(2)}` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clinic</p>
                <p className="font-medium">{call.clinic_name ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End Reason</p>
                <p className="font-medium">{call.ended_reason ?? "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Recording and Transcript */}
        {vapiQuery.isLoading && shouldFetchFromVAPI ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-muted-foreground flex items-center justify-center gap-2">
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

        {/* Call Summary */}
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
        <div className="bg-muted/10 border-t p-4">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
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
