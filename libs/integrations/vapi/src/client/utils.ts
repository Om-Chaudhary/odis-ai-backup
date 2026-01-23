/**
 * VAPI Client Utilities
 *
 * Shared utilities for VAPI client operations.
 */

import { VapiClient } from "@vapi-ai/server-sdk";
import { env } from "@odis-ai/shared/env";

/**
 * Get VAPI client instance
 * Uses the private API key for server-side operations
 */
export function getVapiClient(): VapiClient {
  const apiKey = env.VAPI_PRIVATE_KEY ?? process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error(
      "VAPI_PRIVATE_KEY not configured in environment variables",
    );
  }

  const client = new VapiClient({
    token: apiKey,
  });

  return client;
}

/**
 * Gets the VAPI API key from environment
 * @returns The API key
 * @throws Error if not configured
 */
export function getVapiApiKey(): string {
  const apiKey = env.VAPI_PRIVATE_KEY ?? process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error(
      "VAPI_PRIVATE_KEY not configured in environment variables",
    );
  }

  return apiKey;
}

/**
 * Calculates total cost from VAPI costs array
 *
 * @param costs - Array of VAPI cost objects
 * @returns Total cost in USD
 */
export function calculateTotalCost(
  costs?: Array<{ amount: number; description: string }>,
): number {
  if (!costs || costs.length === 0) return 0;

  return costs.reduce((total, cost) => total + cost.amount, 0);
}

/**
 * Truncates long string values for logging
 *
 * @param value - Value to potentially truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated value or original
 */
export function truncateForLogging(value: unknown, maxLength = 100): unknown {
  if (typeof value === "string" && value.length > maxLength) {
    return `${value.substring(0, maxLength)}...`;
  }
  return value;
}

/**
 * Creates a log-safe version of variable values
 *
 * @param variableValues - Raw variable values
 * @returns Object with truncated long strings
 */
export function formatVariablesForLogging(
  variableValues: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!variableValues) return undefined;

  return Object.fromEntries(
    Object.entries(variableValues).map(([key, value]) => [
      key,
      truncateForLogging(value),
    ]),
  );
}

/**
 * Extracts sample variables for logging
 *
 * @param variableValues - Variable values object
 * @returns Object with common sample variables
 */
export function extractSampleVariables(
  variableValues: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!variableValues) return {};

  return {
    pet_name: variableValues.pet_name,
    owner_name: variableValues.owner_name,
    clinic_name: variableValues.clinic_name,
    agent_name: variableValues.agent_name,
    appointment_date: variableValues.appointment_date,
  };
}
