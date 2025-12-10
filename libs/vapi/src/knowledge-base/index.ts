/**
 * VAPI Knowledge Base System
 *
 * This module provides the main interface for working with the veterinary
 * follow-up assistant knowledge base. It includes helper functions to build
 * complete variable sets with validation and knowledge base integration.
 */

import type {
  ConditionCategory,
  ConditionKnowledgeBase,
  DynamicVariables,
  BuildVariablesOptions,
  BuildVariablesResult,
} from "../types";

import {
  validateDynamicVariables,
  inferConditionCategory,
  hasRequiredFieldsForCallType,
} from "../validators";

import { gastrointestinalKnowledge } from "./gastrointestinal";
import { postSurgicalKnowledge } from "./post-surgical";
import { dermatologicalKnowledge } from "./dermatological";
import { respiratoryKnowledge } from "./respiratory";
import { urinaryKnowledge } from "./urinary";
import { orthopedicKnowledge } from "./orthopedic";
import { neurologicalKnowledge } from "./neurological";
import { ophthalmicKnowledge } from "./ophthalmic";
import { cardiacKnowledge } from "./cardiac";
import { endocrineKnowledge } from "./endocrine";
import { dentalKnowledge } from "./dental";
import { woundCareKnowledge } from "./wound-care";
import { behavioralKnowledge } from "./behavioral";
import { painManagementKnowledge } from "./pain-management";
import { generalKnowledge } from "./general";

/**
 * Registry of all available knowledge bases
 * All condition categories now have comprehensive knowledge bases implemented
 */
const KNOWLEDGE_BASE_REGISTRY: Record<
  ConditionCategory,
  ConditionKnowledgeBase
> = {
  gastrointestinal: gastrointestinalKnowledge,
  "post-surgical": postSurgicalKnowledge,
  dermatological: dermatologicalKnowledge,
  respiratory: respiratoryKnowledge,
  urinary: urinaryKnowledge,
  orthopedic: orthopedicKnowledge,
  neurological: neurologicalKnowledge,
  ophthalmic: ophthalmicKnowledge,
  cardiac: cardiacKnowledge,
  endocrine: endocrineKnowledge,
  dental: dentalKnowledge,
  "wound-care": woundCareKnowledge,
  behavioral: behavioralKnowledge,
  "pain-management": painManagementKnowledge,
  general: generalKnowledge,
};

/**
 * Retrieves a knowledge base by category
 *
 * @param category - The condition category
 * @returns The knowledge base for the specified category (always returns a valid knowledge base)
 */
export function getKnowledgeBase(
  category: ConditionCategory,
): ConditionKnowledgeBase {
  return KNOWLEDGE_BASE_REGISTRY[category];
}

/**
 * Gets all implemented knowledge bases
 *
 * @returns Array of all implemented knowledge bases (all 15 categories)
 */
export function getAllKnowledgeBases(): ConditionKnowledgeBase[] {
  return Object.values(KNOWLEDGE_BASE_REGISTRY);
}

/**
 * Determines the appropriate condition category for a given condition string
 *
 * First checks if a category is explicitly provided, then attempts to infer
 * from the condition description using keyword matching.
 *
 * @param condition - The condition description
 * @param explicitCategory - Explicitly provided category (takes precedence)
 * @returns The determined condition category
 */
export function determineConditionCategory(
  condition: string | undefined,
  explicitCategory?: ConditionCategory,
): ConditionCategory {
  // If explicitly provided, use that
  if (explicitCategory) {
    return explicitCategory;
  }

  // Attempt to infer from condition string
  if (condition) {
    return inferConditionCategory(condition);
  }

  // Default to general
  return "general";
}

/**
 * Builds a complete set of dynamic variables with knowledge base integration
 *
 * This is the main function for creating VAPI call variables. It:
 * 1. Validates base variables
 * 2. Determines appropriate condition category
 * 3. Loads knowledge base for that category
 * 4. Merges knowledge base data with base variables
 * 5. Returns validated, complete variable set
 *
 * @param options - Build options including base variables and configuration
 * @returns Complete build result with variables, knowledge base, and validation info
 * @throws Error if strict mode is enabled and validation fails
 */
