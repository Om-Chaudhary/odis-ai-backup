/**
 * VAPI Knowledge Base Validation Functions
 *
 * This module provides robust validation and sanitization for dynamic variables.
 * Designed to handle worst-case inputs and provide helpful error messages.
 */

import type {
  DynamicVariables,
  ValidationResult,
  AssessmentQuestion,
  ConditionCategory,
} from "./types";

/**
 * Validates and sanitizes a complete DynamicVariables object
 *
 * @param variables - Variables to validate
 * @param strict - Whether to enforce strict validation (throw on missing required fields)
 * @returns Validation result with sanitized variables or errors
 */
export function validateDynamicVariables(
  variables: Partial<DynamicVariables>,
  strict = false,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ============================================
  // Validate Required Core Fields
  // ============================================

  if (!variables.clinicName?.trim()) {
    errors.push("clinicName is required");
  }

  if (!variables.agentName?.trim()) {
    errors.push("agentName is required");
  } else if (
    variables.agentName.includes("Dr.") ||
    variables.agentName.includes("Doctor")
  ) {
    warnings.push(
      'agentName should be first name only (no titles like "Dr."). The AI will introduce them as a vet tech.',
    );
  }

  if (!variables.petName?.trim()) {
    errors.push("petName is required");
  }

  if (!variables.ownerName?.trim()) {
    errors.push("ownerName is required");
  }

  if (!variables.appointmentDate?.trim()) {
    errors.push("appointmentDate is required");
  } else if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(variables.appointmentDate)) {
    warnings.push(
      `appointmentDate should be spelled out (e.g., "November eighth") not formatted like "${variables.appointmentDate}"`,
    );
  }

  if (!variables.callType) {
    errors.push('callType is required (must be "discharge" or "follow-up")');
  } else if (
    variables.callType !== "discharge" &&
    variables.callType !== "follow-up"
  ) {
    errors.push(
      `callType must be "discharge" or "follow-up", got "${variables.callType}"`,
    );
  }

  if (!variables.clinicPhone?.trim()) {
    errors.push("clinicPhone is required");
  } else if (/[\d\-\(\)]/.test(variables.clinicPhone)) {
    warnings.push(
      `clinicPhone should be spelled out (e.g., "four zero eight, two five nine...") not formatted like "${variables.clinicPhone}"`,
    );
  }

  if (!variables.emergencyPhone?.trim()) {
    errors.push("emergencyPhone is required");
  } else if (/[\d\-\(\)]/.test(variables.emergencyPhone)) {
    warnings.push(
      `emergencyPhone should be spelled out (e.g., "four zero eight, eight six five...") not formatted like "${variables.emergencyPhone}"`,
    );
  }

  if (!variables.dischargeSummary?.trim()) {
    errors.push("dischargeSummary is required");
  }

  // ============================================
  // Validate Call-Type Specific Fields
  // ============================================

  if (variables.callType === "discharge") {
    if (
      variables.subType &&
      !["wellness", "vaccination"].includes(variables.subType)
    ) {
      errors.push(
        `subType for discharge calls must be "wellness" or "vaccination", got "${variables.subType}"`,
      );
    }

    // Warnings for follow-up fields being present on discharge calls
    if (variables.condition) {
      warnings.push(
        "condition field is not used for discharge calls (only for follow-up calls)",
      );
    }
    if (variables.medications) {
      warnings.push(
        "medications field is not used for discharge calls (only for follow-up calls)",
      );
    }
  }

  if (variables.callType === "follow-up") {
    if (!variables.condition?.trim()) {
      errors.push("condition is required for follow-up calls");
    }

    if (
      variables.recheckDate &&
      /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(variables.recheckDate)
    ) {
      warnings.push(
        `recheckDate should be spelled out (e.g., "November twentieth") not formatted like "${variables.recheckDate}"`,
      );
    }

    // Warnings for discharge fields being present on follow-up calls
    if (variables.subType) {
      warnings.push(
        "subType field is not used for follow-up calls (only for discharge calls)",
      );
    }
  }

  // ============================================
  // Validate Assessment Questions Structure
  // ============================================

  if (variables.assessmentQuestions) {
    if (!Array.isArray(variables.assessmentQuestions)) {
      errors.push("assessmentQuestions must be an array");
    } else {
      variables.assessmentQuestions.forEach((q, idx) => {
        const questionErrors = validateAssessmentQuestion(q, idx);
        errors.push(...questionErrors);
      });
    }
  }

  // ============================================
  // Validate Array Fields
  // ============================================

  if (
    variables.warningSignsToMonitor &&
    !Array.isArray(variables.warningSignsToMonitor)
  ) {
    errors.push("warningSignsToMonitor must be an array of strings");
  }

  if (
    variables.normalPostTreatmentExpectations &&
    !Array.isArray(variables.normalPostTreatmentExpectations)
  ) {
    errors.push("normalPostTreatmentExpectations must be an array of strings");
  }

  if (
    variables.emergencyCriteria &&
    !Array.isArray(variables.emergencyCriteria)
  ) {
    errors.push("emergencyCriteria must be an array of strings");
  }

  if (variables.urgentCriteria && !Array.isArray(variables.urgentCriteria)) {
    errors.push("urgentCriteria must be an array of strings");
  }

  // ============================================
  // Validate Numeric Fields
  // ============================================

  if (variables.petAge !== undefined) {
    const age = Number(variables.petAge);
    if (isNaN(age) || age < 0 || age > 30) {
      errors.push(
        `petAge must be a number between 0 and 30, got "${variables.petAge}"`,
      );
    }
  }

  if (variables.petWeight !== undefined) {
    const weight = Number(variables.petWeight);
    if (isNaN(weight) || weight <= 0 || weight > 300) {
      errors.push(
        `petWeight must be a positive number up to 300 lbs, got "${variables.petWeight}"`,
      );
    }
  }

  if (variables.daysSinceTreatment !== undefined) {
    const days = Number(variables.daysSinceTreatment);
    if (isNaN(days) || days < 0 || days > 365) {
      errors.push(
        `daysSinceTreatment must be a number between 0 and 365, got "${variables.daysSinceTreatment}"`,
      );
    }
  }

  // ============================================
  // Validate Species
  // ============================================

  if (
    variables.petSpecies &&
    !["dog", "cat", "other"].includes(variables.petSpecies)
  ) {
    errors.push(
      `petSpecies must be "dog", "cat", or "other", got "${variables.petSpecies}"`,
    );
  }

  // ============================================
  // Build Result
  // ============================================

  const valid = errors.length === 0;

  if (!valid && strict) {
    throw new Error(`Validation failed:\n${errors.join("\n")}`);
  }

  const sanitizedVariables = valid
    ? sanitizeVariables(variables as DynamicVariables)
    : undefined;

  return {
    valid,
    errors,
    warnings,
    sanitizedVariables,
  };
}

