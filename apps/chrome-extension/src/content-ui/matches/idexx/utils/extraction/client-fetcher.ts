import { logger } from '@odis-ai/extension-shared';

const odisLogger = logger.child('[ODIS]');

/**
 * IDEXX Neo Client API Fetcher
 * Fetches detailed client/owner contact information including phone numbers
 */

/**
 * Client contact information from IDEXX API
 * Contains multiple phone number fields (home, mobile, work)
 */
export interface IdexxClientContactData {
  id: number;
  firstName: string;
  lastName: string;

  // Phone numbers - multiple types
  homePhone?: string | null;
  mobilePhone?: string | null;
  workPhone?: string | null;
  phone?: string | null; // Generic phone field (fallback)
  phoneNumber?: string | null; // Alternative field name

  // Email
  email?: string | null;

  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  // Additional fields that might be present
  title?: string;
  taxExempt?: boolean;
  preferredContactMethod?: 'phone' | 'email' | 'sms' | string;

  // Unknown additional fields
  [key: string]: unknown;
}

/**
 * Result of client data fetch with metadata
 */
export interface ClientFetchResult {
  success: boolean;
  data?: IdexxClientContactData;
  error?: string;
  endpoint?: string; // Which endpoint succeeded
}

/**
 * Fetch client contact data from IDEXX Neo API
 * Tries multiple endpoint patterns to find the correct one
 *
 * @param clientId - The IDEXX client ID
 * @returns Client contact data with all phone numbers
 */
export const fetchClientContactData = async (clientId: number | string): Promise<ClientFetchResult> => {
  odisLogger.info('Fetching client contact data...', { clientId });

  // Check if we're running in a chrome-extension context
  // This function only works when running on the IDEXX website
  if (typeof window !== 'undefined' && window.location.origin.startsWith('chrome-extension://')) {
    const errorMsg = 'Cannot fetch client data from chrome-extension context - requires IDEXX website';
    odisLogger.warn('⚠️', { error: errorMsg, origin: window.location.origin });
    return {
      success: false,
      error: errorMsg,
    };
  }

  const baseUrl = window.location.origin;

  // Try multiple endpoint patterns (IDEXX might use any of these)
  const endpointPatterns = [
    `/clients/${clientId}/page-data`,
    `/clients/${clientId}`,
    `/clients/view/${clientId}/data`,
    `/clients/${clientId}/data`,
    `/client/${clientId}`, // Singular variant
  ];

  // Try each endpoint pattern
  for (const pattern of endpointPatterns) {
    const url = `${baseUrl}${pattern}`;

    odisLogger.debug('Trying client API endpoint', { url });

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Use browser session
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      // If we get a 200, this is the correct endpoint
      if (response.ok) {
        const data = await response.json();

        odisLogger.info('✅ Client data fetched successfully', { endpoint: pattern });
        odisLogger.debug('📞 Raw client response', { data });

        return {
          success: true,
          data: data as IdexxClientContactData,
          endpoint: pattern,
        };
      }

      // Log non-success responses
      odisLogger.warn(`⚠️ Endpoint returned non-200 status`, { endpoint: pattern, status: response.status });
    } catch (error) {
      odisLogger.warn(`⚠️ Endpoint failed`, { endpoint: pattern, error });
      // Continue to next endpoint
    }
  }

  // If we get here, none of the endpoints worked
  const errorMsg = 'Could not fetch client data - no valid endpoint found';
  odisLogger.error('❌', { error: errorMsg });

  return {
    success: false,
    error: errorMsg,
  };
};

/**
 * Extract best phone number from client data
 * Priority: Mobile > Home > Work > Any available
 *
 * @param clientData - Client contact data
 * @returns Best phone number and its type
 */
export const selectBestPhoneNumber = (
  clientData: IdexxClientContactData,
): {
  phone: string | null;
  type: 'mobile' | 'home' | 'work' | 'other' | null;
} => {
  // Priority 1: Mobile phone (best for calls)
  if (clientData.mobilePhone) {
    odisLogger.debug('📱 Using mobile phone');
    return { phone: clientData.mobilePhone, type: 'mobile' };
  }

  // Priority 2: Home phone
  if (clientData.homePhone) {
    odisLogger.debug('🏠 Using home phone');
    return { phone: clientData.homePhone, type: 'home' };
  }

  // Priority 3: Work phone
  if (clientData.workPhone) {
    odisLogger.debug('💼 Using work phone');
    return { phone: clientData.workPhone, type: 'work' };
  }

  // Priority 4: Generic phone field (fallback)
  if (clientData.phone) {
    odisLogger.debug('📞 Using generic phone field');
    return { phone: clientData.phone, type: 'other' };
  }

  // Priority 5: Alternative phone field name
  if (clientData.phoneNumber) {
    odisLogger.debug('📞 Using phoneNumber field');
    return { phone: clientData.phoneNumber, type: 'other' };
  }

  odisLogger.warn('⚠️ No phone number found in client data');
  return { phone: null, type: null };
};

/**
 * Get all available phone numbers from client data
 * Useful for displaying options or fallbacks
 */
export const getAllPhoneNumbers = (
  clientData: IdexxClientContactData,
): Array<{
  phone: string;
  type: 'mobile' | 'home' | 'work' | 'other';
  label: string;
}> => {
  const phones: Array<{ phone: string; type: 'mobile' | 'home' | 'work' | 'other'; label: string }> = [];

  if (clientData.mobilePhone) {
    phones.push({ phone: clientData.mobilePhone, type: 'mobile', label: 'Mobile' });
  }

  if (clientData.homePhone) {
    phones.push({ phone: clientData.homePhone, type: 'home', label: 'Home' });
  }

  if (clientData.workPhone) {
    phones.push({ phone: clientData.workPhone, type: 'work', label: 'Work' });
  }

  if (clientData.phone && !phones.some(p => p.phone === clientData.phone)) {
    phones.push({ phone: clientData.phone, type: 'other', label: 'Phone' });
  }

  return phones;
};

/**
 * Fetch and select best phone number for a client
 * Convenience function that combines fetch + select
 */
export const fetchClientPhoneNumber = async (
  clientId: number | string,
): Promise<{
  phone: string | null;
  type: 'mobile' | 'home' | 'work' | 'other' | null;
  error?: string;
}> => {
  const result = await fetchClientContactData(clientId);

  if (!result.success || !result.data) {
    return { phone: null, type: null, error: result.error };
  }

  const { phone, type } = selectBestPhoneNumber(result.data);
  return { phone, type };
};
