/**
 * VAPI Variables Builder
 *
 * Simplified module that builds VAPI call variables.
 * Static knowledge base has been removed - only AI-generated intelligence is used.
 */

import type {
  ConditionCategory,
  DynamicVariables,
  BuildVariablesOptions,
  BuildVariablesResult,
} from "../types";

import {
  validateDynamicVariables,
  inferConditionCategory,
  hasRequiredFieldsForCallType,
} from "../validators";

/**
 * Determines the appropriate condition category for a given condition string
 *
 * @param condition - The condition description
 * @param explicitCategory - Explicitly provided category (takes precedence)
 * @returns The determined condition category
 */
export function determineConditionCategory(
  condition: string | undefined,
  explicitCategory?: ConditionCategory,
): ConditionCategory {
  if (explicitCategory) {
    return explicitCategory;
  }

  if (condition) {
    return inferConditionCategory(condition);
  }

  return "general";
}

/**
 * Builds a complete set of dynamic variables
 *
 * This simplified version only uses AI-generated intelligence when provided.
 * Static knowledge base content has been removed.
 *
 * @param options - Build options including base variables and configuration
 * @returns Complete build result with variables and validation info
 */
export function buildDynamicVariables(
  options: BuildVariablesOptions,
): BuildVariablesResult {
  const {
    baseVariables,
    conditionCategory: explicitCategory,
    strict = false,
    aiGeneratedIntelligence,
  } = options;

  const warnings: string[] = [];

  try {
    // Step 1: Determine condition category
    const category = determineConditionCategory(
      baseVariables.condition,
      explicitCategory,
    );

    // Step 2: Build complete variables
    const completeVariables: DynamicVariables = {
      ...baseVariables,
      conditionCategory: category,
    } as DynamicVariables;

    // Step 3: Apply AI-generated intelligence if available
    if (aiGeneratedIntelligence) {
      console.log("[BUILD_VARIABLES] Using AI-generated call intelligence", {
        questionCount: aiGeneratedIntelligence.assessmentQuestions?.length,
        callApproach: aiGeneratedIntelligence.callApproach,
        shouldAskClinicalQuestions:
          aiGeneratedIntelligence.shouldAskClinicalQuestions,
        confidence: aiGeneratedIntelligence.confidence,
      });

      if (aiGeneratedIntelligence.assessmentQuestions?.length) {
        completeVariables.assessmentQuestions =
          aiGeneratedIntelligence.assessmentQuestions;
      }

      if (aiGeneratedIntelligence.warningSignsToMonitor?.length) {
        completeVariables.warningSignsToMonitor =
          aiGeneratedIntelligence.warningSignsToMonitor;
      }

      if (aiGeneratedIntelligence.normalExpectations?.length) {
        completeVariables.normalPostTreatmentExpectations =
          aiGeneratedIntelligence.normalExpectations;
      }

      if (aiGeneratedIntelligence.emergencyCriteria?.length) {
        completeVariables.emergencyCriteria =
          aiGeneratedIntelligence.emergencyCriteria;
      }

      if (aiGeneratedIntelligence.urgentCriteria?.length) {
        completeVariables.urgentCriteria =
          aiGeneratedIntelligence.urgentCriteria;
      }

      // Add call intelligence flags
      if (aiGeneratedIntelligence.shouldAskClinicalQuestions !== undefined) {
        completeVariables.shouldAskClinicalQuestions =
          aiGeneratedIntelligence.shouldAskClinicalQuestions;
      }

      if (aiGeneratedIntelligence.callApproach) {
        completeVariables.callApproach = aiGeneratedIntelligence.callApproach;
      }
    }

    // Step 4: Validate complete variables
    const validation = validateDynamicVariables(completeVariables, strict);
    validation.warnings.push(...warnings);

    // Step 5: Check for required fields
    if (!hasRequiredFieldsForCallType(completeVariables)) {
      validation.errors.push("Missing required fields for call type");
      validation.valid = false;
    }

    if (!validation.valid && strict) {
      throw new Error(
        `Variable validation failed:\n${validation.errors.join("\n")}`,
      );
    }

    return {
      variables: validation.sanitizedVariables ?? completeVariables,
      validation,
      warnings: validation.warnings,
    };
  } catch (error) {
    if (strict) {
      throw error;
    }

    return {
      variables: baseVariables as DynamicVariables,
      validation: {
        valid: false,
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
        warnings,
      },
      warnings,
    };
  }
}

/**
 * Creates a test scenario with variable building
 *
 * @param baseVariables - Core test scenario variables
 * @returns Complete variable set
 */
export function createTestScenario(
  baseVariables: Partial<DynamicVariables>,
): DynamicVariables {
  const result = buildDynamicVariables({
    baseVariables,
    strict: false,
  });

  if (!result.validation.valid) {
    console.warn(
      "Test scenario validation warnings:",
      result.validation.warnings,
    );
    console.error("Test scenario validation errors:", result.validation.errors);
  }

  return result.variables;
}

/**
 * Validates variables and returns user-friendly error messages
 *
 * @param variables - Variables to validate
 * @returns Formatted error message or null if valid
 */
export function getValidationErrorMessage(
  variables: Partial<DynamicVariables>,
): string | null {
  const validation = validateDynamicVariables(variables, false);

  if (!validation.valid) {
    const errorList = validation.errors.map((e) => `• ${e}`).join("\n");
    return `Please fix the following issues:\n\n${errorList}`;
  }

  if (validation.warnings.length > 0) {
    const warningList = validation.warnings.map((w) => `• ${w}`).join("\n");
    return `Warnings:\n\n${warningList}`;
  }

  return null;
}

// Re-export types and utilities
export type {
  ConditionCategory,
  DynamicVariables,
  AssessmentQuestion,
  ValidationResult,
  BuildVariablesOptions,
  BuildVariablesResult,
} from "../types";

export {
  validateDynamicVariables,
  inferConditionCategory,
} from "../validators";
