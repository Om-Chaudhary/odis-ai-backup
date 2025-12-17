import { logger } from '@odis-ai/extension-shared';

const odisLogger = logger.child('[ODIS]');

/**
 * IDEXX Neo Client Email Scraper
 * Fallback method to extract email by scraping the client page HTML
 * Used when API endpoints don't return email data
 */

/**
 * Validate if a string is a valid email address
 */
const isValidEmail = (value: string): boolean => {
  // Basic email validation regex
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(value);
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
    const parentInputs = parent.querySelectorAll('input[type="tel"], input[type="text"], input[type="email"]');
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
  const childInputs = element.querySelectorAll('input[type="tel"], input[type="text"], input[type="email"]');
  inputs.push(...(Array.from(childInputs) as HTMLInputElement[]));

  return inputs;
};

/**
 * Fetch and parse client page HTML to extract email address
 * This navigates to /clients/view/{clientId} and scrapes the DOM
 */
export const scrapeClientEmailFromPage = async (
  clientId: number | string,
): Promise<{
  email: string | null;
  error?: string;
}> => {
  odisLogger.info('📄 Attempting to scrape client email from HTML page...', { clientId });

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

    odisLogger.debug('📄 Client page HTML fetched and parsed for email');

    // Strategy 1: Look for labeled email fields
    const emailPatterns = [{ label: /Email\s*:?/i }, { label: /E-mail\s*:?/i }, { label: /Email\s*Address\s*:?/i }];

    // Search for email by label
    for (const pattern of emailPatterns) {
      const allElements = Array.from(doc.querySelectorAll('*'));

      for (const element of allElements) {
        const text = element.textContent?.trim() || '';

        if (pattern.label.test(text)) {
          odisLogger.debug('📄 Found potential email label', { label: text.substring(0, 100) });

          // Look for input fields nearby
          const inputs = findNearbyInputs(element);

          for (const input of inputs) {
            const value = (input as HTMLInputElement).value?.trim();

            if (value && isValidEmail(value)) {
              odisLogger.info('✅ Found email', { email: value });
              return { email: value };
            }
          }

          // Also check if the email is directly in the text content (not in an input)
          const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
          if (emailMatch && isValidEmail(emailMatch[0])) {
            odisLogger.info('✅ Found email in text', { email: emailMatch[0] });
            return { email: emailMatch[0] };
          }
        }
      }
    }

    // Strategy 2: Look for input fields with name/id containing "email"
    const emailInputs = Array.from(
      doc.querySelectorAll('input[name*="email" i], input[id*="email" i], input[type="email"]'),
    );

    for (const input of emailInputs) {
      const value = (input as HTMLInputElement).value?.trim();

      if (value && isValidEmail(value)) {
        odisLogger.info('✅ Found email from input field', { email: value });
        return { email: value };
      }
    }

    // Strategy 3: Search entire document for email patterns
    const allText = doc.body.textContent || '';
    const emailMatches = allText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);

    if (emailMatches && emailMatches.length > 0) {
      // Filter out common non-user emails
      const validEmails = emailMatches.filter(
        email =>
          !email.includes('example.com') &&
          !email.includes('test.com') &&
          !email.includes('noreply') &&
          !email.includes('support@') &&
          isValidEmail(email),
      );

      if (validEmails.length > 0) {
        odisLogger.info('✅ Found email from page text', { email: validEmails[0] });
        return { email: validEmails[0] };
      }
    }

    odisLogger.warn('⚠️ No email address found in client page HTML');
    return { email: null, error: 'No email address found in page' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    odisLogger.error('❌ Failed to scrape client email from page', { error });
    return { email: null, error: errorMsg };
  }
};
