/**
 * Canonical Patient Repository Implementation
 *
 * Supabase-based repository for canonical patients (unique pets per clinic).
 * Implements find-or-create pattern for deduplication across visits.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ICanonicalPatientRepository,
  CanonicalPatientRow,
  CanonicalPatientInsert,
  CanonicalPatientUpdate,
  FindOrCreateCanonicalPatientInput,
  FindCanonicalPatientsOptions,
} from "@odis-ai/data-access/repository-interfaces";
import { BaseRepository } from "./base";

export class CanonicalPatientRepository
  extends BaseRepository<CanonicalPatientRow>
  implements ICanonicalPatientRepository
{
  constructor(supabase: SupabaseClient) {
    super(supabase, "canonical_patients");
  }

  async findByClientAndName(
    clientId: string,
    name: string,
  ): Promise<CanonicalPatientRow | null> {
    this.logger.debug("Finding canonical patient by client and name", {
      clientId,
      name,
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("client_id", clientId)
      .ilike("name", name)
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to find canonical patient", {
        error: error.message,
      });
      return null;
    }

    return data;
  }

  async findOrCreate(
    input: FindOrCreateCanonicalPatientInput,
  ): Promise<CanonicalPatientRow> {
    this.logger.info("Finding or creating canonical patient", {
      clinicId: input.clinicId,
      clientId: input.clientId,
      name: input.name,
    });

    // Try to find existing patient by client + name
    const existing = await this.findByClientAndName(input.clientId, input.name);

    if (existing) {
      this.logger.debug("Found existing canonical patient", {
        id: existing.id,
      });
      // Record the visit and update demographics if provided
      return this.recordVisitWithUpdates(existing, input);
    }

    // Create new canonical patient
    this.logger.info("Creating new canonical patient", { name: input.name });
    const insertData: CanonicalPatientInsert = {
      clinic_id: input.clinicId,
      client_id: input.clientId,
      name: input.name,
      species: input.species ?? null,
      breed: input.breed ?? null,
      sex: input.sex ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      color: input.color ?? null,
      microchip_id: input.microchipId ?? null,
      first_visit_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
      visit_count: 1,
    };

    return this.create(insertData);
  }

  /**
   * Record a visit and optionally update demographics
   */
  private async recordVisitWithUpdates(
    existing: CanonicalPatientRow,
    input: FindOrCreateCanonicalPatientInput,
  ): Promise<CanonicalPatientRow> {
    const updates: CanonicalPatientUpdate = {
      last_visit_at: new Date().toISOString(),
      visit_count: (existing.visit_count ?? 0) + 1,
    };

    // Update demographics if provided and not already set
    if (input.species && !existing.species) updates.species = input.species;
    if (input.breed && !existing.breed) updates.breed = input.breed;
    if (input.sex && !existing.sex) updates.sex = input.sex;
    if (input.dateOfBirth && !existing.date_of_birth) {
      updates.date_of_birth = input.dateOfBirth;
    }
    if (input.color && !existing.color) updates.color = input.color;
    if (input.microchipId && !existing.microchip_id) {
      updates.microchip_id = input.microchipId;
    }

    return this.update(existing.id, updates);
  }

  async recordVisit(id: string): Promise<CanonicalPatientRow> {
    this.logger.info("Recording visit for canonical patient", { id });

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Canonical patient not found: ${id}`);
    }

    return this.update(id, {
      last_visit_at: new Date().toISOString(),
      visit_count: (existing.visit_count ?? 0) + 1,
    });
  }

  async findByClient(
    clientId: string,
    options?: FindCanonicalPatientsOptions,
  ): Promise<CanonicalPatientRow[]> {
    return this.findMany(
      { client_id: clientId } as Partial<CanonicalPatientRow>,
      {
        limit: options?.limit,
        offset: options?.offset,
        orderBy: options?.orderBy
          ? {
              column: options.orderBy.column,
              ascending: options.orderBy.ascending,
            }
          : { column: "name", ascending: true },
      },
    );
  }

  async findByClinic(
    clinicId: string,
    options?: FindCanonicalPatientsOptions,
  ): Promise<CanonicalPatientRow[]> {
    return this.findMany(
      { clinic_id: clinicId } as Partial<CanonicalPatientRow>,
      {
        limit: options?.limit,
        offset: options?.offset,
        orderBy: options?.orderBy
          ? {
              column: options.orderBy.column,
              ascending: options.orderBy.ascending,
            }
          : { column: "last_visit_at", ascending: false },
      },
    );
  }

  async countByClinic(clinicId: string): Promise<number> {
    return this.count({ clinic_id: clinicId } as Partial<CanonicalPatientRow>);
  }

  async countByClient(clientId: string): Promise<number> {
    return this.count({ client_id: clientId } as Partial<CanonicalPatientRow>);
  }
}
