/**
 * Schedule Icons Injector
 *
 * Injects schedule status icons (email/phone) into the appointment popup
 * that appears when clicking on an appointment in the IDEXX schedule page
 */

import { EmailIcon, PhoneIcon, ContactWarningIcon } from '../../components/icons/ScheduleStatusIcons';
import { getSupabaseClient, logger } from '@odis-ai/extension-shared';
import { createRoot } from 'react-dom/client';
import type { CommunicationStatus } from '../../components/icons/ScheduleStatusIcons';
import type { Root } from 'react-dom/client';

const odisLogger = logger.child('[ScheduleIconsInjector]');

interface AppointmentScheduleStatus {
  emailStatus: CommunicationStatus;
  callStatus: CommunicationStatus;
  missingEmail: boolean;
  missingPhone: boolean;
}

/**
 * Map database email status to CommunicationStatus
 */
const mapEmailStatus = (dbStatus: string | null): CommunicationStatus => {
  if (!dbStatus) return 'none';

  switch (dbStatus.toLowerCase()) {
    case 'scheduled':
    case 'pending':
    case 'queued':
      return 'scheduled';
    case 'sent':
      return 'sent';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'none';
  }
};

/**
 * Map database call status to CommunicationStatus
 */
const mapCallStatus = (dbStatus: string | null): CommunicationStatus => {
  if (!dbStatus) return 'none';

  switch (dbStatus.toLowerCase()) {
    case 'scheduled':
    case 'pending':
    case 'queued':
      return 'scheduled';
    case 'completed':
      return 'sent';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'none';
  }
};

// Track active React roots for cleanup
const activeRoots = new Map<HTMLElement, Root>();

/**
 * Fetch scheduling status for a single consultation
 */
const fetchConsultationScheduleStatus = async (consultationId: string): Promise<AppointmentScheduleStatus> => {
  const defaultStatus: AppointmentScheduleStatus = {
    emailStatus: 'none',
    callStatus: 'none',
    missingEmail: false,
    missingPhone: false,
  };

  try {
    const supabase = getSupabaseClient();

    // Find the case by consultation_id stored in metadata
    // The consultation_id is stored in metadata->idexx->consultation_id
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('metadata->idexx->>consultation_id', consultationId)
      .maybeSingle();

    if (caseError || !caseData) {
      odisLogger.debug('No case found for consultation', { consultationId, error: caseError });
      return defaultStatus;
    }

    const caseId = caseData.id;

    // Fetch latest email, call status, and patient contact info in parallel
    const [emailResult, callResult, patientResult] = await Promise.all([
      supabase
        .from('scheduled_discharge_emails')
        .select('id, status')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('scheduled_discharge_calls')
        .select('id, status')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('patients').select('owner_email, owner_phone').eq('case_id', caseId).maybeSingle(),
    ]);

    const emailStatus = mapEmailStatus(emailResult.data?.status || null);
    const callStatus = mapCallStatus(callResult.data?.status || null);

    // Check for missing contact info
    // Only show warning if patient exists but has missing contact info
    // If patient doesn't exist yet (not synced), don't show warning
    const ownerEmail = patientResult.data?.owner_email;
    const ownerPhone = patientResult.data?.owner_phone;
    const hasPatientData = patientResult.data !== null && !patientResult.error;
    const missingEmail = hasPatientData && (!ownerEmail || ownerEmail.trim() === '');
    const missingPhone = hasPatientData && (!ownerPhone || ownerPhone.trim() === '');

    odisLogger.debug('Fetched consultation schedule status', {
      consultationId,
      caseId,
      emailStatus,
      callStatus,
      missingEmail,
      missingPhone,
    });

    return { emailStatus, callStatus, missingEmail, missingPhone };
  } catch (error) {
    odisLogger.error('Error fetching consultation schedule status', { error, consultationId });
    return defaultStatus;
  }
};

/**
 * Extract consultation ID from the popup's "View Consultation" link
 */
