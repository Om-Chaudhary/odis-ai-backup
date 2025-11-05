"use server";

import { createClient } from "~/lib/supabase/server";
import { getUser } from "./auth";
import {
  sendCallWithPatientSchema,
  scheduleCallSchema,
  listCallsSchema,
  getCallSchema,
  type SendCallWithPatientInput,
  type ScheduleCallInput,
  type ListCallsInput,
} from "~/lib/retell/validators";
import { createPhoneCall, getCall } from "~/lib/retell/client";
import type { RetellCallResponse } from "~/lib/retell/client";

/**
 * Type definition for a single turn in the conversation transcript
 */
export interface TranscriptTurn {
  role: "agent" | "user";
  content: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

/**
 * Enhanced type for call details with complete data from Retell API
 */
export interface CallDetailResponse {
  id: string;
  retell_call_id: string;
  agent_id: string;
  phone_number: string;
  phone_number_pretty: string | null;
  status: string;
  duration_seconds: number | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  recording_url: string | null;
  transcript: string | null;
  transcript_object: TranscriptTurn[] | null;
  call_analysis: RetellCallResponse["call_analysis"] | null;
  disconnection_reason: string | null;
  public_log_url: string | null;
  call_variables: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  retell_response: RetellCallResponse | null;
  created_at: string;
  created_by: string | null;
  patient_id: string | null;
  // Patient information (joined from call_patients table)
  patient?: {
    id: string;
    pet_name: string;
    owner_name: string;
    owner_phone: string;
    vet_name: string | null;
    clinic_name: string | null;
    clinic_phone: string | null;
    discharge_summary: string | null;
  } | null;
}

/**
 * Lightweight status update response for polling
 */
export interface CallStatusResponse {
  call_id: string;
  status: string;
  duration_seconds: number | null;
  recording_available: boolean;
  transcript_available: boolean;
  call_analysis_available: boolean;
}

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
export async function sendCall(input: SendCallWithPatientInput) {
  try {
    // Validate input
    const validated = sendCallWithPatientSchema.parse(input);

    // Check admin access and get user
    const user = await checkAdminAccess();

    // Get Supabase client
    const supabase = await createClient();

    // Initialize variables with provided values
    let finalVariables = { ...validated.variables };
    let phoneNumber = validated.phoneNumber;
    let patientId: string | null = null;

    // If patientId provided, fetch patient and auto-populate variables
    if (validated.patientId) {
      const { data: patient, error: patientError } = await supabase
        .from("call_patients")
        .select("*")
        .eq("id", validated.patientId)
        .single();

      if (patientError) {
        console.error("Failed to fetch patient:", patientError);
        throw new Error(`Patient not found: ${patientError.message}`);
      }

      if (patient) {
        // Auto-populate variables from patient data
        finalVariables = {
          pet_name: patient.pet_name,
          owner_name: patient.owner_name,
          vet_name: patient.vet_name ?? "",
          clinic_name: patient.clinic_name ?? "",
          clinic_phone: patient.clinic_phone ?? "",
          discharge_summary_content: patient.discharge_summary ?? "",
          // Merge with any additional variables provided
          ...validated.variables,
        };

        // Use patient's owner_phone as the call destination
        phoneNumber = patient.owner_phone;
        patientId = patient.id;
      }
    }

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
      to_number: phoneNumber,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: finalVariables,
      metadata: validated.metadata,
      retries_on_no_answer: validated.retryOnBusy ? 2 : 0,
    });

