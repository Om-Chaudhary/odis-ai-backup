import Retell from "retell-sdk";

/**
 * Initialize Retell SDK client
 * API key should be stored in environment variables (server-side only)
 */
function getRetellClient() {
  const apiKey = process.env.RETELL_API_KEY;

  if (!apiKey) {
    throw new Error("RETELL_API_KEY is not defined in environment variables");
  }

  return new Retell({
    apiKey,
  });
}

/**
 * Retell API client instance
 * Only use this on the server side
 */
export const retellClient = getRetellClient();

/**
 * Type definitions for Retell API responses
 */
export interface RetellCallResponse {
  call_id: string;
  agent_id: string;
  call_type: string;
  call_status: string;
  from_number: string;
  to_number: string;
  direction: string;
  start_timestamp?: number;
  end_timestamp?: number;
  transcript?: string;
  transcript_object?: Array<{
    role: string;
    content: string;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
  recording_url?: string;
  public_log_url?: string;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, string>;
  opt_out_sensitive_data_storage?: boolean;
  disconnection_reason?: string;
  call_analysis?: {
    call_summary?: string;
    in_voicemail?: boolean;
    user_sentiment?: string;
    call_successful?: boolean;
  };
}

export interface CreateCallParams {
  from_number?: string;
  to_number: string;
  override_agent_id?: string;
  retell_llm_dynamic_variables?: Record<string, string>;
  metadata?: Record<string, unknown>;
  retries_on_no_answer?: number;
}

/**
 * Create an outbound phone call
 */
export async function createPhoneCall(
  params: CreateCallParams,
): Promise<RetellCallResponse> {
  try {
    // Filter out undefined values to avoid type errors with the SDK
    const cleanedParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined),
    ) as CreateCallParams;

    const response = await retellClient.call.createPhoneCall(
      cleanedParams as unknown as Parameters<
        typeof retellClient.call.createPhoneCall
      >[0],
    );
    return response as unknown as RetellCallResponse;
  } catch (error) {
    console.error("Failed to create phone call:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create phone call",
    );
  }
}

/**
 * Retrieve details of a specific call
 */
export async function getCall(callId: string): Promise<RetellCallResponse> {
  try {
    const response = await retellClient.call.retrieve(callId);
    return response as unknown as RetellCallResponse;
  } catch (error) {
    console.error(`Failed to retrieve call ${callId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to retrieve call",
    );
  }
}

/**
 * List all calls with optional filters
 */
export async function listCalls(params?: {
  filter_criteria?: {
    agent_id?: string[];
    call_type?: Array<"web_call" | "phone_call">;
    call_status?: Array<
      "error" | "ongoing" | "ended" | "registered" | "not_connected"
    >;
    start_timestamp?: number;
    end_timestamp?: number;
  };
  limit?: number;
  sort_order?: "ascending" | "descending";
}): Promise<{ calls: RetellCallResponse[] }> {
  try {
    const response = await retellClient.call.list(
      params as unknown as Parameters<typeof retellClient.call.list>[0],
    );
    return { calls: response as unknown as RetellCallResponse[] };
  } catch (error) {
    console.error("Failed to list calls:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to list calls",
    );
  }
}
