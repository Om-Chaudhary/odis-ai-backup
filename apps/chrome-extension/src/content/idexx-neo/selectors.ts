/**
 * DOM selectors for IDEXX Neo pages
 *
 * These selectors target specific elements in the IDEXX Neo UI.
 * They may need to be updated if IDEXX Neo changes their UI structure.
 */

export const IDEXX_SELECTORS = {
  /**
   * Patient information selectors
   */
  patient: {
    /** Patient name element */
    name: '[data-testid="patient-name"], .patient-name, #patientName',
    /** Patient ID element */
    id: '[data-testid="patient-id"], .patient-id, #patientId',
    /** Species/breed element */
    species: '[data-testid="patient-species"], .patient-species',
    /** Breed element */
    breed: '[data-testid="patient-breed"], .patient-breed',
  },

  /**
   * Client (pet owner) information selectors
   */
  client: {
    /** Client name element */
    name: '[data-testid="client-name"], .client-name, #clientName',
    /** Client phone element */
    phone: '[data-testid="client-phone"], .client-phone',
    /** Client email element */
    email: '[data-testid="client-email"], .client-email',
  },

  /**
   * Visit/appointment selectors
   */
  visit: {
    /** Visit date element */
    date: '[data-testid="visit-date"], .visit-date',
    /** Visit reason element */
    reason: '[data-testid="visit-reason"], .visit-reason',
    /** Visit status element */
    status: '[data-testid="visit-status"], .visit-status',
  },

  /**
   * Page-level selectors
   */
  page: {
    /** Patient detail page container */
    patientDetail: '[data-testid="patient-detail"], .patient-detail-page',
    /** Discharge summary container */
    dischargeSummary: '[data-testid="discharge-summary"], .discharge-summary',
    /** Main content area */
    mainContent: '#main-content, [role="main"], main',
  },

  /**
   * Action button selectors (for potential UI injections)
   */
  actions: {
    /** Action toolbar */
    toolbar: '[data-testid="action-toolbar"], .action-toolbar',
    /** Discharge button */
    dischargeButton: '[data-testid="discharge-btn"], .discharge-button',
  },
} as const;

/**
 * Check if we're on a specific type of IDEXX Neo page
 */
export function isPageType(
  type: "patientDetail" | "dischargeSummary"
): boolean {
  const selector = IDEXX_SELECTORS.page[type];
  return document.querySelector(selector) !== null;
}

/**
 * Get text content from an element matching a selector
 */
export function getTextFromSelector(selector: string): string | null {
  const element = document.querySelector(selector);
  return element?.textContent?.trim() ?? null;
}
