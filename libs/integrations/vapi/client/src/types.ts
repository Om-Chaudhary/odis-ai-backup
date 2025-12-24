/**
 * VAPI Knowledge Base Type Definitions
 *
 * This module defines all types for the comprehensive veterinary follow-up assistant
 * knowledge base system. All types are designed with strict validation and error handling.
 */

/**
 * Condition categories supported by the knowledge base
 * Each category has its own specific assessment questions and criteria
 */
export type ConditionCategory =
  | "gastrointestinal"
  | "dermatological"
  | "respiratory"
  | "urinary"
  | "orthopedic"
  | "post-surgical"
  | "neurological"
  | "ophthalmic"
  | "cardiac"
  | "endocrine"
  | "dental"
  | "wound-care"
  | "behavioral"
  | "pain-management"
  | "general"; // Fallback category

/**
 * Assessment question structure for dynamic conversation flow
 */
export interface AssessmentQuestion {
  /** The question to ask the owner */
  question: string;

  /** Context explaining why this question is being asked (for AI understanding) */
  context?: string;

  /**
   * Array of response patterns that indicate positive progress/improvement
   * Used by AI to assess if treatment is working
   */
  expectedPositiveResponse?: string[];

  /**
   * Array of response patterns that indicate concerning symptoms
   * Triggers follow-up questions or escalation
   */
  concerningResponses?: string[];

  /**
   * Follow-up question to ask if a concerning response is detected
   * Can include variable substitution like {{petName}}
   */
  followUpIfConcerning?: string;

  /**
   * Priority level for this question (1 = highest, 5 = lowest)
   * Higher priority questions are asked first
   */
  priority?: 1 | 2 | 3 | 4 | 5;

  /**
   * Whether this question is required (must be asked)
   * Default: true
   */
  required?: boolean;
}

/**
 * Core dynamic variables structure for VAPI calls
 * All variable names use camelCase to match VAPI system prompt requirements
 */
export interface DynamicVariables {
  // ============================================
  // Core Variables (Required for ALL calls)
  // ============================================

  /** Name of the veterinary clinic */
  clinicName: string;

  /** First name of the vet tech making the call (no title) */
  agentName: string;

  /** Name of the pet */
  petName: string;

  /** Name of the pet owner */
  ownerName: string;

  /** Appointment date in spelled-out format (e.g., "November eighth") */
  appointmentDate: string;

  /** Type of follow-up call */
  callType: "discharge" | "follow-up";

  /** Clinic phone number spelled out for natural speech */
  clinicPhone: string;

  /** Emergency phone number spelled out for natural speech */
  emergencyPhone: string;

  /** Brief summary completing "{petName} [summary]" */
  dischargeSummary: string;

  // ============================================
  // Discharge-Specific Variables (Optional)
  // ============================================

  /** Type of discharge visit */
  subType?: "wellness" | "vaccination";

  /** Follow-up care instructions for discharge calls */
  nextSteps?: string;

  // ============================================
  // Follow-Up Specific Variables (Optional)
  // ============================================

  /** What the pet was treated for */
  condition?: string;

  /**
   * Category of the condition for routing to appropriate knowledge base
   * If not provided, system will attempt to infer from condition string
   */
  conditionCategory?: ConditionCategory;

  /** Prescribed medications with dosing instructions (take-home meds only) */
  medications?: string;

  /** Vaccinations administered during the visit (separate from medications) */
  vaccinations?: string;

  /** Scheduled follow-up appointment date (spelled out) */
  recheckDate?: string;

  // ============================================
  // NEW: Dynamic Assessment System
  // ============================================

  /**
   * Array of condition-specific assessment questions
   * Auto-populated based on conditionCategory if not provided
   */
  assessmentQuestions?: AssessmentQuestion[];

  /**
   * Warning signs specific to this condition that owner should monitor
   * Presented during the call as education
   */
  warningSignsToMonitor?: string[];

