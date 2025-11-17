/**
 * User Repository
 *
 * Database operations for users table.
 * Provides domain-specific queries for user management and profile lookups.
 *
 * @example
 * ```ts
 * const userRepo = new UserRepository(supabase);
 *
 * // Find user by email
 * const user = await userRepo.findByEmail("john@example.com");
 *
 * // Get user profile
 * const profile = await userRepo.findById("user_123");
 * ```
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./base";
import type { User } from "./types";
import { NotFoundError } from "~/lib/api/errors";

export class UserRepository extends BaseRepository<User> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "users");
  }

  /**
   * Find user by email address
   *
   * @param email - User email address
   * @returns User if found, null otherwise
   *
   * @example
   * ```ts
   * const user = await userRepo.findByEmail("john@example.com");
   * ```
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug("Finding user by email", { email });

    const { data, error} = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to find user by email", {
        email,
        error: error.message,
      });
      return null;
    }

    if (!data) {
      this.logger.debug("User not found", { email });
      return null;
    }

    this.logger.debug("User found", { email });
    return data as User;
  }

  /**
   * Get user by ID or throw error if not found
   *
   * @param userId - User identifier
   * @returns User record
   * @throws NotFoundError if user doesn't exist
   *
   * @example
   * ```ts
   * const user = await userRepo.getByIdOrThrow("user_123");
   * ```
   */
  async getByIdOrThrow(userId: string): Promise<User> {
    this.logger.debug("Getting user by ID or throw", { userId });

    const user = await this.findById(userId);

    if (!user) {
      this.logger.warn("User not found", { userId });
      throw new NotFoundError(`User not found: ${userId}`, { userId });
    }

    return user;
  }

  /**
   * Get user by email or throw error if not found
   *
   * @param email - User email address
   * @returns User record
   * @throws NotFoundError if user doesn't exist
   *
   * @example
   * ```ts
   * const user = await userRepo.getByEmailOrThrow("john@example.com");
   * ```
   */
  async getByEmailOrThrow(email: string): Promise<User> {
    this.logger.debug("Getting user by email or throw", { email });

    const user = await this.findByEmail(email);

    if (!user) {
      this.logger.warn("User not found", { email });
      throw new NotFoundError(`User not found: ${email}`, { email });
    }

    return user;
  }

  /**
   * Check if user exists by ID
   *
   * @param userId - User identifier
   * @returns True if user exists, false otherwise
   *
   * @example
   * ```ts
   * const exists = await userRepo.exists("user_123");
   * ```
   */
  async exists(userId: string): Promise<boolean> {
    this.logger.debug("Checking if user exists", { userId });

    const user = await this.findById(userId);
    return user !== null;
  }

  /**
   * Search users by email pattern
   *
   * @param emailPattern - Email pattern to search (uses ILIKE)
   * @param limit - Maximum number of results
   * @returns Array of matching users
   *
   * @example
   * ```ts
   * const users = await userRepo.searchByEmail("%example.com%", 20);
   * ```
   */
  async searchByEmail(
    emailPattern: string,
    limit = 20
  ): Promise<User[]> {
    this.logger.debug("Searching users by email pattern", {
      emailPattern,
      limit,
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .ilike("email", emailPattern)
      .limit(limit);

    if (error) {
      this.logger.error("Failed to search users", {
        emailPattern,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found users", { count: data?.length ?? 0 });
    return (data as User[]) ?? [];
  }
}
