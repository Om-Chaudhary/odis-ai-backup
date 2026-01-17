/**
 * Structured Output Parser
 *
 * Parses VAPI's structured output format into usable data objects.
 * VAPI returns structured outputs in a UUID-keyed format that needs
 * to be transformed for our internal use.
 *
 * @module vapi/webhooks/processors/structured-output
 */

import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.webhook.child("structured-output");

/**
 * Parsed structured outputs from a VAPI call
 */
export interface ParsedStructuredOutputs {
  /** Legacy attention classification data */
  attentionClassification: Record<string, unknown>;
  /** Call outcome assessment */
  callOutcome: Record<string, unknown> | null;
  /** Pet health status */
  petHealth: Record<string, unknown> | null;
  /** Medication compliance data */
  medicationCompliance: Record<string, unknown> | null;
  /** Owner sentiment analysis */
  ownerSentiment: Record<string, unknown> | null;
  /** Escalation tracking data */
  escalation: Record<string, unknown> | null;
  /** Follow-up scheduling data */
  followUp: Record<string, unknown> | null;
}

/**
 * Schema names used by VAPI for structured outputs
 */
export const STRUCTURED_OUTPUT_SCHEMAS = {
  CALL_OUTCOME: "call_outcome",
  PET_HEALTH: "pet_health_status",
  MEDICATION_COMPLIANCE: "medication_compliance",
  OWNER_SENTIMENT: "owner_sentiment",
  ESCALATION: "escalation_tracking",
  FOLLOW_UP: "follow_up_status",
  ATTENTION_CLASSIFICATION: "attention_classification",
} as const;

/**
 * Parse VAPI structured output format
 *
 * VAPI returns structured data in a UUID-keyed format:
 * { "uuid": { "name": "field_name", "result": value }, ... }
 *
 * This function transforms it to a flat format:
 * { "field_name": value, ... }
 *
 * @param structuredData - Raw structured data from VAPI
 * @returns Flattened structured data object
 */
export function parseVapiStructuredOutput(
  structuredData: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!structuredData) return {};

  // Check if it's already in flat format (legacy/backfilled)
  if ("needs_attention" in structuredData) {
    return structuredData;
  }

  // Parse VAPI's UUID-keyed format
  const parsed: Record<string, unknown> = {};
  for (const value of Object.values(structuredData)) {
    if (
      value &&
      typeof value === "object" &&
      "name" in value &&
      "result" in value
    ) {
      const entry = value as { name: string; result: unknown };
      const result = entry.result as Record<string, unknown> | null;

      // For attention_classification schema, spread the result fields directly
      // so needs_attention, attention_types, etc. are at the top level
      if (
        entry.name === STRUCTURED_OUTPUT_SCHEMAS.ATTENTION_CLASSIFICATION &&
        result &&
        typeof result === "object"
      ) {
        Object.assign(parsed, result);
      }
      // Handle nested result objects (e.g., {"attention_types": "[]"})
      else if (result && typeof result === "object" && entry.name in result) {
        parsed[entry.name] = result[entry.name];
      } else {
        parsed[entry.name] = entry.result;
      }
    }
  }
  return parsed;
}

/**
 * Extract a specific structured output by name from VAPI's structuredOutputs
 *
 * VAPI returns multiple structured outputs keyed by UUID or name.
 * This finds the output matching the given schema name.
 *
 * @param structuredOutputs - Raw structured outputs from VAPI artifact
 * @param schemaName - Name of the schema to extract
 * @returns Extracted data or null if not found
 */
