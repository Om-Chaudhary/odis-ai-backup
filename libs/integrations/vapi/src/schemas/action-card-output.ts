/**
 * Action Card Output Schema
 *
 * Re-exports the shared action card schema for VAPI configuration.
 * Canonical definition lives in @odis-ai/shared/types to avoid
 * circular dependency between integrations-vapi and integrations-ai.
 *
 * @module vapi/schemas/action-card-output
 */

export {
  ACTION_CARD_OUTPUT_SCHEMA,
  ACTION_CARD_OUTPUT_CONFIG,
  type ActionCardOutput,
} from "@odis-ai/shared/types";
