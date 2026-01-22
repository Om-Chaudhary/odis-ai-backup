"use client";

import * as React from "react";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  SkipBack,
  SkipForward,
  Bot,
  User,
} from "lucide-react";
import { Button } from "../button";
import { cn } from "@odis-ai/shared/util";
import type { TranscriptMessage } from "@odis-ai/shared/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CallPlayerProps {
  /** URL to the audio recording */
  audioUrl: string;
  /** Transcript messages with timing data */
  transcript?: TranscriptMessage[];
  /** Fallback plain text transcript if no timed messages */
  plainTranscript?: string | null;
  /** Duration in seconds (used if audio metadata isn't available) */
  duration?: number;
  /** Optional title for the recording */
  title?: string;
  /** Optional class name for the container */
  className?: string;
  /** Callback when time updates */
  onTimeUpdate?: (currentTime: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Parse plain text transcript into messages
function parseTranscript(
  text: string
): { speaker: "AI" | "User" | "Other"; text: string }[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const parsed: { speaker: "AI" | "User" | "Other"; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("AI:")) {
      parsed.push({ speaker: "AI", text: trimmed.substring(3).trim() });
    } else if (trimmed.startsWith("User:")) {
      parsed.push({ speaker: "User", text: trimmed.substring(5).trim() });
    } else if (trimmed.includes(": ")) {
      const colonIdx = trimmed.indexOf(": ");
      const speaker = trimmed.substring(0, colonIdx).trim().toLowerCase();
      const content = trimmed.substring(colonIdx + 2).trim();

      if (
        speaker.includes("ai") ||
        speaker.includes("assistant") ||
        speaker.includes("bot")
      ) {
        parsed.push({ speaker: "AI", text: content });
      } else if (
        speaker.includes("user") ||
        speaker.includes("customer") ||
        speaker.includes("client")
      ) {
        parsed.push({ speaker: "User", text: content });
      } else {
        parsed.push({ speaker: "Other", text: trimmed });
      }
    } else if (trimmed.length > 0) {
      parsed.push({ speaker: "Other", text: trimmed });
    }
  }

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Waveform Scrubber Component
// ─────────────────────────────────────────────────────────────────────────────

interface WaveformScrubberProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  className?: string;
}

