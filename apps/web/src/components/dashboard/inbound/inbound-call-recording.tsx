"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  FileText,
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
import { AudioPlayer } from "@odis-ai/shared/ui/audio-player";
import { Badge } from "@odis-ai/shared/ui/badge";
import { cn } from "@odis-ai/shared/util";
import { api } from "~/trpc/client";
import { SyncedTranscript } from "../calls/synced-transcript";
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
  const [currentTime, setCurrentTime] = useState(0);
  const [translationData, setTranslationData] =
    useState<TranslationData | null>(null);
  const [cleanedData, setCleanedData] = useState<CleanedTranscriptData | null>(
    null,
  );
  const [hasAttemptedTranslation, setHasAttemptedTranslation] = useState(false);
  const [hasAttemptedCleanup, setHasAttemptedCleanup] = useState(false);
  const showRawTranscript = true; // Default to showing original VAPI transcript

  const { data: callData, isLoading } =
    api.inboundCalls.getInboundCallByVapiId.useQuery(
      { vapiCallId },
      { enabled: !!vapiCallId },
    );

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
  const hasTimedTranscript =
    transcriptMessages && transcriptMessages.length > 0;

  // Determine which transcript to display
  // Priority: displayTranscript (user override) > translated > cleaned > raw
  const dbDisplayTranscript = callData.displayTranscript; // User override from database
  const cleanedTranscript = cleanedData?.cleanedTranscript;
  const translatedTranscript = translationData?.translatedTranscript;
  const rawTranscript = callData.transcript;

  // If user has set a display_transcript override, use that; otherwise show best available version
  // showRawTranscript toggle only applies when there's no user override
  const displayTranscript =
    dbDisplayTranscript ??
    (showRawTranscript
      ? rawTranscript
      : (translatedTranscript ?? cleanedTranscript ?? rawTranscript));
  const displaySummary = translationData?.summary ?? callData.summary;

  // Check if we have a user override active
  const hasUserOverride = !!dbDisplayTranscript;

  // Determine if we have an enhanced transcript to show
  const hasEnhancedTranscript =
    (cleanedData?.wasModified ?? false) ||
    (translationData?.wasTranslated ?? false);
  const isProcessing = cleanMutation.isPending || translateMutation.isPending;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Audio Player */}
      <AudioPlayer
        url={callData.recordingUrl}
        duration={callData.durationSeconds ?? undefined}
        onTimeUpdate={setCurrentTime}
      />

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

      {/* Transcript - Synced version if we have timed messages */}
      {hasTimedTranscript ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-slate-500" />
              Call Transcript
              {translationData?.wasTranslated && !isProcessing && (
                <Badge
                  variant="outline"
                  className="ml-auto text-xs font-normal"
                >
                  Original ({translationData.originalLanguage})
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SyncedTranscript
              messages={transcriptMessages}
              currentTime={currentTime}
              className="h-[400px] p-4"
            />
          </CardContent>
        </Card>
      ) : displayTranscript ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-slate-500" />
              Call Transcript
              <div className="ml-auto flex items-center gap-2">
                {/* User override badge */}
                {hasUserOverride && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    <Wand2 className="mr-1 h-3 w-3" />
                    Custom
                  </Badge>
                )}
                {/* Enhancement badges - only show if no user override */}
                {!hasUserOverride &&
                  !isProcessing &&
                  hasEnhancedTranscript &&
                  !showRawTranscript && (
                    <>
                      {translationData?.wasTranslated && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          <Globe className="mr-1 h-3 w-3" />
                          Translated
                        </Badge>
                      )}
                    </>
                  )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="bg-muted/50 flex items-center justify-center rounded-md p-8">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {cleanMutation.isPending
                      ? "Cleaning up transcript..."
                      : "Processing transcript..."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 max-h-80 overflow-auto rounded-md p-4">
                <TranscriptDisplay transcript={displayTranscript} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-slate-500" />
              Call Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Transcript not available</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Transcript Display Component with improved formatting
 * Parses transcript text and applies color coding for different speakers
 */
function TranscriptDisplay({ transcript }: { transcript: string }) {
  const parseTranscript = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const parsedLines: { speaker: "AI" | "User" | "Other"; text: string }[] =
      [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("AI:")) {
        parsedLines.push({
          speaker: "AI",
          text: trimmedLine.substring(3).trim(),
        });
      } else if (trimmedLine.startsWith("User:")) {
        parsedLines.push({
          speaker: "User",
          text: trimmedLine.substring(5).trim(),
        });
      } else if (trimmedLine.includes(": ")) {
        const colonIndex = trimmedLine.indexOf(": ");
        const speaker = trimmedLine.substring(0, colonIndex).trim();
        const text = trimmedLine.substring(colonIndex + 2).trim();

        if (
          speaker.toLowerCase().includes("ai") ||
          speaker.toLowerCase().includes("assistant") ||
          speaker.toLowerCase().includes("bot")
        ) {
          parsedLines.push({ speaker: "AI", text });
        } else if (
          speaker.toLowerCase().includes("user") ||
          speaker.toLowerCase().includes("customer") ||
          speaker.toLowerCase().includes("client")
        ) {
          parsedLines.push({ speaker: "User", text });
        } else {
          parsedLines.push({ speaker: "Other", text: trimmedLine });
        }
      } else if (trimmedLine.length > 0) {
        parsedLines.push({ speaker: "Other", text: trimmedLine });
      }
    }

    return parsedLines;
  };

  const formattedLines = parseTranscript(transcript);

  if (formattedLines.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        No transcript available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {formattedLines.map((line, index) => (
        <div key={index} className="leading-relaxed">
          {line.speaker === "AI" && (
            <div className="flex gap-2">
              <span className="shrink-0 rounded bg-teal-100 px-1.5 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                AI
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {line.text}
              </span>
            </div>
          )}
          {line.speaker === "User" && (
            <div className="flex gap-2">
              <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                User
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {line.text}
              </span>
            </div>
          )}
          {line.speaker === "Other" && (
            <div className="pl-10 text-sm text-slate-600 dark:text-slate-400">
              {line.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
