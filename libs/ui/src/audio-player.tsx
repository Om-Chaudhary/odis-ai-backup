"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Slider } from "./slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Rewind,
  FastForward,
} from "lucide-react";
import { formatDuration } from "@odis/utils";

interface AudioPlayerProps {
  url: string;
  duration?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export function AudioPlayer({ url, duration, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Update duration if provided via props
  useEffect(() => {
    if (duration) {
      setTotalDuration(duration);
    }
  }, [duration]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  // Handle metadata loaded (duration available)
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (!duration) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        void audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (audioRef.current && value[0] !== undefined) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current && value[0] !== undefined) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(1);
        audioRef.current.volume = 1;
      }
    }
  };

  // Change playback speed
  const toggleSpeed = () => {
    if (audioRef.current) {
      const rates = [1, 1.5, 2, 0.5];
      const nextRate =
        rates[(rates.indexOf(playbackRate) + 1) % rates.length] ?? 1;
      audioRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col gap-4">
        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => skip(-10)}
            >
              <Rewind className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-1 h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => skip(10)}
            >
              <FastForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-muted-foreground flex items-center gap-1 text-sm font-medium tabular-nums">
            <span>{formatDuration(currentTime)}</span>
            <span className="text-muted-foreground/50">/</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-bold"
              onClick={toggleSpeed}
            >
              {playbackRate}x
            </Button>

            <div className="group relative flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-24 opacity-0 transition-opacity group-hover:opacity-100">
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={url} download target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Scrubber */}
        <Slider
          value={[currentTime]}
          max={totalDuration}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}

// Backwards compatibility alias
export { AudioPlayer as CallAudioPlayer };
