import { initAppWithShadow, logger, formatErrorMessage } from '@odis-ai/extension/shared';
import './index.css';
import App from './App';
import { reconcileCaseNotes } from './utils/sync/notes-reconciliation';
import { syncScheduleFromApi } from './utils/sync/schedule-sync';

const odisLogger = logger.child('[ODIS-IDEXX]');

// Safety timeout for message handler (90 seconds)
// This ensures we always send a response even if the sync hangs
const MESSAGE_HANDLER_TIMEOUT_MS = 90000;

// Note: We use a shadow DOM for isolation, but the CKEditor button
// will be injected outside the shadow DOM into the actual page
initAppWithShadow({ id: 'CEB-extension-idexx', app: <App /> });

// Listen for schedule sync requests from dashboard or other extension contexts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_SCHEDULE') {
    const { startDate, endDate } = message;
    const messageStartTime = Date.now();
    let responseSent = false;

    // Helper to safely send response only once
    const safeSendResponse = (response: unknown) => {
      if (!responseSent) {
        responseSent = true;
        const elapsed = Date.now() - messageStartTime;
        odisLogger.info('🟡 Sending response', {
          success: (response as { success?: boolean })?.success,
          elapsedMs: elapsed,
        });
        sendResponse(response);
      } else {
        odisLogger.warn('🟡 Attempted to send response multiple times, ignoring');
      }
    };

    odisLogger.info('🟡 Message handler: SYNC_SCHEDULE received', {
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      currentHostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      senderUrl: sender.url,
      senderTabId: sender.tab?.id,
      senderFrameId: sender.frameId,
      hasDocument: typeof document !== 'undefined',
      documentLocation: typeof document !== 'undefined' ? document.location?.href : 'N/A',
      documentOrigin: typeof document !== 'undefined' ? document.location?.origin : 'N/A',
      documentHostname: typeof document !== 'undefined' ? document.location?.hostname : 'N/A',
      safetyTimeoutMs: MESSAGE_HANDLER_TIMEOUT_MS,
    });

    // Safety timeout - ensures we always send a response
    const safetyTimeoutId = setTimeout(() => {
      if (!responseSent) {
        const elapsed = Date.now() - messageStartTime;
        odisLogger.error('🔴 Message handler safety timeout reached', {
          elapsedMs: elapsed,
          timeoutMs: MESSAGE_HANDLER_TIMEOUT_MS,
        });
        safeSendResponse({
          success: false,
          error: `Schedule sync timed out after ${Math.round(elapsed / 1000)} seconds. The sync may still be running in the background. Please check the console for more details.`,
        });
      }
    }, MESSAGE_HANDLER_TIMEOUT_MS);

    // Convert ISO strings back to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    odisLogger.info('🟡 Calling syncScheduleFromApi...', {
      start: start.toISOString(),
      end: end.toISOString(),
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - messageStartTime,
    });

    // Perform the sync (now includes clinical notes)
    syncScheduleFromApi(start, end)
      .then(result => {
        clearTimeout(safetyTimeoutId);
        const elapsed = Date.now() - messageStartTime;
        odisLogger.info('✅ Schedule sync completed successfully', {
          total: result.total,
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          patientsCreated: result.patientsCreated,
          patientsUpdated: result.patientsUpdated,
          notesReconciled: result.notesReconciled,
          notesFailed: result.notesFailed,
          errorsCount: result.errors.length,
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
        });
        safeSendResponse({ success: true, result });
      })
      .catch(error => {
        clearTimeout(safetyTimeoutId);
        const elapsed = Date.now() - messageStartTime;
        odisLogger.error('❌ Schedule sync failed', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
        });
        safeSendResponse({
          success: false,
          error: formatErrorMessage(error, 'Failed to sync schedule'),
        });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }

  // Handle notes reconciliation requests
  if (message.type === 'RECONCILE_NOTES') {
    const { startDate, endDate } = message;
    const messageStartTime = Date.now();
    let responseSent = false;

    // Helper to safely send response only once
    const safeSendResponse = (response: unknown) => {
      if (!responseSent) {
        responseSent = true;
        const elapsed = Date.now() - messageStartTime;
        odisLogger.info('🟡 Sending reconciliation response', {
          success: (response as { success?: boolean })?.success,
          elapsedMs: elapsed,
        });
        sendResponse(response);
      } else {
        odisLogger.warn('🟡 Attempted to send response multiple times, ignoring');
      }
    };

    odisLogger.info('🟡 Message handler: RECONCILE_NOTES received', {
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    });

    // Safety timeout - ensures we always send a response
    const safetyTimeoutId = setTimeout(() => {
      if (!responseSent) {
        const elapsed = Date.now() - messageStartTime;
        odisLogger.error('🔴 Reconciliation safety timeout reached', {
          elapsedMs: elapsed,
          timeoutMs: MESSAGE_HANDLER_TIMEOUT_MS,
        });
        safeSendResponse({
          success: false,
          error: `Notes reconciliation timed out after ${Math.round(elapsed / 1000)} seconds.`,
        });
      }
    }, MESSAGE_HANDLER_TIMEOUT_MS);

    // Convert ISO strings back to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    odisLogger.info('🟡 Calling reconcileCaseNotes...', {
      start: start.toISOString(),
      end: end.toISOString(),
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - messageStartTime,
    });

    // Perform the reconciliation
    reconcileCaseNotes({
      startDate: start,
      endDate: end,
      skipAlreadyReconciled: true,
    })
      .then(result => {
        clearTimeout(safetyTimeoutId);
        const elapsed = Date.now() - messageStartTime;
        odisLogger.info('✅ Notes reconciliation completed successfully', {
          totalCases: result.totalCases,
          reconciledCount: result.reconciledCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
        });
        safeSendResponse({ success: true, ...result });
      })
      .catch(error => {
        clearTimeout(safetyTimeoutId);
        const elapsed = Date.now() - messageStartTime;
        odisLogger.error('❌ Notes reconciliation failed', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
        });
        safeSendResponse({
          success: false,
          error: formatErrorMessage(error, 'Failed to reconcile notes'),
        });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }

  // Return false for unhandled messages
  return false;
});
