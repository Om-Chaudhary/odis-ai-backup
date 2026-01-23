/**
 * VAPI Call Management
 *
 * Functions for retrieving and listing VAPI calls.
 */

import type { VapiCallResponse } from "./types";
import { getVapiClient } from "./utils";

/**
 * Gets a call by ID with rate limit handling
 *
 * @param callId - VAPI call ID
 * @returns Call details
 * @throws Error if call cannot be fetched (including rate limit errors)
 */
export async function getCall(callId: string): Promise<VapiCallResponse> {
  const vapi = getVapiClient();

  try {
    const call = await vapi.calls.get(callId);
    return call as VapiCallResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit =
      errorMessage.includes("Rate limit exceeded") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429");

    if (isRateLimit) {
      console.error(`[VAPI_CLIENT] Rate limited when fetching call ${callId}`);
      throw new Error(
        "VAPI rate limit exceeded. Please try again in a few moments.",
      );
    }

    console.error(`[VAPI_CLIENT] Failed to get call ${callId}:`, error);
    throw error;
  }
}

/**
 * Options for listing calls
 */
export interface ListCallsOptions {
  limit?: number;
  createdAtGt?: Date;
  createdAtLt?: Date;
  createdAtGe?: Date;
  createdAtLe?: Date;
}

/**
 * Lists calls with optional filters
 *
 * @param options - Query options
 * @returns Array of calls
 */
export async function listCalls(
  options?: ListCallsOptions,
): Promise<VapiCallResponse[]> {
  const vapi = getVapiClient();

  try {
    const calls = await vapi.calls.list({
      limit: options?.limit,
      createdAtGt: options?.createdAtGt?.toISOString(),
      createdAtLt: options?.createdAtLt?.toISOString(),
      createdAtGe: options?.createdAtGe?.toISOString(),
      createdAtLe: options?.createdAtLe?.toISOString(),
    });

    return calls as VapiCallResponse[];
  } catch (error) {
    console.error("[VAPI_CLIENT] Failed to list calls:", error);
    throw error;
  }
}
