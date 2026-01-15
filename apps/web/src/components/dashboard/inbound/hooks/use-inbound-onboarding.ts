import { useEffect, useState } from "react";
import { useSafeOnborda } from "~/components/providers/onboarding-provider";

/**
 * Hook for managing inbound dashboard onboarding tour
 *
 * Features:
 * - Auto-starts tour on first visit (500ms delay for UI render)
 * - Persists completion state in localStorage
 * - Provides manual restart capability
 * - Safely handles missing provider context (graceful degradation)
 */
export function useInboundOnboarding() {
  const [hasSeenTour, setHasSeenTour] = useState(false);

  // Use safe context that returns null instead of throwing when outside provider
  const onbordaContext = useSafeOnborda();

  const startOnborda = onbordaContext?.startOnborda;
  const closeOnborda = onbordaContext?.closeOnborda;

  useEffect(() => {
    // Skip if no context available
    if (!startOnborda) return;

    // Check localStorage for tour completion
    const seen = localStorage.getItem("inbound-tour-completed");
    if (!seen) {
      // Start tour after 500ms delay (allow UI to render)
      const timer = setTimeout(() => startOnborda("inbound-first-time"), 500);
      return () => clearTimeout(timer);
    }
    setHasSeenTour(true);
  }, [startOnborda]);

  const markTourComplete = () => {
    localStorage.setItem("inbound-tour-completed", "true");
    setHasSeenTour(true);
  };

  const restartTour = () => {
    // Close any existing tour first
    closeOnborda?.();
    // Small delay to ensure clean state before restarting
    setTimeout(() => {
      startOnborda?.("inbound-first-time");
    }, 100);
  };

  return {
    hasSeenTour,
    markTourComplete,
    restartTour,
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentional noop fallback
    closeOnborda: closeOnborda ?? (() => {}),
  };
}
