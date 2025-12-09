/**
 * Case Type Definitions
 *
 * Types related to case metadata and case-related data structures.
 */

import type { NormalizedEntities } from "@odis/validators/scribe";
import type { Database } from "~/database.types";

/* ========================================
   Case Metadata Types
   ======================================== */

/**
 * Case metadata structure stored in cases.metadata JSON field
 */
export interface CaseMetadata {
  entities?: NormalizedEntities;
  idexx?: Record<string, unknown> | null;
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
