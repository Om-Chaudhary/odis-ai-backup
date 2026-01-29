"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward, Rewind } from "lucide-react";
import { cn, formatDurationHuman } from "@odis-ai/shared/util";
import { Slider } from "@odis-ai/shared/ui/slider";

interface InlineAudioPlayerProps {
  /** Recording URL */
  src: string;
  /** Title for accessibility */
  title?: string;
  /** Duration hint in seconds (shown before audio loads) */
  durationHint?: number;
  /** Compact mode for tight spaces */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Inline Audio Player
 *
 * A non-floating, embedded audio player with full controls.
 * Designed to be placed inline within content areas.
 */
export function InlineAudioPlayer({
  src,
  title = "Audio",
  durationHint,
  compact = false,
  className,
}: InlineAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [, setIsLoaded] = useState(false);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleCanPlay = () => setIsLoaded(true);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !value[0]) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio || value[0] === undefined) return;
    audio.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  }, [duration]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        className,
      )}
    >
      {/* Glassmorphic background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-white/70 via-white/50 to-teal-50/30",
          "dark:from-slate-800/70 dark:via-slate-800/50 dark:to-teal-950/30",
          "backdrop-blur-sm",
          "ring-1 ring-white/50 dark:ring-white/10",
        )}
      />

      {/* Decorative glow when playing */}
      {isPlaying && (
        <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-teal-400/20 blur-xl" />
      )}

      {/* Content */}
      <div className={cn("relative", compact ? "p-3" : "p-4")}>
        {/* Hidden audio element */}
        <audio ref={audioRef} src={src} preload="metadata" aria-label={title} />

        {/* Main controls row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <motion.button
            onClick={togglePlay}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center justify-center rounded-full transition-all",
              compact ? "h-10 w-10" : "h-12 w-12",
              isPlaying
                ? "bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30"
                : "bg-gradient-to-br from-slate-100 to-slate-200 hover:from-teal-500 hover:to-teal-600 dark:from-slate-700 dark:to-slate-800",
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className={cn("text-white", compact ? "h-4 w-4" : "h-5 w-5")} />
            ) : (
              <Play className={cn("ml-0.5", compact ? "h-4 w-4" : "h-5 w-5", isPlaying ? "text-white" : "text-slate-600 dark:text-slate-300")} />
            )}
          </motion.button>

          {/* Progress section */}
          <div className="flex flex-1 flex-col gap-1.5">
            {/* Time display */}
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="text-slate-600 dark:text-slate-300">
                {formatDurationHuman(Math.floor(currentTime))}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {formatDurationHuman(Math.floor(duration))}
              </span>
            </div>

            {/* Progress slider */}
            <div className="relative">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
                aria-label="Seek"
              />
              {/* Progress indicator line */}
              <div
                className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-teal-500/20 pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Skip controls (non-compact only) */}
          {!compact && (
            <div className="flex items-center gap-1">
              <button
                onClick={restart}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Restart"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => skip(-10)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Rewind 10 seconds"
              >
                <Rewind className="h-4 w-4" />
              </button>
              <button
                onClick={() => skip(10)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Forward 10 seconds"
              >
                <FastForward className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            {!compact && (
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                  aria-label="Volume"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sound wave animation when playing */}
        {isPlaying && (
          <div className="mt-3 flex items-center justify-center gap-0.5">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-teal-500/60"
                animate={{
                  height: [4, 8 + Math.random() * 16, 4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5 + Math.random() * 0.3,
                  delay: i * 0.02,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
