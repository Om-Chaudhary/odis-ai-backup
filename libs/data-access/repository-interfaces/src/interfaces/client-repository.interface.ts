/**
 * Client Repository Interface
 *
 * Contract for database operations on clients (pet owners) table.
 * Enables dependency injection and testability.
 */

import type { Database } from "@odis-ai/shared/types";

/**
 * Client row type from database schema
 */
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

/**
 * Client insert type from database schema
 */
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

/**
 * Client update type from database schema
 */
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

/**
 * Options for finding or creating a client
 */
export interface FindOrCreateClientInput {
  clinicId: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Options for querying clients
 */
export interface FindClientsOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: "created_at" | "updated_at" | "display_name";
    ascending?: boolean;
  };
}

/**
 * Client repository interface
 */
export interface IClientRepository {
  /**
   * Find a client by ID
   */
  findById(id: string): Promise<ClientRow | null>;

  /**
   * Find a client by clinic and phone number
   */
  findByClinicAndPhone(
    clinicId: string,
    phone: string,
  ): Promise<ClientRow | null>;

  /**
   * Find a client by clinic and name (case-insensitive)
   */
  findByClinicAndName(
    clinicId: string,
    displayName: string,
  ): Promise<ClientRow | null>;

  /**
   * Find or create a client based on phone (preferred) or name
   * Updates contact info if client already exists
   */
  findOrCreate(input: FindOrCreateClientInput): Promise<ClientRow>;

  /**
   * Find clients by clinic
   */
  findByClinic(
    clinicId: string,
    options?: FindClientsOptions,
  ): Promise<ClientRow[]>;

  /**
   * Create a new client
   */
  create(data: ClientInsert): Promise<ClientRow>;

  /**
   * Update a client by ID
   */
  update(id: string, data: ClientUpdate): Promise<ClientRow>;

  /**
   * Delete a client by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count clients by clinic
   */
  countByClinic(clinicId: string): Promise<number>;
}
