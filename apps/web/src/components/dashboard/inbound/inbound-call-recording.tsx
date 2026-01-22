"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  AlertCircle,
  Loader2,
  Globe,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { CallPlayer } from "@odis-ai/shared/ui/media";
import { Badge } from "@odis-ai/shared/ui/badge";
import { cn } from "@odis-ai/shared/util";
import { api } from "~/trpc/client";
import type { TranscriptMessage } from "@odis-ai/shared/types";

interface InboundCallRecordingProps {
  /** VAPI call ID to fetch recording for */
  vapiCallId: string;
  /** Optional clinic name for context-aware transcript cleanup */
  clinicName?: string;
  /** Optional class name for the container */
  className?: string;
}

interface TranslationData {
  originalLanguage: string;
  translatedTranscript: string;
  summary: string;
  wasTranslated: boolean;
}

interface CleanedTranscriptData {
  cleanedTranscript: string;
  wasModified: boolean;
}

// Type for the inbound call data from tRPC
interface InboundCallData {
  id: string;
  transcriptMessages: unknown;
  displayTranscript: string | null;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  cleanedTranscript: string | null;
  duration: number | null;
  durationSeconds: number | null;
  startedAt: string | null;
}

/**
 * Inbound Call Recording Component
 *
 * Fetches and displays the recording and transcript for an inbound call
 * linked to an appointment or message via vapiCallId.
 * Uses pre-cleaned transcript from DB (cleaned at webhook time).
 * Falls back to on-demand cleaning for older calls without cleaned_transcript.
 * Automatically translates non-English transcripts.
 */
export function InboundCallRecording({
  vapiCallId,
  clinicName,
  className,
}: InboundCallRecordingProps) {
  const [translationData, setTranslationData] =
    useState<TranslationData | null>(null);
  const [cleanedData, setCleanedData] = useState<CleanedTranscriptData | null>(
    null,
  );
  const [hasAttemptedTranslation, setHasAttemptedTranslation] = useState(false);
  const [hasAttemptedCleanup, setHasAttemptedCleanup] = useState(false);

  const { data: rawCallData, isLoading } =
    api.inboundCalls.getInboundCallByVapiId.useQuery(
      { vapiCallId },
      { enabled: !!vapiCallId },
    );

  // Type assertion to break deep type inference chain
  const callData = rawCallData as InboundCallData | null | undefined;

  // Clean up transcript mutation (fallback for calls without pre-cleaned transcript)
  const cleanMutation = api.inboundCalls.cleanTranscript.useMutation({
    onSuccess: (data: CleanedTranscriptData) => {
      setCleanedData(data);
      // After cleaning, translate if needed (using cleaned transcript)
      if (data.cleanedTranscript && !hasAttemptedTranslation) {
        setHasAttemptedTranslation(true);
        translateMutation.mutate({ transcript: data.cleanedTranscript });
      }
    },
    onError: (error: unknown) => {
      console.error("[InboundCallRecording] Cleanup failed:", error);
      // Fall back to translation of raw transcript
      if (callData?.transcript && !hasAttemptedTranslation) {
        setHasAttemptedTranslation(true);
        translateMutation.mutate({ transcript: callData.transcript });
      }
    },
  });

  const translateMutation = api.inboundCalls.translateTranscript.useMutation({
    onSuccess: (data: TranslationData) => {
      setTranslationData(data);
    },
    onError: (error: unknown) => {
      console.error("[InboundCallRecording] Translation failed:", error);
    },
  });

  // Use pre-cleaned transcript from DB, or fall back to on-demand cleaning for older calls
  useEffect(() => {
    if (!callData?.transcript) return;

    // If we already have a cleaned transcript from the DB, use it directly
    if (callData.cleanedTranscript) {
      setCleanedData({
        cleanedTranscript: callData.cleanedTranscript,
        wasModified: callData.cleanedTranscript !== callData.transcript,
      });
      // Translate the cleaned transcript if needed
      if (!hasAttemptedTranslation) {
        setHasAttemptedTranslation(true);
        translateMutation.mutate({ transcript: callData.cleanedTranscript });
      }
      return;
    }

    // Fallback: clean on-demand for older calls without pre-cleaned transcript
    if (!hasAttemptedCleanup && !cleanMutation.isPending) {
      setHasAttemptedCleanup(true);
      cleanMutation.mutate({
        transcript: callData.transcript,
        clinicName: clinicName ?? undefined,
      });
    }
  }, [
    callData?.transcript,
    callData?.cleanedTranscript,
    hasAttemptedCleanup,
    hasAttemptedTranslation,
    cleanMutation.isPending,
    cleanMutation,
    translateMutation,
    clinicName,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("bg-slate-50/50 dark:bg-slate-900/30", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-slate-500" />
            Call Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading recording...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No call data found
  if (!callData?.recordingUrl) {
    return (
      <Card className={cn("bg-slate-50/50 dark:bg-slate-900/30", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-slate-500" />
            Call Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Recording not available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse transcript messages if available
  const transcriptMessages = callData.transcriptMessages as
    | TranscriptMessage[]
    | null;

  // Determine which transcript to display
  // Priority: displayTranscript (user override) > raw
  const dbDisplayTranscript = callData.displayTranscript; // User override from database
  const rawTranscript = callData.transcript;
  const displayTranscript = dbDisplayTranscript ?? rawTranscript;
  const displaySummary = translationData?.summary ?? callData.summary;
  const isProcessing = cleanMutation.isPending || translateMutation.isPending;

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Summary Card */}
      {(displaySummary != null || isProcessing) && (
        <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Call Summary
              <div className="ml-auto flex items-center gap-2">
                {cleanedData?.wasModified &&
                  !translationData?.wasTranslated && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    >
                      <Wand2 className="mr-1 h-3 w-3" />
                      Enhanced
                    </Badge>
                  )}
                {translationData?.wasTranslated && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <Globe className="mr-1 h-3 w-3" />
                    Translated from {translationData.originalLanguage}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {cleanMutation.isPending
                    ? "Cleaning up transcript..."
                    : "Generating summary..."}
                </span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {displaySummary}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unified Call Player with integrated transcript */}
      <CallPlayer
        audioUrl={callData.recordingUrl}
        transcript={transcriptMessages ?? undefined}
        plainTranscript={displayTranscript}
        duration={callData.durationSeconds ?? undefined}
        title="Inbound Call"
      />
    </div>
  );
}

