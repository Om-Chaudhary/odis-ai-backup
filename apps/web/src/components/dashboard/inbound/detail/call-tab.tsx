"use client";

import { CallPlayer } from "@odis-ai/shared/ui/media";
import { cn } from "@odis-ai/shared/util";
import { MessageSquare } from "lucide-react";

interface CallTabProps {
  /** Recording URL */
  recordingUrl: string | null;
  /** Transcript text */
  transcript: string | null;
  /** Cleaned transcript (if available) */
  cleanedTranscript?: string | null;
  /** Duration in seconds */
  durationSeconds?: number | null;
  /** Whether recording is loading */
  isLoadingRecording?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Call Tab Component
 *
 * Displays unified audio player with waveform and integrated transcript.
 */
export function CallTab({
  recordingUrl,
  transcript,
  cleanedTranscript,
  durationSeconds,
  isLoadingRecording,
  className,
}: CallTabProps) {
  const displayTranscript = cleanedTranscript ?? transcript;

  // Loading state
  if (isLoadingRecording) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700",
          className
        )}
      >
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Loading audio...
        </p>
      </div>
    );
  }

  // No recording available
  if (!recordingUrl) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700",
          className
        )}
      >
        <MessageSquare className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No recording available
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <CallPlayer
        audioUrl={recordingUrl}
        plainTranscript={displayTranscript}
        duration={durationSeconds ?? undefined}
        title="Inbound Call"
      />
    </div>
  );
}
