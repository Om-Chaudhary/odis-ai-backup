/**
 * Hook to track the current consultation ID from URL with SPA navigation support
 *
 * This hook provides a reactive consultation ID that updates when:
 * 1. The component mounts
 * 2. The user navigates via browser back/forward (popstate)
 * 3. The user navigates via SPA pushState/replaceState
 * 4. The URL changes for any other reason (mutation observer fallback)
 */

import { logger } from '@odis-ai/extension/shared';
import { useState, useEffect, useCallback } from 'react';

const odisLogger = logger.child('[useConsultationId]');

/**
 * Extract consultation ID from the current URL
 * Returns null if not on a consultation page
 *
 * Handles multiple URL patterns:
 * - /consultations/722450
 * - /consultations/view/722450
 * - /consultations/edit/722450
 */
const extractConsultationIdFromUrl = (): string | null => {
  // Match patterns like /consultations/722450, /consultations/view/722450, /consultations/edit/722450
  const match = window.location.pathname.match(/\/consultations\/(?:view\/|edit\/)?(\d+)/);
  return match ? match[1] : null;
};

/**
 * Hook that returns the current consultation ID and updates on URL changes
 *
 * Handles SPA navigation by:
 * - Listening to popstate events (browser back/forward)
 * - Patching pushState/replaceState to detect programmatic navigation
 * - Using a MutationObserver as a fallback for any other DOM-based navigation
 */
export const useConsultationId = (): string | null => {
  const [consultationId, setConsultationId] = useState<string | null>(() => extractConsultationIdFromUrl());

  const updateConsultationId = useCallback(() => {
    const newId = extractConsultationIdFromUrl();
    setConsultationId(prevId => {
      if (prevId !== newId) {
        odisLogger.debug('Consultation ID changed', { from: prevId, to: newId });
        return newId;
      }
      return prevId;
    });
  }, []);

  useEffect(() => {
    // Handle browser back/forward navigation
    const handlePopState = () => {
      odisLogger.debug('popstate event detected');
      updateConsultationId();
    };

    window.addEventListener('popstate', handlePopState);

    // Patch pushState and replaceState to detect SPA navigation
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function (...args) {
      originalPushState(...args);
      odisLogger.debug('pushState detected');
      // Use setTimeout to ensure the URL has updated
      setTimeout(updateConsultationId, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState(...args);
      odisLogger.debug('replaceState detected');
      setTimeout(updateConsultationId, 0);
    };

    // MutationObserver as a fallback for any other navigation patterns
    // (e.g., Angular router, React Router, etc.)
    let lastPathname = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== lastPathname) {
        lastPathname = window.location.pathname;
        odisLogger.debug('URL change detected via MutationObserver');
        updateConsultationId();
      }
    });

    // Observe document body for any changes that might indicate navigation
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      observer.disconnect();
    };
  }, [updateConsultationId]);

  return consultationId;
};

export { extractConsultationIdFromUrl };
