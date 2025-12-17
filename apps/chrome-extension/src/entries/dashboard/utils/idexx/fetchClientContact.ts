import { scrapeClientPhoneFromPage } from '../../../../content-ui/matches/idexx/utils/dom/client-dom-scraper';
import { scrapeClientEmailFromPage } from '../../../../content-ui/matches/idexx/utils/dom/client-email-scraper';
import { fetchClientPhoneNumber } from '../../../../content-ui/matches/idexx/utils/extraction/client-fetcher';
import { logger } from '@odis-ai/extension-shared';

const odisLogger = logger.child('[ODIS-DASHBOARD]');

/**
 * Result of fetching client contact information
 */
export interface ClientContactResult {
  phone: string | null;
  email: string | null;
  phoneType: 'mobile' | 'home' | 'work' | 'other' | null;
  error?: string;
}

/**
 * Fetch client contact information (phone and email) for a client ID
 * Uses multiple fallback strategies: API → DOM scraping
 *
 * @param clientId - The IDEXX client ID
 * @returns Client contact information with phone and email
 */
export const fetchClientContact = async (clientId: number | string): Promise<ClientContactResult> => {
  odisLogger.info('Fetching client contact information...', { clientId });

  // Check if we're running in a chrome-extension context (dashboard)
  // Client contact fetching only works when running on the IDEXX website
  if (typeof window !== 'undefined' && window.location.origin.startsWith('chrome-extension://')) {
    odisLogger.warn('⚠️ Cannot fetch client contact info from dashboard - requires IDEXX website context', {
      clientId,
      origin: window.location.origin,
    });
    return {
      phone: null,
      email: null,
      phoneType: null,
      error:
        'Client contact fetching requires IDEXX website context. Contact info should already be stored in case metadata.',
    };
  }

  let phone: string | null = null;
  let email: string | null = null;
  let phoneType: 'mobile' | 'home' | 'work' | 'other' | null = null;
  let error: string | undefined;

  try {
    // Strategy 1: Try API for phone number
    try {
      const phoneResult = await fetchClientPhoneNumber(clientId);
      if (phoneResult.phone) {
        phone = phoneResult.phone;
        phoneType = phoneResult.type;
        odisLogger.debug('✅ Phone fetched from API', { phone, type: phoneType });
      }
    } catch (apiError) {
      odisLogger.debug('API phone fetch failed, trying DOM scraping', { error: apiError });
    }

    // Strategy 2: Try DOM scraping for phone if API didn't work
    if (!phone) {
      try {
        const scrapedPhone = await scrapeClientPhoneFromPage(clientId);
        if (scrapedPhone.phone) {
          phone = scrapedPhone.phone;
          phoneType = scrapedPhone.type;
          odisLogger.debug('✅ Phone scraped from DOM', { phone, type: phoneType });
        }
      } catch (scrapeError) {
        odisLogger.debug('DOM phone scrape failed', { error: scrapeError });
      }
    }

    // Strategy 3: Try DOM scraping for email
    try {
      const scrapedEmail = await scrapeClientEmailFromPage(clientId);
      if (scrapedEmail.email) {
        email = scrapedEmail.email;
        odisLogger.debug('✅ Email scraped from DOM', { email });
      }
    } catch (scrapeError) {
      odisLogger.debug('DOM email scrape failed', { error: scrapeError });
    }

    // If we got at least one piece of contact info, consider it a success
    if (phone || email) {
      odisLogger.info('✅ Client contact information fetched', {
        clientId,
        hasPhone: !!phone,
        hasEmail: !!email,
      });
    } else {
      error = 'No contact information found';
      odisLogger.warn('⚠️ No contact information found for client', { clientId });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    odisLogger.error('❌ Failed to fetch client contact information', { clientId, error: err });
  }

  return {
    phone,
    email,
    phoneType,
    error,
  };
};

/**
 * Fetch only phone number for a client
 * Convenience function that returns just the phone
 */
export const fetchClientPhone = async (
  clientId: number | string,
): Promise<{ phone: string | null; type: 'mobile' | 'home' | 'work' | 'other' | null }> => {
  const result = await fetchClientContact(clientId);
  return { phone: result.phone, type: result.phoneType };
};

/**
 * Fetch only email for a client
 * Convenience function that returns just the email
 */
export const fetchClientEmail = async (clientId: number | string): Promise<string | null> => {
  const result = await fetchClientContact(clientId);
  return result.email;
};
