"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  User,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";
import { InlineAudioPlayer } from "../../shared/tabbed-panel/inline-audio-player";

interface TranscriptMessage {
  speaker: "AI" | "User" | "Other";
  text: string;
  timestamp?: number;
}

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
 * Parse transcript text into structured messages
 */
function parseTranscript(text: string): TranscriptMessage[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const messages: TranscriptMessage[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for common speaker prefixes
    if (trimmedLine.startsWith("AI:")) {
      messages.push({
        speaker: "AI",
        text: trimmedLine.substring(3).trim(),
      });
    } else if (trimmedLine.startsWith("User:")) {
      messages.push({
        speaker: "User",
        text: trimmedLine.substring(5).trim(),
      });
    } else if (trimmedLine.includes(": ")) {
      const colonIndex = trimmedLine.indexOf(": ");
      const speaker = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
      const text = trimmedLine.substring(colonIndex + 2).trim();

      if (
        speaker.includes("ai") ||
        speaker.includes("assistant") ||
        speaker.includes("bot") ||
        speaker.includes("nancy")
      ) {
        messages.push({ speaker: "AI", text });
      } else if (
        speaker.includes("user") ||
        speaker.includes("customer") ||
        speaker.includes("client") ||
        speaker.includes("caller")
      ) {
        messages.push({ speaker: "User", text });
      } else {
        messages.push({ speaker: "Other", text: trimmedLine });
      }
    } else if (trimmedLine.length > 0) {
      messages.push({ speaker: "Other", text: trimmedLine });
    }
  }

  return messages;
}

/**
 * Call Tab Component
 *
 * Displays audio player and transcript in a unified view.
 * Features a refined, clinical-yet-warm aesthetic with IBM Plex Sans typography.
 */
export function CallTab({
  recordingUrl,
  transcript,
  cleanedTranscript,
  durationSeconds,
  isLoadingRecording,
  className,
}: CallTabProps) {
  const [showCleaned, setShowCleaned] = useState(true);
  const [copied, setCopied] = useState(false);

  // Use cleaned transcript if available and preferred
  const displayTranscript =
    showCleaned && cleanedTranscript ? cleanedTranscript : transcript;

  // Parse the transcript into messages
  const messages = useMemo(() => {
    if (!displayTranscript) return [];
    return parseTranscript(displayTranscript);
  }, [displayTranscript]);

  // Copy transcript to clipboard
  const handleCopy = async () => {
    if (displayTranscript) {
      await navigator.clipboard.writeText(displayTranscript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasCleanedVersion = Boolean(cleanedTranscript);
  const messageCount = messages.length;

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {/* Audio Player Section */}
      {recordingUrl ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InlineAudioPlayer
            src={recordingUrl}
            durationHint={durationSeconds ?? undefined}
            title="Call Recording"
          />
        </motion.div>
      ) : isLoadingRecording ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Loading audio...
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No recording available
          </p>
        </div>
      )}

      {/* Transcript Section */}
      {displayTranscript ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative flex flex-1 flex-col overflow-hidden rounded-xl"
          style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
        >
          {/* Refined background with subtle warmth */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-slate-50/90 via-white/80 to-teal-50/40",
              "dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40",
              "ring-1 ring-slate-200/60 dark:ring-slate-700/60",
            )}
          />

          {/* Toolbar */}
          <div className="relative flex items-center justify-between border-b border-slate-200/60 px-4 py-2.5 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  "bg-gradient-to-br from-teal-500/15 to-teal-600/10",
                  "ring-1 ring-teal-500/20",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Call Transcript
                </span>
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                  {messageCount} messages
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasCleanedVersion && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 text-xs font-medium",
                    showCleaned
                      ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800",
                  )}
                  onClick={() => setShowCleaned(!showCleaned)}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  {showCleaned ? "Enhanced" : "Original"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Scrollable Messages */}
          <div className="relative flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4), duration: 0.2 }}
                  className={cn(
                    "flex gap-3",
                    message.speaker === "User" && "flex-row-reverse",
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                      "ring-2 ring-white/50 dark:ring-slate-900/50",
                      message.speaker === "AI"
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/25"
                        : message.speaker === "User"
                          ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/25"
                          : "bg-gradient-to-br from-slate-400 to-slate-500",
                    )}
                  >
                    {message.speaker === "AI" ? (
                      <Bot className="h-4 w-4 text-white" strokeWidth={2} />
                    ) : message.speaker === "User" ? (
                      <User className="h-4 w-4 text-white" strokeWidth={2} />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={cn(
                      "relative max-w-[80%] rounded-2xl px-3.5 py-2.5",
                      "transition-colors duration-150",
                      message.speaker === "AI"
                        ? "rounded-tl-md bg-teal-500/8 hover:bg-teal-500/12 dark:bg-teal-500/12 dark:hover:bg-teal-500/18"
                        : message.speaker === "User"
                          ? "rounded-tr-md bg-amber-500/8 hover:bg-amber-500/12 dark:bg-amber-500/12 dark:hover:bg-amber-500/18"
                          : "bg-slate-500/8 hover:bg-slate-500/12 dark:bg-slate-500/12",
                    )}
                  >
                    <p
                      className="text-[13px] leading-[1.5] text-slate-700 dark:text-slate-300"
                      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
                    >
                      {message.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Subtle gradient fade at bottom */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-900/60" />
        </motion.div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No transcript available
          </p>
        </div>
      )}
    </div>
  );
}
