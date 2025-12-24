/**
 * Managed MutationObserver hook with automatic cleanup
 * Prevents observer proliferation from component remounts
 */
import { logger } from "../utils/logger";
import { useEffect, useRef } from "react";

const hookLogger = logger.child("[useMutationObserver]");

export interface UseMutationObserverOptions extends MutationObserverInit {
  /**
   * Target element to observe. If null/undefined, observer won't activate.
   */
  target?: HTMLElement | null;
  /**
   * Debounce delay in ms to batch rapid mutations
   */
  debounce?: number;
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Hook to safely observe DOM mutations with automatic cleanup
 *
 * This hook prevents memory leaks from MutationObserver proliferation by:
 * - Automatically cleaning up observers on unmount
 * - Preventing stale callback references
 * - Debouncing rapid mutations to reduce CPU usage
 *
 * @example
 * ```tsx
 * useMutationObserver((mutations) => {
 *   console.log('DOM changed', mutations);
 * }, {
 *   target: document.body,
 *   childList: true,
 *   subtree: true,
 *   debounce: 100
 * });
 * ```
 */
export const useMutationObserver = (
  callback: (mutations: MutationRecord[], observer: MutationObserver) => void,
  options: UseMutationObserverOptions,
): void => {
  const {
    target,
    debounce,
    debug,
    childList,
    subtree,
    attributes,
    attributeFilter,
    characterData,
  } = options;
  const callbackRef = useRef(callback);
  const debounceTimerRef = useRef<number | null>(null);

  // Keep callback fresh without triggering re-observation
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!target) {
      if (debug) {
        hookLogger.debug("No target provided, observer inactive");
      }
      return;
    }

    const wrappedCallback = (
      mutations: MutationRecord[],
      observer: MutationObserver,
    ) => {
      if (debounce) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(() => {
          callbackRef.current(mutations, observer);
          debounceTimerRef.current = null;
        }, debounce);
      } else {
        callbackRef.current(mutations, observer);
      }
    };

    const observer = new MutationObserver(wrappedCallback);

    const observerOptions: MutationObserverInit = {
      childList,
      subtree,
      attributes,
      attributeFilter,
      characterData,
    };

    try {
      observer.observe(target, observerOptions);
      if (debug) {
        hookLogger.debug("MutationObserver started", {
          target: target.tagName,
          options: observerOptions,
        });
      }
    } catch (error) {
      hookLogger.error("Failed to start MutationObserver", { error });
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      observer.disconnect();
      if (debug) {
        hookLogger.debug("MutationObserver cleaned up");
      }
    };
  }, [
    target,
    debounce,
    debug,
    childList,
    subtree,
    attributes,
    attributeFilter,
    characterData,
  ]);
};