const WaveformScrubber = forwardRef<HTMLDivElement, WaveformScrubberProps>(
  ({ currentTime, duration, isPlaying, onSeek, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const [isHovering, setIsHovering] = useState(false);
    const [hoverX, setHoverX] = useState(0);

    // Generate deterministic waveform bars based on duration
    const waveformBars = useMemo(() => {
      const barCount = 64;
      const seed = Math.floor(duration * 1000) || 42;
      return Array.from({ length: barCount }, (_, i) => {
        // Pseudo-random but deterministic
        const x = Math.sin(seed * (i + 1) * 0.1) * 10000;
        return (x - Math.floor(x)) * 0.5 + 0.25;
      });
    }, [duration]);

    // Draw waveform
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get DPR for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Guard against zero dimensions
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const draw = () => {
        const width = rect.width;
        const height = rect.height;

        ctx.clearRect(0, 0, width, height);

        // Progress calculation
        const progress = duration > 0 ? currentTime / duration : 0;

        // Active gradient (teal) - matches dashboard accent
        const activeGradient = ctx.createLinearGradient(0, 0, width, 0);
        activeGradient.addColorStop(0, "rgba(13, 148, 136, 0.95)"); // teal-600
        activeGradient.addColorStop(0.5, "rgba(20, 184, 166, 1)"); // teal-500
        activeGradient.addColorStop(1, "rgba(45, 212, 191, 0.95)"); // teal-400

        // Inactive color (light slate)
        const inactiveColor = "rgba(203, 213, 225, 0.6)"; // slate-300/60

        const barWidth = width / waveformBars.length;
        const gap = 2;

        waveformBars.forEach((bar, i) => {
          const x = i * barWidth;
          const barProgress = i / waveformBars.length;

          // Subtle animation when playing
          const time = Date.now() / 400;
          const amplitude = isPlaying
            ? bar * (0.85 + Math.sin(time + i * 0.3) * 0.15)
            : bar;

          const barHeight = Math.max(2, amplitude * height * 0.85);
          const y = (height - barHeight) / 2;

          // Color based on progress
          ctx.fillStyle = barProgress <= progress ? activeGradient : inactiveColor;

          // Draw rounded bars (ensure non-negative dimensions and radius)
          const barW = Math.max(1, barWidth - gap);
          const radius = Math.max(0, Math.min(barW / 2, barHeight / 2, 3));
          ctx.beginPath();
          ctx.roundRect(x + gap / 2, y, barW, barHeight, radius);
          ctx.fill();
        });

        // Playhead indicator
        if (progress > 0) {
          const playheadX = progress * width;
          ctx.fillStyle = "rgba(13, 148, 136, 1)"; // teal-600
          ctx.shadowColor = "rgba(13, 148, 136, 0.4)";
          ctx.shadowBlur = isPlaying ? 6 : 3;
          ctx.fillRect(playheadX - 1.5, 0, 3, height);
          ctx.shadowBlur = 0;
        }

        if (isPlaying) {
          animationRef.current = requestAnimationFrame(draw);
        }
      };

      draw();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [currentTime, duration, isPlaying, waveformBars]);

    // Redraw on isPlaying change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !isPlaying) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isPlaying]);

    const handleClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = clickX / rect.width;
      onSeek(progress * duration);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoverX(e.clientX - rect.left);
    };

    const hoverProgress = isHovering ? hoverX / (containerRef.current?.offsetWidth || 1) : 0;
    const hoverTime = hoverProgress * duration;

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative h-14 cursor-pointer overflow-hidden rounded-xl",
          "bg-gradient-to-br from-slate-100 via-slate-50 to-white",
          "ring-1 ring-slate-200/80",
          "transition-all duration-200",
          isHovering && "ring-teal-300/50 shadow-sm",
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* Hover time indicator */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute top-1.5 rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white shadow-lg"
              style={{ left: hoverX, transform: "translateX(-50%)" }}
            >
              {formatTime(hoverTime)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
WaveformScrubber.displayName = "WaveformScrubber";

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Panel Component
// ─────────────────────────────────────────────────────────────────────────────

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  currentTime: number;
  onMessageClick: (time: number) => void;
  className?: string;
}

function TranscriptPanel({
  messages,
  currentTime,
  onMessageClick,
  className,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [userScrolled, setUserScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find active message
  const activeIndex = useMemo(() => {
    return messages.findIndex((msg, index) => {
      const nextMsg = messages[index + 1];
      const startTime = msg.time ?? msg.secondsFromStart ?? 0;
      const endTime = nextMsg?.time ?? nextMsg?.secondsFromStart ?? Infinity;
      return currentTime >= startTime && currentTime < endTime;
    });
  }, [messages, currentTime]);

  // Auto-scroll to active message
  useEffect(() => {
    if (activeIndex === -1 || userScrolled) return;

    const activeElement = messageRefs.current.get(activeIndex);
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex, userScrolled]);

  // Detect user scroll and reset after inactivity
  const handleScroll = useCallback(() => {
    setUserScrolled(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "h-[280px] overflow-y-auto px-4 py-3",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200",
        className
      )}
      onScroll={handleScroll}
    >
      <div className="flex flex-col gap-2">
        {messages.map((msg, index) => {
          const isActive = index === activeIndex;
          const isAssistant = msg.role === "assistant";
          const time = msg.time ?? msg.secondsFromStart ?? 0;

          return (
            <motion.div
              key={index}
              ref={(el) => {
                if (el) messageRefs.current.set(index, el);
                else messageRefs.current.delete(index);
              }}
              initial={false}
              animate={{
                backgroundColor: isActive
                  ? "rgba(20, 184, 166, 0.08)"
                  : "transparent",
                scale: isActive ? 1.005 : 1,
              }}
              transition={{ duration: 0.2 }}
              onClick={() => onMessageClick(time)}
              className={cn(
                "group flex gap-3 rounded-lg p-3 cursor-pointer",
                "transition-all duration-200",
                isActive
                  ? "ring-1 ring-teal-400/30 shadow-sm"
                  : "hover:bg-slate-50"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  "ring-1 transition-all duration-200",
                  isAssistant
                    ? isActive
                      ? "bg-teal-100 ring-teal-300 text-teal-700"
                      : "bg-teal-50 ring-teal-200 text-teal-600"
                    : isActive
                      ? "bg-blue-100 ring-blue-300 text-blue-700"
                      : "bg-blue-50 ring-blue-200 text-blue-600"
                )}
              >
                {isAssistant ? (
                  <Bot className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors duration-200",
                      isActive ? "text-slate-800" : "text-slate-500"
                    )}
                  >
                    {isAssistant ? "Assistant" : "User"}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium tabular-nums transition-colors duration-200",
                      isActive ? "text-teal-600" : "text-slate-400"
                    )}
                  >
                    {formatTime(time)}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-colors duration-200",
                    isActive ? "text-slate-800 font-medium" : "text-slate-600"
                  )}
                >
                  {msg.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plain Transcript Display
// ─────────────────────────────────────────────────────────────────────────────

function PlainTranscriptPanel({
  transcript,
  className,
}: {
  transcript: string;
  className?: string;
}) {
  const lines = useMemo(() => parseTranscript(transcript), [transcript]);

  if (lines.length === 0) {
    return (
      <div className={cn("p-4 text-center text-sm text-slate-400", className)}>
        No transcript available
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-[280px] overflow-y-auto px-4 py-3",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {lines.map((line, index) => (
          <div key={index} className="flex gap-3">
            {/* Speaker badge */}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                "ring-1",
                line.speaker === "AI"
                  ? "bg-teal-50 ring-teal-200 text-teal-600"
                  : line.speaker === "User"
                    ? "bg-blue-50 ring-blue-200 text-blue-600"
                    : "bg-slate-50 ring-slate-200 text-slate-500"
              )}
            >
              {line.speaker === "AI" ? (
                <Bot className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                {line.speaker === "AI"
                  ? "Assistant"
                  : line.speaker === "User"
                    ? "User"
                    : ""}
              </span>
              <p className="text-sm leading-relaxed text-slate-600">
                {line.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main CallPlayer Component
// ─────────────────────────────────────────────────────────────────────────────

export function CallPlayer({
  audioUrl,
  transcript,
  plainTranscript,
  duration: propDuration,
  className,
  onTimeUpdate,
}: CallPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration ?? 0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Update duration from props
  useEffect(() => {
    if (propDuration) {
      setDuration(propDuration);
    }
  }, [propDuration]);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      if (!propDuration) {
        setDuration(audioRef.current.duration);
      }
      setIsLoading(false);
    }
  }, [propDuration]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Controls
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        void audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(
        0,
        Math.min(audioRef.current.currentTime + seconds, duration)
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const cyclePlaybackRate = useCallback(() => {
    if (audioRef.current) {
      const rates = [1, 1.25, 1.5, 2, 0.75];
      const nextRate =
        rates[(rates.indexOf(playbackRate) + 1) % rates.length] ?? 1;
      audioRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
    }
  }, [playbackRate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skip, toggleMute]);

  const hasTimedTranscript = transcript && transcript.length > 0;
  const hasPlainTranscript = plainTranscript && plainTranscript.trim().length > 0;
  const hasAnyTranscript = hasTimedTranscript || hasPlainTranscript;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "overflow-hidden rounded-lg bg-card shadow-sm",
        className
      )}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Content */}
      <div className="p-4">
        {/* Waveform Scrubber */}
        <WaveformScrubber
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          className="mb-3"
        />

        {/* Time & Controls Row */}
        <div className="flex items-center justify-between">
          {/* Time display */}
          <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
            <span className="text-slate-800">{formatTime(currentTime)}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">{formatTime(duration)}</span>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => skip(-10)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                className={cn(
                  "h-11 w-11 rounded-full",
                  "bg-gradient-to-br from-teal-500 to-teal-600",
                  "shadow-md shadow-teal-500/30",
                  "ring-1 ring-teal-400/30",
                  "transition-all duration-200 hover:scale-105 hover:shadow-teal-500/40"
                )}
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 text-white" />
                )}
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => skip(10)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-bold text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              onClick={cyclePlaybackRate}
            >
              {playbackRate}x
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-teal-600"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-teal-600"
              asChild
            >
              <a href={audioUrl} download target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Transcript Panel */}
        {hasAnyTranscript && (
          <>
            <div className="my-3 h-px bg-slate-100" />

            <div className="rounded-lg bg-slate-50/50 ring-1 ring-slate-100">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
                <Bot className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-xs font-medium text-slate-600">
                  Transcript
                </span>
                {hasTimedTranscript && (
                  <span className="text-[10px] text-slate-400">
                    • Click to seek
                  </span>
                )}
              </div>

              {hasTimedTranscript ? (
                <TranscriptPanel
                  messages={transcript}
                  currentTime={currentTime}
                  onMessageClick={handleSeek}
                />
              ) : hasPlainTranscript ? (
                <PlainTranscriptPanel transcript={plainTranscript} />
              ) : null}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default CallPlayer;
