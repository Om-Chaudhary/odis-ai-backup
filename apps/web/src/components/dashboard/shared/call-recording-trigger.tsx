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
 * A beautiful button that triggers the floating audio player.
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
          "flex items-center gap-4 rounded-xl border px-4 py-3",
          "bg-gradient-to-r from-slate-50 to-white",
          "border-slate-200/60",
          "dark:from-slate-800/50 dark:to-slate-900/50",
          "dark:border-slate-700/50",
          className,
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
          "flex items-center gap-4 rounded-xl border px-4 py-3",
          "bg-gradient-to-r from-slate-50 to-white",
          "border-slate-200/60",
          "dark:from-slate-800/50 dark:to-slate-900/50",
          "dark:border-slate-700/50",
          className,
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <AlertCircle className="h-5 w-5 text-slate-400" />
        </div>
        <div>
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border px-4 py-3",
        "bg-gradient-to-r from-slate-50 via-white to-teal-50/30",
        "border-slate-200/60 hover:border-teal-300/60",
        "dark:from-slate-800/50 dark:via-slate-900/50 dark:to-teal-950/30",
        "dark:border-slate-700/50 dark:hover:border-teal-700/50",
        "transition-all duration-200",
        isPlaying && "border-teal-300 ring-2 ring-teal-500/30",
        className,
      )}
    >
      {/* Play button */}
      <motion.div
        animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={cn(
          "relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
          "bg-gradient-to-br shadow-lg transition-all duration-200",
          isPlaying
            ? "from-teal-500 to-teal-600 shadow-teal-500/30"
            : "from-slate-200 to-slate-300 group-hover:from-teal-500 group-hover:to-teal-600",
          isPlaying
            ? ""
            : "dark:from-slate-700 dark:to-slate-800 dark:group-hover:from-teal-500 dark:group-hover:to-teal-600",
          isPlaying ? "" : "group-hover:shadow-teal-500/20",
        )}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="ml-0.5 h-5 w-5 text-slate-600 group-hover:text-white dark:text-slate-300" />
        )}

        {/* Animated rings when playing */}
        {isPlaying && (
          <>
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-teal-400"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-teal-400"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </>
        )}
      </motion.div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isPlaying ? "Now Playing" : "Play Recording"}
          </span>
        </div>
        {durationSeconds && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Duration: {formatDuration(durationSeconds)}
          </p>
        )}
      </div>

      {/* Visual indicator */}
      {isPlaying && (
        <div className="flex items-center gap-0.5">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="h-4 w-1 rounded-full bg-teal-500"
              animate={{
                height: [16, 8 + Math.random() * 16, 16],
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
