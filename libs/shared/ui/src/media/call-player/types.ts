import type { TranscriptMessage } from "@odis-ai/shared/types";

export interface CallPlayerProps {
  /** URL to the audio recording */
  audioUrl: string;
  /** Transcript messages with timing data */
  transcript?: TranscriptMessage[];
  /** Fallback plain text transcript if no timed messages */
  plainTranscript?: string | null;
  /** Duration in seconds (used if audio metadata isn't available) */
  duration?: number;
  /** Optional title for the recording */
  title?: string;
  /** Optional class name for the container */
  className?: string;
  /** Callback when time updates */
  onTimeUpdate?: (currentTime: number) => void;
}

export interface WaveformScrubberProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  className?: string;
}

export interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  currentTime: number;
  onMessageClick: (time: number) => void;
  className?: string;
}

export interface PlainTranscriptPanelProps {
  transcript: string;
  className?: string;
}

export interface UseAudioPlayerOptions {
  audioUrl: string;
  initialDuration?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  playbackRate: number;
  isLoading: boolean;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  toggleMute: () => void;
  cyclePlaybackRate: () => void;
}
