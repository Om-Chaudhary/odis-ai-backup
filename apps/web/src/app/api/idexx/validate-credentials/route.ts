/**
 * Validate IDEXX Credentials API Endpoint
 *
 * POST /api/idexx/validate-credentials
 *
 * Validates IDEXX Neo credentials by attempting login.
 * Can validate provided credentials or stored credentials.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@odis-ai/data-access/db/server";
import { getUser } from "~/server/actions/auth";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/data-access/api/cors";
import { IdexxCredentialManager } from "@odis-ai/integrations/idexx/credential-manager";
import { validateIdexxCredentials } from "@odis-ai/integrations/idexx/validation";

const validateCredentialsSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  clinicId: z.string().uuid().optional().nullable(),
});

/**
 * Log credential operation to audit log
 */
async function logAuditEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  clinicId: string | null,
  actionType: string,
  status: string,
  details: Record<string, unknown>,
  request: NextRequest,
) {
  try {
    await supabase.from("idexx_sync_audit_log").insert({
      user_id: userId,
      clinic_id: clinicId,
      action_type: actionType,
      resource_type: "credential",
      status,
      details,
      ip_address:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        null,
      user_agent: request.headers.get("user-agent") ?? null,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error("[VALIDATE_CREDENTIALS] Failed to log audit event:", error);
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

/**
 * Validate IDEXX Credentials
 *
 * POST /api/idexx/validate-credentials
 *
 * Request body (optional):
 * {
 *   username?: string  // If omitted, uses stored credentials
 *   password?: string   // If omitted, uses stored credentials
 *   clinicId?: string | null
 * }
 *
 * Response:
 * {
 *   valid: boolean
 *   lastValidated: string (ISO timestamp)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validated = validateCredentialsSchema.parse(body);

    let username: string;
    let password: string;
    let usingStoredCredentials = false;

    // Get credentials (provided or stored)
    if (validated.username && validated.password) {
      // Use provided credentials
      username = validated.username;
      password = validated.password;
    } else {
      // Retrieve stored credentials
      const credentialManager = await IdexxCredentialManager.create();
      const stored = await credentialManager.getCredentials(
        user.id,
        validated.clinicId ?? null,
      );

      if (!stored) {
        // Log access attempt
        await logAuditEvent(
          supabase,
          user.id,
          validated.clinicId ?? null,
          "credential_accessed",
          "failed",
          {
            error: "No stored credentials found",
          },
          request,
        );

        return withCorsHeaders(
          request,
          NextResponse.json(
            {
              error:
                "No stored credentials found. Please configure credentials first.",
            },
            { status: 404 },
          ),
        );
      }

      username = stored.username;
      password = stored.password;
      usingStoredCredentials = true;

      // Log credential access
      await logAuditEvent(
        supabase,
        user.id,
        validated.clinicId ?? null,
        "credential_accessed",
        "success",
        {
          using_stored: true,
        },
        request,
      );
    }

    // Validate credentials
    const validationResult = await validateIdexxCredentials(username, password);
    const lastValidated = new Date().toISOString();

    // Note: getCredentials() already updates last_used_at, so no need to update again here

    // Log validation result
    await logAuditEvent(
      supabase,
      user.id,
      validated.clinicId ?? null,
      "credential_validated",
      validationResult.valid ? "success" : "failed",
      {
        validation_result: validationResult.valid,
        using_stored: usingStoredCredentials,
        last_validated: lastValidated,
        error: validationResult.error,
      },
      request,
    );

    return withCorsHeaders(
      request,
      NextResponse.json({
        valid: validationResult.valid,
        lastValidated,
        error: validationResult.error,
      }),
    );
  } catch (error) {
    console.error("[VALIDATE_CREDENTIALS] Error:", error);

    if (error instanceof z.ZodError) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Invalid request body", details: error.errors },
          { status: 400 },
        ),
      );
    }

    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}
