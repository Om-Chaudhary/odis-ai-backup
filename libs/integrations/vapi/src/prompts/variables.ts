/**
 * Prompt Template Variables
 *
 * Defines all dynamic variables that can be used in prompt templates,
 * along with utilities for variable replacement and validation.
 */

import { z } from "zod";

/**
 * All dynamic variables that can be used in prompts.
 * Variables use {{variable_name}} syntax in templates.
 */
export const PromptVariablesSchema = z.object({
  // Agent configuration
  agent_name: z.string().default("Nancy"),

  // Clinic information
  clinic_name: z.string(),
  clinic_phone: z.string().optional(),
  clinic_address: z.string().optional(),
  clinic_hours: z.string().optional(),
  clinic_services: z.string().optional(),
  clinic_lunch_closure: z.string().optional(),
  clinic_is_open: z.string().optional(), // "true" | "false"

  // Patient/Owner context (primarily outbound)
  pet_name: z.string().optional(),
  patient_species: z.string().optional(),
  patient_breed: z.string().optional(),
  patient_age: z.string().optional(),
  owner_name: z.string().optional(),
  owner_first_name: z.string().optional(),

  // Visit information (outbound)
  appointment_date: z.string().optional(),
  chief_complaint: z.string().optional(),
  visit_reason: z.string().optional(),
  primary_diagnosis: z.string().optional(),
  diagnoses: z.string().optional(),
  presenting_symptoms: z.string().optional(),
  treatments: z.string().optional(),
  procedures: z.string().optional(),
  medications_detailed: z.string().optional(),
  vaccinations: z.string().optional(),
  discharge_summary: z.string().optional(),

  // Billing (outbound)
  services_performed: z.string().optional(),
  services_declined: z.string().optional(),

  // Follow-up care (outbound)
  next_steps: z.string().optional(),
  follow_up_instructions: z.string().optional(),
  recheck_required: z.string().optional(),
  recheck_date: z.string().optional(),

  // Assessment intelligence (outbound)
  should_ask_clinical_questions: z.string().optional(),
  call_approach: z.string().optional(),
  warning_signs_to_monitor: z.string().optional(),
  normal_post_treatment_expectations: z.string().optional(),
  assessment_questions: z.string().optional(),
  emergency_criteria: z.string().optional(),
  urgent_criteria: z.string().optional(),

  // Boolean flags (outbound) - string "true" | "false"
  has_medications: z.string().optional(),
  has_vaccinations: z.string().optional(),
  has_diagnoses: z.string().optional(),
  has_recheck: z.string().optional(),
  has_follow_up_instructions: z.string().optional(),

  // Emergency info
  er_clinic_name: z.string().optional(),
  er_clinic_phone: z.string().optional(),

  // Tool names (clinic-specific, for inbound prompts)
  tool_check_availability: z.string().optional(),
  tool_book_appointment: z.string().optional(),
  tool_slack_notification: z.string().optional(),
});

export type PromptVariables = z.infer<typeof PromptVariablesSchema>;

/**
 * Variable placeholder pattern: {{variable_name}}
 */
export const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * VAPI date template pattern: {{'now' | date: ...}}
 * These are handled by VAPI at runtime, not by our template engine.
 */
export const VAPI_DATE_PATTERN = /\{\{'now'\s*\|\s*date:[^}]+\}\}/g;

/**
 * Replace variables in template string.
 * Preserves VAPI date templates (e.g., {{'now' | date: '%A, %B %d, %Y', 'America/Los_Angeles'}})
 */
export function replaceVariables(
  template: string,
  variables: Partial<PromptVariables>,
): string {
  return template.replace(VARIABLE_PATTERN, (match, varName: string) => {
    // Skip VAPI date templates (they contain 'now')
    if (match.includes("'now'")) {
      return match;
    }
    const value = variables[varName as keyof PromptVariables];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Validate that all required variables are provided.
 * Ignores VAPI date templates.
 */
export function validateVariables(
  template: string,
  variables: Partial<PromptVariables>,
): { valid: boolean; missing: string[] } {
  const matches = template.matchAll(VARIABLE_PATTERN);
  const missing: string[] = [];

  for (const match of matches) {
    const varName = match[1];
    // Skip VAPI runtime variables (like 'now' in date templates)
    if (!varName || varName === "now") continue;
    const key = varName as keyof PromptVariables;
    if (variables[key] === undefined) {
      if (!missing.includes(varName)) {
        missing.push(varName);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extract all variable names from a template.
 * Excludes VAPI date templates.
 */
export function extractVariableNames(template: string): string[] {
  const matches = template.matchAll(VARIABLE_PATTERN);
  const names = new Set<string>();

  for (const match of matches) {
    const varName = match[1] ?? "";
    if (varName && varName !== "now") {
      names.add(varName);
    }
  }

  return Array.from(names);
}
