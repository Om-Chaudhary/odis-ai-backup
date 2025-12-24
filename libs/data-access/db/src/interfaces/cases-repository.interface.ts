/**
 * Cases Repository Interface
 *
 * Contract for database operations on cases table.
 * Enables dependency injection and testability.
 *
 * @example
 * ```ts
 * class CasesService {
 *   constructor(private casesRepo: ICasesRepository) {}
 *
 *   async getCase(id: string) {
 *     return this.casesRepo.findById(id);
 *   }
 * }
 * ```
 */

import type { Database } from "@odis-ai/shared/types";
import type { CaseMetadata } from "@odis-ai/shared/types";

/**
 * Case row type from database schema
 */
export type CaseRow = Database["public"]["Tables"]["cases"]["Row"];

/**
 * Case insert type from database schema
 */
export type CaseInsert = Database["public"]["Tables"]["cases"]["Insert"];

/**
 * Case update type from database schema
 */
export type CaseUpdate = Database["public"]["Tables"]["cases"]["Update"];

/**
 * Options for querying cases
 */
export interface FindCasesOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: "created_at" | "updated_at" | "scheduled_at";
    ascending?: boolean;
  };
}

/**
 * Cases repository interface
 */
export interface ICasesRepository {
  /**
   * Find a case by ID
   *
   * @param id - Case identifier
   * @returns Case if found, null otherwise
   */
  findById(id: string): Promise<CaseRow | null>;

  /**
   * Find cases by patient ID
   *
   * @param patientId - Patient identifier
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of cases for the patient
   */
  findByPatient(
    patientId: string,
    options?: FindCasesOptions,
  ): Promise<CaseRow[]>;

  /**
   * Find cases by user ID
   *
   * @param userId - User identifier
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of cases for the user
   */
  findByUser(userId: string, options?: FindCasesOptions): Promise<CaseRow[]>;

  /**
   * Find cases by status
   *
   * @param status - Case status
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of cases with the given status
   */
  findByStatus(
    status: Database["public"]["Enums"]["CaseStatus"],
    options?: FindCasesOptions,
  ): Promise<CaseRow[]>;

  /**
   * Create a new case
   *
   * @param data - Case data (without auto-generated fields)
   * @returns Created case with all fields
   */
  create(data: CaseInsert): Promise<CaseRow>;

  /**
   * Update a case by ID
   *
   * @param id - Case identifier
   * @param data - Fields to update
   * @returns Updated case
   */
  update(id: string, data: CaseUpdate): Promise<CaseRow>;

  /**
   * Update case metadata
   *
   * @param id - Case identifier
   * @param metadata - Metadata to merge with existing
   * @returns Updated case
   */
  updateMetadata(id: string, metadata: Partial<CaseMetadata>): Promise<CaseRow>;

  /**
   * Delete a case by ID
   *
   * @param id - Case identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Count cases by criteria
   *
   * @param criteria - Optional criteria to filter cases
   * @returns Total count of matching cases
   */
  count(criteria?: {
    userId?: string;
    status?: Database["public"]["Enums"]["CaseStatus"];
  }): Promise<number>;
}
