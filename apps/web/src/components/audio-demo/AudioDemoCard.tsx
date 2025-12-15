"use client";

import { forwardRef } from "react";
import { motion, type Variants } from "motion/react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { cn } from "~/lib/utils";
import { MiniWaveform } from "~/components/ui/mini-waveform";

export interface DemoCardData {
  id: string;
  title: string;
  duration: number; // in seconds
  audioUrl: string;
  petName: string;
  petImage: string;
}

interface AudioDemoCardProps {
  card: DemoCardData;
  isPlaying: boolean;
  progress: number; // 0 to 1
  onTogglePlay: () => void;
  index: number;
  // Scattered layout props
  offsetY?: number;
  rotation?: number;
  // Animation control
  disableAnimations?: boolean;
  // Blur effect when another card is active
  isBlurred?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const AudioDemoCard = forwardRef<HTMLDivElement, AudioDemoCardProps>(
  (
    {
      card,
      isPlaying,
      progress,
      onTogglePlay,
      index,
      offsetY = 0,
      rotation = 0,
      disableAnimations = false,
      isBlurred = false,
      onHoverStart,
      onHoverEnd,
    },
    ref,
  ) => {
    const currentTime = progress * card.duration;

    // Animation variants - only apply on desktop
    const cardVariants: Variants = disableAnimations
      ? {
          hidden: { opacity: 1 },
          visible: { opacity: 1 },
        }
      : {
          hidden: { opacity: 0, y: 30, scale: 0.95 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.6,
              delay: 0.1 + index * 0.12,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        whileHover={disableAnimations ? undefined : { scale: 1.04 }}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
        className={cn(
          "group relative flex w-full flex-col rounded-2xl border bg-white/95 backdrop-blur-sm",
          "p-4 md:p-5",
          "shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
          "transition-all duration-300 ease-out",
          "hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
          isPlaying
            ? "z-10 border-teal-400 ring-2 ring-teal-400/20"
            : "border-slate-100/80",
          // Subtle blur when another card is focused
          isBlurred && "scale-[0.98] opacity-60 blur-[1px]",
        )}
        style={{
          // Apply scattered transforms only on desktop
          transform: `translateY(${offsetY}px) rotate(${rotation}deg)`,
        }}
      >
        {/* Header: Pet Avatar + Title + Playing Indicator */}
        <div className="mb-3 flex items-center gap-3">
          {/* Pet Avatar */}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100">
            <Image
              src={card.petImage}
              alt={card.petName}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-800 md:text-base">
              {card.title}
            </h3>
            <p className="text-xs text-slate-500">{card.petName}</p>
          </div>

          {/* Playing Indicator */}
          {isPlaying && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
              </span>
            </span>
          )}
        </div>

        {/* Waveform with integrated play button */}
        <div className="relative flex items-center gap-3 rounded-xl bg-slate-50/80 p-2.5 md:p-3">
          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
              isPlaying
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                : "bg-white text-slate-500 shadow-sm hover:text-teal-600 hover:shadow-md",
            )}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
            )}
          </button>

          {/* Waveform + Progress */}
          <div className="flex flex-1 flex-col gap-1">
            <MiniWaveform
              progress={progress}
              isPlaying={isPlaying}
              barCount={28}
              height={24}
            />
            {/* Minimal time display */}
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="font-mono">{formatDuration(currentTime)}</span>
              <span className="font-mono">{formatDuration(card.duration)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

AudioDemoCard.displayName = "AudioDemoCard";