export function buildDynamicVariables(
  options: BuildVariablesOptions,
): BuildVariablesResult {
  const {
    baseVariables,
    conditionCategory: explicitCategory,
    strict = false,
    useDefaults = true,
    customKnowledgeBase,
    aiGeneratedIntelligence,
  } = options;

  const warnings: string[] = [];

  try {
    // Step 1: Determine condition category
    const category = determineConditionCategory(
      baseVariables.condition,
      explicitCategory,
    );

    if (category === "general" && baseVariables.callType === "follow-up") {
      warnings.push(
        `Could not determine specific condition category from "${baseVariables.condition}". Using general knowledge base. For better results, explicitly set conditionCategory.`,
      );
    }

    // Step 2: Load knowledge base (or use custom)
    let knowledgeBase: ConditionKnowledgeBase;

    if (customKnowledgeBase) {
      // Use custom knowledge base if provided
      knowledgeBase = {
        conditionCategory: category,
        displayName: customKnowledgeBase.displayName ?? `Custom ${category}`,
        description: customKnowledgeBase.description ?? "",
        keywords: customKnowledgeBase.keywords ?? [],
        assessmentQuestions: customKnowledgeBase.assessmentQuestions ?? [],
        normalPostTreatmentExpectations:
          customKnowledgeBase.normalPostTreatmentExpectations ?? [],
        warningSignsToMonitor: customKnowledgeBase.warningSignsToMonitor ?? [],
        emergencyCriteria: customKnowledgeBase.emergencyCriteria ?? [],
        urgentCriteria: customKnowledgeBase.urgentCriteria ?? [],
        typicalRecoveryDays: customKnowledgeBase.typicalRecoveryDays,
        commonMedications: customKnowledgeBase.commonMedications,
      };
    } else {
      // All categories now have knowledge bases implemented
      knowledgeBase = getKnowledgeBase(category);
    }

    // Step 3: Build complete variables by merging base with knowledge base
    const completeVariables: DynamicVariables = {
      ...baseVariables,
      conditionCategory: category,
    } as DynamicVariables;

    // Step 4: Apply AI-generated intelligence (PREFERRED) or fall back to static KB
    const hasAIIntelligence =
      aiGeneratedIntelligence?.assessmentQuestions &&
      aiGeneratedIntelligence.assessmentQuestions.length > 0;

    if (hasAIIntelligence && aiGeneratedIntelligence) {
      // Use AI-generated content (preferred)
      console.log("[BUILD_VARIABLES] Using AI-generated call intelligence", {
        questionCount: aiGeneratedIntelligence.assessmentQuestions?.length,
        callApproach: aiGeneratedIntelligence.callApproach,
        confidence: aiGeneratedIntelligence.confidence,
      });

      // AI-generated assessment questions (hyper-specific to this case)
      if (aiGeneratedIntelligence.assessmentQuestions?.length) {
        completeVariables.assessmentQuestions =
          aiGeneratedIntelligence.assessmentQuestions;
      }

      // AI-generated warning signs (case-specific)
      if (aiGeneratedIntelligence.warningSignsToMonitor?.length) {
        completeVariables.warningSignsToMonitor =
          aiGeneratedIntelligence.warningSignsToMonitor;
      }

      // AI-generated normal expectations
      if (aiGeneratedIntelligence.normalExpectations?.length) {
        completeVariables.normalPostTreatmentExpectations =
          aiGeneratedIntelligence.normalExpectations;
      }

      // AI-generated emergency criteria (case-specific)
      if (aiGeneratedIntelligence.emergencyCriteria?.length) {
        completeVariables.emergencyCriteria =
          aiGeneratedIntelligence.emergencyCriteria;
      }

      // For urgent criteria, fall back to static KB (AI doesn't generate these)
      if (
        !completeVariables.urgentCriteria &&
        knowledgeBase.urgentCriteria.length > 0
      ) {
        completeVariables.urgentCriteria = knowledgeBase.urgentCriteria;
      }
    } else if (useDefaults && knowledgeBase) {
      // Fall back to static knowledge base
      console.log(
        "[BUILD_VARIABLES] Using static knowledge base (no AI intelligence provided)",
        { category },
      );

      // Only add knowledge base fields if they're not already provided
      if (
        !completeVariables.assessmentQuestions &&
        knowledgeBase.assessmentQuestions.length > 0
      ) {
        completeVariables.assessmentQuestions =
          knowledgeBase.assessmentQuestions;
      }

      if (
        !completeVariables.warningSignsToMonitor &&
        knowledgeBase.warningSignsToMonitor.length > 0
      ) {
        completeVariables.warningSignsToMonitor =
          knowledgeBase.warningSignsToMonitor;
      }

      if (
        !completeVariables.normalPostTreatmentExpectations &&
        knowledgeBase.normalPostTreatmentExpectations.length > 0
      ) {
        completeVariables.normalPostTreatmentExpectations =
          knowledgeBase.normalPostTreatmentExpectations;
      }

      if (
        !completeVariables.emergencyCriteria &&
        knowledgeBase.emergencyCriteria.length > 0
      ) {
        completeVariables.emergencyCriteria = knowledgeBase.emergencyCriteria;
      }

      if (
        !completeVariables.urgentCriteria &&
        knowledgeBase.urgentCriteria.length > 0
      ) {
        completeVariables.urgentCriteria = knowledgeBase.urgentCriteria;
      }
    }

    // Step 5: Validate complete variables
    const validation = validateDynamicVariables(completeVariables, strict);

    // Add our warnings to validation warnings
    validation.warnings.push(...warnings);

    // Step 6: Check for required fields
    if (!hasRequiredFieldsForCallType(completeVariables)) {
      validation.errors.push("Missing required fields for call type");
      validation.valid = false;
    }

    // If validation failed and strict mode is on, throw
    if (!validation.valid && strict) {
      throw new Error(
        `Variable validation failed:\n${validation.errors.join("\n")}`,
      );
    }

    return {
      variables: validation.sanitizedVariables ?? completeVariables,
      knowledgeBase,
      validation,
      warnings: validation.warnings,
    };
  } catch (error) {
    if (strict) {
      throw error;
    }

    // In non-strict mode, return error information with general knowledge base
    return {
      variables: baseVariables as DynamicVariables,
      knowledgeBase: getKnowledgeBase("general"),
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
 * Creates a test scenario with complete knowledge base integration
 *
 * Helper function for creating test scenarios that automatically
 * include all relevant knowledge base data.
 *
 * @param baseVariables - Core test scenario variables
 * @returns Complete variable set with knowledge base data
 */
export function createTestScenario(
  baseVariables: Partial<DynamicVariables>,
): DynamicVariables {
  const result = buildDynamicVariables({
    baseVariables,
    strict: false,
    useDefaults: true,
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
  ConditionKnowledgeBase,
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

// Export all knowledge bases for direct access if needed
export { gastrointestinalKnowledge } from "./gastrointestinal";
export { postSurgicalKnowledge } from "./post-surgical";
export { dermatologicalKnowledge } from "./dermatological";
export { respiratoryKnowledge } from "./respiratory";
export { urinaryKnowledge } from "./urinary";
export { orthopedicKnowledge } from "./orthopedic";
export { neurologicalKnowledge } from "./neurological";
export { ophthalmicKnowledge } from "./ophthalmic";
export { cardiacKnowledge } from "./cardiac";
export { endocrineKnowledge } from "./endocrine";
export { dentalKnowledge } from "./dental";
export { woundCareKnowledge } from "./wound-care";
export { behavioralKnowledge } from "./behavioral";
export { painManagementKnowledge } from "./pain-management";
export { generalKnowledge } from "./general";
