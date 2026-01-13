/**
 * Canonical Patient Repository Interface
 *
 * Contract for database operations on canonical_patients table.
 * Canonical patients represent unique pets per clinic, deduplicated
 * across multiple visits/cases.
 */

import type { Database } from "@odis-ai/shared/types";

/**
 * Canonical patient row type from database schema
 */
export type CanonicalPatientRow =
  Database["public"]["Tables"]["canonical_patients"]["Row"];

/**
 * Canonical patient insert type from database schema
 */
export type CanonicalPatientInsert =
  Database["public"]["Tables"]["canonical_patients"]["Insert"];

/**
 * Canonical patient update type from database schema
 */
export type CanonicalPatientUpdate =
  Database["public"]["Tables"]["canonical_patients"]["Update"];

/**
 * Options for finding or creating a canonical patient
 */
export interface FindOrCreateCanonicalPatientInput {
  clinicId: string;
  clientId: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null;
  color?: string | null;
  microchipId?: string | null;
}

/**
 * Options for querying canonical patients
 */
export interface FindCanonicalPatientsOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: "created_at" | "updated_at" | "name" | "last_visit_at";
    ascending?: boolean;
  };
}

/**
 * Canonical patient repository interface
 */
export interface ICanonicalPatientRepository {
  /**
   * Find a canonical patient by ID
   */
  findById(id: string): Promise<CanonicalPatientRow | null>;

  /**
   * Find a canonical patient by client and name (case-insensitive)
   */
  findByClientAndName(
    clientId: string,
    name: string,
  ): Promise<CanonicalPatientRow | null>;

  /**
   * Find or create a canonical patient based on client + name
   * Updates demographics and increments visit count if patient exists
   */
  findOrCreate(
    input: FindOrCreateCanonicalPatientInput,
  ): Promise<CanonicalPatientRow>;

  /**
   * Find canonical patients by client
   */
  findByClient(
    clientId: string,
    options?: FindCanonicalPatientsOptions,
  ): Promise<CanonicalPatientRow[]>;

  /**
   * Find canonical patients by clinic
   */
  findByClinic(
    clinicId: string,
    options?: FindCanonicalPatientsOptions,
  ): Promise<CanonicalPatientRow[]>;

  /**
   * Create a new canonical patient
   */
  create(data: CanonicalPatientInsert): Promise<CanonicalPatientRow>;

  /**
   * Update a canonical patient by ID
   */
  update(
    id: string,
    data: CanonicalPatientUpdate,
  ): Promise<CanonicalPatientRow>;

  /**
   * Record a visit for a canonical patient (increments visit_count, updates last_visit_at)
   */
  recordVisit(id: string): Promise<CanonicalPatientRow>;

  /**
   * Delete a canonical patient by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count canonical patients by clinic
   */
  countByClinic(clinicId: string): Promise<number>;

  /**
   * Count canonical patients by client
   */
  countByClient(clientId: string): Promise<number>;
}
