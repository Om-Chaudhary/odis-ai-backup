/**
 * Calendar Grid Icons Injector
 *
 * Injects email/phone status icons into each appointment block in the IDEXX calendar grid.
 * Icons are positioned in the bottom-left corner of each appointment block.
 * Icons are ALWAYS shown on appointment blocks.
 *
 * Status colors:
 * - Gray outline: No communication scheduled (default state)
 * - Black filled: Communication scheduled/pending
 * - Green filled: Communication sent/completed
 * - Red filled: Communication failed
 */

import { CalendarGridStatusIcons } from '../../components/icons/ScheduleStatusIcons';
import { batchGetAppointmentStatuses, clearStatusCache } from '../../services/appointment-status-fetcher';
import { logger } from '@odis-ai/extension/shared';
import { createRoot } from 'react-dom/client';
import type { AppointmentCommunicationStatus } from '../../services/appointment-status-fetcher';
import type { Root } from 'react-dom/client';

const odisLogger = logger.child('[CalendarGridIcons]');

// Container class for injected icons
const ICONS_CONTAINER_CLASS = 'odis-calendar-grid-icons';

// Track active React roots for cleanup
const activeRoots = new Map<HTMLElement, Root>();

// Track which appointment blocks have been processed
const processedBlocks = new Set<string>();

// Debounce timer for batch processing
let batchDebounceTimer: number | null = null;
const BATCH_DEBOUNCE_MS = 300;

// Queue of blocks waiting to be processed
const pendingBlocks: HTMLElement[] = [];

/**
 * Extract appointment ID from an appointment block element
 * The ID is stored in the element's id attribute, e.g., "appointment_id_347700"
 */
const extractAppointmentIdFromBlock = (block: HTMLElement): string | null => {
  const id = block.id || block.getAttribute('id');
  if (!id) return null;

  // Match pattern: appointment_id_XXXXX
  const match = id.match(/appointment_id_(\d+)/);
  return match ? match[1] : null;
};

/**
 * Check if an appointment block is a "no show" case
 * Checks for common CSS class patterns used by IDEXX to indicate no-show status
 */
const isNoShowAppointment = (block: HTMLElement): boolean => {
  const classNames = block.className.toLowerCase();
  const statusText = block.getAttribute('data-status')?.toLowerCase() || '';

  // Check for common no-show class patterns
  const noShowPatterns = ['no-show', 'noshow', 'no_show', 'ns-status', 'status-ns', 'status-noshow'];

  for (const pattern of noShowPatterns) {
    if (classNames.includes(pattern) || statusText.includes(pattern)) {
      return true;
    }
  }

  // Also check for status text content within the block that might indicate no-show
  const statusElement = block.querySelector('.status, [class*="status"]');
  const statusContent = statusElement?.textContent?.toLowerCase().trim() || '';
  if (statusContent === 'no show' || statusContent === 'no-show' || statusContent === 'noshow') {
    return true;
  }

  return false;
};

/**
 * Inject icons into a single appointment block
 * Always injects icons - shows black when scheduled, gray outline when not
 */
const injectIconsIntoBlock = async (block: HTMLElement, status: AppointmentCommunicationStatus): Promise<void> => {
  // Check if icons already injected
  if (block.querySelector(`.${ICONS_CONTAINER_CLASS}`)) {
    return;
  }

  // Ensure the block has position: relative for absolute positioning of icons
  const currentPosition = window.getComputedStyle(block).position;
  if (currentPosition === 'static') {
    block.style.position = 'relative';
  }

  // Create container for icons
  const iconsContainer = document.createElement('span');
  iconsContainer.className = ICONS_CONTAINER_CLASS;
  iconsContainer.style.cssText = `
    position: absolute;
    bottom: -8px;
    left: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
    pointer-events: none;
  `;

  // Append to block
  block.appendChild(iconsContainer);

  // Render React component - always shows icons (black when scheduled, gray when not)
  const root = createRoot(iconsContainer);
  activeRoots.set(iconsContainer, root);

  root.render(
    <CalendarGridStatusIcons
      emailStatus={status.emailStatus}
      callStatus={status.callStatus}
      missingEmail={status.missingEmail}
      missingPhone={status.missingPhone}
      isUrgent={status.isUrgent}
      urgentReason={status.urgentReason}
      iconSize={14}
      alwaysShow={true}
    />,
  );
};

/**
 * Process a batch of appointment blocks
 */
