/**
 * CallPlayer - Audio player with waveform visualization and transcript sync
 */

export { CallPlayer } from "./call-player";
export { WaveformScrubber } from "./waveform-scrubber";
export { TranscriptPanel } from "./transcript-panel";
export { PlainTranscriptPanel } from "./plain-transcript-panel";
export { useAudioPlayer } from "./use-audio-player";
export { formatTime, parseTranscript } from "./utils";

export type {
  CallPlayerProps,
  WaveformScrubberProps,
  TranscriptPanelProps,
  PlainTranscriptPanelProps,
  UseAudioPlayerOptions,
  UseAudioPlayerReturn,
} from "./types";
