/**
 * Cases Repository
 *
 * Database operations for cases table.
 * Provides domain-specific queries for case management.
 *
 * @example
 * ```ts
 * const casesRepo = new CasesRepository(supabase);
 *
 * // Find case by ID
 * const caseData = await casesRepo.findById("case_123");
 *
 * // Find cases by patient
 * const patientCases = await casesRepo.findByPatient("patient_123");
 *
 * // Create new case
 * const newCase = await casesRepo.create({
 *   user_id: "user_123",
 *   status: "draft",
 *   source: "manual",
 * });
 * ```
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./base";
import type {
  ICasesRepository,
  CaseRow,
  CaseInsert,
  CaseUpdate,
  FindCasesOptions,
} from "@odis-ai/data-access/repository-interfaces";
import type { Database, CaseMetadata } from "@odis-ai/shared/types";

export class CasesRepository
  extends BaseRepository<CaseRow>
  implements ICasesRepository
{
  constructor(supabase: SupabaseClient) {
    super(supabase, "cases");
  }

  /**
   * Find cases by patient ID
   *
   * @param patientId - Patient identifier
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of cases for the patient
   *
   * @example
   * ```ts
   * const cases = await casesRepo.findByPatient("patient_123", {
   *   limit: 10,
   *   orderBy: { column: "created_at", ascending: false }
   * });
   * ```
   */
  async findByPatient(
    patientId: string,
    options?: FindCasesOptions,
  ): Promise<CaseRow[]> {
    this.logger.debug("Finding cases by patient ID", { patientId, options });

    // Build query with join to patients table
    let query = this.supabase
      .from(this.tableName)
      .select("*, patients!inner(id)")
      .eq("patients.id", patientId);

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 50) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find cases by patient ID", {
        patientId,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found cases by patient", {
      patientId,
      count: data?.length ?? 0,
    });
    return (data as CaseRow[]) ?? [];
  }

  /**
   * Find cases by user ID
   *
   * @param userId - User identifier
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of cases for the user
   *
   * @example
   * ```ts
   * const userCases = await casesRepo.findByUser("user_123", {
   *   limit: 20,
   *   orderBy: { column: "created_at", ascending: false }
   * });
   * ```
   */
  async findByUser(
    userId: string,
    options?: FindCasesOptions,
  ): Promise<CaseRow[]> {
    this.logger.debug("Finding cases by user ID", { userId, options });

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId);

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 50) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find cases by user ID", {
        userId,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found cases by user", {
      userId,
      count: data?.length ?? 0,
    });
    return (data as CaseRow[]) ?? [];
  }

  /**
   * Find cases by status
   *
   * @param status - Case status
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of cases with the given status
   *
   * @example
   * ```ts
   * const draftCases = await casesRepo.findByStatus("draft", {
   *   limit: 10
   * });
   * ```
   */
  async findByStatus(
    status: Database["public"]["Enums"]["CaseStatus"],
    options?: FindCasesOptions,
  ): Promise<CaseRow[]> {
    this.logger.debug("Finding cases by status", { status, options });

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("status", status);

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 50) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find cases by status", {
        status,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found cases by status", {
      status,
      count: data?.length ?? 0,
    });
    return (data as CaseRow[]) ?? [];
  }

  /**
   * Create a new case
   *
   * @param data - Case data (without auto-generated fields)
   * @returns Created case with all fields
   *
   * @example
   * ```ts
   * const newCase = await casesRepo.create({
   *   user_id: "user_123",
   *   status: "draft",
   *   source: "manual",
   * });
   * ```
   */
  async create(data: CaseInsert): Promise<CaseRow> {
    this.logger.info("Creating case", { data });

    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to create case", {
        error: error.message,
      });
      throw new Error(`Failed to create case: ${error.message}`);
    }

    this.logger.info("Case created successfully", { id: created.id });
    return created as CaseRow;
  }

  /**
   * Update a case by ID
   *
   * @param id - Case identifier
   * @param data - Fields to update
   * @returns Updated case
   *
   * @example
   * ```ts
   * await casesRepo.update("case_123", {
   *   status: "completed"
   * });
   * ```
   */
  async update(id: string, data: CaseUpdate): Promise<CaseRow> {
    this.logger.info("Updating case", { id, data });

    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to update case", {
        id,
        error: error.message,
      });
      throw new Error(`Failed to update case: ${error.message}`);
    }

    this.logger.info("Case updated successfully", { id });
    return updated as CaseRow;
  }

  /**
   * Update case metadata
   *
   * @param id - Case identifier
   * @param metadata - Metadata to merge with existing
   * @returns Updated case
   *
   * @example
   * ```ts
   * await casesRepo.updateMetadata("case_123", {
   *   discharge_notes: "Updated discharge notes"
   * });
   * ```
   */
  async updateMetadata(
    id: string,
    metadata: Partial<CaseMetadata>,
  ): Promise<CaseRow> {
    this.logger.info("Updating case metadata", { id, metadata });

    // Fetch existing case to merge metadata
    const existingCase = await this.findById(id);
    if (!existingCase) {
      throw new Error(`Case not found: ${id}`);
    }

    const mergedMetadata = {
      ...(existingCase.metadata as CaseMetadata | null),
      ...metadata,
    };

    return this.update(id, { metadata: mergedMetadata as Database["public"]["Tables"]["cases"]["Row"]["metadata"] });
  }

  /**
   * Delete a case by ID
   *
   * @param id - Case identifier
   *
   * @example
   * ```ts
   * await casesRepo.delete("case_123");
   * ```
   */
  async delete(id: string): Promise<void> {
    this.logger.info("Deleting case", { id });

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      this.logger.error("Failed to delete case", {
        id,
        error: error.message,
      });
      throw new Error(`Failed to delete case: ${error.message}`);
    }

    this.logger.info("Case deleted successfully", { id });
  }

  /**
   * Count cases by criteria
   *
   * @param criteria - Optional criteria to filter cases
   * @returns Total count of matching cases
   *
   * @example
   * ```ts
   * const draftCount = await casesRepo.count({ status: "draft" });
   * const userCount = await casesRepo.count({ userId: "user_123" });
   * ```
   */
  async count(criteria?: {
    userId?: string;
    status?: Database["public"]["Enums"]["CaseStatus"];
  }): Promise<number> {
    this.logger.debug("Counting cases", { criteria });

    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (criteria?.userId) {
      query = query.eq("user_id", criteria.userId);
    }

    if (criteria?.status) {
      query = query.eq("status", criteria.status);
    }

    const { count, error } = await query;

    if (error) {
      this.logger.error("Failed to count cases", {
        criteria,
        error: error.message,
      });
      return 0;
    }

    this.logger.debug("Cases counted", { criteria, count });
    return count ?? 0;
  }
}
