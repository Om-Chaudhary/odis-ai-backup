/**
 * VAPI Call Manager
 *
 * Centralized manager for creating and managing VAPI veterinary follow-up calls.
 * Integrates with knowledge base system, Supabase storage, and VAPI API.
 */

import {
  buildDynamicVariables,
  type ConditionCategory,
} from "./knowledge-base";
import { createServiceClient } from "@odis/db";
import { getClinicByUserId } from "@odis/clinics/utils";
import { getClinicVapiConfigByUserId } from "@odis/clinics/vapi-config";
import { normalizeToE164 } from "@odis/utils/phone";
import type { Database } from "@odis/types";

type ScheduledCallRow =
  Database["public"]["Tables"]["scheduled_discharge_calls"]["Row"];

/**
 * Input parameters for creating a VAPI call
 */
export interface CreateVapiCallInput {
  // Core required fields
  clinicName: string;
  agentName: string;
  petName: string;
  ownerName: string;
  ownerPhone: string; // E.164 format: +1234567890
  appointmentDate: string; // Spelled out: "November eighth"
  callType: "discharge" | "follow-up";
  clinicPhone: string; // Spelled out for natural speech
  emergencyPhone: string; // Spelled out for natural speech
  dischargeSummary: string;

  // Optional discharge fields
  subType?: "wellness" | "vaccination";
  nextSteps?: string;

  // Optional follow-up fields
  condition?: string;
  conditionCategory?: ConditionCategory;
  medications?: string;
  recheckDate?: string; // Spelled out

  // Optional metadata
  petSpecies?: "dog" | "cat" | "other";
  petAge?: number;
  petWeight?: number;
  daysSinceTreatment?: number;

  // Call scheduling
  scheduledFor?: string; // ISO 8601 datetime

  // VAPI configuration (optional overrides)
  assistantId?: string; // Defaults to env variable
  phoneNumberId?: string; // Defaults to env variable
}

/**
 * Result of creating a VAPI call
 */
export interface CreateVapiCallResult {
  success: boolean;
  callId?: string;
  vapiCallId?: string;
  databaseId?: string;
  status?: string;
  errors?: string[];
  warnings?: string[];
  scheduledFor?: string;
}

/**
 * VAPI call status response
 */