  /**
   * Normal post-treatment expectations to set owner's expectations
   * Helps reduce anxiety about normal recovery symptoms
   */
  normalPostTreatmentExpectations?: string[];

  /**
   * Emergency criteria - symptoms requiring immediate ER visit
   * AI uses these to triage and provide urgent guidance
   */
  emergencyCriteria?: string[];

  /**
   * Urgent criteria - symptoms requiring same-day vet visit
   * Less severe than emergency but needs prompt attention
   */
  urgentCriteria?: string[];

  // ============================================
  // AI Call Intelligence Flags
  // ============================================

  /**
   * Whether clinical questions should be asked at all
   * False for grooming, simple wellness, etc.
   */
  shouldAskClinicalQuestions?: boolean;

  /**
   * Recommended call approach based on case complexity
   */
  callApproach?:
    | "brief-checkin"
    | "standard-assessment"
    | "detailed-monitoring";

  // ============================================
  // Additional Metadata (Optional)
  // ============================================

  /** Pet species (for species-specific guidance) */
  petSpecies?: "dog" | "cat" | "other";

  /** Pet age in years (for age-appropriate guidance) */
  petAge?: number;

  /** Pet weight in pounds (for medication dosing context) */
  petWeight?: number;

  /**
   * Days since treatment/visit
   * Used to contextualize expected recovery timeline
   */
  daysSinceTreatment?: number;

  // ============================================
  // Billing Verification (Source of Truth)
  // ============================================

  /**
   * Services/products actually performed (from billing - accepted)
   * This is the SOURCE OF TRUTH for what was actually done
   * Only discuss items that appear in this list
   */
  servicesPerformed?: string[];

  /**
   * Services/products declined by owner (from billing - declined)
   * DO NOT discuss these items - owner declined them
   */
  servicesDeclined?: string[];
}

/**
 * Validation result for dynamic variables
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Array of validation error messages */
  errors: string[];

  /** Array of validation warnings (non-blocking) */
  warnings: string[];

  /** Sanitized/corrected variables (if validation passed) */
  sanitizedVariables?: DynamicVariables;
}

/**
 * AI-generated call intelligence for VAPI calls
 */
export interface AIGeneratedCallIntelligence {
  /** Brief case context summary */
  caseContextSummary?: string;

  /** Hyper-specific assessment questions for this case */
  assessmentQuestions?: AssessmentQuestion[];

  /** Case-specific warning signs */
  warningSignsToMonitor?: string[];

  /** Normal expectations for this specific recovery */
  normalExpectations?: string[];

  /** Emergency criteria specific to this case */
  emergencyCriteria?: string[];

  /** Urgent criteria specific to this case (less severe than emergency) */
  urgentCriteria?: string[];

  /** Whether clinical questions should be asked at all */
  shouldAskClinicalQuestions?: boolean;

  /** Recommended call approach */
  callApproach?:
    | "brief-checkin"
    | "standard-assessment"
    | "detailed-monitoring";

  /** AI confidence in generated content */
  confidence?: number;
}

/**
 * Options for building dynamic variable sets
 */
export interface BuildVariablesOptions {
  /** Base variables (required core fields) */
  baseVariables: Partial<DynamicVariables>;

  /**
   * Condition category for the case
   * If not provided, will attempt to infer from condition string
   */
  conditionCategory?: ConditionCategory;

  /**
   * Whether to throw errors on validation failures
   * If false, returns validation result with errors array
   * Default: false
   */
  strict?: boolean;

  /**
   * @deprecated No longer used - static KB has been removed
   */
  useDefaults?: boolean;

  /**
   * AI-generated call intelligence
   * When provided, uses AI-generated content for assessment questions, warnings, etc.
   */
  aiGeneratedIntelligence?: AIGeneratedCallIntelligence;
}

/**
 * Result of building dynamic variables
 */
export interface BuildVariablesResult {
  /** Successfully built and validated variables */
  variables: DynamicVariables;

  /** Validation result */
  validation: ValidationResult;

  /** Warnings that should be displayed to user */
  warnings: string[];
}
