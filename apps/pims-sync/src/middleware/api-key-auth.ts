/**
 * API Key Authentication Middleware
 *
 * Validates X-API-Key header against clinic_api_keys table.
 * Uses key_prefix for fast lookup, then validates full hash.
 */

import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { logger } from "../lib/logger";
import { createSupabaseServiceClient } from "../lib/supabase";

/**
 * Authenticated request with clinic context
 */
export interface AuthenticatedRequest extends Request {
  clinic: {
    id: string;
    apiKeyId: string;
    permissions: string[] | null;
  };
}

/**
 * API key validation result
 */
interface ApiKeyValidation {
  valid: boolean;
  clinicId?: string;
  apiKeyId?: string;
  permissions?: string[] | null;
  error?: string;
}

/**
 * Hash an API key for comparison
 */
function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Extract prefix from API key (first 8 characters)
 */
function getKeyPrefix(key: string): string {
  return key.slice(0, 8);
}

/**
 * Validate API key against database
 */
async function validateApiKey(apiKey: string): Promise<ApiKeyValidation> {
  try {
    const supabase = createSupabaseServiceClient();

    const prefix = getKeyPrefix(apiKey);
    const hash = hashApiKey(apiKey);

    // Look up key by prefix first (fast indexed lookup)
    const { data: keyRecord, error } = await supabase
      .from("clinic_api_keys")
      .select("id, clinic_id, key_hash, is_active, expires_at, permissions")
      .eq("key_prefix", prefix)
      .maybeSingle();

    if (error) {
      logger.error(`API key lookup failed: ${error.message}`);
      return { valid: false, error: "Database error" };
    }

    if (!keyRecord) {
      return { valid: false, error: "Invalid API key" };
    }

    // Verify hash matches (timing-safe comparison would be better, but this is acceptable)
    if (keyRecord.key_hash !== hash) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check if key is active
    if (!keyRecord.is_active) {
      return { valid: false, error: "API key is disabled" };
    }

    // Check expiration
    if (keyRecord.expires_at) {
      const expiresAt = new Date(keyRecord.expires_at);
      if (expiresAt < new Date()) {
        return { valid: false, error: "API key has expired" };
      }
    }

    // Update last_used_at (fire and forget)
    void supabase
      .from("clinic_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRecord.id);

    // Parse permissions
    const permissions = keyRecord.permissions as string[] | null;

    return {
      valid: true,
      clinicId: keyRecord.clinic_id,
      apiKeyId: keyRecord.id,
      permissions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`API key validation error: ${message}`);
    return { valid: false, error: "Validation failed" };
  }
}

/**
 * API Key authentication middleware
 *
 * Expects X-API-Key header with a valid clinic API key.
 * On success, attaches clinic context to request.
 */
export function apiKeyAuth() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      res.status(401).json({
        success: false,
        error: "Missing X-API-Key header",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const validation = await validateApiKey(apiKey);

    if (!validation.valid) {
      logger.warn(`API key auth failed: ${validation.error}`, {
        keyPrefix: getKeyPrefix(apiKey),
      });

      res.status(401).json({
        success: false,
        error: validation.error ?? "Authentication failed",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach clinic context to request
    (req as AuthenticatedRequest).clinic = {
      id: validation.clinicId!,
      apiKeyId: validation.apiKeyId!,
      permissions: validation.permissions ?? null,
    };

    logger.debug("API key authenticated", {
      clinicId: validation.clinicId,
      apiKeyId: validation.apiKeyId,
    });

    next();
  };
}

/**
 * Permission check middleware
 *
 * Checks if the authenticated API key has the required permission.
 * Must be used after apiKeyAuth middleware.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.clinic) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { permissions } = authReq.clinic;

    // If no permissions array, allow all (backwards compatibility)
    if (!permissions || permissions.length === 0) {
      next();
      return;
    }

    // Check for wildcard or specific permission
    if (permissions.includes("*") || permissions.includes(permission)) {
      next();
      return;
    }

    logger.warn("Permission denied", {
      clinicId: authReq.clinic.id,
      required: permission,
      has: permissions,
    });

    res.status(403).json({
      success: false,
      error: `Permission denied: ${permission}`,
      timestamp: new Date().toISOString(),
    });
  };
}
