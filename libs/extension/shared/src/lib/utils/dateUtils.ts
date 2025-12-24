/**
 * Date utility functions for consistent date handling across the extension
 *
 * Best Practices:
 * - Use local timezone for user-facing dates (date pickers, displays)
 * - Use UTC/ISO strings for API communication and database storage
 * - Always be explicit about timezone handling
 * - Uses server-synced time for accurate date/time operations
 * - ALWAYS use `now()` instead of `new Date()` for current date/time
 */

import {
  getCurrentDateSync,
  getCurrentDate,
  getTodayLocalDateSync,
  getStartOfDaySync,
  getEndOfDaySync,
  isTodaySync,
} from './serverDateUtils';

/**
 * Standard date utility - replaces JavaScript's `new Date()` for current date/time
 *
 * This function uses server-synced time when available to ensure accuracy
 * across different timezones and account for client clock drift.
 * Falls back to local time if server time is not available.
 *
 * IMPORTANT: Use this instead of `new Date()` for getting the current date/time.
 *
 * @returns Date object representing the current accurate date and time
 *
 * @example
 * ```typescript
 * // ✅ Correct - uses server-synced time
 * const currentTime = now();
 *
 * // ❌ Wrong - uses client time which may be inaccurate
 * const currentTime = new Date();
 * ```
 */
export const now = (): Date => getCurrentDateSync();

/**
 * Standard date utility - async version for getting fresh server time
 *
 * Use this when you need the most accurate server time and can handle async.
 * For most cases, use the synchronous `now()` function instead.
 *
 * @returns Promise<Date> representing the current accurate date and time
 *
 * @example
 * ```typescript
 * // Get fresh server time
 * const currentTime = await nowAsync();
 * ```
 */
export const nowAsync = async (): Promise<Date> => await getCurrentDate();

/**
 * Get today's date in local timezone formatted as YYYY-MM-DD
 * Uses server-synced time for accuracy across timezones
 * Use this for date input fields to ensure correct local date regardless of timezone
 */
export const getTodayLocalDate = (): string => getTodayLocalDateSync();

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * Use this for date input fields (not for API/database)
 */
export const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 * Assumes the date string represents a local date (not UTC)
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeOfDay - Optional time to set (defaults to start of day: 00:00:00)
 * @returns Date object in local timezone
 */
export const parseLocalDateString = (dateString: string, timeOfDay: 'start' | 'end' | 'midnight' = 'start'): Date => {
  const parts = dateString.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;

  const date = new Date(year, month - 1, day);

  switch (timeOfDay) {
    case 'start':
    case 'midnight':
      date.setHours(0, 0, 0, 0);
      break;
    case 'end':
      date.setHours(23, 59, 59, 999);
      break;
  }

  return date;
};

/**
 * Get current date/time as ISO string (UTC)
 * Uses server-synced time for accuracy
 * Use this for API requests and database storage
 */
export const getCurrentISOString = (): string => getCurrentDateSync().toISOString();

/**
 * Convert a Date object to ISO string (UTC)
 * Use this when sending dates to APIs or storing in database
 */
export const toISOString = (date: Date): string => date.toISOString();

/**
 * Check if a date is today (in local timezone)
 * Uses server-synced time for accuracy
 */
export const isToday = (date: Date): boolean => isTodaySync(date);

/**
 * Get start of day in local timezone
 * Uses server-synced time if no date is provided
 */
export const getStartOfDay = (date?: Date): Date => getStartOfDaySync(date);

/**
 * Get end of day in local timezone
 * Uses server-synced time if no date is provided
 */
export const getEndOfDay = (date?: Date): Date => getEndOfDaySync(date);

/**
 * Get date range (start and end of day) for a given date
 * Returns an object with start and end Date objects
 *
 * @param date - Date to get range for (defaults to today)
 * @returns Object with start and end Date objects
 *
 * @example
 * ```typescript
 * const { start, end } = getDateRange();
 * // Or for a specific date:
 * const { start, end } = getDateRange(new Date('2024-01-15'));
 * ```
 */
export const getDateRange = (date?: Date): { start: Date; end: Date } => ({
  start: getStartOfDay(date),
  end: getEndOfDay(date),
});

/**
 * Add days to a date (in local timezone)
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add hours to a date
 */
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Add minutes to a date
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

/**
 * Format date for display with relative terms (Today, Yesterday, Tomorrow)
 * Falls back to formatted date string
 * Uses server-synced time for accurate "today" comparison
 */
export const formatDateForDisplay = (date: Date): string => {
  const today = getStartOfDaySync();
  const compareDate = getStartOfDaySync(date);

  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format time for display (e.g., "3:45 PM")
 */
export const formatTimeForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time for display
 */
export const formatDateTimeForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Compare two dates (ignoring time)
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1: Date, date2: Date): number => {
  const d1 = getStartOfDay(date1).getTime();
  const d2 = getStartOfDay(date2).getTime();

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

/**
 * Format Date to datetime-local input format (YYYY-MM-DDTHH:mm)
 * Use this for HTML5 datetime-local input fields
 */
export const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format Date to API format: "YYYY-MM-DD HH:MM:SS" (local timezone)
 * Use this when APIs expect local timezone format
 */
export const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
