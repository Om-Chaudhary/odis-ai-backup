"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import { cn } from "@odis-ai/shared/util";

interface TranscriptMessage {
  speaker: "AI" | "User" | "Other";
  text: string;
  timestamp?: number;
}

interface CollapsibleTranscriptProps {
  /** Raw transcript text */
  transcript: string | null;
  /** Cleaned/formatted transcript (preferred if available) */
  cleanedTranscript?: string | null;
  /** Whether to show the cleaned version by default */
  preferCleaned?: boolean;
  /** Current playback time for highlighting (in seconds) */
  currentTime?: number;
  /** Callback when user clicks on a message to seek */
  onSeek?: (timestamp: number) => void;
  /** Maximum height of the transcript area */
  maxHeight?: number;
  /** Additional className */
  className?: string;
  /** Whether the transcript is initially expanded */
  defaultOpen?: boolean;
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
        speaker.includes("nancy") // Common AI name in veterinary context
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
      // Continuation or unparseable line
      messages.push({ speaker: "Other", text: trimmedLine });
    }
  }

  return messages;
}

/**
 * Collapsible Transcript Component
 *
 * A beautiful, animated collapsible transcript with:
 * - Speaker avatars with distinct styling
 * - Message bubbles with gradient backgrounds
 * - Smooth expand/collapse animations
 * - Copy to clipboard functionality
 * - Dark mode support
 */
export function CollapsibleTranscript({
  transcript,
  cleanedTranscript,
  preferCleaned = true,
  currentTime,
  onSeek,
  maxHeight = 400,
  className,
  defaultOpen = false,
}: CollapsibleTranscriptProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showCleaned, setShowCleaned] = useState(preferCleaned);
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

  if (!transcript && !cleanedTranscript) {
    return null;
  }

  const hasCleanedVersion = Boolean(cleanedTranscript);
  const messageCount = messages.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border px-4 py-3.5",
            "bg-gradient-to-r from-slate-50 to-white",
            "border-slate-200/60 hover:border-slate-300/80",
            "dark:from-slate-800/50 dark:to-slate-900/50",
            "dark:border-slate-700/50 dark:hover:border-slate-600/80",
            "group transition-all duration-200",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "bg-gradient-to-br from-slate-100 to-slate-200",
                "dark:from-slate-700 dark:to-slate-800",
                "group-hover:from-teal-50 group-hover:to-teal-100",
                "dark:group-hover:from-teal-900/30 dark:group-hover:to-teal-800/30",
                "transition-colors duration-200",
              )}
            >
              <MessageSquare className="h-4 w-4 text-slate-600 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400" />
            </div>
            <div className="text-left">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Call Transcript
              </span>
              <span className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                {messageCount} messages
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasCleanedVersion && (
              <span
                className={cn(
                  "hidden items-center gap-1 rounded-full px-2 py-1 text-xs sm:inline-flex",
                  "bg-purple-100/80 text-purple-700",
                  "dark:bg-purple-900/30 dark:text-purple-400",
                )}
              >
                <Sparkles className="h-3 w-3" />
                Enhanced
              </span>
            )}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </motion.div>
          </div>
        </motion.button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-2"
            >
              {/* Transcript container */}
              <div
                className={cn(
                  "overflow-hidden rounded-xl border",
                  "bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50",
                  "border-slate-200/60",
                  "dark:from-slate-900/80 dark:via-slate-800/50 dark:to-slate-900/50",
                  "dark:border-slate-700/50",
                )}
              >
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-2 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    {hasCleanedVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 text-xs",
                          showCleaned
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "text-slate-500",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCleaned(!showCleaned);
                        }}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        {showCleaned ? "Enhanced" : "Original"}
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-3 w-3 text-green-500" />
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

                {/* Messages */}
                <ScrollArea style={{ maxHeight }} className="p-4">
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className={cn(
                          "flex gap-3",
                          message.speaker === "User" && "flex-row-reverse",
                        )}
                        onClick={() => {
                          if (message.timestamp !== undefined && onSeek) {
                            onSeek(message.timestamp);
                          }
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                            message.speaker === "AI"
                              ? "bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/20"
                              : message.speaker === "User"
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20"
                                : "bg-gradient-to-br from-slate-400 to-slate-500",
                          )}
                        >
                          {message.speaker === "AI" ? (
                            <Bot className="h-4 w-4 text-white" />
                          ) : message.speaker === "User" ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-white" />
                          )}
                        </div>

                        {/* Message bubble */}
                        <div
                          className={cn(
                            "relative max-w-[85%] rounded-2xl px-4 py-2.5",
                            message.speaker === "AI"
                              ? "rounded-tl-sm bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/50 dark:to-teal-900/30"
                              : message.speaker === "User"
                                ? "rounded-tr-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30"
                                : "bg-slate-100 dark:bg-slate-800/50",
                            "border border-transparent",
                            message.speaker === "AI" &&
                              "border-teal-200/30 dark:border-teal-800/30",
                            message.speaker === "User" &&
                              "border-blue-200/30 dark:border-blue-800/30",
                          )}
                        >
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {message.text}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
