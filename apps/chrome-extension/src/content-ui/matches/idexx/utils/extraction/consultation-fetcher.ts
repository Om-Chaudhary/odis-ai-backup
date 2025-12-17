import { logger } from '@odis-ai/extension-shared';
import type { IdexxConsultationPageData } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * Extract consultation ID from current URL
 * URL format: https://us.idexxneo.com/consultations/view/310382
 */
export const extractConsultationId = (url: string = window.location.href): string | null => {
  // Match both /consultations/view/[id] and /consultations/[id] patterns
  const match = url.match(/\/consultations\/(?:view\/)?(\d+)/);
  return match ? match[1] : null;
};

/**
 * Check if current page is a consultation page
 */
export const isConsultationPage = (): boolean => extractConsultationId() !== null;

/**
 * Fetch consultation page data from IDEXX Neo API
 * This fetches detailed consultation info including discharge summaries
 */
export const fetchConsultationData = async (consultationId: string): Promise<IdexxConsultationPageData> => {
  odisLogger.info('Fetching consultation data from IDEXX Neo...', { consultationId });

  try {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/consultations/${consultationId}/page-data`;

    odisLogger.debug('API Request', { url });

    // Fetch with credentials to use browser session
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies for IDEXX authentication
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`IDEXX API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as IdexxConsultationPageData;

    odisLogger.info('✅ Consultation data fetched successfully');
    odisLogger.debug('📞 Client data inspection', {
      clientId: data.client?.id,
      firstName: data.client?.firstName,
      lastName: data.client?.lastName,
      phone: data.client?.phone,
      email: data.client?.email,
      allClientFields: Object.keys(data.client || {}),
      fullClientObject: data.client,
    });

    // Log products/services data
    odisLogger.debug('🛒 Products/Services inspection', {
      hasConsultationLines: !!data.consultationLines,
      linesCount: data.consultationLines?.length || 0,
      lines: data.consultationLines,
      allRootFields: Object.keys(data),
    });

    // Validate required fields
    if (!data.patient) {
      throw new Error('Invalid response: missing patient data');
    }

    if (!data.client) {
      throw new Error('Invalid response: missing client data');
    }

    if (!data.pageData || !data.pageData.providers) {
      throw new Error('Invalid response: missing providers data');
    }

    return data;
  } catch (error) {
    odisLogger.error('❌ Failed to fetch consultation data', { error });
    throw new Error(`Failed to fetch consultation data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch consultation data for current page
 * Convenience function that extracts ID from URL and fetches data
 */
export const fetchCurrentConsultationData = async (): Promise<IdexxConsultationPageData | null> => {
  const consultationId = extractConsultationId();

  if (!consultationId) {
    odisLogger.warn('Not on a consultation page');
    return null;
  }

  try {
    return await fetchConsultationData(consultationId);
  } catch (error) {
    odisLogger.error('Failed to fetch current consultation data', { error });
    return null;
  }
};

/**
 * Test if we can access the consultation API
 * Useful for debugging IDEXX session and permissions
 */
export const testConsultationApiAccess = async (): Promise<boolean> => {
  const consultationId = extractConsultationId();

  if (!consultationId) {
    odisLogger.debug('Cannot test API - not on consultation page');
    return false;
  }

  try {
    await fetchConsultationData(consultationId);
    odisLogger.info('✅ Consultation API access confirmed');
    return true;
  } catch (error) {
    odisLogger.error('❌ Consultation API access failed', { error });
    return false;
  }
};