const extractConsultationIdFromPopup = (popup: HTMLElement): string | null => {
  // Look for the "View Consultation" link which has href like "consultations/view/722450"
  const viewLink = popup.querySelector('a[href*="consultations/view/"]');
  if (viewLink) {
    const href = viewLink.getAttribute('href');
    const match = href?.match(/consultations\/view\/(\d+)/);
    if (match) {
      return match[1];
    }
  }

  // Fallback: look for appointment_id in various places
  const appointmentLink = popup.querySelector('a[href*="appointment_id="]');
  if (appointmentLink) {
    const href = appointmentLink.getAttribute('href');
    const match = href?.match(/appointment_id=(\d+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
};

/**
 * Inject status icons into the appointment popup
 */
const injectIconsIntoPopup = async (popup: HTMLElement): Promise<void> => {
  const containerClass = 'odis-popup-schedule-icons';

  // Check if icons already injected
  if (popup.querySelector(`.${containerClass}`)) {
    return;
  }

  // Extract consultation ID from popup
  const consultationId = extractConsultationIdFromPopup(popup);
  if (!consultationId) {
    odisLogger.debug('Could not extract consultation ID from popup');
    return;
  }

  odisLogger.info('Injecting schedule status icons into popup', { consultationId });

  // Find the title area (next to the provider name and status pill)
  const titleElement = popup.querySelector('.popover-title');
  if (!titleElement) {
    odisLogger.debug('Could not find popover title element');
    return;
  }

  // Create container for icons - insert before the tab-actions span
  const iconsContainer = document.createElement('span');
  iconsContainer.className = containerClass;
  iconsContainer.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 10px;
    vertical-align: middle;
  `;

  // Find the tab-actions span to insert before it
  const tabActions = titleElement.querySelector('.tab-actions');
  if (tabActions) {
    titleElement.insertBefore(iconsContainer, tabActions);
  } else {
    titleElement.appendChild(iconsContainer);
  }

  // Render loading state first
  const root = createRoot(iconsContainer);
  activeRoots.set(iconsContainer, root);

  root.render(
    <span style={{ display: 'inline-flex', gap: '6px', opacity: 0.5 }}>
      <EmailIcon status="none" size={16} variant="menubar" />
      <PhoneIcon status="none" size={16} variant="menubar" />
    </span>,
  );

  // Fetch actual status
  const status = await fetchConsultationScheduleStatus(consultationId);

  // Re-render with actual status (same variant as consultation page menubar)
  // Warning icons replace the corresponding communication icon position
  root.render(
    <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
      {/* Email position: show warning if missing email, otherwise show email icon */}
      {status.missingEmail ? (
        <ContactWarningIcon missingEmail={true} missingPhone={false} size={16} variant="menubar" />
      ) : (
        <EmailIcon status={status.emailStatus} size={16} variant="menubar" />
      )}
      {/* Phone position: show warning if missing phone, otherwise show phone icon */}
      {status.missingPhone ? (
        <ContactWarningIcon missingEmail={false} missingPhone={true} size={16} variant="menubar" />
      ) : (
        <PhoneIcon status={status.callStatus} size={16} variant="menubar" />
      )}
    </span>,
  );

  odisLogger.info('Schedule status icons injected into popup', { consultationId, ...status });
};

/**
 * Setup observer to inject icons when appointment popup appears
 */
export const setupScheduleIconsObserver = (): (() => void) => {
  let debounceTimeout: number | null = null;

  const handlePopupAppear = () => {
    // Find the appointment popup
    const popup = document.querySelector<HTMLElement>('app-event-popup .ui-popover');
    if (popup) {
      injectIconsIntoPopup(popup).catch(error => {
        odisLogger.error('Error injecting icons into popup', { error });
      });
    }
  };

  const debouncedHandle = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = window.setTimeout(handlePopupAppear, 100);
  };

  // Watch for popup appearing in the DOM
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      // Check added nodes for popup
      const addedNodes = Array.from(mutation.addedNodes);
      for (const node of addedNodes) {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'APP-EVENT-POPUP' || node.querySelector?.('app-event-popup')) {
            debouncedHandle();
            return;
          }
        }
      }
      // Also check if popup content changed (tab switches, etc.)
      if (mutation.target instanceof HTMLElement) {
        const popup = mutation.target.closest('app-event-popup');
        if (popup) {
          debouncedHandle();
          return;
        }
      }
    }
  });

  // Observe the entire body for popup appearance
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check in case popup is already visible
  handlePopupAppear();

  // Return cleanup function
  return () => {
    observer.disconnect();
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    // Cleanup React roots
    activeRoots.forEach(root => {
      try {
        root.unmount();
      } catch {
        // Ignore errors during cleanup
      }
    });
    activeRoots.clear();
  };
};

// Keep old export for backwards compatibility (no-op now)
export const injectScheduleStatusIcons = async (): Promise<void> => {
  // This is now handled by the popup observer
};
