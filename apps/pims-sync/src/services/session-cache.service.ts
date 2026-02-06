/**
 * Session Cache Service
 *
 * Manages persistent session caching for PIMS authentication.
 * Encrypts cookies at rest using the same key as credentials.
 *
 * Session expiration strategy:
 * - Idle timeout: 20 minutes of inactivity
 * - Absolute timeout: 8 hours from creation
 */

import * as crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "../lib/supabase";
import { config } from "../config";
import { logger } from "../lib/logger";

const sessionCacheLogger = logger.child("session-cache");

/**
 * Type for pims_session_cache table row
 * NOTE: Run `pnpm update-types` after applying migration to get this in database.types.ts
 */
interface PimsSessionCacheRow {
  id: string;
  clinic_id: string;
  session_cookies: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
}

/** 20 minutes idle timeout */
const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
/** 8 hours absolute timeout */
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

/**
 * Cached session data
 */
export interface CachedSession {
  cookies: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

/**
 * Session Cache Service
 *
 * Caches PIMS session cookies in Supabase to reduce authentication frequency.
 * All cookies are encrypted at rest using AES-256-GCM.
 */
export class SessionCacheService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: SupabaseClient<any> = createSupabaseServiceClient();

  /**
   * Get cached session if valid (not idle-expired or absolute-expired)
   * @param clinicId - Clinic ID to look up session for
   * @returns Cached session or null if not found/expired
   */
  async getValidSession(clinicId: string): Promise<CachedSession | null> {
    const { data, error } = (await this.supabase
      .from("pims_session_cache")
      .select("session_cookies, created_at, last_used_at, expires_at")
      .eq("clinic_id", clinicId)
      .single()) as {
      data: Pick<
        PimsSessionCacheRow,
        "session_cookies" | "created_at" | "last_used_at" | "expires_at"
      > | null;
      error: { code: string; message: string } | null;
    };

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found, which is expected
        sessionCacheLogger.warn(
          `Error fetching session cache for clinic ${clinicId}: ${error.message}`,
        );
      }
      return null;
    }

    const now = Date.now();
    const lastUsed = new Date(data.last_used_at).getTime();
    const expiresAt = new Date(data.expires_at).getTime();

    // Check idle timeout (20 min of inactivity)
    if (now - lastUsed > IDLE_TIMEOUT_MS) {
      sessionCacheLogger.debug(
        `Session for clinic ${clinicId} expired due to idle timeout`,
      );
      await this.deleteSession(clinicId);
      return null;
    }

    // Check absolute timeout
    if (now > expiresAt) {
      sessionCacheLogger.debug(
        `Session for clinic ${clinicId} expired due to absolute timeout`,
      );
      await this.deleteSession(clinicId);
      return null;
    }

    // Decrypt cookies
    try {
      const cookies = this.decrypt(data.session_cookies);

      return {
        cookies,
        createdAt: new Date(data.created_at),
        lastUsedAt: new Date(data.last_used_at),
        expiresAt: new Date(data.expires_at),
      };
    } catch (decryptError) {
      sessionCacheLogger.error(
        `Failed to decrypt session for clinic ${clinicId}: ${decryptError instanceof Error ? decryptError.message : "Unknown error"}`,
      );
      await this.deleteSession(clinicId);
      return null;
    }
  }

  /**
   * Save session to cache
   * @param clinicId - Clinic ID to save session for
   * @param cookies - JSON stringified cookies to cache
   */
  async saveSession(clinicId: string, cookies: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS);

    const { error } = await this.supabase.from("pims_session_cache").upsert(
      {
        clinic_id: clinicId,
        session_cookies: this.encrypt(cookies),
        created_at: now.toISOString(),
        last_used_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: "clinic_id",
      },
    );

    if (error) {
      sessionCacheLogger.error(
        `Failed to save session for clinic ${clinicId}: ${error.message}`,
      );
      throw error;
    }

    sessionCacheLogger.info(
      `Saved session cache for clinic ${clinicId} (expires at ${expiresAt.toISOString()})`,
    );
  }

  /**
   * Update last_used_at to prevent idle expiration
   * @param clinicId - Clinic ID to touch session for
   */
  async touchSession(clinicId: string): Promise<void> {
    const { error } = await this.supabase
      .from("pims_session_cache")
      .update({ last_used_at: new Date().toISOString() })
      .eq("clinic_id", clinicId);

    if (error) {
      sessionCacheLogger.warn(
        `Failed to touch session for clinic ${clinicId}: ${error.message}`,
      );
    } else {
      sessionCacheLogger.debug(`Touched session for clinic ${clinicId}`);
    }
  }

  /**
   * Delete session (on logout or invalid session)
   * @param clinicId - Clinic ID to delete session for
   */
  async deleteSession(clinicId: string): Promise<void> {
    const { error } = await this.supabase
      .from("pims_session_cache")
      .delete()
      .eq("clinic_id", clinicId);

    if (error) {
      sessionCacheLogger.warn(
        `Failed to delete session for clinic ${clinicId}: ${error.message}`,
      );
    } else {
      sessionCacheLogger.debug(`Deleted session cache for clinic ${clinicId}`);
    }
  }

  /**
   * Encrypt text using AES-256-GCM
   * Uses IDEXX_ENCRYPTION_KEY for consistency with credential encryption
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(config.IDEXX_ENCRYPTION_KEY, "salt", 32);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  }

  /**
   * Decrypt text using AES-256-GCM
   */
  private decrypt(encryptedText: string): string {
    const buffer = Buffer.from(encryptedText, "base64");
    const iv = buffer.subarray(0, 16);
    const tag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);
    const key = crypto.scryptSync(config.IDEXX_ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }
}
