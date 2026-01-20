/**
 * IDEXX Credential Manager
 *
 * Manages IDEXX Neo credentials with encryption, validation, and rotation support.
 * Uses AES-256-GCM encryption for secure storage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@odis-ai/data-access/db";
import { decrypt, encrypt } from "@odis-ai/shared/crypto/aes-encryption";

export interface IdexxCredentials {
  username: string;
  password: string;
  companyId: string;
}

export interface StoredCredential {
  id: string;
  user_id: string;
  clinic_id: string | null;
  encryption_key_id: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  username_encrypted: unknown;
  password_encrypted: unknown;
  company_id_encrypted: unknown;
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
   * @param companyId - IDEXX company ID
   * @param keyId - Encryption key ID (default: 'default')
   * @returns Credential record ID
   */
  async storeCredentials(
    userId: string,
    clinicId: string | null,
    username: string,
    password: string,
    companyId: string,
    keyId = "default",
  ): Promise<{ id: string }> {
    // Encrypt credentials
    const { encrypted: usernameEncrypted } = encrypt(username, keyId);
    const { encrypted: passwordEncrypted } = encrypt(password, keyId);
    const { encrypted: companyIdEncrypted } = encrypt(companyId, keyId);

    // Deactivate any existing active credentials for this user/clinic
    await this.deactivateCredentials(userId, clinicId);

    // Convert Buffers to hex string with \x prefix for PostgreSQL bytea
    // Supabase JS client doesn't properly handle binary data, so use hex encoding
    const usernameHex = "\\x" + usernameEncrypted.toString("hex");
    const passwordHex = "\\x" + passwordEncrypted.toString("hex");
    const companyIdHex = "\\x" + companyIdEncrypted.toString("hex");

    // Insert new credential record
    const { data, error } = await this.supabase
      .from("idexx_credentials")
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        username_encrypted: usernameHex,
        password_encrypted: passwordHex,
        company_id_encrypted: companyIdHex,
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
      // Supabase returns bytea as Uint8Array - convert to Buffer for decryption
      const usernameData = credential.username_encrypted;
      const passwordData = credential.password_encrypted;
      const companyIdData = credential.company_id_encrypted;

      // Handle different formats that Supabase might return for bytea
      // Supabase JS client returns bytea as hex string with \x prefix
      const parseByteaData = (data: unknown): Buffer => {
        if (data instanceof Uint8Array) {
          return Buffer.from(data);
        }
        if (Buffer.isBuffer(data)) {
          return data;
        }
        if (typeof data === "string") {
          // Supabase returns bytea as hex string with \x prefix
          if (data.startsWith("\\x")) {
            return Buffer.from(data.slice(2), "hex");
          }
          // Try plain hex
          return Buffer.from(data, "hex");
        }
        throw new Error(`Unexpected bytea data type: ${typeof data}`);
      };

      const usernameEncryptedBuffer = parseByteaData(usernameData);
      const passwordEncryptedBuffer = parseByteaData(passwordData);
      const username = decrypt(
        usernameEncryptedBuffer,
        credential.encryption_key_id,
      );
      const password = decrypt(
        passwordEncryptedBuffer,
        credential.encryption_key_id,
      );

      // Decrypt company ID (may not exist for older credentials)
      let companyId = "";
      console.log("[IdexxCredentialManager] company_id_encrypted data:", {
        hasData: !!companyIdData,
        dataType: typeof companyIdData,
        isUint8Array: companyIdData instanceof Uint8Array,
        isBuffer: Buffer.isBuffer(companyIdData),
        stringPreview:
          typeof companyIdData === "string"
            ? companyIdData.substring(0, 20)
            : "N/A",
      });

      if (companyIdData) {
        const companyIdEncryptedBuffer = parseByteaData(companyIdData);
        console.log("[IdexxCredentialManager] Parsed buffer length:", {
          length: companyIdEncryptedBuffer.length,
        });
        companyId = decrypt(
          companyIdEncryptedBuffer,
          credential.encryption_key_id,
        );
        console.log("[IdexxCredentialManager] Decrypted company ID:", {
          value: companyId,
          length: companyId.length,
        });
      } else {
        console.log(
          "[IdexxCredentialManager] No company_id_encrypted data found",
        );
      }

      // Update last_used_at
      await this.supabase
        .from("idexx_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", credential.id);

      return { username, password, companyId };
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
   * @param companyId - IDEXX company ID
   * @returns true if credentials are valid, false otherwise
   */
  async validateCredentials(
    username: string,
    password: string,
    companyId: string,
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
    // 2. Fill in company ID, username, and password
    // 3. Submit form
    // 4. Check for successful redirect or error message
    // 5. Return true if login successful, false otherwise

    // Placeholder: basic validation (non-empty)
    if (!username || !password || !companyId) {
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

        // Handle company_id if present
        let companyIdEncryptedNew: Buffer | null = null;
        if (credential.company_id_encrypted) {
          const companyIdEncryptedBuffer = Buffer.from(
            credential.company_id_encrypted as unknown as Uint8Array,
          );
          const companyId = decrypt(
            companyIdEncryptedBuffer,
            credential.encryption_key_id,
          );
          companyIdEncryptedNew = encrypt(companyId, newKeyId).encrypted;
        }

        // Update credential record
        const updateData: Record<string, unknown> = {
          username_encrypted: usernameEncryptedNew,
          password_encrypted: passwordEncryptedNew,
          encryption_key_id: newKeyId,
          updated_at: new Date().toISOString(),
        };
        if (companyIdEncryptedNew) {
          updateData.company_id_encrypted = companyIdEncryptedNew;
        }

        const { error: updateError } = await this.supabase
          .from("idexx_credentials")
          .update(updateData)
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
