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

  /** Prescribed medications with dosing instructions */
  medications?: string;

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
 * Complete knowledge base definition for a condition category
 */
export interface ConditionKnowledgeBase {
  /** Unique identifier for this condition category */
  conditionCategory: ConditionCategory;

  /** Human-readable display name */
  displayName: string;

  /** Description of what conditions fall under this category */
  description: string;

  /** Array of keywords used to auto-detect condition category from condition string */
  keywords: string[];

  /** Condition-specific assessment questions */
  assessmentQuestions: AssessmentQuestion[];

  /** Normal post-treatment expectations for this condition type */
  normalPostTreatmentExpectations: string[];

  /** Warning signs to monitor for this condition */
  warningSignsToMonitor: string[];

  /** Emergency criteria requiring immediate ER visit */
  emergencyCriteria: string[];

  /** Urgent criteria requiring same-day vet visit */
  urgentCriteria: string[];

  /**
   * Average expected recovery timeline in days
   * Used to contextualize owner expectations
   */
  typicalRecoveryDays?: number;

  /**
   * Common medications used for this condition
   * Used for validation and auto-completion
   */
  commonMedications?: string[];
}

/**
 * Options for building dynamic variable sets
 */
export interface BuildVariablesOptions {
  /** Base variables (required core fields) */
  baseVariables: Partial<DynamicVariables>;

  /**
   * Condition category to use for knowledge base lookup
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
   * Whether to auto-populate missing optional fields with defaults
   * Default: true
   */
  useDefaults?: boolean;

  /**
   * Custom knowledge base override
   * Allows providing custom questions/criteria instead of using built-in knowledge base
   */
  customKnowledgeBase?: Partial<ConditionKnowledgeBase>;
}

/**
 * Result of building dynamic variables
 */
export interface BuildVariablesResult {
  /** Successfully built and validated variables */
  variables: DynamicVariables;

  /** Knowledge base used for this condition (always available - defaults to general if category unknown) */
  knowledgeBase: ConditionKnowledgeBase;

  /** Validation result */
  validation: ValidationResult;

  /** Warnings that should be displayed to user */
  warnings: string[];
}
