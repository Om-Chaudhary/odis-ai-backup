"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { UseAudioPlayerOptions, UseAudioPlayerReturn } from "./types";

const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.75] as const;

export function useAudioPlayer({
  audioUrl,
  initialDuration,
  onTimeUpdate,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Update duration from props
  useEffect(() => {
    if (initialDuration) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  // Reset state when audioUrl changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLoading(true);
  }, [audioUrl]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      if (!initialDuration) {
        setDuration(audioRef.current.duration);
      }
      setIsLoading(false);
    }
  }, [initialDuration]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Attach event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [
    handleTimeUpdate,
    handleLoadedMetadata,
    handleCanPlay,
    handleEnded,
    handleWaiting,
    handlePlaying,
  ]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        void audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      if (audioRef.current) {
        const newTime = Math.max(
          0,
          Math.min(audioRef.current.currentTime + seconds, duration)
        );
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration]
  );

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const cyclePlaybackRate = useCallback(() => {
    if (audioRef.current) {
      const currentIndex = PLAYBACK_RATES.indexOf(
        playbackRate as (typeof PLAYBACK_RATES)[number]
      );
      const nextRate =
        PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length] ?? 1;
      audioRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
    }
  }, [playbackRate]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skip, toggleMute]);

  return {
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
  };
}
