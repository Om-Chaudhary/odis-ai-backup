/**
 * Prompt Composition Engine
 *
 * Combines base template with call-type-specific templates
 * and applies variable substitution.
 */

import { basePrompt } from "./templates/base";
import { inboundPrompt } from "./templates/inbound";
import { outboundDischargePrompt } from "./templates/outbound-discharge";
import {
  replaceVariables,
  validateVariables,
  extractVariableNames,
  type PromptVariables,
} from "./variables";

export type CallType = "inbound" | "outbound_discharge" | "outbound_followup";

const CALL_TYPE_TEMPLATES: Record<CallType, string> = {
  inbound: inboundPrompt,
  outbound_discharge: outboundDischargePrompt,
  outbound_followup: "", // TODO: Add when needed
};

export interface ComposePromptOptions {
  /** Type of call this prompt is for */
  callType: CallType;
  /** Variable values to substitute */
  variables: Partial<PromptVariables>;
  /** Clinic-specific additions to append */
  clinicOverrides?: string;
  /** Whether to include base shared guidelines (default: true) */
  includeBase?: boolean;
}

export interface ComposePromptResult {
  /** The composed prompt with variables substituted */
  prompt: string;
  /** Whether all variables were successfully substituted */
  valid: boolean;
  /** List of variables that were not provided */
  missingVariables: string[];
}

/**
 * Compose a full system prompt from templates
 *
 * @example
 * ```typescript
 * const result = composePrompt({
 *   callType: "inbound",
 *   variables: {
 *     clinic_name: "Alum Rock Animal Hospital",
 *     clinic_address: "2810 Alum Rock Avenue, San Jose, California 95127",
 *     clinic_phone: "four oh eight, two five eight, two seven three five",
 *     clinic_hours: "Monday through Friday eight AM to seven PM, Saturday eight AM to six PM, Sunday nine AM to five PM.",
 *     clinic_lunch_closure: "twelve PM to two PM daily",
 *     clinic_services: "Wellness exams, vaccines, spay/neuter, dental, urgent care, boarding, basic grooming.",
 *     agent_name: "Nancy",
 *     tool_check_availability: "alum_rock_check_availability",
 *     tool_book_appointment: "alum_rock_book_appointment",
 *     tool_slack_notification: "slack_send_alum_rock_appointment_booked",
 *   },
 * });
 *
 * if (!result.valid) {
 *   console.warn("Missing variables:", result.missingVariables);
 * }
 *
 * // Use result.prompt for VAPI assistant
 * ```
 */
export function composePrompt(options: ComposePromptOptions): ComposePromptResult {
  const { callType, variables, clinicOverrides, includeBase = true } = options;

  // Build full template
  let template = "";

  // Add base shared guidelines if requested
  if (includeBase) {
    template = basePrompt + "\n\n";
  }

  // Add call-type specific section
  const callTypeTemplate = CALL_TYPE_TEMPLATES[callType];
  if (callTypeTemplate) {
    template += callTypeTemplate;
  }

  // Add clinic-specific overrides
  if (clinicOverrides) {
    template += "\n\n[Clinic-Specific Instructions]\n" + clinicOverrides;
  }

  // Validate variables
  const validation = validateVariables(template, variables);

  // Replace variables
  const prompt = replaceVariables(template, variables);

  return {
    prompt,
    valid: validation.valid,
    missingVariables: validation.missing,
  };
}

/**
 * Get list of required variables for a call type
 *
 * Useful for documentation and validation.
 *
 * @example
 * ```typescript
 * const vars = getRequiredVariables("inbound");
 * // Returns: ["clinic_name", "clinic_address", "clinic_phone", ...]
 * ```
 */
export function getRequiredVariables(callType: CallType): string[] {
  const template = basePrompt + (CALL_TYPE_TEMPLATES[callType] || "");
  return extractVariableNames(template);
}

/**
 * Get the raw template for a call type (without variable substitution)
 *
 * Useful for debugging and documentation.
 */
export function getRawTemplate(callType: CallType): string {
  let template = basePrompt;

  const callTypeTemplate = CALL_TYPE_TEMPLATES[callType];
  if (callTypeTemplate) {
    template += "\n\n" + callTypeTemplate;
  }

  return template;
}
