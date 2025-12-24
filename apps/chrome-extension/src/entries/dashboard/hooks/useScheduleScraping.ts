import { getStartOfDay, getEndOfDay, logger, formatErrorMessage } from '@odis-ai/extension/shared';
import { useState } from 'react';

const odisLogger = logger.child('[ODIS-DASHBOARD]');

interface UseScheduleScrapingParams {
  refresh: () => Promise<void>;
}

interface ScrapeResult {
  success: boolean;
  appointmentsFound: number;
  casesCreated: number;
  error?: string;
}

/**
 * Custom hook for handling schedule scraping from IDEXX
 * Sends a message to the IDEXX content script via background script to perform the sync
 */
export const useScheduleScraping = ({ refresh }: UseScheduleScrapingParams) => {
  const [isScrapingSchedule, setIsScrapingSchedule] = useState(false);

  /**
   * Scrape today's schedule from IDEXX and sync to Supabase
   * Sends a message to the IDEXX content script to perform the sync
   */
  const scrapeSchedule = async (): Promise<ScrapeResult> => {
    try {
      setIsScrapingSchedule(true);

      odisLogger.info('scrapeSchedule started');

      // Get today's date range
      const startOfDay = getStartOfDay();
      const endOfDay = getEndOfDay();

      odisLogger.info('Requesting schedule sync via messaging', { startOfDay, endOfDay });

      // Send message to background script, which forwards to IDEXX content script
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_SCHEDULE',
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      });

      // Handle chrome.runtime.lastError (extension context invalidated, etc.)
      if (chrome.runtime.lastError) {
        const errorMessage = formatErrorMessage(
          chrome.runtime.lastError.message,
          'Failed to communicate with extension. Please reload the page.',
        );
        odisLogger.error('Chrome runtime error during schedule sync', {
          error: chrome.runtime.lastError.message,
        });
        return {
          success: false,
          appointmentsFound: 0,
          casesCreated: 0,
          error: errorMessage,
        };
      }

      if (!response || !response.success) {
        const errorMessage = formatErrorMessage(response?.error, 'Failed to sync schedule');
        odisLogger.error('Schedule sync failed', { error: errorMessage, response });
        return {
          success: false,
          appointmentsFound: 0,
          casesCreated: 0,
          error: errorMessage,
        };
      }

      const syncResult = response.result;

      odisLogger.info('Schedule scraped successfully', {
        total: syncResult.total,
        created: syncResult.created,
        updated: syncResult.updated,
        failed: syncResult.failed,
      });

      // Refresh cases to get newly created ones
      await refresh();

      return {
        success: true,
        appointmentsFound: syncResult.total,
        casesCreated: syncResult.created,
      };
    } catch (err) {
      odisLogger.error('Failed to scrape schedule', { error: err });
      const errorMessage = formatErrorMessage(err, 'Failed to scrape schedule');
      return {
        success: false,
        appointmentsFound: 0,
        casesCreated: 0,
        error: errorMessage,
      };
    } finally {
      setIsScrapingSchedule(false);
    }
  };

  return {
    scrapeSchedule,
    isScrapingSchedule,
  };
};
