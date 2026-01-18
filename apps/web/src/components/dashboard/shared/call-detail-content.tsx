"use client";

import { cn } from "@odis-ai/shared/util";
import { CallSummaryCard } from "./call-summary-card";
import { CallRecordingTrigger } from "./call-recording-trigger";
import { CollapsibleTranscript } from "./collapsible-transcript";

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
 * 2. Recording Trigger - beautiful play button to launch floating player
 * 3. Collapsible Transcript - expandable with speaker avatars
 */
export function CallDetailContent({
  callId,
  summary,
  timestamp,
  durationSeconds,
  actionsTaken,
  recordingUrl,
  transcript,
  cleanedTranscript,
  title = "Call Recording",
  subtitle,
  isLoadingRecording = false,
  isSuccessful = true,
  transcriptDefaultOpen = false,
  className,
}: CallDetailContentProps) {
  const hasContent = summary ?? recordingUrl ?? transcript;

  if (!hasContent && !isLoadingRecording) {
    return null;
  }

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

      {/* Recording Trigger - Launches floating player */}
      <CallRecordingTrigger
        recordingUrl={recordingUrl}
        title={title}
        subtitle={subtitle}
        durationSeconds={durationSeconds}
        callId={callId}
        isLoading={isLoadingRecording}
      />

      {/* Collapsible Transcript */}
      {(transcript ?? cleanedTranscript) && (
        <CollapsibleTranscript
          transcript={transcript}
          cleanedTranscript={cleanedTranscript}
          defaultOpen={transcriptDefaultOpen}
        />
      )}
    </div>
  );
}
