"use server";

import { createClient } from "~/lib/supabase/server";
import { getUser } from "./auth";
import {
  sendCallSchema,
  listCallsSchema,
  getCallSchema,
  type SendCallInput,
  type ListCallsInput,
} from "~/lib/retell/validators";
import { createPhoneCall, getCall } from "~/lib/retell/client";

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
 */
export async function sendCall(input: SendCallInput) {
  try {
    // Validate input
    const validated = sendCallSchema.parse(input);

    // Check admin access
    const user = await checkAdminAccess();

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
    const supabase = await createClient();
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
 * List all calls with optional filters
 */
export async function fetchCalls(input?: ListCallsInput) {
  try {
    // Check admin access
    await checkAdminAccess();

    // Validate input
    const validated = input
      ? listCallsSchema.parse(input)
      : listCallsSchema.parse({});

    // Fetch from database
    const supabase = await createClient();
    let query = supabase
      .from("retell_calls")
      .select("*")
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
 * Get details of a specific call
 */
export async function fetchCall(callId: string) {
  try {
    // Validate input
    const validated = getCallSchema.parse({ callId });

    // Check admin access
    await checkAdminAccess();

    // Fetch from database
    const supabase = await createClient();
    const { data: dbCall, error } = await supabase
      .from("retell_calls")
      .select("*")
      .eq("id", validated.callId)
      .single();

    if (error || !dbCall) {
      throw new Error("Call not found");
    }

    // Optionally fetch fresh data from Retell API
    try {
      const retellCall = await getCall(dbCall.retell_call_id);

      // Update database with latest info
      const mappedStatus = mapRetellStatus(retellCall.call_status);
      await supabase
        .from("retell_calls")
        .update({
          status: mappedStatus,
          duration_seconds:
            retellCall.end_timestamp && retellCall.start_timestamp
              ? retellCall.end_timestamp - retellCall.start_timestamp
              : null,
          end_timestamp: retellCall.end_timestamp
            ? new Date(retellCall.end_timestamp * 1000).toISOString()
            : null,
          retell_response: retellCall as unknown,
        })
        .eq("id", validated.callId);

      return {
        success: true,
        data: {
          ...dbCall,
          retell_response: retellCall,
          status: mappedStatus,
        },
      };
    } catch (retellError) {
      // If Retell API fails, return database data
      console.error("Failed to fetch from Retell API:", retellError);
      return {
        success: true,
        data: dbCall,
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
