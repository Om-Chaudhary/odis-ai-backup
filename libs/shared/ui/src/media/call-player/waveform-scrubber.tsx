"use client";

import { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import { formatTime } from "./utils";
import type { WaveformScrubberProps } from "./types";

export const WaveformScrubber = forwardRef<HTMLDivElement, WaveformScrubberProps>(
  function WaveformScrubber(
    { currentTime, duration, isPlaying, onSeek, className },
    _ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const [isHovering, setIsHovering] = useState(false);
    const [hoverX, setHoverX] = useState(0);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Generate deterministic waveform bars
    const waveformBars = useMemo(() => {
      const barCount = 64;
      const seed = duration > 0 ? Math.floor(duration * 1000) : 12345;
      return Array.from({ length: barCount }, (_, i) => {
        const x = Math.sin(seed * (i + 1) * 0.1) * 10000;
        return (x - Math.floor(x)) * 0.5 + 0.25;
      });
    }, [duration]);

    // ResizeObserver to track canvas dimensions
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setCanvasSize({ width, height });
          }
        }
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    // Draw waveform whenever size, progress, or playing state changes
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      ctx.scale(dpr, dpr);

      function draw(): void {
        if (!ctx) return;
        const width = canvasSize.width;
        const height = canvasSize.height;

        ctx.clearRect(0, 0, width, height);

        const progress = duration > 0 ? currentTime / duration : 0;

        // Active gradient (teal)
        const activeGradient = ctx.createLinearGradient(0, 0, width, 0);
        activeGradient.addColorStop(0, "rgba(13, 148, 136, 0.95)");
        activeGradient.addColorStop(0.5, "rgba(20, 184, 166, 1)");
        activeGradient.addColorStop(1, "rgba(45, 212, 191, 0.95)");

        const inactiveColor = "rgba(203, 213, 225, 0.6)";
        const barWidth = width / waveformBars.length;
        const gap = 2;

        waveformBars.forEach((bar, i) => {
          const x = i * barWidth;
          const barProgress = i / waveformBars.length;

          const time = Date.now() / 400;
          const amplitude = isPlaying
            ? bar * (0.85 + Math.sin(time + i * 0.3) * 0.15)
            : bar;

          const barHeight = Math.max(2, amplitude * height * 0.85);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = barProgress <= progress ? activeGradient : inactiveColor;

          const barW = Math.max(1, barWidth - gap);
          const radius = Math.max(0, Math.min(barW / 2, barHeight / 2, 3));
          ctx.beginPath();
          ctx.roundRect(x + gap / 2, y, barW, barHeight, radius);
          ctx.fill();
        });

        // Playhead indicator
        if (progress > 0) {
          const playheadX = progress * width;
          ctx.fillStyle = "rgba(13, 148, 136, 1)";
          ctx.shadowColor = "rgba(13, 148, 136, 0.4)";
          ctx.shadowBlur = isPlaying ? 6 : 3;
          ctx.fillRect(playheadX - 1.5, 0, 3, height);
          ctx.shadowBlur = 0;
        }

        if (isPlaying) {
          animationRef.current = requestAnimationFrame(draw);
        }
      }

      draw();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [currentTime, duration, isPlaying, waveformBars, canvasSize]);

    function handleClick(e: React.MouseEvent): void {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = clickX / rect.width;
      onSeek(progress * duration);
    }

    function handleMouseMove(e: React.MouseEvent): void {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoverX(e.clientX - rect.left);
    }

    const hoverProgress = isHovering
      ? hoverX / (containerRef.current?.offsetWidth || 1)
      : 0;
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
