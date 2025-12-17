import type { DashboardCase } from '../hooks/useDailyDischarges';

/**
 * Update case status to 'sending' with processing message
 */
export const setCaseSending = (cases: DashboardCase[], caseId: string): DashboardCase[] =>
  cases.map(c => (c.id === caseId ? { ...c, status: 'sending', statusMessage: 'Processing...' } : c));

/**
 * Update case status to 'completed' with success message
 */
export const setCaseCompleted = (cases: DashboardCase[], caseId: string, actions: string[]): DashboardCase[] =>
  cases.map(c => (c.id === caseId ? { ...c, status: 'completed', statusMessage: `Sent: ${actions.join(', ')}` } : c));

/**
 * Update case status to 'error' with error message
 */
export const setCaseError = (cases: DashboardCase[], caseId: string, error: string): DashboardCase[] =>
  cases.map(c => (c.id === caseId ? { ...c, status: 'error', statusMessage: error } : c));

/**
 * Filter cases that are ready to send (pending status with contact info)
 */
export const getReadyCases = (cases: DashboardCase[]): DashboardCase[] =>
  cases.filter(c => c.status === 'pending' && (c.hydrated?.ownerPhone || c.hydrated?.ownerEmail));

/**
 * Count cases that are ready to send
 */
export const getReadyCount = (cases: DashboardCase[]): number => getReadyCases(cases).length;
