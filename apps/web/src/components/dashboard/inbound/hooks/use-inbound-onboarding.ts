import { useOnborda } from "onborda";
import { useEffect, useState } from "react";

/**
 * Hook for managing inbound dashboard onboarding tour
 *
 * Features:
 * - Auto-starts tour on first visit (500ms delay for UI render)
 * - Persists completion state in localStorage
 * - Provides manual restart capability
 */
export function useInboundOnboarding() {
  const { startOnborda, closeOnborda } = useOnborda();
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
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
    startOnborda("inbound-first-time");
  };

  return { hasSeenTour, markTourComplete, restartTour, closeOnborda };
}
