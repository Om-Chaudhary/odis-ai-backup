/**
 * IDEXX Neo API Fetch Utilities
 * Standardized utilities for fetching data from IDEXX Neo API
 * These utilities wrap the core fetchers from content-ui and provide
 * dashboard-specific functionality.
 */

export { fetchInternalNotesForCase } from './fetchInternalNotes';
export { fetchClientContact, fetchClientPhone, fetchClientEmail } from './fetchClientContact';
export type { ClientContactResult } from './fetchClientContact';
