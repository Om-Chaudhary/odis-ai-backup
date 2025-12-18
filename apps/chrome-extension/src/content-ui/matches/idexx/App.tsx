import { BrandedMenuBar } from './components/menu/BrandedMenuBar';
import { setupCalendarGridIconsObserver } from './utils/dom/calendar-grid-icons-injector';
import { detectCKEditor, injectBrandedMenuBar } from './utils/dom/ckeditor-detector';
import { setupScheduleIconsObserver } from './utils/dom/schedule-icons-injector';
import { extractConsultationId } from './utils/extraction/consultation-fetcher';
import { setupVitalsAutoExtraction } from './utils/extraction/vitals-autofill';
import { logger } from '@odis-ai/extension-shared';
import { soapTemplatesStorage } from '@odis-ai/extension-storage';
import { useEffect, useRef } from 'react';

// Inline CSS for global styles (CSS variables) - injected into host page
const globalCss = `
:root {
  --odis-primary: #3b82f6;
  --odis-primary-hover: #2563eb;
  --odis-secondary: #6b7280;
  --odis-success: #22c55e;
  --odis-warning: #f59e0b;
  --odis-error: #ef4444;
  --odis-bg: #ffffff;
  --odis-text: #1f2937;
  --odis-border: #e5e7eb;
  --odis-radius: 0.375rem;
}
`;

// Inline CSS for utilities - minimal Tailwind-like utilities for extension components
const utilitiesCss = `
.odis-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: var(--odis-radius); font-weight: 500; cursor: pointer; transition: all 0.2s; }
.odis-btn-primary { background: var(--odis-primary); color: white; border: none; }
.odis-btn-primary:hover { background: var(--odis-primary-hover); }
.odis-flex { display: flex; }
.odis-items-center { align-items: center; }
.odis-gap-2 { gap: 0.5rem; }
.odis-text-sm { font-size: 0.875rem; }
.odis-font-medium { font-weight: 500; }
`;

const odisLogger = logger.child('[ODIS]');

/**
 * Inject CSS variables and utilities into document head
 *
 * We inject two separate stylesheets:
 * 1. global.css - ONLY CSS custom properties (variables)
 * 2. utilities.css - Compiled Tailwind utilities (NO base reset)
 *
 * This allows our components to use Tailwind classes without breaking
 * host page styles like IDEXX schedule tables.
 */
const injectGlobalStyles = () => {
  // Inject CSS variables
  if (!document.getElementById('odis-global-styles')) {
    const variablesStyle = document.createElement('style');
    variablesStyle.id = 'odis-global-styles';
    variablesStyle.textContent = globalCss;
    document.head.appendChild(variablesStyle);
  }

  // Inject Tailwind utilities (for components injected outside Shadow DOM)
  if (!document.getElementById('odis-utilities-styles')) {
    const utilitiesStyle = document.createElement('style');
    utilitiesStyle.id = 'odis-utilities-styles';
    utilitiesStyle.textContent = utilitiesCss;
    document.head.appendChild(utilitiesStyle);
  }
};

