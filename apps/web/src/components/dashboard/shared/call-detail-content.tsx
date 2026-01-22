"use client";

import { cn } from "@odis-ai/shared/util";
import { CallPlayer } from "@odis-ai/shared/ui/media";
import { CallSummaryCard } from "./call-summary-card";

interface CallDetailContentProps {
  /** Call ID for tracking */
  callId?: string;
  /** The call summary text */
  summary: string | null;
  /** When the call occurred */
  timestamp?: string | null;
  /** Duration in seconds */
  durationSeconds?: number | null;
  /** List of actions taken during the call */
  actionsTaken?: (string | { action: string; details?: string })[];
  /** URL to the recording */
  recordingUrl: string | null;
  /** Raw transcript text */
  transcript: string | null;
  /** Cleaned/formatted transcript */
  cleanedTranscript?: string | null;
  /** Title for the audio player */
  title?: string;
  /** Subtitle for the audio player */
  subtitle?: string;
  /** Whether the recording is still loading */
  isLoadingRecording?: boolean;
  /** Whether the call was successful */
  isSuccessful?: boolean;
  /** Whether transcript should be expanded by default */
  transcriptDefaultOpen?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Call Detail Content Component
 *
 * A unified component for displaying call details consistently across
 * both inbound and outbound dashboards.
 *
 * Layout (top to bottom):
 * 1. Call Summary Card - with timestamp, duration, and actions
 * 2. Unified Call Player - with waveform and integrated transcript
 */
export function CallDetailContent({
  summary,
  timestamp,
  durationSeconds,
  actionsTaken,
  recordingUrl,
  transcript,
  cleanedTranscript,
  title = "Call Recording",
  isSuccessful = true,
  className,
}: CallDetailContentProps) {
  const hasContent = summary ?? recordingUrl ?? transcript;

  if (!hasContent) {
    return null;
  }

  const displayTranscript = cleanedTranscript ?? transcript;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Card - Always at the top */}
      {summary && (
        <CallSummaryCard
          summary={summary}
          timestamp={timestamp}
          durationSeconds={durationSeconds}
          actionsTaken={actionsTaken}
          isSuccessful={isSuccessful}
        />
      )}

      {/* Unified Call Player with integrated transcript */}
      {recordingUrl && (
        <CallPlayer
          audioUrl={recordingUrl}
          plainTranscript={displayTranscript}
          duration={durationSeconds ?? undefined}
          title={title}
        />
      )}
    </div>
  );
}
