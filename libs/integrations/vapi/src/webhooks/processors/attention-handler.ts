/**
 * Attention Case Handler
 *
 * Handles detection and flagging of calls that require human attention.
 * Processes VAPI's attention classification structured output and
 * updates call records accordingly.
 *
 * @module vapi/webhooks/processors/attention-handler
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { parseVapiStructuredOutput } from "./structured-output";

const logger = loggers.webhook.child("attention-handler");

/**
 * Attention case data extracted from structured outputs
 */
export interface AttentionCaseData {
  needsAttention: boolean;
  attentionTypes: string[];
  attentionSeverity: string;
  attentionSummary: string | null;
}

/**
 * Existing call record with required fields for attention handling
 */
export interface AttentionCallRecord {
  id: string;
  case_id?: string | null;
}

/**
 * Parse attention types from various VAPI formats
 *
 * VAPI may return attention types as:
 * - An array of strings
 * - A JSON string containing an array
 * - A comma-separated string
 *
 * @param rawTypes - Raw attention types value from VAPI
 * @returns Normalized array of attention type strings
 */
export function parseAttentionTypes(rawTypes: unknown): string[] {
  if (Array.isArray(rawTypes)) {
    return rawTypes.filter((t): t is string => typeof t === "string");
  }

  if (typeof rawTypes === "string") {
    // Try parsing as JSON array first (e.g., '["health_concern","emergency_signs"]')
    try {
      const parsedTypes = JSON.parse(rawTypes);
      if (Array.isArray(parsedTypes)) {
        return parsedTypes.filter((t): t is string => typeof t === "string");
      }
      return [rawTypes];
    } catch {
      // Fall back to comma-separated split
      return rawTypes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }

  return [];
}

/**
 * Extract attention case data from structured output
 *
 * @param structuredData - Raw structured data from VAPI
 * @returns Parsed attention case data
 */
export function extractAttentionData(
  structuredData: Record<string, unknown> | undefined,
): AttentionCaseData {
  const parsed = parseVapiStructuredOutput(structuredData);

  return {
    needsAttention: parsed?.needs_attention === true,
    attentionTypes: parseAttentionTypes(parsed?.attention_types),
    attentionSeverity: (parsed?.attention_severity as string) ?? "routine",
    attentionSummary: (parsed?.attention_summary as string) ?? null,
  };
}

/**
 * Build attention update fields for database
 *
 * @param attentionData - Parsed attention data
 * @returns Update fields object or empty object if no attention needed
 */
export function buildAttentionUpdateFields(
  attentionData: AttentionCaseData,
): Record<string, unknown> {
  if (!attentionData.needsAttention) {
    return {};
  }

  return {
    attention_types: attentionData.attentionTypes,
    attention_severity: attentionData.attentionSeverity,
    attention_flagged_at: new Date().toISOString(),
    attention_summary: attentionData.attentionSummary,
  };
}

/**
 * Handle attention case detection for outbound calls
 *
 * Processes attention classification fields and optionally
 * marks the parent case as urgent for critical severity.
 *
 * @param callId - VAPI call ID
 * @param existingCall - Existing call record
 * @param structuredData - Raw structured data from VAPI
 * @param updateData - Object to append attention fields to
 * @param supabase - Supabase client for case updates
 */
export async function handleOutboundAttentionCase(
  callId: string,
  existingCall: AttentionCallRecord,
  structuredData: Record<string, unknown> | undefined,
  updateData: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<void> {
  const attentionData = extractAttentionData(structuredData);

  if (!attentionData.needsAttention) {
    return;
  }

  logger.info("Attention case detected", {
    callId,
    dbId: existingCall.id,
    caseId: existingCall.case_id,
    attentionTypes: attentionData.attentionTypes,
    severity: attentionData.attentionSeverity,
  });

  // Set attention fields on update data
  const attentionFields = buildAttentionUpdateFields(attentionData);
  Object.assign(updateData, attentionFields);

  // If critical severity, also mark parent case as urgent
  if (attentionData.attentionSeverity === "critical" && existingCall.case_id) {
    const { error: caseUpdateError } = await supabase
      .from("cases")
      .update({ is_urgent: true })
      .eq("id", existingCall.case_id);

    if (caseUpdateError) {
      logger.error("Failed to update case is_urgent for critical attention", {
        callId,
        caseId: existingCall.case_id,
        error: caseUpdateError.message,
      });
    } else {
      logger.info("Updated case is_urgent for critical attention", {
        callId,
        caseId: existingCall.case_id,
      });
    }
  }
}

/**
 * Handle attention case detection for inbound calls
 *
 * Similar to outbound but without case_id logic since
 * inbound calls don't have associated cases.
 *
 * @param callId - VAPI call ID
 * @param existingCall - Existing call record
 * @param structuredData - Raw structured data from VAPI
 * @param updateData - Object to append attention fields to
 */
export function handleInboundAttentionCase(
  callId: string,
  existingCall: AttentionCallRecord,
  structuredData: Record<string, unknown> | undefined,
  updateData: Record<string, unknown>,
): void {
  const attentionData = extractAttentionData(structuredData);

  if (!attentionData.needsAttention) {
    return;
  }

  logger.info("Inbound attention case detected", {
    callId,
    dbId: existingCall.id,
    attentionTypes: attentionData.attentionTypes,
    severity: attentionData.attentionSeverity,
  });

  // Set attention fields on update data
  const attentionFields = buildAttentionUpdateFields(attentionData);
  Object.assign(updateData, attentionFields);
}
