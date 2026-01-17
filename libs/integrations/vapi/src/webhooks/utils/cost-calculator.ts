/**
 * Cost and Duration Calculation Utilities
 *
 * Calculates call costs and durations from VAPI data.
 *
 * @module vapi/webhooks/utils/cost-calculator
 */

import type { VapiCost } from "../types";

/**
 * Calculates total cost from VAPI costs array
 *
 * @param costs - Array of VAPI cost objects
 * @returns Total cost in USD
 */
export function calculateTotalCost(costs?: VapiCost[]): number {
  if (!costs || costs.length === 0) return 0;
  return costs.reduce((total, cost) => total + cost.amount, 0);
}

/**
 * Calculate call duration in seconds
 *
 * @param startedAt - Call start timestamp
 * @param endedAt - Call end timestamp
 * @returns Duration in seconds, or null if cannot be calculated
 */
export function calculateDuration(
  startedAt?: string,
  endedAt?: string,
): number | null {
  if (!startedAt || !endedAt) return null;

  try {
    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(endedAt).getTime();

    if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) {
      return null;
    }

    return Math.floor((endTime - startTime) / 1000);
  } catch {
    return null;
  }
}

/**
 * Format duration for display
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "2m 30s")
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "N/A";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted string (e.g., "$0.05")
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}
