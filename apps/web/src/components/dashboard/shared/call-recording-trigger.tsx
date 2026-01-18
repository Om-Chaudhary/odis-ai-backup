"use client";

import { motion } from "framer-motion";
import { Headphones, Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatDuration } from "@odis-ai/shared/util";
import {
  useAudioPlayerOptional,
  type AudioTrack,
} from "./audio-player-context";

interface CallRecordingTriggerProps {
  /** URL to the recording */
  recordingUrl: string | null;
  /** Title for the audio track */
  title?: string;
  /** Subtitle for the audio track */
  subtitle?: string;
  /** Duration in seconds */
  durationSeconds?: number | null;
  /** Call ID for tracking which call is playing */
  callId?: string;
  /** Whether the recording is loading */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Call Recording Trigger Component
 *
 * A glassmorphic button that triggers the floating audio player.
 * Shows play/pause state and integrates with the audio player context.
 */
export function CallRecordingTrigger({
  recordingUrl,
  title = "Call Recording",
  subtitle,
  durationSeconds,
  callId,
  isLoading = false,
  className,
}: CallRecordingTriggerProps) {
  const player = useAudioPlayerOptional();

  // Check if this track is currently playing
  const isCurrentTrack =
    player?.currentTrack?.callId === callId && callId !== undefined;
  const isPlaying = isCurrentTrack && player?.isPlaying;

  const handleClick = () => {
    if (!recordingUrl || !player) return;

    if (isCurrentTrack) {
      // Toggle play/pause for current track
      player.togglePlay();
    } else {
      // Set new track
      const track: AudioTrack = {
        id: callId ?? recordingUrl,
        url: recordingUrl,
        title,
        subtitle,
        duration: durationSeconds ?? undefined,
        callId,
      };
      player.setCurrentTrack(track);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative flex items-center gap-4 overflow-hidden rounded-xl px-4 py-3",
          className,
        )}
      >
        {/* Glassmorphic background */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-r from-white/50 via-white/30 to-slate-50/30",
            "dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/30",
            "backdrop-blur-sm",
            "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
          )}
        />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/50 dark:bg-slate-700/50">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading recording...
          </p>
        </div>
      </div>
    );
  }

  // No recording available
  if (!recordingUrl) {
    return (
      <div
        className={cn(
          "relative flex items-center gap-4 overflow-hidden rounded-xl px-4 py-3",
          className,
        )}
      >
        {/* Glassmorphic background */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-r from-white/50 via-white/30 to-slate-50/30",
            "dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/30",
            "backdrop-blur-sm",
            "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
          )}
        />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/50 dark:bg-slate-700/50">
          <AlertCircle className="h-5 w-5 text-slate-400" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No recording available
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Recording may not be ready yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        "group relative flex w-full items-center gap-4 overflow-hidden rounded-xl px-4 py-3",
        "transition-all duration-200",
        className,
      )}
    >
      {/* Glassmorphic background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-white/60 via-white/40 to-teal-50/40",
          "dark:from-slate-800/60 dark:via-slate-800/40 dark:to-teal-950/40",
          "backdrop-blur-sm",
          "ring-1 transition-all duration-200",
          isPlaying
            ? "shadow-lg shadow-teal-500/10 ring-teal-400/40"
            : "ring-slate-200/40 group-hover:ring-teal-400/30 dark:ring-slate-700/40",
        )}
      />

      {/* Decorative glow when playing */}
      {isPlaying && (
        <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-teal-400/20 blur-xl" />
      )}

      {/* Play button */}
      <motion.div
        animate={isPlaying ? { scale: [1, 1.03, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={cn(
          "relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
          "transition-all duration-200",
          isPlaying
            ? "bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30"
            : "bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-teal-500 group-hover:to-teal-600 dark:from-slate-700 dark:to-slate-800 dark:group-hover:from-teal-500 dark:group-hover:to-teal-600",
        )}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="ml-0.5 h-5 w-5 text-slate-500 group-hover:text-white dark:text-slate-400" />
        )}

        {/* Animated rings when playing */}
        {isPlaying && (
          <>
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-teal-400"
              animate={{ scale: [1, 1.25], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-teal-400"
              animate={{ scale: [1, 1.25], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </>
        )}
      </motion.div>

      {/* Info */}
      <div className="relative flex-1 text-left">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-teal-500" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isPlaying ? "Now Playing" : "Play Recording"}
          </span>
        </div>
        {durationSeconds && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Duration: {formatDuration(durationSeconds)}
          </p>
        )}
      </div>

      {/* Visual indicator - sound bars */}
      {isPlaying && (
        <div className="relative flex items-center gap-0.5 pr-1">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="h-4 w-1 rounded-full bg-teal-500"
              animate={{
                height: [16, 8 + Math.random() * 12, 16],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.5,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}
