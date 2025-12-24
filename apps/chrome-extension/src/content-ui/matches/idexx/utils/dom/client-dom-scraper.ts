import { logger } from '@odis-ai/extension/shared';

const odisLogger = logger.child('[ODIS]');

/**
 * IDEXX Neo Client DOM Scraper
 * Fallback method to extract phone numbers by scraping the client page HTML
 * Used when API endpoints don't return phone data
 */

/**
 * Fetch and parse client page HTML to extract phone numbers
 * This navigates to /clients/view/{clientId} and scrapes the DOM
 */
const scrapeClientPhoneFromPage = async (
  clientId: number | string,
): Promise<{
  phone: string | null;
  type: 'mobile' | 'home' | 'work' | 'other' | null;
  error?: string;
}> => {
  odisLogger.info('📄 Attempting to scrape client phone from HTML page...', { clientId });

  try {
    const baseUrl = window.location.origin;
    const clientPageUrl = `${baseUrl}/clients/view/${clientId}`;

    odisLogger.debug('Fetching client page', { url: clientPageUrl });

    // Fetch the client page HTML
    const response = await fetch(clientPageUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch client page: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML into a DOM document
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    odisLogger.debug('📄 Client page HTML fetched and parsed');

    // Strategy 1: Look for labeled phone fields
    // Example HTML structure from screenshot:
    // <div>
    //   <label>Home No:</label>
    //   <input value="408-838-0314" />
    // </div>

    // Try to find phone fields by label text
    const phonePatterns = [
      { label: /Mobile\s*No\.?:?/i, type: 'mobile' as const, priority: 1 },
      { label: /Cell\s*Phone:?/i, type: 'mobile' as const, priority: 1 },
      { label: /Mobile\s*Phone:?/i, type: 'mobile' as const, priority: 1 },
      { label: /Home\s*No\.?:?/i, type: 'home' as const, priority: 2 },
      { label: /Home\s*Phone:?/i, type: 'home' as const, priority: 2 },
      { label: /Work\s*No\.?:?/i, type: 'work' as const, priority: 3 },
      { label: /Work\s*Phone:?/i, type: 'work' as const, priority: 3 },
      { label: /Phone:?/i, type: 'other' as const, priority: 4 },
    ];

    const foundPhones: Array<{ phone: string; type: 'mobile' | 'home' | 'work' | 'other'; priority: number }> = [];

    // Search for phone numbers by label
    for (const pattern of phonePatterns) {
      // Find all text nodes and elements containing the label
      const allElements = Array.from(doc.querySelectorAll('*'));

      for (const element of allElements) {
        const text = element.textContent?.trim() || '';

        if (pattern.label.test(text)) {
          odisLogger.debug('📄 Found potential phone label', { label: text });

          // Look for input fields nearby (next sibling, parent's children, etc.)
          const inputs = findNearbyInputs(element);

          for (const input of inputs) {
            const value = (input as HTMLInputElement).value?.trim();

            if (value && isValidPhoneNumber(value)) {
              odisLogger.info(`✅ Found ${pattern.type} phone`, { phone: value, type: pattern.type });
              foundPhones.push({
                phone: value,
                type: pattern.type,
                priority: pattern.priority,
              });
            }
          }
        }
      }
    }

    // Strategy 2: Look for input fields with name/id containing "phone"
    if (foundPhones.length === 0) {
      const phoneInputs = Array.from(doc.querySelectorAll('input[name*="phone" i], input[id*="phone" i]'));

      for (const input of phoneInputs) {
        const value = (input as HTMLInputElement).value?.trim();
        const name = (input as HTMLInputElement).name?.toLowerCase() || '';
        const id = (input as HTMLInputElement).id?.toLowerCase() || '';

        if (value && isValidPhoneNumber(value)) {
          let type: 'mobile' | 'home' | 'work' | 'other' = 'other';
          let priority = 4;

          if (name.includes('mobile') || id.includes('mobile') || name.includes('cell') || id.includes('cell')) {
            type = 'mobile';
            priority = 1;
          } else if (name.includes('home') || id.includes('home')) {
            type = 'home';
            priority = 2;
          } else if (name.includes('work') || id.includes('work')) {
            type = 'work';
            priority = 3;
          }

          odisLogger.info(`✅ Found ${type} phone from input field`, { phone: value, type });
          foundPhones.push({ phone: value, type, priority });
        }
      }
    }

    // Sort by priority (mobile first)
    foundPhones.sort((a, b) => a.priority - b.priority);

    if (foundPhones.length > 0) {
      const best = foundPhones[0];
      odisLogger.info('✅ Selected best phone', { phone: best.phone, type: best.type });
      return { phone: best.phone, type: best.type };
    }

    odisLogger.warn('⚠️ No phone numbers found in client page HTML');
    return { phone: null, type: null, error: 'No phone numbers found in page' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    odisLogger.error('❌ Failed to scrape client phone from page', { error });
    return { phone: null, type: null, error: errorMsg };
  }
};

/**
 * Find input elements near a label element
 */
const findNearbyInputs = (element: Element): HTMLInputElement[] => {
  const inputs: HTMLInputElement[] = [];

  // Check next sibling
  const nextSibling = element.nextElementSibling;
  if (nextSibling && nextSibling.tagName === 'INPUT') {
    inputs.push(nextSibling as HTMLInputElement);
  }

  // Check parent's children
  const parent = element.parentElement;
  if (parent) {
    const parentInputs = parent.querySelectorAll('input[type="tel"], input[type="text"]');
    inputs.push(...(Array.from(parentInputs) as HTMLInputElement[]));
  }

  // Check for label's "for" attribute
  if (element.tagName === 'LABEL') {
    const forId = element.getAttribute('for');
    if (forId) {
      const input = element.ownerDocument?.getElementById(forId);
      if (input && input.tagName === 'INPUT') {
        inputs.push(input as HTMLInputElement);
      }
    }
  }

  // Check children
  const childInputs = element.querySelectorAll('input[type="tel"], input[type="text"]');
  inputs.push(...(Array.from(childInputs) as HTMLInputElement[]));

  return inputs;
};

/**
 * Validate if a string looks like a phone number
 */
const isValidPhoneNumber = (value: string): boolean => {
  // Remove common formatting characters
  const cleaned = value.replace(/[\s\-()+.]/g, '');

  // Check if it's mostly digits and has a reasonable length (7-15 digits)
  const digitCount = (cleaned.match(/\d/g) || []).length;

  return digitCount >= 7 && digitCount <= 15 && cleaned.length >= 7;
};

/**
 * Get all phone numbers from client page
 */
const getAllPhonesFromPage = async (
  clientId: number | string,
): Promise<
  Array<{
    phone: string;
    type: 'mobile' | 'home' | 'work' | 'other';
  }>
> => {
  // For now, just return the best one
  // Could be extended to return all found phones
  const result = await scrapeClientPhoneFromPage(clientId);

  if (result.phone && result.type) {
    return [{ phone: result.phone, type: result.type }];
  }

  return [];
};

export { scrapeClientPhoneFromPage, getAllPhonesFromPage };
