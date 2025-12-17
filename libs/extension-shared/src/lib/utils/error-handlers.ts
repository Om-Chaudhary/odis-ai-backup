/**
 * Error handling utilities for consistent error processing across the codebase
 */

/**
 * Check if an error is authentication-related
 * Looks for common authentication error messages and patterns
 *
 * @param error - The error to check
 * @returns boolean True if the error is authentication-related
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   if (isAuthError(error)) {
 *     alert('Please sign in to continue.');
 *   }
 * }
 * ```
 */
export const isAuthError = (error: unknown): boolean => {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Common authentication error patterns
  const authPatterns = [
    'not signed in',
    'not authenticated',
    'authentication failed',
    'unauthorized',
    'no auth token',
    'no access token',
    'sign in',
    'please sign in',
    'user is not signed in',
  ];

  return authPatterns.some(pattern => lowerMessage.includes(pattern));
};

/**
 * Format an error into a user-friendly error message
 * Handles various error types and formats them consistently
 *
 * @param error - The error to format
 * @param defaultMessage - Default message if error cannot be formatted
 * @returns string Formatted error message
 *
 * @example
 * ```typescript
 * import { logger } from '@odis-ai/extension-shared';
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = formatErrorMessage(error, 'An unexpected error occurred');
 *   logger.error(message);
 * }
 * ```
 */
export const formatErrorMessage = (error: unknown, defaultMessage: string = 'An error occurred'): string => {
  if (!error) return defaultMessage;

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    // Try to extract message from error object
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }
  }

  return defaultMessage;
};

/**
 * Handle Supabase-specific errors
 * Extracts meaningful error messages from Supabase error responses
 *
 * @param error - The Supabase error to handle
 * @returns object with error details
 *
 * @example
 * ```typescript
 * import { logger } from '@odis-ai/extension-shared';
 *
 * try {
 *   const { error } = await supabase.from('cases').select();
 *   if (error) {
 *     const handled = handleSupabaseError(error);
 *     logger.error(handled.message, { code: handled.code });
 *   }
 * } catch (error) {
 *   const handled = handleSupabaseError(error);
 *   logger.error(handled.message, { code: handled.code });
 * }
 * ```
 */
export const handleSupabaseError = (
  error: unknown,
): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
} => {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle Supabase PostgREST errors
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;

    // Supabase error structure
    if (typeof errorObj.message === 'string') {
      return {
        message: errorObj.message,
        code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
        details: typeof errorObj.details === 'string' ? errorObj.details : undefined,
        hint: typeof errorObj.hint === 'string' ? errorObj.hint : undefined,
      };
    }

    // Handle PostgREST error codes
    if (typeof errorObj.code === 'string') {
      const code = errorObj.code;
      let message = 'Database error occurred';

      // Common PostgREST error codes
      switch (code) {
        case 'PGRST116':
          message = 'No rows found';
          break;
        case '23505':
          message = 'A record with this information already exists';
          break;
        case '23503':
          message = 'Referenced record does not exist';
          break;
        case '23502':
          message = 'Required field is missing';
          break;
        case '42501':
          message = 'Insufficient privileges';
          break;
        default:
          message = typeof errorObj.message === 'string' ? errorObj.message : `Database error: ${code}`;
      }

      return {
        message,
        code,
        details: typeof errorObj.details === 'string' ? errorObj.details : undefined,
        hint: typeof errorObj.hint === 'string' ? errorObj.hint : undefined,
      };
    }
  }

  // Fallback to standard error formatting
  return {
    message: formatErrorMessage(error, 'An error occurred'),
  };
};

/**
 * Get a user-friendly error message for display to users
 * Formats errors in a way that's appropriate for UI display
 *
 * @param error - The error to format
 * @param context - Optional context about where the error occurred
 * @returns string User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await scrapeSchedule();
 * } catch (error) {
 *   const userMessage = getUserFriendlyErrorMessage(error, 'scraping schedule');
 *   alert(userMessage);
 * }
 * ```
 */
export const getUserFriendlyErrorMessage = (error: unknown, context?: string): string => {
  if (isAuthError(error)) {
    return 'Please sign in to the extension to continue.';
  }

  const message = formatErrorMessage(error);

  // Add context if provided
  if (context) {
    return `Failed to ${context}: ${message}`;
  }

  return message;
};
