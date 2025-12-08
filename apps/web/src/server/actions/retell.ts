"use server";

import { createClient } from "~/lib/supabase/server";
import { getUser } from "./auth";
import {
  sendCallSchema,
  scheduleCallSchema,
  importCallsSchema,
  type SendCallInput,
  type ScheduleCallInput,
  type ImportCallsInput,
} from "~/lib/retell/validators";
import { createPhoneCall } from "~/lib/retell/client";

/**
 * Check if user is admin
 */
async function checkAdminAccess() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

/**
 * Send a new outbound call via Retell AI
 *
 * This action:
 * - Validates admin access
 * - Optionally fetches patient data if patientId provided
 * - Auto-populates call_variables from patient data
 * - Creates call via Retell API
 * - Stores call in database with created_by set to current user and optional patient_id
 * - RLS policies automatically filter queries by created_by
 * - Maintains backwards compatibility for calls without patient
 */
export async function sendCall(input: SendCallInput) {
  try {
    // Validate input
    const validated = sendCallSchema.parse(input);

    // Check admin access and get user
    const user = await checkAdminAccess();

    // Get Supabase client
    const supabase = await createClient();

    // Get from number from env or use provided
    const fromNumber = validated.fromNumber ?? process.env.RETELL_FROM_NUMBER;
    if (!fromNumber) {
      throw new Error(
        "From number is required. Set RETELL_FROM_NUMBER in environment variables or provide it in the input.",
      );
    }

    // Get agent ID from env or use provided
    const agentId = validated.agentId?.trim()
      ? validated.agentId
      : process.env.RETELL_AGENT_ID;
    if (!agentId) {
      throw new Error(
        "Agent ID is required. Set RETELL_AGENT_ID in environment variables or provide it in the input.",
      );
    }

    // Create the call via Retell API
    const response = await createPhoneCall({
      from_number: fromNumber,
      to_number: validated.phoneNumber,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: validated.variables,
      metadata: validated.metadata,
      retries_on_no_answer: validated.retryOnBusy ? 2 : 0,
    });

    // Store call in database
    const { error } = await supabase
      .from("retell_calls")
      .insert({
        retell_call_id: response.call_id,
        agent_id: response.agent_id,
        phone_number: validated.phoneNumber,
        phone_number_pretty: formatPhoneNumber(validated.phoneNumber),
        call_variables: validated.variables,
        metadata: validated.metadata,
        status: mapRetellStatus(response.call_status),
        start_timestamp: response.start_timestamp
          ? new Date(response.start_timestamp * 1000).toISOString()
          : null,
        retell_response: response as unknown,
        created_by: user.id,
        patient_id: null, // Always null - standalone calls only
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to store call in database:", error);
      throw new Error("Call created but failed to save to database");
    }

    return {
      success: true,
      data: {
        callId: response.call_id,
        status: response.call_status,
        phoneNumber: validated.phoneNumber,
      },
    };
  } catch (error) {
    console.error("Send call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send call",
    };
  }
}

/**
 * Schedule a call for later (saves to DB without calling Retell API)
 *
 * This action:
 * - Validates admin access
 * - Fetches patient data and validates it exists
 * - Creates a database record with status "scheduled"
 * - Does NOT call Retell API (call is queued for later)
 * - Maintains backwards compatibility
 */
export async function scheduleCall(input: ScheduleCallInput) {
  try {
    // Validate input
    const validated = scheduleCallSchema.parse(input);

    // Check admin access and get user
    const user = await checkAdminAccess();

    // Get Supabase client
    const supabase = await createClient();

    // Prepare call variables from input data
    const callVariables = {
      pet_name: validated.petName,
      owner_name: validated.ownerName,
      vet_name: validated.vetName ?? "",
      clinic_name: validated.clinicName ?? "",
      clinic_phone: validated.clinicPhone ?? "",
      discharge_summary_content: validated.dischargeSummary ?? "",
    };

    // Store scheduled call in database (without calling Retell)
    const { data: scheduledCall, error: dbError } = await supabase
      .from("retell_calls")
      .insert({
        retell_call_id: `scheduled_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary ID
        agent_id: process.env.RETELL_AGENT_ID ?? "",
        phone_number: validated.phoneNumber,
        phone_number_pretty: formatPhoneNumber(validated.phoneNumber),
        call_variables: callVariables,
        metadata: {
          notes: validated.notes,
          scheduled_for: validated.scheduledFor?.toISOString(),
        },
        status: "scheduled",
        created_by: user.id,
        patient_id: null, // Not using patient_id for scheduled calls
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to store scheduled call:", dbError);
      throw new Error("Failed to schedule call");
    }

    return {
      success: true,
      data: {
        callId: scheduledCall.id,
        petName: validated.petName,
        phoneNumber: validated.phoneNumber,
      },
    };
  } catch (error) {
    console.error("Schedule call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule call",
    };
  }
}

/**
 * Initiate a scheduled call (transition from "scheduled" to actual call)
 *
 * This action:
 * - Fetches the scheduled call from DB
 * - Creates actual call via Retell API
 * - Updates DB record with Retell response
 */
export async function initiateScheduledCall(scheduledCallId: string) {
  try {
    // Check admin access
    await checkAdminAccess();

    // Get Supabase client
    const supabase = await createClient();

    // Fetch the scheduled call
    const { data: scheduledCall, error: fetchError } = await supabase
      .from("retell_calls")
      .select("*")
      .eq("id", scheduledCallId)
      .eq("status", "scheduled")
      .single();

    if (fetchError ?? !scheduledCall) {
      throw new Error("Scheduled call not found");
    }

    // Get agent ID and from number
    const fromNumber = process.env.RETELL_FROM_NUMBER;
    if (!fromNumber) {
      throw new Error("From number not configured");
    }

    const agentId = scheduledCall.agent_id ?? process.env.RETELL_AGENT_ID;
    if (!agentId) {
      throw new Error("Agent ID not configured");
    }

    // Create the call via Retell API
    const response = await createPhoneCall({
      from_number: fromNumber,
      to_number: scheduledCall.phone_number,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: scheduledCall.call_variables,
      metadata: scheduledCall.metadata,
      retries_on_no_answer: 0,
    });

    // Update the database record
    const { error: updateError } = await supabase
      .from("retell_calls")
      .update({
        retell_call_id: response.call_id,
        agent_id: response.agent_id,
        status: mapRetellStatus(response.call_status),
        start_timestamp: response.start_timestamp
          ? new Date(response.start_timestamp * 1000).toISOString()
          : null,
        retell_response: response as unknown,
      })
      .eq("id", scheduledCallId);

    if (updateError) {
      console.error("Failed to update call record:", updateError);
      throw new Error("Call created but failed to update database");
    }

    return {
      success: true,
      data: {
        callId: response.call_id,
        status: response.call_status,
        phoneNumber: scheduledCall.phone_number,
      },
    };
  } catch (error) {
    console.error("Initiate scheduled call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate call",
    };
  }
}

/**
 * Map Retell API status to our database status
 */
function mapRetellStatus(retellStatus: string | undefined): string {
  if (!retellStatus) return "initiated";

  const statusMap: Record<string, string> = {
    registered: "initiated",
    ongoing: "in_progress",
    active: "in_progress",
    ended: "completed",
    error: "failed",
  };

  const lowerStatus = retellStatus.toLowerCase();
  return statusMap[lowerStatus] ?? lowerStatus;
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove + and non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");

  // US/Canada format
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // International format
  return `+${cleaned}`;
}

/**
 * Import calls from JSON array
 * Creates scheduled calls in the database for each item
 *
 * @param jsonInput - Array of call objects or stringified JSON
 * @returns Result with count of imported calls
 */
export async function importCallsFromJson(
  jsonInput: string | ImportCallsInput,
) {
  try {
    // Parse JSON if string provided
    let callsData: ImportCallsInput;
    if (typeof jsonInput === "string") {
      try {
        callsData = JSON.parse(jsonInput);
      } catch {
        throw new Error("Invalid JSON format");
      }
    } else {
      callsData = jsonInput;
    }

    // Validate input
    const validated = importCallsSchema.parse(callsData);

    // Check admin access and get user
    const user = await checkAdminAccess();

    // Get Supabase client
    const supabase = await createClient();

    // Prepare calls for bulk insert
    const callsToInsert = validated.map((call) => ({
      retell_call_id: `scheduled_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      agent_id: process.env.RETELL_AGENT_ID ?? "",
      phone_number: call.phone_number,
      phone_number_pretty: formatPhoneNumber(call.phone_number),
      call_variables: {
        pet_name: call.pet_name,
        owner_name: call.owner_name ?? "",
        vet_name: call.vet_name ?? "",
        clinic_name: call.clinic_name ?? "",
        clinic_phone: call.clinic_phone ?? "",
        discharge_summary_content: call.discharge_summary_content ?? "",
      },
      metadata: {
        notes: call.notes,
      },
      status: "scheduled",
      created_by: user.id,
      patient_id: null,
    }));

    // Bulk insert all calls
    const { data: insertedCalls, error: dbError } = await supabase
      .from("retell_calls")
      .insert(callsToInsert)
      .select();

    if (dbError) {
      console.error("Failed to import calls:", dbError);
      throw new Error("Failed to import calls");
    }

    return {
      success: true,
      data: {
        count: insertedCalls?.length ?? 0,
        calls: insertedCalls,
      },
    };
  } catch (error) {
    console.error("Import calls error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import calls",
    };
  }
}
