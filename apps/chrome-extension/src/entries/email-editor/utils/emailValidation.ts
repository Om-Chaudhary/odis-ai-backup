/**
 * Email Validation Utilities
 *
 * Provides functions for validating email addresses and parsing email lists
 */

/**
 * Validates a single email address using a standard email regex pattern
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Parses a comma-separated string of email addresses into an array
 */
export const parseEmailList = (input: string): string[] =>
  input
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);

/**
 * Validates a list of email addresses and returns both valid and invalid ones
 */
export const validateEmailList = (
  emails: string[],
): {
  valid: string[];
  invalid: string[];
} => {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(email => {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
};

/**
 * Validates and parses a comma-separated string of email addresses
 * Returns both valid and invalid email addresses
 */
export const validateAndParseEmailList = (
  input: string,
): {
  valid: string[];
  invalid: string[];
} => {
  const emails = parseEmailList(input);
  return validateEmailList(emails);
};
