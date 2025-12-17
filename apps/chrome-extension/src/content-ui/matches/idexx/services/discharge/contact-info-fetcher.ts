import { scrapeClientPhoneFromPage } from '../../utils/dom/client-dom-scraper';
import { scrapeClientEmailFromPage } from '../../utils/dom/client-email-scraper';
import { fetchClientPhoneNumber } from '../../utils/extraction/client-fetcher';
import { logger } from '@odis-ai/extension-shared';
import type { IdexxConsultationPageData } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * Fetch contact information (phone and email) for a consultation
 * Uses multiple fallback strategies: consultation data → API → DOM scraping
 */
export const fetchContactInfo = async (
  consultationData: IdexxConsultationPageData,
  maxRetries = 3,
  delayMs = 1000,
): Promise<{ phone: string; email: string }> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let phone =
      consultationData.client.mobilePhone ||
      consultationData.client.homePhone ||
      consultationData.client.phone ||
      consultationData.client.workPhone ||
      '';
    let email = consultationData.client.email || '';

    if (phone && email) return { phone, email };

    // Try client API if we have client ID
    if (consultationData.client.id && !phone) {
      try {
        const clientPhoneResult = await fetchClientPhoneNumber(consultationData.client.id);
        if (clientPhoneResult.phone) phone = clientPhoneResult.phone;
      } catch (err) {
        odisLogger.error('Failed to fetch phone', { error: err });
      }
    }

    // Try DOM scraping if still no phone
    if (consultationData.client.id && !phone) {
      try {
        const scrapedResult = await scrapeClientPhoneFromPage(consultationData.client.id);
        if (scrapedResult.phone) phone = scrapedResult.phone;
      } catch (err) {
        odisLogger.error('Failed to scrape phone', { error: err });
      }
    }

    // Try DOM scraping if still no email
    if (consultationData.client.id && !email) {
      try {
        const scrapedResult = await scrapeClientEmailFromPage(consultationData.client.id);
        if (scrapedResult.email) email = scrapedResult.email;
      } catch (err) {
        odisLogger.error('Failed to scrape email', { error: err });
      }
    }

    if (phone || email) return { phone, email };
    if (attempt < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return { phone: '', email: '' };
};