export default function App() {
  const isInjectedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const syncButtonInjectedRef = useRef(false); // Track if schedule icons were injected
  const scheduleIconsCleanupRef = useRef<(() => void) | null>(null);
  const calendarGridIconsCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    odisLogger.info('IDEXX Neo integration loaded');

    // Inject global styles
    injectGlobalStyles();

    // Initialize default templates on first run
    soapTemplatesStorage.initializeDefaultTemplates().catch(error => {
      odisLogger.error('Failed to initialize default templates', { error });
    });

    // Inject schedule status icons into appointment popup
    const injectScheduleIcons = () => {
      // Clean up existing observer if any
      if (scheduleIconsCleanupRef.current) {
        scheduleIconsCleanupRef.current();
        scheduleIconsCleanupRef.current = null;
      }

      // Setup new observer for popup icons
      try {
        const cleanup = setupScheduleIconsObserver();
        scheduleIconsCleanupRef.current = cleanup;
        odisLogger.info('Schedule popup icons observer setup');
      } catch (error) {
        odisLogger.error('Failed to setup schedule popup icons observer', { error });
      }
    };

    // Inject calendar grid status icons into appointment blocks
    const injectCalendarGridIcons = () => {
      // Clean up existing observer if any
      if (calendarGridIconsCleanupRef.current) {
        calendarGridIconsCleanupRef.current();
        calendarGridIconsCleanupRef.current = null;
      }

      // Setup new observer for calendar grid icons
      try {
        const cleanup = setupCalendarGridIconsObserver();
        calendarGridIconsCleanupRef.current = cleanup;
        odisLogger.info('Calendar grid icons observer setup');
      } catch (error) {
        odisLogger.error('Failed to setup calendar grid icons observer', { error });
      }
    };

    // Show sync button on schedule pages
    const checkForSchedulePage = () => {
      const pathname = window.location.pathname.toLowerCase();
      const pageTitle = document.title.toLowerCase();

      odisLogger.debug('Checking for schedule page', { pathname, pageTitle });

      // Check URL pathname (more comprehensive patterns)
      const pathnameMatch =
        pathname.includes('/schedule') ||
        pathname.includes('/calendar') ||
        pathname.includes('/appointment') ||
        pathname.includes('/scheduling') ||
        pathname.includes('/agenda');

      // Check page title
      const titleMatch =
        pageTitle.includes('schedule') || pageTitle.includes('calendar') || pageTitle.includes('appointment');

      // Check for IDEXX-specific schedule page elements
      // These are the actual elements we see in the IDEXX schedule page HTML
      const idexxSpecificMatches =
        // Angular components
        document.querySelector('app-appointments-view') ||
        document.querySelector('app-appointments-calendar') ||
        // FullCalendar component
        document.querySelector('full-calendar') ||
        document.querySelector('.fc') ||
        // Data attributes from IDEXX
        document.querySelector('[data-qa="appointment-calendar-tab"]') ||
        document.querySelector('[data-qa="boarding-calendar-tab"]') ||
        document.querySelector('[data-qa*="appointment"]') ||
        document.querySelector('[data-qa*="calendar"]') ||
        // Appointment blocks
        document.querySelector('.appointment-block') ||
        document.querySelector('[id*="appointment_id"]') ||
        // FullCalendar time slots
        document.querySelector('.fc-timegrid-slot') ||
        document.querySelector('.fc-timegrid-col') ||
        document.querySelector('.fc-event') ||
        // Appointment calendar controls
        document.querySelector('#appointment-calendar-manage-elements-row') ||
        document.querySelector('[id*="appointment-calendar"]') ||
        // Schedule header (check if any h2 contains "Schedule")
        Array.from(document.querySelectorAll('h2')).some(h2 => h2.textContent?.toLowerCase().includes('schedule'));

      // Check for generic schedule/calendar DOM elements (fallback)
      const genericMatches =
        document.querySelector('[data-testid*="schedule"]') ||
        document.querySelector('[data-testid*="calendar"]') ||
        document.querySelector('.schedule-grid') ||
        document.querySelector('.calendar-view') ||
        document.querySelector('.appointment-card') ||
        document.querySelector('.appointment-list') ||
        document.querySelector('[class*="calendar"]') ||
        document.querySelector('[class*="schedule"]') ||
        document.querySelector('[class*="appointment"]') ||
        document.querySelector('[id*="calendar"]') ||
        document.querySelector('[id*="schedule"]') ||
        // Check for common calendar/schedule indicators
        document.querySelector('table[class*="calendar"]') ||
        document.querySelector('div[class*="calendar"]') ||
        document.querySelector('div[class*="schedule"]') ||
        // Check for time slots or day views
        document.querySelector('[class*="time-slot"]') ||
        document.querySelector('[class*="day-view"]') ||
        document.querySelector('[class*="week-view"]') ||
        document.querySelector('[class*="month-view"]');

      const isSchedulePage = pathnameMatch || titleMatch || !!idexxSpecificMatches || !!genericMatches;

      // Enhanced logging for debugging
      if (isSchedulePage) {
        odisLogger.info('Schedule page detected - showing sync button', {
          pathname: window.location.pathname,
          pageTitle: document.title,
          pathnameMatch,
          titleMatch,
          hasIdexxMatch: !!idexxSpecificMatches,
          hasGenericMatch: !!genericMatches,
        });
      } else {
        // Log when not detected (only occasionally to avoid spam)
        if (Math.random() < 0.1) {
          odisLogger.debug('Not a schedule page', {
            pathname: window.location.pathname,
            pageTitle: document.title,
          });
        }
      }

      // Inject/remove sync button and schedule icons based on detection
      if (isSchedulePage) {
        if (!syncButtonInjectedRef.current) {
          // REMOVED: injectSyncButton();
          injectScheduleIcons();
          injectCalendarGridIcons();
          syncButtonInjectedRef.current = true; // Still set to true to prevent re-checking
        }
      } else {
        // Remove button and icons if not on schedule page
        // REMOVED: Sync button cleanup
        // if (syncButtonCleanupRef.current) {
        //   syncButtonCleanupRef.current();
        //   syncButtonCleanupRef.current = null;
        // }
        if (scheduleIconsCleanupRef.current) {
          scheduleIconsCleanupRef.current();
          scheduleIconsCleanupRef.current = null;
        }
        if (calendarGridIconsCleanupRef.current) {
          calendarGridIconsCleanupRef.current();
          calendarGridIconsCleanupRef.current = null;
        }
        syncButtonInjectedRef.current = false;
      }
    };

    // Initial check immediately
    checkForSchedulePage();

    // Also check after a short delay to catch Angular-rendered content
    const initialDelayTimeout = setTimeout(() => {
      checkForSchedulePage();
    }, 500);

    // Check periodically for navigation changes (also check on DOM mutations)
    const interval = setInterval(() => {
      checkForSchedulePage();
    }, 2000);

    // Also watch for URL changes (SPA navigation)
    const urlChangeObserver = new MutationObserver(() => {
      checkForSchedulePage();
    });

    // Watch for URL changes via popstate
    window.addEventListener('popstate', checkForSchedulePage);

    // Watch for pushstate/replacestate (common in SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(checkForSchedulePage, 100);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkForSchedulePage, 100);
    };

    // Watch DOM changes that might indicate schedule page loaded
    urlChangeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(initialDelayTimeout);
      clearInterval(interval);
      urlChangeObserver.disconnect();
      window.removeEventListener('popstate', checkForSchedulePage);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      // REMOVED: Clean up sync button
      // if (syncButtonCleanupRef.current) {
      //   syncButtonCleanupRef.current();
      //   syncButtonCleanupRef.current = null;
      // }
      // Clean up schedule popup icons
      if (scheduleIconsCleanupRef.current) {
        scheduleIconsCleanupRef.current();
        scheduleIconsCleanupRef.current = null;
      }
      // Clean up calendar grid icons
      if (calendarGridIconsCleanupRef.current) {
        calendarGridIconsCleanupRef.current();
        calendarGridIconsCleanupRef.current = null;
      }
      syncButtonInjectedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Detect and inject branded menu bar
    const detectAndInject = () => {
      // Don't inject if already injected
      if (isInjectedRef.current) {
        return true;
      }

      const editorInfo = detectCKEditor();
      if (editorInfo) {
        // Inject our branded menu bar above the CKEditor toolbar
        const cleanup = injectBrandedMenuBar(editorInfo, BrandedMenuBar);
        if (cleanup) {
          cleanupRef.current = cleanup;
          isInjectedRef.current = true;
          odisLogger.info('Successfully injected branded menu bar');
        }
        return true;
      }
      return false;
    };

    // Try to detect immediately
    if (detectAndInject()) {
      return;
    }

    // If not found, watch for DOM changes
    let timeoutId: number | null = null;
    const observer = new MutationObserver(() => {
      // Debounce the detection to avoid too many calls
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        if (detectAndInject()) {
          observer.disconnect();
        }
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Clean up the injected button
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        isInjectedRef.current = false;
      }
    };
  }, []); // Empty deps - only run once

  // Setup vitals auto-extraction on consultation pages
  useEffect(() => {
    const consultationId = extractConsultationId();

    // Only enable on consultation pages
    if (!consultationId) {
      return;
    }

    odisLogger.info('Setting up vitals auto-extraction for consultation', { consultationId });

    // Wait a bit for the page to fully load
    let cleanup: (() => void) | undefined;
    const timeoutId = window.setTimeout(() => {
      try {
        // Note: case_id would need to be retrieved from your app state
        // For now, we'll pass undefined and store vitals without case linkage
        cleanup = setupVitalsAutoExtraction(undefined, consultationId);
      } catch (error) {
        odisLogger.error('Failed to setup vitals auto-extraction', { error });
      }
    }, 2000); // Wait 2 seconds for page to load

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, []); // Run once on mount

  // Render buttons based on page type
  // - Discharge call button appears in the ODIS menu bar (handled by BrandedMenuBar component)
  // - The template button is injected into the page's CKEditor toolbar
  // - Status icons are injected into the schedule page (handled by setupScheduleIconsObserver and setupCalendarGridIconsObserver)
  return null;
}
