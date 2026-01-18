"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import {
  motion,
  AnimatePresence,
  type Transition,
  useDragControls,
} from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Download,
  Headphones,
} from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { cn, formatDuration } from "@odis-ai/shared/util";
import { useAudioPlayerOptional } from "./audio-player-context";

// Smooth spring transition for natural movement
const smoothSpring: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

// Subtle fade transition
const fadeTransition: Transition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1], // Smooth ease-out
};

// Layout transition for size changes
const layoutTransition: Transition = {
  type: "spring",
  damping: 35,
  stiffness: 400,
  mass: 0.5,
};

/**
 * Floating Audio Player Component
 *
 * A beautiful, minimizable audio player that floats at the bottom of the screen.
 * Features smooth velocity-based animations and glassmorphic design.
 */
export function FloatingAudioPlayer() {
  const player = useAudioPlayerOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  // Generate static waveform bars for visual effect
  const waveformBars = useMemo(() => {
    return Array.from({ length: 48 }, () => Math.random() * 0.6 + 0.2);
  }, []);

  // Draw waveform visualization (simulated, doesn't require AudioContext)
  useEffect(() => {
    if (!canvasRef.current || !player || player.isMinimized) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(20, 184, 166, 0.8)"); // teal-500
      gradient.addColorStop(0.5, "rgba(45, 212, 191, 0.9)"); // teal-400
      gradient.addColorStop(1, "rgba(94, 234, 212, 0.8)"); // teal-300

      const barWidth = width / waveformBars.length;
      const progress =
        player.duration > 0 ? player.currentTime / player.duration : 0;

      waveformBars.forEach((bar, i) => {
        const x = i * barWidth;
        const barProgress = i / waveformBars.length;

        // Animate bars based on playback - smoother animation
        const time = Date.now() / 300;
        const amplitude = player.isPlaying
          ? bar * (0.7 + Math.sin(time + i * 0.4) * 0.3)
          : bar * 0.5;

        const barHeight = amplitude * height * 0.8;
        const y = (height - barHeight) / 2;

        // Color based on progress
        if (barProgress <= progress) {
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = "rgba(148, 163, 184, 0.3)"; // slate-400
        }

        // Draw rounded bars
        const radius = barWidth * 0.3;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barWidth - 2, barHeight, radius);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    player?.isPlaying,
    player?.currentTime,
    player?.duration,
    player?.isMinimized,
    player,
    waveformBars,
  ]);

  if (!player?.currentTrack) return null;

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isMinimized,
  } = player;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Playback rate options
  const rates = [0.5, 1, 1.5, 2];
  const nextRate = () => {
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    player.setPlaybackRate(rates[nextIndex] ?? 1);
  };

  return (
    <>
      {/* Drag constraints boundary (full viewport) */}
      <div
        ref={constraintsRef}
        className="pointer-events-none fixed inset-0 z-40"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key="floating-player"
          drag
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={constraintsRef}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          initial={{ y: 80, opacity: 0, scale: 0.95, x: "-50%" }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.95 }}
          transition={smoothSpring}
          whileDrag={{ scale: 1.02, cursor: "grabbing" }}
          className={cn(
            "fixed bottom-6 left-1/2 z-50",
            isMinimized ? "w-auto" : "w-[560px] max-w-[calc(100vw-2rem)]",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <motion.div
            layout
            layoutId="audio-player-container"
            transition={layoutTransition}
            className={cn(
              "relative overflow-hidden rounded-2xl",
              "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
              "backdrop-blur-xl",
              "shadow-2xl shadow-slate-950/50",
              "ring-1 ring-white/10",
              "dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95",
            )}
          >
            {/* Subtle ambient glow */}
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-teal-500/15 blur-3xl"
                animate={{
                  opacity: isPlaying ? [0.15, 0.25, 0.15] : 0.1,
                  scale: isPlaying ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
                animate={{
                  opacity: isPlaying ? [0.1, 0.2, 0.1] : 0.05,
                  scale: isPlaying ? [1, 1.03, 1] : 1,
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </motion.div>

            {/* Drag Handle - visible indicator */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-0.5">
                <div className="h-1 w-8 rounded-full bg-white/20" />
              </div>
            </div>

            {/* Minimized View */}
            <AnimatePresence mode="wait">
              {isMinimized ? (
                <motion.div
                  key="minimized"
                  layout
                  className="flex items-center gap-3 p-3 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={fadeTransition}
                >
                  {/* Play indicator */}
                  <motion.div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      "bg-gradient-to-br from-teal-500 to-teal-600",
                      "shadow-lg shadow-teal-500/25",
                    )}
                    animate={
                      isPlaying
                        ? {
                            boxShadow: [
                              "0 10px 15px -3px rgba(20, 184, 166, 0.25)",
                              "0 10px 15px -3px rgba(20, 184, 166, 0.4)",
                              "0 10px 15px -3px rgba(20, 184, 166, 0.25)",
                            ],
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Headphones className="h-5 w-5 text-white" />
                  </motion.div>

                  {/* Mini progress ring */}
                  <div className="relative">
                    <svg className="h-10 w-10 -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        strokeWidth="3"
                        fill="none"
                        className="stroke-slate-700/50"
                      />
                      <motion.circle
                        cx="20"
                        cy="20"
                        r="16"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        className="stroke-teal-500"
                        initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                        animate={{
                          strokeDashoffset:
                            2 * Math.PI * 16 * (1 - progressPercent / 100),
                        }}
                        transition={{ duration: 0.1, ease: "linear" }}
                        style={{ strokeDasharray: `${2 * Math.PI * 16}` }}
                      />
                    </svg>
                    <button
                      onClick={player.togglePlay}
                      className="absolute inset-0 flex items-center justify-center transition-transform hover:scale-105"
                    >
                      <motion.div
                        initial={false}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4 text-white" />
                        )}
                      </motion.div>
                    </button>
                  </div>

                  {/* Track info */}
                  <div className="max-w-[120px] truncate">
                    <p className="truncate text-sm font-medium text-white">
                      {currentTrack.title}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </p>
                  </div>

                  {/* Expand button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 transition-colors hover:bg-white/10 hover:text-teal-400"
                    onClick={player.toggleMinimize}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>

                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 transition-colors hover:bg-white/10 hover:text-red-400"
                    onClick={player.closePlayer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                /* Expanded View */
                <motion.div
                  key="expanded"
                  layout
                  className="relative p-5 pt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={fadeTransition}
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl",
                          "bg-gradient-to-br from-teal-500 to-teal-600",
                          "shadow-lg shadow-teal-500/25",
                        )}
                        animate={
                          isPlaying
                            ? {
                                boxShadow: [
                                  "0 10px 15px -3px rgba(20, 184, 166, 0.25)",
                                  "0 10px 15px -3px rgba(20, 184, 166, 0.4)",
                                  "0 10px 15px -3px rgba(20, 184, 166, 0.25)",
                                ],
                              }
                            : {}
                        }
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Headphones className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {currentTrack.title}
                        </h3>
                        {currentTrack.subtitle && (
                          <p className="text-sm text-slate-400">
                            {currentTrack.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 transition-colors hover:bg-white/10 hover:text-teal-400"
                        onClick={player.toggleMinimize}
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 transition-colors hover:bg-white/10 hover:text-red-400"
                        onClick={player.closePlayer}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="relative mb-4 h-16 overflow-hidden rounded-xl bg-slate-800/40 ring-1 ring-white/5">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={64}
                      className="h-full w-full"
                    />

                    {/* Progress overlay for click-to-seek */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const progress = clickX / rect.width;
                        player.seek(progress * duration);
                      }}
                    />

                    {/* Playhead */}
                    <motion.div
                      className="pointer-events-none absolute top-0 h-full w-0.5 bg-white"
                      style={{ left: `${progressPercent}%` }}
                      animate={{
                        opacity: isPlaying ? 1 : 0.6,
                        boxShadow: isPlaying
                          ? "0 0 8px rgba(255,255,255,0.5)"
                          : "0 0 4px rgba(255,255,255,0.3)",
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

                  {/* Time Display */}
                  <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-400">
                    <span className="tabular-nums">
                      {formatDuration(currentTime)}
                    </span>
                    <span className="tabular-nums">
                      {formatDuration(duration)}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    {/* Left controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-bold text-teal-400 transition-colors hover:bg-white/10 hover:text-teal-300"
                        onClick={nextRate}
                      >
                        {playbackRate}x
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 transition-colors hover:bg-white/10 hover:text-teal-400"
                        onClick={() => player.setVolume(volume === 0 ? 1 : 0)}
                      >
                        {volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Center controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => player.skip(-10)}
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>

                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          size="icon"
                          className={cn(
                            "h-14 w-14 rounded-full",
                            "bg-gradient-to-br from-teal-500 to-teal-600",
                            "shadow-xl shadow-teal-500/30",
                            "transition-all duration-200 hover:scale-105",
                            "hover:shadow-teal-500/40",
                          )}
                          onClick={player.togglePlay}
                        >
                          {isPlaying ? (
                            <Pause className="h-6 w-6 text-white" />
                          ) : (
                            <Play className="ml-1 h-6 w-6 text-white" />
                          )}
                        </Button>
                      </motion.div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => player.skip(10)}
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 transition-colors hover:bg-white/10 hover:text-teal-400"
                        asChild
                      >
                        <a
                          href={currentTrack.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
