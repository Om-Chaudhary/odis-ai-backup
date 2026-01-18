"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Slider } from "@odis-ai/shared/ui/slider";
import { cn, formatDuration } from "@odis-ai/shared/util";
import { useAudioPlayerOptional } from "./audio-player-context";

/**
 * Floating Audio Player Component
 *
 * A beautiful, minimizable audio player that floats at the bottom of the screen.
 * Features:
 * - Waveform visualization with gradient fill
 * - Smooth minimize/expand animations
 * - Modern glassmorphism design
 * - Dark mode support
 */
export function FloatingAudioPlayer() {
  const player = useAudioPlayerOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Generate static waveform bars for visual effect
  const waveformBars = useMemo(() => {
    return Array.from({ length: 48 }, () => Math.random() * 0.6 + 0.2);
  }, []);

  // Setup audio analyzer for waveform
  useEffect(() => {
    if (!player?.audioRef.current || !player.currentTrack) return;

    const audio = player.audioRef.current;

    // Only create context once
    audioContextRef.current ??= new AudioContext();

    const ctx = audioContextRef.current;

    // Only create source and analyzer once per audio element
    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audio);
        analyzerRef.current = ctx.createAnalyser();
        analyzerRef.current.fftSize = 256;
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(ctx.destination);
      } catch {
        // Source already connected, just use existing
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [player?.audioRef, player?.currentTrack]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !player?.isPlaying || player.isMinimized) return;

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

        // Animate bars based on playback
        const amplitude = player.isPlaying
          ? bar * (0.8 + Math.sin(Date.now() / 200 + i * 0.3) * 0.2)
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
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
          isMinimized ? "w-auto" : "w-[560px] max-w-[calc(100vw-2rem)]",
        )}
      >
        <motion.div
          layout
          className={cn(
            "relative overflow-hidden rounded-2xl border shadow-2xl",
            "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
            "border-slate-700/50 backdrop-blur-xl",
            "dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95",
            "dark:border-slate-700/30",
          )}
        >
          {/* Ambient glow effect */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div
              className={cn(
                "absolute -top-20 -left-20 h-40 w-40 rounded-full blur-3xl",
                "bg-teal-500/20",
                isPlaying && "animate-pulse",
              )}
            />
            <div
              className={cn(
                "absolute -right-20 -bottom-20 h-40 w-40 rounded-full blur-3xl",
                "bg-cyan-500/10",
                isPlaying && "animate-pulse",
              )}
            />
          </div>

          {/* Minimized View */}
          {isMinimized ? (
            <motion.div
              layout
              className="flex items-center gap-3 p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Play indicator */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-teal-500 to-teal-600",
                  "shadow-lg shadow-teal-500/30",
                )}
              >
                <Headphones className="h-5 w-5 text-white" />
              </div>

              {/* Mini progress ring */}
              <div className="relative">
                <svg className="h-10 w-10 -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    strokeWidth="3"
                    fill="none"
                    className="stroke-slate-700"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    className="stroke-teal-500 transition-all duration-300"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 16}`,
                      strokeDashoffset: `${2 * Math.PI * 16 * (1 - progressPercent / 100)}`,
                    }}
                  />
                </svg>
                <button
                  onClick={player.togglePlay}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 text-white" />
                  )}
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
                className="h-8 w-8 text-slate-400 hover:text-white"
                onClick={player.toggleMinimize}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-400"
                onClick={player.closePlayer}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            /* Expanded View */
            <motion.div
              layout
              className="relative p-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      "bg-gradient-to-br from-teal-500 to-teal-600",
                      "shadow-lg shadow-teal-500/30",
                    )}
                  >
                    <Headphones className="h-6 w-6 text-white" />
                  </div>
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
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={player.toggleMinimize}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-400"
                    onClick={player.closePlayer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className="relative mb-4 h-16 overflow-hidden rounded-xl bg-slate-800/50">
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
                  className="pointer-events-none absolute top-0 h-full w-0.5 bg-white shadow-lg shadow-white/50"
                  style={{ left: `${progressPercent}%` }}
                  animate={{ opacity: isPlaying ? 1 : 0.5 }}
                />
              </div>

              {/* Time Display */}
              <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="tabular-nums">
                  {formatDuration(currentTime)}
                </span>
                <span className="tabular-nums">{formatDuration(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-bold text-slate-400 hover:text-white"
                    onClick={nextRate}
                  >
                    {playbackRate}x
                  </Button>

                  <div
                    className="relative"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() => player.setVolume(volume === 0 ? 1 : 0)}
                    >
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>

                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-slate-800 p-3 shadow-xl"
                        >
                          <Slider
                            value={[volume]}
                            max={1}
                            step={0.05}
                            orientation="vertical"
                            className="h-20"
                            onValueChange={([v]) =>
                              v !== undefined && player.setVolume(v)
                            }
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Center controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-300 hover:text-white"
                    onClick={() => player.skip(-10)}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button
                    size="icon"
                    className={cn(
                      "h-14 w-14 rounded-full",
                      "bg-gradient-to-br from-teal-500 to-teal-600",
                      "shadow-xl shadow-teal-500/40",
                      "hover:from-teal-400 hover:to-teal-500",
                      "transition-all duration-200 hover:scale-105",
                    )}
                    onClick={player.togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="ml-1 h-6 w-6 text-white" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-300 hover:text-white"
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
                    className="h-8 w-8 text-slate-400 hover:text-white"
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
