/**
 * IDEXX Neo DOM Selectors
 *
 * Selector strategies for IDEXX Neo web interface.
 * Uses multiple fallback strategies to handle UI changes.
 *
 * Strategy Priority:
 * 1. data-testid attributes (most stable)
 * 2. Semantic class names
 * 3. Structural patterns
 * 4. Text content matching
 */

/**
 * Login Page Selectors
 */
export const LOGIN_SELECTORS = {
  // Company ID field - first input on the page
  companyIdInput: {
    primary: 'input[name="companyId"]',
    fallback1: 'input[name="company_id"]',
    fallback2: "#companyId",
    fallback3: "input:first-of-type",
    fallback4: 'input[placeholder*="Company" i]',
  },

  // Username field
  usernameInput: {
    primary: 'input[name="username"]',
    fallback1: 'input[placeholder="username"]',
    fallback2: 'input[type="email"]',
    fallback3: "#username",
    fallback4: 'input[placeholder*="email" i]',
  },

  // Password field
  passwordInput: {
    primary: 'input[name="password"]',
    fallback1: 'input[placeholder="password"]',
    fallback2: 'input[type="password"]',
    fallback3: "#password",
  },

  // Submit button
  submitButton: {
    primary: 'button:has-text("Login")',
    fallback1: 'button[type="submit"]',
    fallback2: 'button:has-text("Sign In")',
    fallback3: 'input[type="submit"]',
  },

  // Login error message
  errorMessage: {
    primary: '[data-testid="login-error"]',
    fallback1: ".error-message",
    fallback2: '[role="alert"]',
  },

  // 2FA field (if present)
  twoFactorInput: {
    primary: 'input[name="code"]',
    fallback1: 'input[name="otp"]',
    fallback2: 'input[placeholder*="code" i]',
  },
};

/**
 * Dashboard Selectors
 */
export const DASHBOARD_SELECTORS = {
  // User menu (indicates successful login)
  userMenu: {
    primary: '[data-testid="user-menu"]',
    fallback1: ".user-menu",
    fallback2: '[class*="avatar"]',
  },

  // Navigation to schedule
  scheduleNav: {
    primary: '[data-testid="nav-schedule"]',
    fallback1: 'a[href*="schedule"]',
    fallback2: 'nav a:has-text("Schedule")',
  },

  // Navigation to consultations
  consultationsNav: {
    primary: '[data-testid="nav-consultations"]',
    fallback1: 'a[href*="consultation"]',
    fallback2: 'nav a:has-text("Consultations")',
  },
};

/**
 * Schedule Page Selectors
 */
export const SCHEDULE_SELECTORS = {
  // Date picker
  datePicker: {
    primary: '[data-testid="date-picker"]',
    fallback1: 'input[type="date"]',
    fallback2: ".date-picker",
  },

  // Appointment row
  appointmentRow: {
    primary: '[data-testid="appointment-row"]',
    fallback1: ".appointment-item",
    fallback2: 'tr[class*="appointment"]',
    fallback3: ".schedule-row",
  },

  // Appointment time
  appointmentTime: {
    primary: '[data-testid="appointment-time"]',
    fallback1: ".appointment-time",
    fallback2: ".time-slot",
  },

  // Patient name
  patientName: {
    primary: '[data-testid="patient-name"]',
    fallback1: ".patient-name",
    fallback2: '[class*="patient"]',
  },

  // Client name
  clientName: {
    primary: '[data-testid="client-name"]',
    fallback1: ".client-name",
    fallback2: '[class*="owner"]',
  },

  // Client phone
  clientPhone: {
    primary: '[data-testid="client-phone"]',
    fallback1: ".client-phone",
    fallback2: 'a[href^="tel:"]',
  },

  // Provider name
  providerName: {
    primary: '[data-testid="provider-name"]',
    fallback1: ".provider-name",
    fallback2: '[class*="doctor"]',
  },

  // Appointment type
  appointmentType: {
    primary: '[data-testid="appointment-type"]',
    fallback1: ".appointment-type",
    fallback2: '[class*="reason"]',
  },
};

/**
 * Consultation Page Selectors
 */
export const CONSULTATION_SELECTORS = {
  // Consultation row in list
  consultationRow: {
    primary: '[data-testid="consultation-row"]',
    fallback1: ".consultation-item",
    fallback2: 'tr[class*="consultation"]',
  },

  // Has notes indicator
  notesIndicator: {
    primary: '[data-testid="notes-indicator"]',
    fallback1: ".notes-indicator",
    fallback2: ".has-notes",
  },

  // Search/filter button
  searchButton: {
    primary: '[data-testid="search"]',
    fallback1: 'button:has-text("Search")',
    fallback2: 'button[type="submit"]',
  },

  // Date range start
  startDateInput: {
    primary: 'input[name="startDate"]',
    fallback1: '[data-testid="start-date"]',
    fallback2: 'input[placeholder*="start" i]',
  },

  // Date range end
  endDateInput: {
    primary: 'input[name="endDate"]',
    fallback1: '[data-testid="end-date"]',
    fallback2: 'input[placeholder*="end" i]',
  },

  // Clinical notes container
  clinicalNotes: {
    primary: '[data-testid="clinical-notes"]',
    fallback1: ".clinical-notes",
    fallback2: ".soap-notes",
    fallback3: '[class*="notes-content"]',
  },

  // Vitals section
  vitalsSection: {
    primary: '[data-testid="vitals"]',
    fallback1: ".vitals-section",
    fallback2: '[class*="vital"]',
  },

  // Diagnosis section
  diagnosisSection: {
    primary: '[data-testid="diagnosis"]',
    fallback1: ".diagnosis-section",
    fallback2: '[class*="diagnosis"]',
  },

  // Status indicator
  statusIndicator: {
    primary: '[data-testid="status"]',
    fallback1: ".status-badge",
    fallback2: '[class*="status"]',
  },
};

/**
 * Session/Auth Selectors
 */
export const SESSION_SELECTORS = {
  // Session expired indicator
  sessionExpired: {
    primary: ".session-expired",
    fallback1: '[data-testid="session-expired"]',
    fallback2: ':has-text("session expired")',
  },

  // Login required indicator
  loginRequired: {
    primary: ".login-required",
    fallback1: '[data-testid="login-required"]',
    fallback2: ':has-text("please log in")',
  },
};

/**
 * Helper type for selector objects
 */
export interface SelectorSet {
  primary: string;
  fallback1?: string;
  fallback2?: string;
  fallback3?: string;
}

/**
 * Get all selector variants as an array (primary first, then fallbacks)
 */
export function getSelectorVariants(selectorSet: SelectorSet): string[] {
  return [
    selectorSet.primary,
    selectorSet.fallback1,
    selectorSet.fallback2,
    selectorSet.fallback3,
  ].filter((s): s is string => !!s);
}
