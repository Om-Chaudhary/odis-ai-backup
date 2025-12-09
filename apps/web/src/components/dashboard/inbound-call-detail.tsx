"use client";

import { format } from "date-fns";
import { Badge } from "@odis/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@odis/ui/card";
import {
  Phone,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import { formatDuration } from "@odis/utils";
import { CallAudioPlayer } from "./call-audio-player";
import type { Database } from "~/database.types";

// Use database types instead of manual interface
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];
type CallStatus = InboundCall["status"];
type UserSentiment = InboundCall["user_sentiment"];

interface InboundCallDetailProps {
  call: InboundCall;
}

export function InboundCallDetail({ call }: InboundCallDetailProps) {
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return "N/A";
    const cleaned = phone.replace(/^\+/, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: CallStatus) => {
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
      <Badge className={variant.className} variant="secondary">
        {variant.label}
      </Badge>
    );
  };

  const getSentimentBadge = (sentiment: UserSentiment) => {
    if (!sentiment) return null;

    const variants: Record<
      Exclude<UserSentiment, null>,
      { label: string; className: string; icon: typeof CheckCircle }
    > = {
      positive: {
        label: "Positive",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      neutral: {
        label: "Neutral",
        className: "bg-gray-100 text-gray-800",
        icon: AlertCircle,
      },
      negative: {
        label: "Negative",
        className: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };

    const variant = variants[sentiment];
    if (!variant) return null;
    const Icon = variant.icon;
    return (
      <Badge className={variant.className} variant="secondary">
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  const parseTranscriptMessages = () => {
    if (!call.transcript_messages) return [];
    try {
      const messages = call.transcript_messages as Array<{
        role: string;
        message: string;
        time: number;
      }>;
      return messages;
    } catch {
      return [];
    }
  };

  const messages = parseTranscriptMessages();

  // Extract and type-check transcript
  const transcript =
    typeof call.transcript === "string" ? call.transcript : null;

  return (
    <div className="space-y-6">
      {/* Call Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Inbound Call Details
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(call.status)}
              {getSentimentBadge(call.user_sentiment)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Caller
              </p>
              <p className="text-lg font-semibold">
                {formatPhoneNumber(call.customer_phone)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Clinic
              </p>
              <p className="text-lg font-semibold">
                {call.clinic_name ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Date & Time
              </p>
              <p className="text-lg font-semibold">
                {format(new Date(call.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Duration
              </p>
              <p className="text-lg font-semibold">
                {call.duration_seconds
                  ? formatDuration(call.duration_seconds)
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Cost</p>
              <p className="text-lg font-semibold">
                {call.cost ? `$${call.cost.toFixed(2)}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                VAPI Call ID
              </p>
              <p className="font-mono text-sm">{call.vapi_call_id}</p>
            </div>
          </div>

          {call.started_at && call.ended_at && (
            <div className="mt-4 border-t pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Started
                  </p>
                  <p className="text-sm">
                    {format(
                      new Date(call.started_at),
                      "MMM d, yyyy 'at' h:mm:ss a",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Ended
                  </p>
                  <p className="text-sm">
                    {format(
                      new Date(call.ended_at),
                      "MMM d, yyyy 'at' h:mm:ss a",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {call.ended_reason && (
            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground text-sm font-medium">
                End Reason
              </p>
              <p className="text-sm">{call.ended_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording */}
      {call.recording_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Call Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CallAudioPlayer
              url={call.recording_url}
              duration={call.duration_seconds ?? undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message-by-Message Transcript */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Message Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="text-muted-foreground w-20 flex-shrink-0 text-xs">
                    {format(new Date(msg.time * 1000), "mm:ss")}
                  </div>
                  <div className="flex-1">
                    <Badge
                      variant={msg.role === "assistant" ? "default" : "outline"}
                      className="mb-1"
                    >
                      {msg.role === "assistant" ? "Assistant" : "Caller"}
                    </Badge>
                    <p className="mt-1 text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis */}
      {(call.summary ?? call.success_evaluation ?? call.call_analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Call Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {call.summary && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Summary
                </p>
                <p className="text-sm">{call.summary}</p>
              </div>
            )}

            {call.success_evaluation && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Success Evaluation
                </p>
                <p className="text-sm">{String(call.success_evaluation)}</p>
              </div>
            )}

            {call.structured_data != null && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Structured Data
                </p>
                <pre className="bg-muted overflow-auto rounded-md p-3 text-xs">
                  {JSON.stringify(call.structured_data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-muted-foreground font-medium">Assistant ID</p>
              <p className="font-mono">{call.assistant_id}</p>
            </div>
            {call.phone_number_id && (
              <div>
                <p className="text-muted-foreground font-medium">
                  Phone Number ID
                </p>
                <p className="font-mono">{call.phone_number_id}</p>
              </div>
            )}
            {call.user_id && (
              <div>
                <p className="text-muted-foreground font-medium">User ID</p>
                <p className="font-mono">{call.user_id}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground font-medium">Created</p>
              <p>
                {format(
                  new Date(call.created_at),
                  "MMM d, yyyy 'at' h:mm:ss a",
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Last Updated</p>
              <p>
                {format(
                  new Date(call.updated_at),
                  "MMM d, yyyy 'at' h:mm:ss a",
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
