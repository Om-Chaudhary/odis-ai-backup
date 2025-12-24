/**
 * Utility functions for case-related operations
 */

import { formatTimeForDisplay, formatDateForDisplay, now } from "./dateUtils";

/**
 * Get display name for a patient
 * Returns patient name if available, otherwise returns "New Case - [Time]"
 * @param patientName - The patient's name (can be null/undefined)
 * @param caseCreatedAt - The case creation timestamp (optional)
 * @returns Display name string
 */
export const getPatientDisplayName = (
  patientName?: string | null,
  caseCreatedAt?: string | null,
): string => {
  if (patientName?.trim()) {
    return patientName;
  }

  // Format: "New Case - 3:45 PM"
  const timestamp = caseCreatedAt ? new Date(caseCreatedAt) : now();
  const timeString = formatTimeForDisplay(timestamp);

  return `New Case - ${timeString}`;
};

/**
 * Format timestamp to time string
 * @param dateString - ISO date string
 * @returns Formatted time string (e.g., "3:45 PM")
 * @deprecated Use formatTimeForDisplay from dateUtils instead
 */
export const formatTime = (dateString: string | null): string => {
  if (!dateString) return "";
  return formatTimeForDisplay(dateString);
};

/**
 * Format date for display
 * Shows "Today", "Yesterday", "Tomorrow", or full date
 * @param date - Date object
 * @returns Formatted date string
 * @deprecated Use formatDateForDisplay from dateUtils instead
 */
export const formatDate = (date: Date): string => formatDateForDisplay(date);

// isToday is now exported from dateUtils - keeping this for backward compatibility
// but not re-exporting to avoid conflicts
