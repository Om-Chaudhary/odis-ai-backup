"use client";

import { useState, useEffect } from "react";

/**
 * Hook that returns true once the page is fully loaded.
 * This ensures animations don't start until the user can actually see them.
 *
 * @param minDelay - Minimum delay in ms before returning true (default: 100ms)
 * @returns boolean indicating if the page is ready for animations
 */
export function usePageLoaded(minDelay = 100): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if document is already loaded
    if (document.readyState === "complete") {
      // Still add a small delay to ensure paint is complete
      const timer = setTimeout(() => setIsLoaded(true), minDelay);
      return () => clearTimeout(timer);
    }

    // Wait for window load event
    const handleLoad = () => {
      const timer = setTimeout(() => setIsLoaded(true), minDelay);
      return () => clearTimeout(timer);
    };

    window.addEventListener("load", handleLoad);

    // Fallback: if load event doesn't fire within 2s, proceed anyway
    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);

    return () => {
      window.removeEventListener("load", handleLoad);
      clearTimeout(fallbackTimer);
    };
  }, [minDelay]);

  return isLoaded;
}
