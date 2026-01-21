/**
 * Schedule and Business Hours Types
 */

/**
 * Configuration for a single day's business hours
 */
export interface DayHoursConfig {
  /** Whether the clinic is open on this day */
  enabled: boolean;
  /** Opening time in HH:MM format (e.g., "09:00") - required if enabled is true */
  open?: string;
  /** Closing time in HH:MM format (e.g., "17:00") - required if enabled is true */
  close?: string;
}

/**
 * Per-day business hours configuration
 * Keys are day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
 *
 * Example:
 * {
 *   "0": { "enabled": false },                                    // Sunday closed
 *   "1": { "enabled": true, "open": "09:00", "close": "17:00" },  // Monday 9-5
 *   "2": { "enabled": true, "open": "09:00", "close": "17:00" },  // Tuesday 9-5
 *   "3": { "enabled": true, "open": "09:00", "close": "17:00" },  // Wednesday 9-5
 *   "4": { "enabled": true, "open": "09:00", "close": "17:00" },  // Thursday 9-5
 *   "5": { "enabled": true, "open": "09:00", "close": "17:00" },  // Friday 9-5
 *   "6": { "enabled": true, "open": "10:00", "close": "15:00" }   // Saturday 10-3 (different hours!)
 * }
 */
export type DailyHours = {
  [key: string]: DayHoursConfig;
};
