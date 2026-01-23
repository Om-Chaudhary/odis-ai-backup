"use client";

import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  SkipBack,
  SkipForward,
  Bot,
} from "lucide-react";
import { Button } from "../../button";
import { cn } from "@odis-ai/shared/util";
import { useAudioPlayer } from "./use-audio-player";
import { WaveformScrubber } from "./waveform-scrubber";
import { TranscriptPanel } from "./transcript-panel";
import { PlainTranscriptPanel } from "./plain-transcript-panel";
import { formatTime } from "./utils";
import type { CallPlayerProps } from "./types";

export function CallPlayer({
  audioUrl,
  transcript,
  plainTranscript,
  duration: propDuration,
  className,
  onTimeUpdate,
}: CallPlayerProps): React.ReactElement {
  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    playbackRate,
    isLoading,
    togglePlay,
    seek,
    skip,
    toggleMute,
    cyclePlaybackRate,
  } = useAudioPlayer({
    audioUrl,
    initialDuration: propDuration,
    onTimeUpdate,
  });

  const hasTimedTranscript = transcript && transcript.length > 0;
  const hasPlainTranscript =
    plainTranscript && plainTranscript.trim().length > 0;
  const hasAnyTranscript = hasTimedTranscript || hasPlainTranscript;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("overflow-hidden rounded-lg bg-card shadow-sm", className)}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Content */}
      <div className="p-4">
        {/* Waveform Scrubber */}
        <WaveformScrubber
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={seek}
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
                  onMessageClick={seek}
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