/**
 * Validates a single assessment question
 *
 * @param question - Question to validate
 * @param index - Index in array (for error messages)
 * @returns Array of error messages
 */
function validateAssessmentQuestion(
  question: unknown,
  index: number,
): string[] {
  const errors: string[] = [];
  const prefix = `assessmentQuestions[${index}]`;

  if (typeof question !== "object" || question === null) {
    errors.push(`${prefix} must be an object`);
    return errors;
  }

  const q = question as AssessmentQuestion;

  if (!q.question?.trim()) {
    errors.push(
      `${prefix}.question is required and must be a non-empty string`,
    );
  }

  if (
    q.expectedPositiveResponse &&
    !Array.isArray(q.expectedPositiveResponse)
  ) {
    errors.push(
      `${prefix}.expectedPositiveResponse must be an array of strings`,
    );
  }

  if (q.concerningResponses && !Array.isArray(q.concerningResponses)) {
    errors.push(`${prefix}.concerningResponses must be an array of strings`);
  }

  if (
    q.followUpIfConcerning !== undefined &&
    typeof q.followUpIfConcerning !== "string"
  ) {
    errors.push(`${prefix}.followUpIfConcerning must be a string`);
  }

  if (q.priority !== undefined) {
    if (![1, 2, 3, 4, 5].includes(q.priority)) {
      errors.push(
        `${prefix}.priority must be 1, 2, 3, 4, or 5, got ${q.priority}`,
      );
    }
  }

  if (q.required !== undefined && typeof q.required !== "boolean") {
    errors.push(`${prefix}.required must be a boolean`);
  }

  return errors;
}

