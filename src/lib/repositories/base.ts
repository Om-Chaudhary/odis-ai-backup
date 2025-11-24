/**
 * Base Repository Class
 *
 * Provides common CRUD operations for all database tables with:
 * - Type-safe database operations
 * - Centralized error handling
 * - Consistent logging
 * - Query abstraction layer
 *
 * All domain repositories should extend this class.
 *
 * @example
 * ```ts
 * export class CallRepository extends BaseRepository<ScheduledCall> {
 *   constructor(supabase: SupabaseClient) {
 *     super(supabase, "scheduled_discharge_calls");
 *   }
 *
 *   async findByVapiCallId(vapiCallId: string): Promise<ScheduledCall | null> {
 *     return this.findOne({ vapi_call_id: vapiCallId });
 *   }
 * }
 * ```
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError } from "~/lib/api/errors";
import { createLogger } from "~/lib/logger";

const logger = createLogger("repository");

/**
 * Base repository with common CRUD operations
 *
 * @template T - The row type for this table
 */
export abstract class BaseRepository<T extends Record<string, unknown>> {
  protected get logger() {
    return logger.child(this.tableName);
  }

  constructor(
    protected supabase: SupabaseClient,
    protected tableName: string,
  ) {}

  /**
   * Find a single record by ID
   *
   * @param id - Record ID
   * @returns Record if found, null otherwise
   * @throws DatabaseError if query fails
   *
   * @example
   * ```ts
   * const call = await callRepository.findById("123");
   * ```
   */
  async findById(id: string): Promise<T | null> {
    this.logger.debug("Finding record by ID", { id });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Not found is not an error - return null
      if (error.code === "PGRST116") {
        this.logger.debug("Record not found", { id });
        return null;
      }

      this.logger.error("Failed to find record by ID", {
        id,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to find ${this.tableName} by ID`, {
        table: this.tableName,
        operation: "findById",
        id,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.debug("Record found", { id });
    return data as T;
  }

  /**
   * Find a single record by custom criteria
   *
   * @param criteria - Key-value pairs to match
   * @returns Record if found, null otherwise
   * @throws DatabaseError if query fails
   *
   * @example
   * ```ts
   * const call = await callRepository.findOne({
   *   vapi_call_id: "vapi_123",
   *   status: "in-progress"
   * });
   * ```
   */
  async findOne(criteria: Partial<T>): Promise<T | null> {
    this.logger.debug("Finding single record", { criteria });

    let query = this.supabase.from(this.tableName).select("*");

    // Apply all criteria as equality filters
    for (const [key, value] of Object.entries(criteria)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query.single();

    if (error) {
      // Not found is not an error - return null
      if (error.code === "PGRST116") {
        this.logger.debug("Record not found", { criteria });
        return null;
      }

      this.logger.error("Failed to find record", {
        criteria,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to find ${this.tableName}`, {
        table: this.tableName,
        operation: "findOne",
        criteria,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.debug("Record found", { criteria });
    return data as T;
  }

  /**
   * Find multiple records by criteria
   *
   * @param criteria - Key-value pairs to match
   * @param options - Query options (limit, orderBy, etc.)
   * @returns Array of matching records
   * @throws DatabaseError if query fails
   *
   * @example
   * ```ts
   * const calls = await callRepository.findMany(
   *   { status: "queued" },
   *   { limit: 50, orderBy: { column: "created_at", ascending: false } }
   * );
   * ```
   */
  async findMany(
    criteria: Partial<T> = {},
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { column: string; ascending?: boolean };
    },
  ): Promise<T[]> {
    this.logger.debug("Finding multiple records", { criteria, options });

    let query = this.supabase.from(this.tableName).select("*");

    // Apply criteria filters
    for (const [key, value] of Object.entries(criteria)) {
      query = query.eq(key, value);
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 10) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find records", {
        criteria,
        options,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to find ${this.tableName} records`, {
        table: this.tableName,
        operation: "findMany",
        criteria,
        options,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.debug("Records found", { count: data?.length ?? 0 });
    return (data as T[]) ?? [];
  }

  /**
   * Create a new record
   *
   * @param data - Record data (without auto-generated fields like id, created_at)
   * @returns Created record with all fields
   * @throws DatabaseError if creation fails
   *
   * @example
   * ```ts
   * const call = await callRepository.create({
   *   user_id: "user_123",
   *   phone_number: "+11234567890",
   *   status: "queued"
   * });
   * ```
   */
  async create(data: Partial<T>): Promise<T> {
    this.logger.info("Creating record", { data });

    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to create record", {
        data,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to create ${this.tableName}`, {
        table: this.tableName,
        operation: "create",
        data,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.info("Record created successfully", {
      id: (created as { id?: string }).id,
    });
    return created as T;
  }

  /**
   * Update a record by ID
   *
   * @param id - Record ID
   * @param data - Fields to update
   * @returns Updated record
   * @throws DatabaseError if update fails or record not found
   *
   * @example
   * ```ts
   * const updatedCall = await callRepository.update("123", {
   *   status: "completed"
   * });
   * ```
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    this.logger.info("Updating record", { id, data });

    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to update record", {
        id,
        data,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to update ${this.tableName}`, {
        table: this.tableName,
        operation: "update",
        id,
        data,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.info("Record updated successfully", { id });
    return updated as T;
  }

  /**
   * Update multiple records by criteria
   *
   * @param criteria - Criteria to match records
   * @param data - Fields to update
   * @returns Array of updated records
   * @throws DatabaseError if update fails
   *
   * @example
   * ```ts
   * const updatedCalls = await callRepository.updateMany(
   *   { status: "queued", scheduled_for: { $lt: new Date() } },
   *   { status: "expired" }
   * );
   * ```
   */
  async updateMany(criteria: Partial<T>, data: Partial<T>): Promise<T[]> {
    this.logger.info("Updating multiple records", { criteria, data });

    let query = this.supabase.from(this.tableName).update(data);

    // Apply criteria filters
    for (const [key, value] of Object.entries(criteria)) {
      query = query.eq(key, value);
    }

    const { data: updated, error } = await query.select();

    if (error) {
      this.logger.error("Failed to update records", {
        criteria,
        data,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to update ${this.tableName} records`, {
        table: this.tableName,
        operation: "updateMany",
        criteria,
        data,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.info("Records updated successfully", {
      count: updated?.length ?? 0,
    });
    return (updated as T[]) ?? [];
  }

  /**
   * Delete a record by ID
   *
   * @param id - Record ID
   * @throws DatabaseError if deletion fails
   *
   * @example
   * ```ts
   * await callRepository.delete("123");
   * ```
   */
  async delete(id: string): Promise<void> {
    this.logger.info("Deleting record", { id });

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      this.logger.error("Failed to delete record", {
        id,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to delete ${this.tableName}`, {
        table: this.tableName,
        operation: "delete",
        id,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.info("Record deleted successfully", { id });
  }

  /**
   * Delete multiple records by criteria
   *
   * @param criteria - Criteria to match records for deletion
   * @returns Number of deleted records
   * @throws DatabaseError if deletion fails
   *
   * @example
   * ```ts
   * const count = await callRepository.deleteMany({ status: "expired" });
   * ```
   */
  async deleteMany(criteria: Partial<T>): Promise<number> {
    this.logger.info("Deleting multiple records", { criteria });

    let query = this.supabase.from(this.tableName).delete();

    // Apply criteria filters
    for (const [key, value] of Object.entries(criteria)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query.select();

    if (error) {
      this.logger.error("Failed to delete records", {
        criteria,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to delete ${this.tableName} records`, {
        table: this.tableName,
        operation: "deleteMany",
        criteria,
        error: error.message,
        code: error.code,
      });
    }

    const count = data?.length ?? 0;
    this.logger.info("Records deleted successfully", { count });
    return count;
  }

  /**
   * Count records matching criteria
   *
   * @param criteria - Optional criteria to filter records
   * @returns Total count of matching records
   * @throws DatabaseError if count fails
   *
   * @example
   * ```ts
   * const totalQueued = await callRepository.count({ status: "queued" });
   * ```
   */
  async count(criteria?: Partial<T>): Promise<number> {
    this.logger.debug("Counting records", { criteria });

    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    // Apply criteria filters
    if (criteria) {
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value);
      }
    }

    const { count, error } = await query;

    if (error) {
      this.logger.error("Failed to count records", {
        criteria,
        error: error.message,
        code: error.code,
      });

      throw new DatabaseError(`Failed to count ${this.tableName} records`, {
        table: this.tableName,
        operation: "count",
        criteria,
        error: error.message,
        code: error.code,
      });
    }

    this.logger.debug("Records counted", { count });
    return count ?? 0;
  }
}
