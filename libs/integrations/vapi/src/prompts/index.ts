/**
 * VAPI Prompt Template System
 *
 * Version-controlled prompt templates with composition support.
 *
 * @module vapi/prompts
 *
 * @example
 * ```typescript
 * import { composePrompt, getRequiredVariables } from "@odis-ai/integrations/vapi/prompts";
 *
 * // Compose a full prompt
 * const result = composePrompt({
 *   callType: "inbound",
 *   variables: {
 *     clinic_name: "Happy Paws Vet",
 *     clinic_phone: "555-123-4567",
 *     agent_name: "Odis",
 *   },
 * });
 *
 * // Check what variables are needed
 * const vars = getRequiredVariables("outbound_discharge");
 * // Returns: ["clinic_name", "clinic_phone", "pet_name", "owner_first_name", ...]
 * ```
 */

// Composition
export {
  composePrompt,
  getRequiredVariables,
  getRawTemplate,
} from "./compose";
export type {
  CallType,
  ComposePromptOptions,
  ComposePromptResult,
} from "./compose";

// Variables
export {
  replaceVariables,
  validateVariables,
  extractVariableNames,
  PromptVariablesSchema,
  VARIABLE_PATTERN,
} from "./variables";
export type { PromptVariables } from "./variables";

// Raw templates (for direct access if needed)
export { basePrompt } from "./templates/base";
export { inboundPrompt } from "./templates/inbound";
export { outboundDischargePrompt } from "./templates/outbound-discharge";