export function extractStructuredOutputByName(
  structuredOutputs: Record<string, unknown> | undefined,
  schemaName: string,
): Record<string, unknown> | null {
  if (!structuredOutputs) return null;

  // Look through all outputs to find one matching the schema name
  for (const [key, value] of Object.entries(structuredOutputs)) {
    if (!value || typeof value !== "object") continue;

    const output = value as Record<string, unknown>;

    // Check if the key matches the schema name directly
    if (key === schemaName || key.includes(schemaName)) {
      // If it has a 'result' property, extract that
      if (
        "result" in output &&
        output.result &&
        typeof output.result === "object"
      ) {
        return output.result as Record<string, unknown>;
      }
      return output;
    }

    // Check if there's a 'name' property that matches
    if (output.name === schemaName) {
      if (
        "result" in output &&
        output.result &&
        typeof output.result === "object"
      ) {
        return output.result as Record<string, unknown>;
      }
      // Return the output without the 'name' field wrapper
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name: _name, ...rest } = output;
      return rest;
    }

    // Check if the output itself contains the schema's expected fields
    // This handles cases where VAPI nests the data differently
    if (
      schemaName === STRUCTURED_OUTPUT_SCHEMAS.CALL_OUTCOME &&
      "call_outcome" in output
    ) {
      return output;
    }
    if (
      schemaName === STRUCTURED_OUTPUT_SCHEMAS.PET_HEALTH &&
      "pet_recovery_status" in output
    ) {
      return output;
    }
    if (
      schemaName === STRUCTURED_OUTPUT_SCHEMAS.MEDICATION_COMPLIANCE &&
      "medication_compliance" in output
    ) {
      return output;
    }
    if (
      schemaName === STRUCTURED_OUTPUT_SCHEMAS.OWNER_SENTIMENT &&
      "owner_sentiment" in output
    ) {
      return output;
    }
    if (
      schemaName === STRUCTURED_OUTPUT_SCHEMAS.ESCALATION &&
      "escalation_triggered" in output
    ) {
      return output;
    }
    if (
      schemaName === STRUCTURED_OUTPUT_SCHEMAS.FOLLOW_UP &&
      ("recheck_reminder_delivered" in output ||
        "follow_up_call_needed" in output)
    ) {
      return output;
    }
  }

  return null;
}

/**
 * Parse all structured outputs from VAPI's artifact
 *
 * Extracts all known structured output types and returns them
 * in a typed object for easy access.
 *
 * @param structuredOutputs - Raw structured outputs from VAPI artifact
 * @returns Parsed structured outputs object
 */
export function parseAllStructuredOutputs(
  structuredOutputs: Record<string, unknown> | undefined,
): ParsedStructuredOutputs {
  // Parse the legacy attention classification (for backwards compatibility)
  const attentionClassification = parseVapiStructuredOutput(structuredOutputs);

  return {
    attentionClassification,
    callOutcome: extractStructuredOutputByName(
      structuredOutputs,
      STRUCTURED_OUTPUT_SCHEMAS.CALL_OUTCOME,
    ),
    petHealth: extractStructuredOutputByName(
      structuredOutputs,
      STRUCTURED_OUTPUT_SCHEMAS.PET_HEALTH,
    ),
    medicationCompliance: extractStructuredOutputByName(
      structuredOutputs,
      STRUCTURED_OUTPUT_SCHEMAS.MEDICATION_COMPLIANCE,
    ),
    ownerSentiment: extractStructuredOutputByName(
      structuredOutputs,
      STRUCTURED_OUTPUT_SCHEMAS.OWNER_SENTIMENT,
    ),
    escalation: extractStructuredOutputByName(
      structuredOutputs,
      STRUCTURED_OUTPUT_SCHEMAS.ESCALATION,
    ),
    followUp: extractStructuredOutputByName(
      structuredOutputs,
      STRUCTURED_OUTPUT_SCHEMAS.FOLLOW_UP,
    ),
  };
}

/**
 * Log structured output availability for debugging
 *
 * @param callId - VAPI call ID
 * @param outputs - Parsed structured outputs
 */
export function logStructuredOutputAvailability(
  callId: string,
  outputs: ParsedStructuredOutputs,
): void {
  logger.debug("Structured outputs parsed", {
    callId,
    hasCallOutcome: !!outputs.callOutcome,
    hasPetHealth: !!outputs.petHealth,
    hasMedicationCompliance: !!outputs.medicationCompliance,
    hasOwnerSentiment: !!outputs.ownerSentiment,
    hasEscalation: !!outputs.escalation,
    hasFollowUp: !!outputs.followUp,
    hasAttentionClassification:
      Object.keys(outputs.attentionClassification).length > 0,
  });
}
