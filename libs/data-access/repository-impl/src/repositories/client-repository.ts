/**
 * Client Repository Implementation
 *
 * Supabase-based repository for clients (pet owners).
 * Implements find-or-create pattern for deduplication.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IClientRepository,
  ClientRow,
  ClientInsert,
  ClientUpdate,
  FindOrCreateClientInput,
  FindClientsOptions,
} from "@odis-ai/data-access/repository-interfaces";
import { BaseRepository } from "./base";

export class ClientRepository
  extends BaseRepository<ClientRow>
  implements IClientRepository
{
  constructor(supabase: SupabaseClient) {
    super(supabase, "clients");
  }

  async findByClinicAndPhone(
    clinicId: string,
    phone: string,
  ): Promise<ClientRow | null> {
    this.logger.debug("Finding client by clinic and phone", {
      clinicId,
      phone,
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to find client by phone", {
        error: error.message,
      });
      return null;
    }

    return data;
  }

  async findByClinicAndName(
    clinicId: string,
    displayName: string,
  ): Promise<ClientRow | null> {
    this.logger.debug("Finding client by clinic and name", {
      clinicId,
      displayName,
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("clinic_id", clinicId)
      .ilike("display_name", displayName)
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to find client by name", {
        error: error.message,
      });
      return null;
    }

    return data;
  }

  async findOrCreate(input: FindOrCreateClientInput): Promise<ClientRow> {
    this.logger.info("Finding or creating client", {
      clinicId: input.clinicId,
      displayName: input.displayName,
      hasPhone: !!input.phone,
    });

    // 1. Try to find by phone (most reliable identifier)
    if (input.phone) {
      const byPhone = await this.findByClinicAndPhone(
        input.clinicId,
        input.phone,
      );
      if (byPhone) {
        this.logger.debug("Found existing client by phone", { id: byPhone.id });
        // Update contact info if needed
        const updates: ClientUpdate = {};
        if (input.email && !byPhone.email) updates.email = input.email;
        if (input.displayName && byPhone.display_name !== input.displayName) {
          updates.display_name = input.displayName;
        }
        if (input.firstName && !byPhone.first_name)
          updates.first_name = input.firstName;
        if (input.lastName && !byPhone.last_name)
          updates.last_name = input.lastName;

        if (Object.keys(updates).length > 0) {
          return this.update(byPhone.id, updates);
        }
        return byPhone;
      }
    }

    // 2. Try to find by name (fallback)
    const byName = await this.findByClinicAndName(
      input.clinicId,
      input.displayName,
    );
    if (byName) {
      this.logger.debug("Found existing client by name", { id: byName.id });
      // Update contact info if provided
      const updates: ClientUpdate = {};
      if (input.phone && !byName.phone) updates.phone = input.phone;
      if (input.email && !byName.email) updates.email = input.email;
      if (input.firstName && !byName.first_name)
        updates.first_name = input.firstName;
      if (input.lastName && !byName.last_name)
        updates.last_name = input.lastName;

      if (Object.keys(updates).length > 0) {
        return this.update(byName.id, updates);
      }
      return byName;
    }

    // 3. Create new client
    this.logger.info("Creating new client", { displayName: input.displayName });
    const insertData: ClientInsert = {
      clinic_id: input.clinicId,
      display_name: input.displayName,
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
    };

    return this.create(insertData);
  }

  async findByClinic(
    clinicId: string,
    options?: FindClientsOptions,
  ): Promise<ClientRow[]> {
    return this.findMany({ clinic_id: clinicId } as Partial<ClientRow>, {
      limit: options?.limit,
      offset: options?.offset,
      orderBy: options?.orderBy
        ? {
            column: options.orderBy.column,
            ascending: options.orderBy.ascending,
          }
        : { column: "display_name", ascending: true },
    });
  }

  async countByClinic(clinicId: string): Promise<number> {
    return this.count({ clinic_id: clinicId } as Partial<ClientRow>);
  }
}