/**
 * Sanitizes dynamic variables by trimming strings, normalizing data, and removing undefined fields
 *
 * @param variables - Variables to sanitize
 * @returns Sanitized variables
 */
export function sanitizeVariables(
  variables: DynamicVariables,
): DynamicVariables {
  const sanitized: DynamicVariables = {
    // Trim all string fields
    clinicName: variables.clinicName.trim(),
    agentName: variables.agentName.trim(),
    petName: variables.petName.trim(),
    ownerName: variables.ownerName.trim(),
    appointmentDate: variables.appointmentDate.trim(),
    callType: variables.callType,
    clinicPhone: variables.clinicPhone.trim(),
    emergencyPhone: variables.emergencyPhone.trim(),
    dischargeSummary: variables.dischargeSummary.trim(),
  };

  // Optional fields - only include if defined and non-empty
  if (variables.subType) sanitized.subType = variables.subType;
  if (variables.nextSteps?.trim())
    sanitized.nextSteps = variables.nextSteps.trim();
  if (variables.condition?.trim())
    sanitized.condition = variables.condition.trim();
  if (variables.conditionCategory)
    sanitized.conditionCategory = variables.conditionCategory;
  if (variables.medications?.trim())
    sanitized.medications = variables.medications.trim();
  if (variables.recheckDate?.trim())
    sanitized.recheckDate = variables.recheckDate.trim();

  // Array fields - filter out empty strings and trim
  if (
    variables.assessmentQuestions &&
    variables.assessmentQuestions.length > 0
  ) {
    sanitized.assessmentQuestions = variables.assessmentQuestions.map((q) => ({
      ...q,
      question: q.question.trim(),
      context: q.context?.trim(),
      expectedPositiveResponse: q.expectedPositiveResponse
        ?.map((r) => r.trim())
        .filter(Boolean),
      concerningResponses: q.concerningResponses
        ?.map((r) => r.trim())
        .filter(Boolean),
      followUpIfConcerning: q.followUpIfConcerning?.trim(),
    }));
  }

  if (
    variables.warningSignsToMonitor &&
    variables.warningSignsToMonitor.length > 0
  ) {
    sanitized.warningSignsToMonitor = variables.warningSignsToMonitor
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (
    variables.normalPostTreatmentExpectations &&
    variables.normalPostTreatmentExpectations.length > 0
  ) {
    sanitized.normalPostTreatmentExpectations =
      variables.normalPostTreatmentExpectations
        .map((s) => s.trim())
        .filter(Boolean);
  }

  if (variables.emergencyCriteria && variables.emergencyCriteria.length > 0) {
    sanitized.emergencyCriteria = variables.emergencyCriteria
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (variables.urgentCriteria && variables.urgentCriteria.length > 0) {
    sanitized.urgentCriteria = variables.urgentCriteria
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Metadata fields
  if (variables.petSpecies) sanitized.petSpecies = variables.petSpecies;
  if (variables.petAge !== undefined) sanitized.petAge = variables.petAge;
  if (variables.petWeight !== undefined)
    sanitized.petWeight = variables.petWeight;
  if (variables.daysSinceTreatment !== undefined)
    sanitized.daysSinceTreatment = variables.daysSinceTreatment;

  return sanitized;
}

/**
 * Attempts to infer condition category from condition string using keyword matching
 *
 * @param conditionString - The condition description
 * @returns Detected condition category or 'general' if no match
 */
export function inferConditionCategory(
  conditionString: string,
): ConditionCategory {
  if (!conditionString) return "general";

  const normalized = conditionString.toLowerCase();

  // Gastrointestinal keywords
  if (
    /vomit|diarrhea|gi|gastrointestinal|nausea|gastro|colitis|enteritis|stomach|intestinal|bowel/.test(
      normalized,
    )
  ) {
    return "gastrointestinal";
  }

  // Post-surgical keywords
  if (
    /surg|spay|neuter|incision|stitches|sutures|castration|ovariohysterectomy/.test(
      normalized,
    )
  ) {
    return "post-surgical";
  }

  // Dermatological keywords
  if (
    /skin|rash|itch|hot spot|derma|pyoderma|allergy|allergic|scratch/.test(
      normalized,
    )
  ) {
    return "dermatological";
  }

  // Respiratory keywords
  if (
    /cough|sneeze|respiratory|wheeze|breathing|pneumonia|bronchitis|kennel cough/.test(
      normalized,
    )
  ) {
    return "respiratory";
  }

  // Urinary keywords
  if (
    /urin|bladder|uti|kidney|renal|crystals|stones|incontinence/.test(
      normalized,
    )
  ) {
    return "urinary";
  }

  // Orthopedic keywords
  if (
    /limp|lame|arthritis|orthopedic|joint|bone|fracture|hip|cruciate|acl|mobility|leg/.test(
      normalized,
    )
  ) {
    return "orthopedic";
  }

  // Neurological keywords
  if (
    /seizure|neurological|neuro|paralysis|tremor|ataxia|disc|ivdd/.test(
      normalized,
    )
  ) {
    return "neurological";
  }

  // Ophthalmic keywords
  if (
    /eye|ophthalm|vision|cornea|conjunctivitis|cataract|glaucoma/.test(
      normalized,
    )
  ) {
    return "ophthalmic";
  }

  // Cardiac keywords
  if (/heart|cardiac|murmur|arrhythmia|congestive|chf/.test(normalized)) {
    return "cardiac";
  }

  // Endocrine keywords
  if (
    /diabetes|diabetic|thyroid|cushing|addison|endocrine|hormone/.test(
      normalized,
    )
  ) {
    return "endocrine";
  }

  // Dental keywords
  if (/dental|tooth|teeth|gum|periodontal|extraction/.test(normalized)) {
    return "dental";
  }

  // Wound care keywords
  if (
    /wound|laceration|abscess|bite|puncture|cut|injury|trauma/.test(normalized)
  ) {
    return "wound-care";
  }

  // Behavioral keywords
  if (
    /behavior|anxiety|aggression|fear|stress|separation|compulsive/.test(
      normalized,
    )
  ) {
    return "behavioral";
  }

  // Pain management keywords
  if (/pain|discomfort|analgesic|nsaid/.test(normalized)) {
    return "pain-management";
  }

  // Default to general if no specific category detected
  return "general";
}

/**
 * Validates that required fields are present for a specific call type
 *
 * @param variables - Variables to check
 * @returns True if all required fields for the call type are present
 */
export function hasRequiredFieldsForCallType(
  variables: Partial<DynamicVariables>,
): boolean {
  const coreFields = [
    variables.clinicName,
    variables.agentName,
    variables.petName,
    variables.ownerName,
    variables.appointmentDate,
    variables.callType,
    variables.clinicPhone,
    variables.emergencyPhone,
    variables.dischargeSummary,
  ];

  const hasCoreFields = coreFields.every(
    (field) => field && String(field).trim().length > 0,
  );

  if (!hasCoreFields) return false;

  // Follow-up calls additionally require condition
  if (variables.callType === "follow-up") {
    return Boolean(variables.condition?.trim());
  }

  return true;
}
