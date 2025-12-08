/**
 * IDEXX Credential Manager
 *
 * Manages IDEXX Neo credentials with encryption, validation, and rotation support.
 * Uses AES-256-GCM encryption for secure storage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "~/lib/supabase/server";
import { decrypt, encrypt } from "~/lib/crypto/aes-encryption";

export interface IdexxCredentials {
  username: string;
  password: string;
}

export interface StoredCredential {
  id: string;
  userId: string;
  clinicId: string | null;
  encryptionKeyId: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  username_encrypted: unknown;
  password_encrypted: unknown;
}

/**
 * IDEXX Credential Manager
 *
 * Handles secure storage, retrieval, validation, and rotation of IDEXX Neo credentials.
 */
export class IdexxCredentialManager {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      // Service client creation is async, but we'll handle it in methods
      // For now, we'll require it to be passed in or create it per-method
      throw new Error(
        "Supabase client must be provided. Use IdexxCredentialManager.create() for async initialization.",
      );
    }
  }

  /**
   * Create a new IdexxCredentialManager instance with service client
   */
  static async create(): Promise<IdexxCredentialManager> {
    const supabase = await createServiceClient();
    return new IdexxCredentialManager(supabase as unknown as SupabaseClient);
  }

  /**
   * Store IDEXX credentials with encryption
   *
   * @param userId - User ID
   * @param clinicId - Optional clinic ID
   * @param username - IDEXX username
   * @param password - IDEXX password
   * @param keyId - Encryption key ID (default: 'default')
   * @returns Credential record ID
   */
  async storeCredentials(
    userId: string,
    clinicId: string | null,
    username: string,
    password: string,
    keyId = "default",
  ): Promise<{ id: string }> {
    // Encrypt credentials
    const { encrypted: usernameEncrypted } = encrypt(username, keyId);
    const { encrypted: passwordEncrypted } = encrypt(password, keyId);

    // Deactivate any existing active credentials for this user/clinic
    await this.deactivateCredentials(userId, clinicId);

    // Insert new credential record
    const { data, error } = await this.supabase
      .from("idexx_credentials")
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        username_encrypted: usernameEncrypted,
        password_encrypted: passwordEncrypted,
        encryption_key_id: keyId,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to store credentials: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to store credentials: No data returned");
    }

    return { id: data.id };
  }

  /**
   * Retrieve and decrypt IDEXX credentials
   *
   * @param userId - User ID
   * @param clinicId - Optional clinic ID (if provided, only returns credentials for that clinic)
   * @returns Decrypted credentials or null if not found
   */
  async getCredentials(
    userId: string,
    clinicId?: string | null,
  ): Promise<IdexxCredentials | null> {
    // Build query
    let query = this.supabase
      .from("idexx_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    // Filter by clinic if provided
    if (clinicId !== undefined) {
      if (clinicId === null) {
        query = query.is("clinic_id", null);
      } else {
        query = query.eq("clinic_id", clinicId);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve credentials: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const credential = data[0] as unknown as StoredCredential;

    // Decrypt credentials
    try {
      const usernameEncryptedBuffer = Buffer.from(
        credential.username_encrypted as Uint8Array,
      );
      const passwordEncryptedBuffer = Buffer.from(
        credential.password_encrypted as Uint8Array,
      );
      const username = decrypt(
        usernameEncryptedBuffer,
        credential.encryptionKeyId,
      );
      const password = decrypt(
        passwordEncryptedBuffer,
        credential.encryptionKeyId,
      );

      // Update last_used_at
      await this.supabase
        .from("idexx_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", credential.id);

      return { username, password };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to decrypt credentials: ${errorMessage}`);
    }
  }

  /**
   * Validate IDEXX credentials by attempting login
   *
   * Note: This is a placeholder implementation. In production, this should use
   * Playwright or an HTTP client to test login with IDEXX Neo.
   *
   * @param username - IDEXX username
   * @param password - IDEXX password
   * @returns true if credentials are valid, false otherwise
   */
  async validateCredentials(
    username: string,
    password: string,
  ): Promise<boolean> {
    // TODO: Implement actual IDEXX Neo login validation
    // This could use Playwright to navigate to IDEXX Neo login page
    // and verify successful authentication
    //
    // For now, return true as a placeholder (actual validation should be implemented
    // in the API endpoint where we have access to Playwright or HTTP client)
    //
    // Example implementation would be:
    // 1. Navigate to IDEXX Neo login page
    // 2. Fill in username and password
    // 3. Submit form
    // 4. Check for successful redirect or error message
    // 5. Return true if login successful, false otherwise

    // Placeholder: basic validation (non-empty)
    if (!username || !password) {
      return false;
    }

    // In production, this should make an actual HTTP request or use Playwright
    // to test the credentials against IDEXX Neo
    throw new Error(
      "validateCredentials not fully implemented. Use the API endpoint /api/idexx/validate-credentials which will implement Playwright validation.",
    );
  }

  /**
   * Rotate credentials to use a new encryption key
   *
   * @param userId - User ID
   * @param newKeyId - New encryption key ID (e.g., 'v2')
   * @returns Number of credentials rotated
   */
  async rotateCredentials(userId: string, newKeyId: string): Promise<number> {
    // Get all active credentials for user
    const { data: credentials, error: fetchError } = await this.supabase
      .from("idexx_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (fetchError) {
      throw new Error(
        `Failed to fetch credentials for rotation: ${fetchError.message}`,
      );
    }

    if (!credentials || credentials.length === 0) {
      return 0;
    }

    let rotatedCount = 0;

    // Re-encrypt each credential with new key
    for (const credential of credentials) {
      try {
        // Decrypt with old key
        const usernameEncryptedBuffer = Buffer.from(
          credential.username_encrypted as unknown as Uint8Array,
        );
        const passwordEncryptedBuffer = Buffer.from(
          credential.password_encrypted as unknown as Uint8Array,
        );
        const username = decrypt(
          usernameEncryptedBuffer,
          credential.encryption_key_id,
        );
        const password = decrypt(
          passwordEncryptedBuffer,
          credential.encryption_key_id,
        );

        // Re-encrypt with new key
        const { encrypted: usernameEncryptedNew } = encrypt(username, newKeyId);
        const { encrypted: passwordEncryptedNew } = encrypt(password, newKeyId);

        // Update credential record
        const { error: updateError } = await this.supabase
          .from("idexx_credentials")
          .update({
            username_encrypted: usernameEncryptedNew,
            password_encrypted: passwordEncryptedNew,
            encryption_key_id: newKeyId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", credential.id);

        if (updateError) {
          console.error(
            `Failed to rotate credential ${credential.id}:`,
            updateError,
          );
          continue;
        }

        rotatedCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to decrypt credential ${credential.id} for rotation:`,
          errorMessage,
        );
        // Continue with other credentials
      }
    }

    return rotatedCount;
  }

  /**
   * Deactivate credentials for a user
   *
   * @param userId - User ID
   * @param clinicId - Optional clinic ID (if provided, only deactivates credentials for that clinic)
   */
  async deactivateCredentials(
    userId: string,
    clinicId?: string | null,
  ): Promise<void> {
    let query = this.supabase
      .from("idexx_credentials")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (clinicId !== undefined) {
      if (clinicId === null) {
        query = query.is("clinic_id", null);
      } else {
        query = query.eq("clinic_id", clinicId);
      }
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to deactivate credentials: ${error.message}`);
    }
  }

  /**
   * Get credential status for a user
   *
   * @param userId - User ID
   * @param clinicId - Optional clinic ID
   * @returns Credential status information
   */
  async getCredentialStatus(
    userId: string,
    clinicId?: string | null,
  ): Promise<{
    hasCredentials: boolean;
    isActive: boolean;
    lastUsedAt: string | null;
    encryptionKeyId: string | null;
  }> {
    let query = this.supabase
      .from("idexx_credentials")
      .select("is_active, last_used_at, encryption_key_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (clinicId !== undefined) {
      if (clinicId === null) {
        query = query.is("clinic_id", null);
      } else {
        query = query.eq("clinic_id", clinicId);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get credential status: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        hasCredentials: false,
        isActive: false,
        lastUsedAt: null,
        encryptionKeyId: null,
      };
    }

    const credential = data[0] as {
      is_active: boolean;
      last_used_at: string | null;
      encryption_key_id: string;
    };

    return {
      hasCredentials: true,
      isActive: credential.is_active,
      lastUsedAt: credential.last_used_at,
      encryptionKeyId: credential.encryption_key_id,
    };
  }
}
