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
 * A glassmorphic, animated collapsible transcript with:
 * - Speaker avatars with distinct styling
 * - Message bubbles with soft backgrounds
 * - Smooth expand/collapse animations
 * - Copy to clipboard functionality
 * - Dark mode support
 */
export function CollapsibleTranscript({
  transcript,
  cleanedTranscript,
  preferCleaned = true,
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
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-4 py-3"
        >
          {/* Glassmorphic background */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-r from-white/50 via-white/30 to-slate-50/40",
              "dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/40",
              "backdrop-blur-sm",
              "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
              "group-hover:ring-slate-300/40 dark:group-hover:ring-slate-600/40",
              "transition-all duration-200",
            )}
          />

          <div className="relative flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "bg-gradient-to-br from-slate-100/80 to-slate-200/80",
                "dark:from-slate-700/80 dark:to-slate-800/80",
                "group-hover:from-teal-100/80 group-hover:to-teal-200/80",
                "dark:group-hover:from-teal-900/50 dark:group-hover:to-teal-800/50",
                "ring-1 ring-slate-200/30 dark:ring-slate-600/30",
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

          <div className="relative flex items-center gap-2">
            {hasCleanedVersion && (
              <span
                className={cn(
                  "hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
                  "bg-purple-500/10 text-purple-600",
                  "dark:bg-purple-500/20 dark:text-purple-400",
                )}
              >
                <Sparkles className="h-2.5 w-2.5" />
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
              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphic background */}
                <div
                  className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-br from-white/60 via-white/40 to-slate-50/50",
                    "dark:from-slate-900/60 dark:via-slate-800/40 dark:to-slate-900/50",
                    "backdrop-blur-sm",
                    "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
                  )}
                />

                {/* Toolbar */}
                <div className="relative flex items-center justify-between border-b border-slate-200/40 px-4 py-2 dark:border-slate-700/40">
                  <div className="flex items-center gap-2">
                    {hasCleanedVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 text-xs",
                          showCleaned
                            ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400"
                            : "text-slate-500 hover:text-slate-700",
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

                {/* Messages */}
                <ScrollArea style={{ maxHeight }} className="relative p-4">
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.2 }}
                        className={cn(
                          "flex gap-2.5",
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
                            "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                            message.speaker === "AI"
                              ? "bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/20"
                              : message.speaker === "User"
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20"
                                : "bg-gradient-to-br from-slate-400 to-slate-500",
                          )}
                        >
                          {message.speaker === "AI" ? (
                            <Bot className="h-3.5 w-3.5 text-white" />
                          ) : message.speaker === "User" ? (
                            <User className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>

                        {/* Message bubble */}
                        <div
                          className={cn(
                            "relative max-w-[85%] rounded-xl px-3 py-2",
                            message.speaker === "AI"
                              ? "rounded-tl-sm bg-teal-500/8 dark:bg-teal-500/15"
                              : message.speaker === "User"
                                ? "rounded-tr-sm bg-blue-500/8 dark:bg-blue-500/15"
                                : "bg-slate-500/8 dark:bg-slate-500/15",
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
