"use client";

import { forwardRef, useState, useRef, useCallback } from "react";
import { motion, type Variants, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "~/lib/utils";

export interface DemoCardData {
  id: string;
  title: string;
  description?: string;
  duration: number; // in seconds
  audioUrl: string;
  petName: string;
  petImage: string;
  callType?: "inbound" | "outbound";
}

interface AudioDemoCardProps {
  card: DemoCardData;
  isPlaying: boolean;
  progress: number; // 0 to 1
  onTogglePlay: () => void;
  onSeek?: (progress: number) => void;
  onSpeedChange?: (speed: number) => void;
  onVolumeChange?: (volume: number) => void;
  currentSpeed?: number;
  currentVolume?: number;
  index: number;
  // Staggered layout props
  staggerOffset?: number;
  // Animation control
  disableAnimations?: boolean;
  // Blur effect when another card is active
  isBlurred?: boolean;
  isExpanded?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

// Waveform bars component with ElevenLabs-style animation
function AudioWaveform({
  progress,
  isPlaying,
  barCount = 40,
}: {
  progress: number;
  isPlaying: boolean;
  barCount?: number;
}) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const normalizedPosition = i / barCount;
    const isActive = normalizedPosition <= progress;
    // Create varied heights for organic look
    const baseHeight = 0.3 + Math.sin(i * 0.5) * 0.3 + Math.cos(i * 0.3) * 0.2;
    const height = Math.max(0.15, Math.min(1, baseHeight));

    return (
      <motion.div
        key={i}
        className={cn(
          "w-[2px] rounded-full transition-colors duration-150",
          isActive ? "bg-teal-500" : "bg-slate-200",
        )}
        style={{
          height: `${height * 100}%`,
        }}
        animate={
          isPlaying && isActive
            ? {
                scaleY: [1, 1.2, 0.8, 1],
                transition: {
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.02,
                },
              }
            : { scaleY: 1 }
        }
      />
    );
  });

  return (
    <div className="flex h-10 items-center justify-center gap-[2px]">
      {bars}
    </div>
  );
}