const processBatch = async (blocks: HTMLElement[]): Promise<void> => {
  if (blocks.length === 0) return;

  // Extract appointment IDs and filter out already processed ones
  const blockMap = new Map<string, HTMLElement>();
  const appointmentIds: string[] = [];

  for (const block of blocks) {
    const appointmentId = extractAppointmentIdFromBlock(block);
    if (!appointmentId) continue;

    // Skip if already processed
    if (processedBlocks.has(appointmentId)) continue;

    // Skip no-show appointments - don't display icons for them
    if (isNoShowAppointment(block)) {
      processedBlocks.add(appointmentId); // Mark as processed to avoid re-checking
      odisLogger.debug('Skipping no-show appointment', { appointmentId });
      continue;
    }

    blockMap.set(appointmentId, block);
    appointmentIds.push(appointmentId);
    processedBlocks.add(appointmentId);
  }

  if (appointmentIds.length === 0) return;

  odisLogger.debug('Processing batch of appointment blocks', { count: appointmentIds.length });

  try {
    // Batch fetch statuses
    const statuses = await batchGetAppointmentStatuses(appointmentIds);

    // Inject icons into each block
    for (const [appointmentId, block] of blockMap) {
      const status = statuses.get(appointmentId);
      if (status) {
        await injectIconsIntoBlock(block, status);
      }
    }
  } catch (error) {
    odisLogger.error('Error processing batch', { error });
  }
};

/**
 * Queue a block for batch processing
 */
const queueBlockForProcessing = (block: HTMLElement): void => {
  pendingBlocks.push(block);

  // Debounce batch processing
  if (batchDebounceTimer) {
    clearTimeout(batchDebounceTimer);
  }

  batchDebounceTimer = window.setTimeout(() => {
    const blocksToProcess = [...pendingBlocks];
    pendingBlocks.length = 0;
    batchDebounceTimer = null;
    processBatch(blocksToProcess);
  }, BATCH_DEBOUNCE_MS);
};

/**
 * Find all appointment blocks currently in the DOM
 */
const findAllAppointmentBlocks = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('.appointment-block[id^="appointment_id_"]'));

/**
 * Process all appointment blocks currently visible
 */
const processAllVisibleBlocks = async (): Promise<void> => {
  const blocks = findAllAppointmentBlocks();
  odisLogger.debug('Found appointment blocks', { count: blocks.length });

  if (blocks.length === 0) return;

  // Queue all blocks for batch processing
  for (const block of blocks) {
    queueBlockForProcessing(block);
  }
};

/**
 * Setup MutationObserver to watch for new appointment blocks
 */
export const setupCalendarGridIconsObserver = (): (() => void) => {
  odisLogger.info('Setting up calendar grid icons observer');

  // Reset state
  processedBlocks.clear();
  clearStatusCache();

  // Process initially visible blocks
  processAllVisibleBlocks();

  // Observer to detect new appointment blocks
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      // Check added nodes for appointment blocks
      const addedNodes = Array.from(mutation.addedNodes);
      for (const node of addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        // Check if this node is an appointment block
        if (node.classList?.contains('appointment-block') && node.id?.startsWith('appointment_id_')) {
          queueBlockForProcessing(node);
        }

        // Check descendants for appointment blocks
        const descendantBlocks = node.querySelectorAll?.<HTMLElement>('.appointment-block[id^="appointment_id_"]');
        if (descendantBlocks) {
          const blocks = Array.from(descendantBlocks);
          for (const block of blocks) {
            queueBlockForProcessing(block);
          }
        }
      }

      // Also check if the calendar container was updated (e.g., date navigation)
      if (
        mutation.target instanceof HTMLElement &&
        (mutation.target.classList?.contains('fc-timegrid-body') ||
          mutation.target.classList?.contains('fc-timegrid-col-events') ||
          mutation.target.closest('full-calendar'))
      ) {
        // Re-scan for new blocks
        processAllVisibleBlocks();
      }
    }
  });

  // Observe the entire body for calendar changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Return cleanup function
  return () => {
    odisLogger.debug('Cleaning up calendar grid icons observer');

    // Disconnect observer
    observer.disconnect();

    // Cancel pending batch
    if (batchDebounceTimer) {
      clearTimeout(batchDebounceTimer);
      batchDebounceTimer = null;
    }
    pendingBlocks.length = 0;

    // Unmount all React roots
    activeRoots.forEach((root, container) => {
      try {
        root.unmount();
        container.remove();
      } catch {
        // Ignore errors during cleanup
      }
    });
    activeRoots.clear();

    // Clear processed blocks tracking
    processedBlocks.clear();

    // Remove all injected icon containers
    document.querySelectorAll(`.${ICONS_CONTAINER_CLASS}`).forEach(el => el.remove());

    // Clear status cache
    clearStatusCache();
  };
};

/**
 * Manually refresh icons for all visible appointment blocks
 * Call this after a sync operation or when status may have changed
 */
export const refreshCalendarGridIcons = async (): Promise<void> => {
  odisLogger.info('Refreshing calendar grid icons');

  // Clear caches
  processedBlocks.clear();
  clearStatusCache();

  // Remove existing icons
  document.querySelectorAll(`.${ICONS_CONTAINER_CLASS}`).forEach(el => el.remove());

  // Unmount existing React roots
  activeRoots.forEach(root => {
    try {
      root.unmount();
    } catch {
      // Ignore
    }
  });
  activeRoots.clear();

  // Re-process all blocks
  await processAllVisibleBlocks();
};