    // Store call in database with created_by set to current user
    // RLS policies will automatically filter queries by this field
    const { error } = await supabase
      .from("retell_calls")
      .insert({
        retell_call_id: response.call_id,
        agent_id: response.agent_id,
        phone_number: phoneNumber,
        phone_number_pretty: formatPhoneNumber(phoneNumber),
        call_variables: finalVariables,
        metadata: validated.metadata,
        status: mapRetellStatus(response.call_status),
        start_timestamp: response.start_timestamp
          ? new Date(response.start_timestamp * 1000).toISOString()
          : null,
        retell_response: response as unknown,
        created_by: user.id, // Set to current user for RLS filtering
        patient_id: patientId, // Link to patient if provided
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
        phoneNumber: phoneNumber,
        patientId: patientId,
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

    // Fetch patient to validate and get data
    const { data: patient, error: patientError } = await supabase
      .from("call_patients")
      .select("*")
      .eq("id", validated.patientId)
      .single();

    if (patientError) {
      console.error("Failed to fetch patient:", patientError);
      throw new Error(`Patient not found: ${patientError.message}`);
    }

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Prepare call variables from patient data
    const callVariables = {
      pet_name: patient.pet_name,
      owner_name: patient.owner_name,
      vet_name: patient.vet_name ?? "",
      clinic_name: patient.clinic_name ?? "",
      clinic_phone: patient.clinic_phone ?? "",
      discharge_summary_content: patient.discharge_summary ?? "",
    };

    // Store scheduled call in database (without calling Retell)
    const { data: scheduledCall, error: dbError } = await supabase
      .from("retell_calls")
      .insert({
        retell_call_id: `scheduled_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary ID
        agent_id: process.env.RETELL_AGENT_ID ?? "",
        phone_number: patient.owner_phone,
        phone_number_pretty: formatPhoneNumber(patient.owner_phone),
        call_variables: callVariables,
        metadata: {
          notes: validated.notes,
          scheduled_for: validated.scheduledFor?.toISOString(),
        },
        status: "scheduled",
        created_by: user.id,
        patient_id: patient.id,
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
        patientId: patient.id,
        petName: patient.pet_name,
        phoneNumber: patient.owner_phone,
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
 * List all calls with optional filters
 *
 * This action:
 * - Uses createClient() to respect RLS policies
 * - RLS automatically filters by created_by = auth.uid()
 * - Only returns calls created by the current user
 * - Admin check ensures only admins can list calls
 */
export async function fetchCalls(input?: ListCallsInput) {
  try {
    // Check admin access
    await checkAdminAccess();

    // Validate input
    const validated = input
      ? listCallsSchema.parse(input)
      : listCallsSchema.parse({});

    // Fetch from database using standard client
    // RLS policies automatically filter by created_by = auth.uid()
    // Join with call_patients to include patient information
    const supabase = await createClient();
    let query = supabase
      .from("retell_calls")
      .select(
        `
        *,
        patient:call_patients(
          id,
          pet_name,
          owner_name,
          owner_phone,
          vet_name,
          clinic_name,
          clinic_phone,
          discharge_summary
        )
      `,
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (validated.status && validated.status !== "all") {
      query = query.eq("status", validated.status);
    }

    if (validated.agentId) {
      query = query.eq("agent_id", validated.agentId);
    }

    if (validated.startDate) {
      query = query.gte("created_at", validated.startDate.toISOString());
    }

    if (validated.endDate) {
      query = query.lte("created_at", validated.endDate.toISOString());
    }

    // Apply pagination
    query = query.range(
      validated.offset,
      validated.offset + validated.limit - 1,
    );

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch calls:", error);
      throw new Error("Failed to fetch calls");
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Fetch calls error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch calls",
      data: [],
    };
  }
}

/**
 * Get complete details of a specific call with fresh data from Retell API
 *
 * This action:
 * - Uses createClient() to respect RLS policies
 * - RLS automatically filters by created_by = auth.uid()
 * - Always fetches fresh data from Retell API to get latest recording URL and transcript
 * - Updates database with latest status, duration, recording URL, transcript_object, and analysis
 * - Returns complete call details including transcript_object for the detail page
 * - Handles cases where recording or transcript is not ready yet
 */
export async function fetchCall(callId: string) {
  try {
    // Validate input
    const validated = getCallSchema.parse({ callId });

    // Check admin access
    await checkAdminAccess();

    // Fetch from database using standard client
    // RLS policies automatically filter by created_by = auth.uid()
    const supabase = await createClient();
    const { data: dbCall, error } = await supabase
      .from("retell_calls")
      .select("*")
      .eq("id", validated.callId)
      .single();

    if (error || !dbCall) {
      throw new Error("Call not found");
    }

    // Always fetch fresh data from Retell API to get recording URL and transcript
    try {
      const retellCall = await getCall(dbCall.retell_call_id);

      // Calculate duration if timestamps are available
      const durationSeconds =
        retellCall.end_timestamp && retellCall.start_timestamp
          ? retellCall.end_timestamp - retellCall.start_timestamp
          : null;

      // Map status
      const mappedStatus = mapRetellStatus(retellCall.call_status);

      // Update database with latest info including recording URL, transcript, and transcript_object
      await supabase
        .from("retell_calls")
        .update({
          status: mappedStatus,
          duration_seconds: durationSeconds,
          end_timestamp: retellCall.end_timestamp
            ? new Date(retellCall.end_timestamp * 1000).toISOString()
            : null,
          recording_url: retellCall.recording_url ?? null,
          transcript: retellCall.transcript ?? null,
          transcript_object: retellCall.transcript_object
            ? (retellCall.transcript_object as unknown)
            : null,
          call_analysis: retellCall.call_analysis
            ? (retellCall.call_analysis as unknown)
            : null,
          disconnection_reason: retellCall.disconnection_reason ?? null,
          public_log_url: retellCall.public_log_url ?? null,
          retell_response: retellCall as unknown,
        })
        .eq("id", validated.callId);

      // Return enhanced call details with properly typed transcript_object
      const enhancedData: CallDetailResponse = {
        id: dbCall.id,
        retell_call_id: dbCall.retell_call_id,
        agent_id: retellCall.agent_id,
        phone_number: dbCall.phone_number,
        phone_number_pretty: dbCall.phone_number_pretty,
        status: mappedStatus,
        duration_seconds: durationSeconds,
        start_timestamp: retellCall.start_timestamp
          ? new Date(retellCall.start_timestamp * 1000).toISOString()
          : null,
        end_timestamp: retellCall.end_timestamp
          ? new Date(retellCall.end_timestamp * 1000).toISOString()
          : null,
        recording_url: retellCall.recording_url ?? null,
        transcript: retellCall.transcript ?? null,
        transcript_object:
          (retellCall.transcript_object as TranscriptTurn[]) ?? null,
        call_analysis: retellCall.call_analysis ?? null,
        disconnection_reason: retellCall.disconnection_reason ?? null,
        public_log_url: retellCall.public_log_url ?? null,
        call_variables: dbCall.call_variables,
        metadata: dbCall.metadata,
        retell_response: retellCall,
        created_at: dbCall.created_at,
        created_by: dbCall.created_by,
        patient_id: dbCall.patient_id ?? null,
      };

      return {
        success: true,
        data: enhancedData,
      };
    } catch (retellError) {
      // If Retell API fails, return database data with proper typing
      console.error("Failed to fetch from Retell API:", retellError);

      const fallbackData: CallDetailResponse = {
        id: dbCall.id,
        retell_call_id: dbCall.retell_call_id,
        agent_id: dbCall.agent_id,
        phone_number: dbCall.phone_number,
        phone_number_pretty: dbCall.phone_number_pretty,
        status: dbCall.status,
        duration_seconds: dbCall.duration_seconds,
        start_timestamp: dbCall.start_timestamp,
        end_timestamp: dbCall.end_timestamp,
        recording_url: dbCall.recording_url ?? null,
        transcript: dbCall.transcript ?? null,
        transcript_object: dbCall.transcript_object
          ? (dbCall.transcript_object as TranscriptTurn[])
          : null,
        call_analysis: dbCall.call_analysis
          ? (dbCall.call_analysis as RetellCallResponse["call_analysis"])
          : null,
        disconnection_reason: dbCall.disconnection_reason ?? null,
        public_log_url: dbCall.public_log_url ?? null,
        call_variables: dbCall.call_variables,
        metadata: dbCall.metadata,
        retell_response: dbCall.retell_response
          ? (dbCall.retell_response as RetellCallResponse)
          : null,
        created_at: dbCall.created_at,
        created_by: dbCall.created_by,
        patient_id: dbCall.patient_id ?? null,
      };

      return {
        success: true,
        data: fallbackData,
        warning: "Using cached data - unable to fetch latest from Retell API",
      };
    }
  } catch (error) {
    console.error("Fetch call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch call",
    };
  }
}

/**
 * Lightweight status check for real-time polling
 *
 * This action:
 * - Uses createClient() to respect RLS policies
 * - RLS automatically filters by created_by = auth.uid()
 * - Performs quick status check without fetching full call details
 * - Updates only status and duration in database
 * - Returns minimal data for UI status updates
 * - Indicates availability of recording, transcript, and analysis
 * - Suitable for polling every few seconds
 */
export async function refreshCallStatus(callId: string) {
  try {
    // Validate input
    const validated = getCallSchema.parse({ callId });

    // Check admin access
    await checkAdminAccess();

    // Fetch call from database to get Retell call ID
    // RLS policies automatically filter by created_by = auth.uid()
    const supabase = await createClient();
    const { data: dbCall, error } = await supabase
      .from("retell_calls")
      .select("id, retell_call_id, status")
      .eq("id", validated.callId)
      .single();

    if (error || !dbCall) {
      throw new Error("Call not found");
    }

    // Fetch lightweight status from Retell API
    try {
      const retellCall = await getCall(dbCall.retell_call_id);

      // Calculate duration if available
      const durationSeconds =
        retellCall.end_timestamp && retellCall.start_timestamp
          ? retellCall.end_timestamp - retellCall.start_timestamp
          : null;

      // Map status
      const mappedStatus = mapRetellStatus(retellCall.call_status);

      // Update only essential fields in database for performance
      await supabase
        .from("retell_calls")
        .update({
          status: mappedStatus,
          duration_seconds: durationSeconds,
          end_timestamp: retellCall.end_timestamp
            ? new Date(retellCall.end_timestamp * 1000).toISOString()
            : null,
        })
        .eq("id", validated.callId);

      // Return minimal status response
      const statusResponse: CallStatusResponse = {
        call_id: dbCall.id,
        status: mappedStatus,
        duration_seconds: durationSeconds,
        recording_available: !!retellCall.recording_url,
        transcript_available: !!retellCall.transcript,
        call_analysis_available: !!retellCall.call_analysis,
      };

      return {
        success: true,
        data: statusResponse,
      };
    } catch (retellError) {
      // If Retell API fails, return database status
      console.error("Failed to refresh status from Retell API:", retellError);

      return {
        success: true,
        data: {
          call_id: dbCall.id,
          status: dbCall.status,
          duration_seconds: null,
          recording_available: false,
          transcript_available: false,
          call_analysis_available: false,
        } as CallStatusResponse,
        warning: "Using cached status - unable to fetch latest from Retell API",
      };
    }
  } catch (error) {
    console.error("Refresh call status error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to refresh call status",
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
