"use client";

import type { ReactNode } from "react";
import { AudioPlayerProvider } from "./audio-player-context";
import { FloatingAudioPlayer } from "./floating-audio-player";

interface AudioPlayerWrapperProps {
  children: ReactNode;
}

/**
 * Audio Player Wrapper Component
 *
 * Wraps the dashboard content with the AudioPlayerProvider context
 * and renders the FloatingAudioPlayer at the bottom.
 *
 * This is a client component wrapper to be used in server component layouts.
 */
export function AudioPlayerWrapper({ children }: AudioPlayerWrapperProps) {
  return (
    <AudioPlayerProvider>
      {children}
      <FloatingAudioPlayer />
    </AudioPlayerProvider>
  );
}
