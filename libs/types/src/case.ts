/**
 * Case Type Definitions
 *
 * Types related to case metadata and case-related data structures.
 */

import type { Database } from "./database.types";
import type { NormalizedEntities } from "@odis-ai/validators";
import type { IdexxMetadata } from "./idexx";

export type { NormalizedEntities } from "@odis-ai/validators";
export type { IdexxMetadata } from "./idexx";

/* ========================================
   Case Metadata Types
   ======================================== */

/**
 * Assessment question for dynamic conversation flow
 * (Mirrored from vapi types to avoid circular dependency)
 */
export interface AssessmentQuestion {
  question: string;
  context?: string;
  expectedPositiveResponse?: string[];
  concerningResponses?: string[];
  followUpIfConcerning?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
}

/**
 * AI-generated call intelligence for VAPI calls
 * (Mirrored from vapi types to avoid circular dependency)
 */
export interface AIGeneratedCallIntelligence {
  caseContextSummary?: string;
  assessmentQuestions?: AssessmentQuestion[];
  warningSignsToMonitor?: string[];
  normalExpectations?: string[];
  emergencyCriteria?: string[];
  urgentCriteria?: string[];
  shouldAskClinicalQuestions?: boolean;
  callApproach?:
    | "brief-checkin"
    | "standard-assessment"
    | "detailed-monitoring";
  confidence?: number;
}

/**
 * Pre-generated call intelligence stored at ingest-time
 */
export interface StoredCallIntelligence extends AIGeneratedCallIntelligence {
  /** When the intelligence was generated */
  generatedAt: string;
}

/**
 * Case metadata structure stored in cases.metadata JSON field
 */
export interface CaseMetadata {
  entities?: NormalizedEntities;
  /** IDEXX-specific metadata with structured billing data */
  idexx?: IdexxMetadata | null;
  /** Pre-generated AI call intelligence (generated at ingest-time) */
  callIntelligence?: StoredCallIntelligence | null;
  last_updated_by?: string;
  [key: string]: unknown;
}

/**
 * Type helper for case metadata in database operations
 */
export type CaseMetadataJson =
  Database["public"]["Tables"]["cases"]["Row"]["metadata"];

/* ========================================
   Case Result Types
   ======================================== */

/**
 * Case with entities and patient info
 */
export interface CaseWithEntities {
  case: Database["public"]["Tables"]["cases"]["Row"];
  entities: NormalizedEntities | undefined;
  patient:
    | Database["public"]["Tables"]["patients"]["Row"]
    | Database["public"]["Tables"]["patients"]["Row"][]
    | null;
  metadata: CaseMetadata;
}
