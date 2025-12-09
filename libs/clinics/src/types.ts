/**
 * Clinic Lookup Utilities - Type Definitions
 *
 * TypeScript types for clinic lookup utilities and related operations.
 */

import type { Database } from "~/database.types";

/**
 * Clinic record from database
 */
export type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

/**
 * Clinic insert/update data
 */
export type ClinicInsert = Database["public"]["Tables"]["clinics"]["Insert"];
export type ClinicUpdate = Database["public"]["Tables"]["clinics"]["Update"];

/**
 * Result type for clinic lookup operations
 */
export type ClinicLookupResult = ClinicRow | null;

/**
 * Extended clinic type with computed fields
 * Useful for enriching clinic data with additional metadata
 */
export interface ClinicWithMetadata extends ClinicRow {
  /**
   * Number of active providers at this clinic
   */
  providerCount?: number;

  /**
   * Number of active appointments for this clinic
   */
  appointmentCount?: number;

  /**
   * Whether clinic has active schedule syncs
   */
  hasActiveSyncs?: boolean;
}

/**
 * Options for creating or updating clinic records
 */
export interface ClinicData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  pims_type?: string;
  is_active?: boolean;
}

/**
 * Result of getOrCreateClinic operation
 */
export interface GetOrCreateClinicResult {
  clinicId: string;
  created: boolean;
}
