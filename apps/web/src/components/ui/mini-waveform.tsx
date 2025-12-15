"use client";

import { useMemo } from "react";
import { cn } from "~/lib/utils";

interface MiniWaveformProps {
  /** Progress value from 0 to 1 */
  progress: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Number of bars in the waveform */
  barCount?: number;
  /** Height of the waveform in pixels */
  height?: number;
  /** Additional class names */
  className?: string;
}

export function MiniWaveform({
  progress,
  isPlaying,
  barCount = 32,
  height = 32,
  className,
}: MiniWaveformProps) {
  // Generate deterministic bar heights based on index
  const bars = useMemo(() => {
    return Array.from({ length: barCount }).map((_, i) => {
      // Create a wave-like pattern
      const base = Math.sin((i / barCount) * Math.PI);
      const variation = Math.sin(i * 0.8) * 0.3 + Math.cos(i * 0.5) * 0.2;
      return Math.max(0.15, Math.min(1, base + variation));
    });
  }, [barCount]);

  return (
    <div
      className={cn("flex items-center justify-center gap-[2px]", className)}
      style={{ height }}
      role="presentation"
      aria-hidden="true"
    >
      {bars.map((barHeight, i) => {
        const fillPercentage = (i + 1) / barCount;
        const isFilled = fillPercentage <= progress;

        return (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-150",
              isFilled
                ? "bg-gradient-to-t from-teal-600 to-teal-400"
                : "bg-slate-200",
            )}
            style={{
              width: 3,
              height: `${barHeight * 100}%`,
              opacity: isFilled ? 1 : 0.6,
              transform:
                isPlaying && isFilled
                  ? `scaleY(${0.85 + Math.random() * 0.3})`
                  : undefined,
              transition: isPlaying ? "transform 150ms ease" : "all 150ms ease",
            }}
          />
        );
      })}
    </div>
  );
}
