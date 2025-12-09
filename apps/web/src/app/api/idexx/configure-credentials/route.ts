/**
 * Configure IDEXX Credentials API Endpoint
 *
 * POST /api/idexx/configure-credentials
 *
 * Stores and validates IDEXX Neo credentials with AES-256-GCM encryption.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@odis-ai/db/server";
import { getUser } from "~/server/actions/auth";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/api/cors";
import { IdexxCredentialManager } from "@odis-ai/idexx/credential-manager";
import { validateIdexxCredentials } from "@odis-ai/idexx/validation";

const configureCredentialsSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(255, "Username must be 255 characters or less"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(500, "Password must be 500 characters or less"),
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
    console.error("[CONFIGURE_CREDENTIALS] Failed to log audit event:", error);
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

/**
 * Configure IDEXX Credentials
 *
 * POST /api/idexx/configure-credentials
 *
 * Request body:
 * {
 *   username: string
 *   password: string
 *   clinicId?: string | null
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   validationStatus: 'valid' | 'invalid' | 'unknown'
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
    const body = await request.json();
    const validated = configureCredentialsSchema.parse(body);

    // Validate credentials with IDEXX Neo
    const validationResult = await validateIdexxCredentials(
      validated.username,
      validated.password,
    );

    const validationStatus = validationResult.valid
      ? ("valid" as const)
      : ("invalid" as const);
    const lastValidated = new Date().toISOString();

    // Store credentials if validation passed
    if (validationResult.valid) {
      try {
        const credentialManager = await IdexxCredentialManager.create();
        await credentialManager.storeCredentials(
          user.id,
          validated.clinicId ?? null,
          validated.username,
          validated.password,
        );

        // Log successful configuration
        await logAuditEvent(
          supabase,
          user.id,
          validated.clinicId ?? null,
          "credential_configured",
          "success",
          {
            validation_status: validationStatus,
            last_validated: lastValidated,
          },
          request,
        );

        return withCorsHeaders(
          request,
          NextResponse.json({
            success: true,
            validationStatus,
            lastValidated,
          }),
        );
      } catch (error) {
        console.error(
          "[CONFIGURE_CREDENTIALS] Failed to store credentials:",
          error,
        );

        // Log failure
        await logAuditEvent(
          supabase,
          user.id,
          validated.clinicId ?? null,
          "credential_configured",
          "failed",
          {
            error: error instanceof Error ? error.message : "Unknown error",
            validation_status: validationStatus,
          },
          request,
        );

        return withCorsHeaders(
          request,
          NextResponse.json(
            {
              success: false,
              validationStatus,
              lastValidated,
              error: "Failed to store credentials",
            },
            { status: 500 },
          ),
        );
      }
    } else {
      // Log validation failure
      await logAuditEvent(
        supabase,
        user.id,
        validated.clinicId ?? null,
        "credential_configured",
        "failed",
        {
          validation_status: validationStatus,
          error: validationResult.error ?? "Invalid credentials",
        },
        request,
      );

      return withCorsHeaders(
        request,
        NextResponse.json({
          success: false,
          validationStatus,
          lastValidated,
          error: validationResult.error ?? "Invalid credentials",
        }),
      );
    }
  } catch (error) {
    console.error("[CONFIGURE_CREDENTIALS] Error:", error);

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
