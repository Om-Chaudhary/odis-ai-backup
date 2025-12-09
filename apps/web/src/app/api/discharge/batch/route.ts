import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@odis/db/server";
import { DischargeBatchProcessor } from "@odis/services/discharge-batch-processor";
import { z } from "zod";
import { getUser } from "~/server/actions/auth";

/**
 * Process Discharge Batch API Route
 *
 * POST /api/discharge/batch
 *
 * Processes a batch of discharge cases, scheduling emails and calls
 * according to the specified times.
 */

// Input validation schema
const processBatchSchema = z.object({
  batchId: z.string().uuid(),
  emailScheduleTime: z.string().datetime(),
  callScheduleTime: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 },
      );
    }

    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validated = processBatchSchema.parse(body);

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from("discharge_batches")
      .select(`
        *,
        discharge_batch_items (
          case_id,
          patient_id
        )
      `)
      .eq("id", validated.batchId)
      .eq("user_id", user.id)
      .single();

    if (batchError ?? !batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 },
      );
    }

    // Check if batch is already being processed
    if (batch.status !== "pending") {
      return NextResponse.json(
        { error: "Batch is already being processed or completed" },
        { status: 400 },
      );
    }

    // Get eligible cases from batch items
    const batchItems = batch.discharge_batch_items as Array<{ case_id: string }>;
    const caseIds = batchItems.map((item) => item.case_id);

    // Fetch case details
    const { data: cases, error: casesError } = await supabase
      .from("cases")
      .select(`
        id,
        patients (
          id,
          name,
          owner_name,
          owner_email,
          owner_phone
        )
      `)
      .in("id", caseIds);

    if (casesError ?? !cases) {
      return NextResponse.json(
        { error: "Failed to fetch case details" },
        { status: 500 },
      );
    }

    // Transform to eligible cases format
    const eligibleCases = cases.map(caseData => {
      const patient = Array.isArray(caseData.patients)
        ? caseData.patients[0]
        : caseData.patients;

      return {
        id: caseData.id,
        patient_id: patient?.id ?? "",
        patient_name: patient?.name ?? "Unknown Patient",
        owner_name: patient?.owner_name ?? null,
        owner_email: patient?.owner_email ?? null,
        owner_phone: patient?.owner_phone ?? null,
        has_discharge_summary: true,
        has_scheduled_email: false,
        has_scheduled_call: false,
      };
    });

    // Initialize processor
    const processor = new DischargeBatchProcessor(supabase, user);

    // Process the batch
    const result = await processor.processBatch(eligibleCases, {
      batchId: validated.batchId,
      emailScheduleTime: new Date(validated.emailScheduleTime),
      callScheduleTime: new Date(validated.callScheduleTime),
      chunkSize: 10,
    });

    console.log(`[Batch Processing] Completed batch ${validated.batchId}`, {
      processedCount: result.processedCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
    });

    return NextResponse.json({
      success: result.success,
      processedCount: result.processedCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[Batch Processing] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Get batch status endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 },
      );
    }

    // Get batch status
    const { data: batch, error } = await supabase
      .from("discharge_batches")
      .select(`
        *,
        discharge_batch_items (
          id,
          case_id,
          status,
          email_scheduled,
          call_scheduled,
          error_message,
          processed_at
        )
      `)
      .eq("id", batchId)
      .eq("user_id", user.id)
      .single();

    if (error ?? !batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("[Batch Status] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}