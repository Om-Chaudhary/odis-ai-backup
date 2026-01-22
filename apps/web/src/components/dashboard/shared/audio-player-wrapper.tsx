import type { ReactNode } from "react";

interface AudioPlayerWrapperProps {
  children: ReactNode;
}

/**
 * Audio Player Wrapper Component
 *
 * Legacy wrapper that previously provided context for a floating audio player.
 * Now simplified to just pass children through for backwards compatibility.
 *
 * @deprecated This wrapper is no longer needed. The new CallPlayer component
 * from @odis-ai/shared/ui/media includes its own integrated player.
 */
export function AudioPlayerWrapper({ children }: AudioPlayerWrapperProps) {
  return <>{children}</>;
}
