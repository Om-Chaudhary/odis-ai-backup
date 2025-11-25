/**
 * POST /api/vapi/calls/create
 *
 * Creates a new VAPI veterinary follow-up call with full knowledge base integration.
 *
 * This endpoint:
 * 1. Validates the request body
 * 2. Authenticates the user
 * 3. Builds dynamic variables using the knowledge base system
 * 4. Stores the call request in Supabase
 * 5. Returns the call ID for tracking
 *
 * The actual VAPI call will be processed asynchronously by a background job.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import {
  createVapiCall,
  type CreateVapiCallInput,
} from "~/lib/vapi/call-manager";
import { z } from "zod";
import { handleCorsPreflightRequest, withCorsHeaders } from "~/lib/api/cors";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { getUser } from "~/server/actions/auth";

/**
 * Request body validation schema
 */
const CreateCallSchema = z.object({
  // Core required fields
  clinicName: z.string().min(1, "Clinic name is required"),
  agentName: z.string().min(1, "Agent name is required"),
  petName: z.string().min(1, "Pet name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone must be in E.164 format (e.g., +14155551234)",
    ),
  appointmentDate: z
    .string()
    .min(1, "Appointment date is required (spelled out)"),
  callType: z.enum(["discharge", "follow-up"]),
  clinicPhone: z.string().min(1, "Clinic phone is required (spelled out)"),
  emergencyPhone: z
    .string()
    .min(1, "Emergency phone is required (spelled out)"),
  dischargeSummary: z.string().min(1, "Discharge summary is required"),

  // Optional discharge fields
  subType: z.enum(["wellness", "vaccination"]).optional(),
  nextSteps: z.string().optional(),

  // Optional follow-up fields
  condition: z.string().optional(),
  conditionCategory: z
    .enum([
      "gastrointestinal",
      "post-surgical",
      "dermatological",
      "respiratory",
      "urinary",
      "orthopedic",
      "neurological",
      "ophthalmic",
      "cardiac",
      "endocrine",
      "dental",
      "wound-care",
      "behavioral",
      "pain-management",
      "general",
    ])
    .optional(),
  medications: z.string().optional(),
  recheckDate: z.string().optional(),

  // Optional metadata
  petSpecies: z.enum(["dog", "cat", "other"]).optional(),
  petAge: z.number().min(0).max(30).optional(),
  petWeight: z.number().min(0).max(300).optional(),
  daysSinceTreatment: z.number().min(0).max(365).optional(),

  // Call scheduling
  scheduledFor: z.string().datetime().optional(),

  // VAPI configuration overrides
  assistantId: z.string().optional(),
  phoneNumberId: z.string().optional(),
});

/**
 * Authenticate user from either cookies (web app) or Authorization header (extension)
 */
async function authenticateRequest(request: NextRequest) {
  // Check for Authorization header (browser extension)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // Create a Supabase client with the token
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for token-based auth
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, supabase: null };
    }

    return { user, supabase };
  }

  // Fall back to cookie-based auth (web app)
  const user = await getUser();
  if (!user) {
    return { user: null, supabase: null };
  }

  const supabase = await createClient();
  return { user, supabase };
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validation = CreateCallSchema.safeParse(body);

    if (!validation.success) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Validation failed",
            errors: validation.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 },
        ),
      );
    }

    const input: CreateVapiCallInput = validation.data;

    // Step 3: Additional validation for follow-up calls
    if (input.callType === "follow-up" && !input.condition) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Validation failed",
            errors: [
              {
                field: "condition",
                message: "Condition is required for follow-up calls",
              },
            ],
          },
          { status: 400 },
        ),
      );
    }

    // Step 4: Create the call
    const result = await createVapiCall(input, user.id);

    if (!result.success) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Failed to create call",
            errors: result.errors,
            warnings: result.warnings,
          },
          { status: 400 },
        ),
      );
    }

    // Step 5: Return success response
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          success: true,
          data: {
            callId: result.databaseId,
            status: result.status,
            scheduledFor: result.scheduledFor,
            message: result.scheduledFor
              ? "Call queued successfully and will be placed at the scheduled time"
              : "Call created successfully and will be processed shortly",
          },
          warnings: result.warnings,
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    console.error("Error creating VAPI call:", error);
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error: "Internal server error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
        { status: 500 },
      ),
    );
  }
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