export interface VapiCallStatus {
  id: string;
  vapiCallId: string | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
  transcript: string | null;
  transcriptMessages: unknown;
  callAnalysis: unknown;
  conditionCategory: string | null;
  knowledgeBaseUsed: string | null;
  cost: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a VAPI follow-up call with full knowledge base integration
 *
 * This function:
 * 1. Validates and builds dynamic variables using the knowledge base system
 * 2. Stores the call record in Supabase
 * 3. Creates the call via VAPI (for immediate calls) or queues it (for scheduled calls)
 * 4. Returns the call ID and status
 *
 * @param input - Call parameters
 * @param userId - User ID for RLS
 * @returns Result with call ID and status
 */
export async function createVapiCall(
  input: CreateVapiCallInput,
  userId: string,
): Promise<CreateVapiCallResult> {
  try {
    // Step 0: Optionally validate and enrich clinic data from clinic table
    // This ensures clinic information is consistent with the clinic registry
    const supabase = await createServiceClient();
    const clinic = await getClinicByUserId(userId, supabase);

    // If clinic is found in table, prefer clinic table data for consistency
    // but fallback to input values for backward compatibility
    const validatedClinicName = clinic?.name ?? input.clinicName;

    // Step 1: Build dynamic variables with knowledge base integration
    const variablesBuildResult = buildDynamicVariables({
      baseVariables: {
        clinicName: validatedClinicName,
        agentName: input.agentName,
        petName: input.petName,
        ownerName: input.ownerName,
        appointmentDate: input.appointmentDate,
        callType: input.callType,
        clinicPhone: input.clinicPhone,
        emergencyPhone: input.emergencyPhone,
        dischargeSummary: input.dischargeSummary,
        subType: input.subType,
        nextSteps: input.nextSteps,
        condition: input.condition,
        conditionCategory: input.conditionCategory,
        medications: input.medications,
        recheckDate: input.recheckDate,
        petSpecies: input.petSpecies,
        petAge: input.petAge,
        petWeight: input.petWeight,
        daysSinceTreatment: input.daysSinceTreatment,
      },
      strict: false,
      useDefaults: true,
    });

    // Check validation errors
    if (!variablesBuildResult.validation.valid) {
      return {
        success: false,
        errors: variablesBuildResult.validation.errors,
        warnings: variablesBuildResult.validation.warnings,
      };
    }

    // Step 2: Get VAPI configuration (clinic-specific or env fallback)
    const clinicVapiConfig = await getClinicVapiConfigByUserId(
      userId,
      supabase,
    );
    const assistantId = input.assistantId ??
      clinicVapiConfig.outboundAssistantId;
    const phoneNumberId = input.phoneNumberId ?? clinicVapiConfig.phoneNumberId;

    console.log("[VAPI_CALL_MANAGER] Using VAPI config", {
      source: clinicVapiConfig.source,
      clinicName: clinicVapiConfig.clinicName,
      hasAssistantId: !!assistantId,
      hasPhoneNumberId: !!phoneNumberId,
    });

    if (!assistantId) {
      return {
        success: false,
        errors: [
          "VAPI assistant ID not configured for clinic or in environment",
        ],
      };
    }

    if (!phoneNumberId) {
      return {
        success: false,
        errors: [
          "VAPI phone number ID not configured for clinic or in environment",
        ],
      };
    }

    // Normalize phone number to E.164 format (+1XXXXXXXXXX for US numbers)
    const normalizedPhone = normalizeToE164(input.ownerPhone);
    if (!normalizedPhone) {
      return {
        success: false,
        errors: [`Invalid phone number format: ${input.ownerPhone}`],
      };
    }

    // Step 3: Store call record in Supabase
    // Note: supabase client already created in Step 0

    const { data: callRecord, error: insertError } = await supabase
      .from("scheduled_discharge_calls")
      .insert({
        user_id: userId,
        assistant_id: assistantId,
        phone_number_id: phoneNumberId,
        customer_phone: normalizedPhone,
        scheduled_for: input.scheduledFor ?? null,
        status: input.scheduledFor ? "queued" : "pending",
        dynamic_variables: variablesBuildResult.variables,
        condition_category:
          variablesBuildResult.knowledgeBase.conditionCategory,
        knowledge_base_used: variablesBuildResult.knowledgeBase.displayName,
      })
      .select("id")
      .single();

    if (insertError || !callRecord) {
      return {
        success: false,
        errors: [
          `Failed to store call record: ${
            insertError?.message || "Unknown error"
          }`,
        ],
      };
    }

    // Step 4: Return success with warnings if any
    // Note: Actual VAPI call creation will be handled by a separate process
    // that reads from this table and uses the VAPI MCP server
    return {
      success: true,
      databaseId: callRecord.id,
      status: input.scheduledFor ? "queued" : "pending",
      warnings: variablesBuildResult.validation.warnings,
      scheduledFor: input.scheduledFor,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Gets the status of a VAPI call by database ID
 *
 * @param callId - Database ID of the call
 * @param userId - User ID for RLS check
 * @returns Call status or null if not found
 */
export async function getVapiCallStatus(
  callId: string,
  userId: string,
): Promise<VapiCallStatus | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("scheduled_discharge_calls")
    .select("*")
    .eq("id", callId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    vapiCallId: data.vapi_call_id,
    status: data.status,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    durationSeconds: data.duration_seconds,
    recordingUrl: data.recording_url,
    transcript: data.transcript,
    transcriptMessages: data.transcript_messages,
    callAnalysis: data.call_analysis,
    conditionCategory: data.condition_category,
    knowledgeBaseUsed: data.knowledge_base_used,
    cost: data.cost,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Lists all VAPI calls for a user
 *
 * @param userId - User ID for RLS
 * @param filters - Optional filters
 * @returns Array of call statuses
 */
export async function listVapiCalls(
  userId: string,
  filters?: {
    status?: string;
    conditionCategory?: string;
    limit?: number;
    offset?: number;
  },
): Promise<VapiCallStatus[]> {
  const supabase = await createServiceClient();

  let query = supabase
    .from("scheduled_discharge_calls")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.conditionCategory) {
    query = query.eq("condition_category", filters.conditionCategory);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit ?? 10) - 1,
    );
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((call: ScheduledCallRow) => ({
    id: call.id,
    vapiCallId: call.vapi_call_id,
    status: call.status,
    startedAt: call.started_at,
    endedAt: call.ended_at,
    durationSeconds: call.duration_seconds,
    recordingUrl: call.recording_url,
    transcript: call.transcript,
    transcriptMessages: call.transcript_messages,
    callAnalysis: call.call_analysis,
    conditionCategory: call.condition_category,
    knowledgeBaseUsed: call.knowledge_base_used,
    cost: call.cost,
    createdAt: call.created_at,
    updatedAt: call.updated_at,
  }));
}

/**
 * Updates a VAPI call record (typically called by webhooks)
 *
 * @param vapiCallId - VAPI call ID
 * @param updates - Fields to update
 * @returns Success boolean
 */
export async function updateVapiCall(
  vapiCallId: string,
  updates: {
    status?: string;
    endedReason?: string;
    startedAt?: string;
    endedAt?: string;
    durationSeconds?: number;
    recordingUrl?: string;
    transcript?: string;
    transcriptMessages?: unknown;
    callAnalysis?: unknown;
    cost?: number;
  },
): Promise<boolean> {
  const supabase = await createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (updates.status) updateData.status = updates.status;
  if (updates.endedReason) updateData.ended_reason = updates.endedReason;
  if (updates.startedAt) updateData.started_at = updates.startedAt;
  if (updates.endedAt) updateData.ended_at = updates.endedAt;
  if (updates.durationSeconds !== undefined) {
    updateData.duration_seconds = updates.durationSeconds;
  }
  if (updates.recordingUrl) updateData.recording_url = updates.recordingUrl;
  if (updates.transcript) updateData.transcript = updates.transcript;
  if (updates.transcriptMessages) {
    updateData.transcript_messages = updates.transcriptMessages;
  }
  if (updates.callAnalysis) updateData.call_analysis = updates.callAnalysis;
  if (updates.cost !== undefined) updateData.cost = updates.cost;

  const { error } = await supabase
    .from("scheduled_discharge_calls")
    .update(updateData)
    .eq("vapi_call_id", vapiCallId);

  return !error;
}
