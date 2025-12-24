/**
 * User Repository Interface
 *
 * Contract for database operations on users table.
 * Enables dependency injection and testability.
 *
 * @example
 * ```ts
 * class UserService {
 *   constructor(private userRepo: IUserRepository) {}
 *
 *   async getUserProfile(id: string) {
 *     return this.userRepo.findById(id);
 *   }
 * }
 * ```
 */

/**
 * User entity
 */
export interface User extends Record<string, unknown> {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * User settings/preferences type
 * Extend as needed for application-specific settings
 */
export interface UserSettings {
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  preferences?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * User repository interface
 */
export interface IUserRepository {
  /**
   * Find a user by ID
   *
   * @param id - User identifier
   * @returns User if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email address
   *
   * @param email - User email address
   * @returns User if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Get user by ID or throw error if not found
   *
   * @param userId - User identifier
   * @returns User record
   * @throws NotFoundError if user doesn't exist
   */
  getByIdOrThrow(userId: string): Promise<User>;

  /**
   * Get user by email or throw error if not found
   *
   * @param email - User email address
   * @returns User record
   * @throws NotFoundError if user doesn't exist
   */
  getByEmailOrThrow(email: string): Promise<User>;

  /**
   * Check if user exists by ID
   *
   * @param userId - User identifier
   * @returns True if user exists, false otherwise
   */
  exists(userId: string): Promise<boolean>;

  /**
   * Search users by email pattern
   *
   * @param emailPattern - Email pattern to search (uses ILIKE)
   * @param limit - Maximum number of results
   * @returns Array of matching users
   */
  searchByEmail(emailPattern: string, limit?: number): Promise<User[]>;

  /**
   * Get user settings/preferences
   *
   * @param userId - User identifier
   * @returns User settings if available, null otherwise
   */
  getSettings(userId: string): Promise<UserSettings | null>;

  /**
   * Create a new user
   *
   * @param data - User data (without auto-generated fields)
   * @returns Created user with all fields
   */
  create(data: Partial<User>): Promise<User>;

  /**
   * Update a user by ID
   *
   * @param id - User identifier
   * @param data - Fields to update
   * @returns Updated user
   */
  update(id: string, data: Partial<User>): Promise<User>;

  /**
   * Update user settings/preferences
   *
   * @param userId - User identifier
   * @param settings - Settings to merge with existing
   * @returns Updated user
   */
  updateSettings(
    userId: string,
    settings: Partial<UserSettings>,
  ): Promise<User>;

  /**
   * Delete a user by ID
   *
   * @param id - User identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Count users by criteria
   *
   * @param criteria - Optional criteria to filter users
   * @returns Total count of matching users
   */
  count(criteria?: Record<string, unknown>): Promise<number>;
}