export const AudioDemoCard = forwardRef<HTMLDivElement, AudioDemoCardProps>(
  (
    {
      card,
      isPlaying,
      progress,
      onTogglePlay,
      onSeek,
      onSpeedChange,
      onVolumeChange,
      currentSpeed = 1,
      currentVolume = 1,
      index,
      staggerOffset = 0,
      disableAnimations = false,
      isBlurred = false,
      _isExpanded = false,
      onHoverStart,
      onHoverEnd,
    },
    ref,
  ) => {
    const currentTime = progress * card.duration;
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Handle progress bar click for seeking
    const handleProgressClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !onSeek) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
        onSeek(newProgress);
      },
      [onSeek],
    );

    // Handle speed button click
    const handleSpeedClick = useCallback(() => {
      if (!onSpeedChange) return;
      const currentIndex = SPEED_OPTIONS.indexOf(currentSpeed);
      const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
      onSpeedChange(SPEED_OPTIONS[nextIndex] ?? 1);
    }, [currentSpeed, onSpeedChange]);

    // Animation variants with enhanced hover expansion
    const cardVariants: Variants = disableAnimations
      ? {
          hidden: { opacity: 1 },
          visible: { opacity: 1 },
        }
      : {
          hidden: { opacity: 0, y: 40, scale: 0.95 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.7,
              delay: 0.15 + index * 0.15,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        };

    const isOdd = index % 2 === 1;

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        whileHover={
          disableAnimations
            ? undefined
            : {
                scale: 1.03,
                y: -8,
                transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              }
        }
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
        className={cn(
          "group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white/98 backdrop-blur-md",
          "p-4 sm:p-5",
          "shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
          "transition-all duration-500 ease-out",
          "hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]",
          isPlaying
            ? "z-10 border-teal-400 ring-2 ring-teal-400/30"
            : "border-slate-100/80 hover:border-teal-200/60",
          // Subtle blur when another card is focused
          isBlurred && "scale-[0.97] opacity-50 blur-[2px]",
        )}
        style={{
          // Apply stagger offset for cascading layout - alternating left/right
          transform: `translateX(${isOdd ? staggerOffset : -staggerOffset}px)`,
        }}
      >
        {/* Call type badge */}
        {card.callType && (
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                card.callType === "outbound"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-blue-50 text-blue-600",
              )}
            >
              {card.callType}
            </span>
          </div>
        )}

        {/* Header: Pet Avatar + Title + Description */}
        <div className="mb-4 flex items-start gap-3">
          {/* Pet Avatar with ring animation when playing */}
          <div className="relative shrink-0">
            <motion.div
              className={cn(
                "relative h-12 w-12 overflow-hidden rounded-full",
                isPlaying && "ring-2 ring-teal-400 ring-offset-2",
              )}
              animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={
                isPlaying ? { duration: 2, repeat: Infinity } : undefined
              }
            >
              <Image
                src={card.petImage}
                alt={card.petName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </motion.div>
            {/* Playing indicator dot */}
            <AnimatePresence>
              {isPlaying && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="min-w-0 flex-1 pr-12">
            <h3 className="text-base font-semibold text-slate-800 sm:text-lg">
              {card.title}
            </h3>
            <p className="text-sm text-slate-500">
              {card.petName} •{" "}
              <span className="font-mono text-xs">
                {formatDuration(card.duration)}
              </span>
            </p>
            {card.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                {card.description}
              </p>
            )}
          </div>
        </div>

        {/* ElevenLabs-style audio controls */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 sm:p-4">
          {/* Waveform visualization */}
          <div
            ref={progressBarRef}
            className="relative mb-3 cursor-pointer"
            onClick={handleProgressClick}
          >
            <AudioWaveform
              progress={progress}
              isPlaying={isPlaying}
              barCount={50}
            />
            {/* Hover scrubber indicator */}
            <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
              <div
                className="absolute top-0 h-full w-0.5 bg-teal-600"
                style={{ left: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Time display */}
          <div className="mb-3 flex justify-between text-xs text-slate-400">
            <span className="font-mono tabular-nums">
              {formatDuration(currentTime)}
            </span>
            <span className="font-mono tabular-nums">
              {formatDuration(card.duration)}
            </span>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            {/* Left controls: Speed */}
            <div className="relative">
              <button
                onClick={handleSpeedClick}
                className={cn(
                  "flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all",
                  "text-slate-500 hover:bg-slate-200/80 hover:text-slate-700",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none",
                )}
              >
                {currentSpeed}x
              </button>
            </div>

            {/* Center controls: Skip back, Play/Pause, Skip forward */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSeek?.(Math.max(0, progress - 0.1))}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  "text-slate-400 hover:bg-slate-200/80 hover:text-slate-600",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none",
                )}
                aria-label="Skip back 10 seconds"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                onClick={onTogglePlay}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isPlaying
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/40 hover:bg-teal-600"
                    : "bg-slate-800 text-white shadow-lg shadow-slate-800/30 hover:bg-slate-700",
                )}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                )}
              </button>

              <button
                onClick={() => onSeek?.(Math.min(1, progress + 0.1))}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  "text-slate-400 hover:bg-slate-200/80 hover:text-slate-600",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none",
                )}
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Right controls: Volume */}
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  "text-slate-500 hover:bg-slate-200/80 hover:text-slate-700",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none",
                )}
                aria-label="Volume control"
              >
                {currentVolume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              {/* Volume slider popup */}
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="absolute right-0 bottom-full z-20 mb-2 rounded-lg bg-white p-3 shadow-xl ring-1 ring-slate-100"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentVolume}
                      onChange={(e) =>
                        onVolumeChange?.(parseFloat(e.target.value))
                      }
                      className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Subtle gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-teal-500/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </motion.div>
    );
  },
);

AudioDemoCard.displayName = "AudioDemoCard";
