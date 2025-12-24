/**
 * Hook to safely listen to SPA navigation (pushState/replaceState/popstate)
 * Prevents history method pollution from multiple patches
 */
import { logger } from "../utils/logger";
import { useEffect, useRef } from "react";

const hookLogger = logger.child("[useHistoryListener]");

// Global tracking to prevent multiple patches
const historyPatchedRef = { current: false };
const historyListeners = new Set<() => void>();
let originalPushState: typeof history.pushState | null = null;
let originalReplaceState: typeof history.replaceState | null = null;

/**
 * Patch history methods globally (once only) to notify all listeners
 */
const patchHistoryMethods = () => {
  if (historyPatchedRef.current) {
    return;
  }

  originalPushState = history.pushState.bind(history);
  originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState!.apply(history, args);
    // Notify all listeners asynchronously
    setTimeout(() => {
      historyListeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          hookLogger.error("Error in history listener", { error });
        }
      });
    }, 0);
  };

  history.replaceState = function (...args) {
    originalReplaceState!.apply(history, args);
    setTimeout(() => {
      historyListeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          hookLogger.error("Error in history listener", { error });
        }
      });
    }, 0);
  };

  historyPatchedRef.current = true;
  hookLogger.debug("History methods patched globally");
};

/**
 * Hook to listen for SPA navigation changes (pushState/replaceState/popstate)
 *
 * This hook prevents memory leaks from history method pollution by:
 * - Patching history methods only ONCE globally
 * - Allowing multiple components to listen without nested wrappers
 * - Automatically cleaning up listeners on unmount
 * - Catching and logging errors in listener callbacks
 *
 * Key advantage: Instead of each component wrapping history.pushState with its own
 * setTimeout, we have ONE global patch that notifies all registered listeners.
 * This prevents the nested wrapper problem that causes memory leaks.
 *
 * @example
 * ```tsx
 * useHistoryListener(() => {
 *   console.log('Navigation occurred!');
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Multiple components can safely use this hook
 * function ComponentA() {
 *   useHistoryListener(() => console.log('A detected navigation'));
 * }
 *
 * function ComponentB() {
 *   useHistoryListener(() => console.log('B detected navigation'));
 * }
 * // Both listeners work without interfering with each other
 * ```
 */
export const useHistoryListener = (callback: () => void): void => {
  const callbackRef = useRef(callback);

  // Keep callback fresh
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Patch history methods once globally
    patchHistoryMethods();

    // Create stable listener
    const listener = () => callbackRef.current();

    // Register listener
    historyListeners.add(listener);

    // Also listen to popstate (back/forward buttons)
    const popstateHandler = () => listener();
    window.addEventListener("popstate", popstateHandler);

    // Cleanup
    return () => {
      historyListeners.delete(listener);
      window.removeEventListener("popstate", popstateHandler);
    };
  }, []);
};

/**
 * Restore original history methods (for testing only)
 *
 * WARNING: This is only for test cleanup. Do not use in production code.
 */
export const restoreHistoryMethods = (): void => {
  if (
    !historyPatchedRef.current ||
    !originalPushState ||
    !originalReplaceState
  ) {
    return;
  }

  history.pushState = originalPushState;
  history.replaceState = originalReplaceState;
  historyPatchedRef.current = false;
  historyListeners.clear();
  hookLogger.debug("History methods restored");
};
