"use client";
import { Phone, FileText, Volume2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { AudioPlayer } from "@odis-ai/ui/audio-player";
import { cn } from "@odis-ai/utils";

interface CallRecordingPlayerProps {
  /** URL to the audio recording */
  recordingUrl: string | null;
  /** Full transcript text */
  transcript: string | null;
  /** Duration in seconds (used for display if audio metadata isn't available) */
  durationSeconds?: number | null;
  /** Optional call summary from AI analysis */
  summary?: string | null;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Call Recording Player Component
 *
 * Displays an audio player for call recordings with synchronized transcript display.
 * Uses the existing AudioPlayer component from the UI library for audio playback.
 */
export function CallRecordingPlayer({
  recordingUrl,
  transcript,
  durationSeconds,
  summary,
  className,
}: CallRecordingPlayerProps) {
  // If no recording URL, show a message
  if (!recordingUrl) {
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

  return (
    <div className={cn("space-y-4", className)}>
      {/* Audio Player */}
      <AudioPlayer url={recordingUrl} duration={durationSeconds ?? undefined} />

      {/* AI Summary (if available) */}
      {summary && (
        <Card className="border-teal-200/40 bg-teal-50/30 dark:bg-teal-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-400">
              <Volume2 className="h-4 w-4" />
              Call Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {transcript && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-slate-500" />
              Call Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 max-h-80 overflow-auto rounded-md p-4">
              <TranscriptDisplay transcript={transcript} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* No transcript fallback */}
      {!transcript && (
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
  // Parse the transcript and format it with color coding and spacing
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
        // Handle other speaker formats like "Assistant: " or "Customer: "
        const colonIndex = trimmedLine.indexOf(": ");
        const speaker = trimmedLine.substring(0, colonIndex).trim();
        const text = trimmedLine.substring(colonIndex + 2).trim();

        // Map common speaker names to our standard format
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
        // If no speaker prefix, treat as continuation of previous speaker or other
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
