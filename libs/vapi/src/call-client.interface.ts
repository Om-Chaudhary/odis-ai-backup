/**
 * ICallClient Interface
 *
 * Interface for phone call management systems using VAPI or similar providers.
 * Enables dependency injection and testing for call operations.
 *
 * @example
 * ```typescript
 * class VapiCallClient implements ICallClient {
 *   async create(config: CallConfig): Promise<CallResponse> {
 *     // Implementation using VAPI SDK
 *   }
 *
 *   async get(id: string): Promise<Call> {
 *     // Implementation using VAPI SDK
 *   }
 *
 *   async list(filters: CallFilters): Promise<Call[]> {
 *     // Implementation using VAPI SDK
 *   }
 *
 *   async cancel(id: string): Promise<void> {
 *     // Implementation using VAPI SDK
 *   }
 * }
 * ```
 */

/**
 * Configuration for creating a new outbound call
 */
export interface CallConfig {
  /** Customer's phone number in E.164 format (e.g., +1234567890) */
  phoneNumber: string;

  /** Assistant ID to use for the call */
  assistantId: string;

  /** Phone number ID for the caller ID */
  phoneNumberId: string;

  /**
   * Dynamic overrides to customize the assistant for this specific call
   * Supports variableValues, voicemailDetection, toolIds, and other runtime overrides
   */
  assistantOverrides?: Record<string, unknown>;
}

/**
 * Response from creating a call
 */
export interface CallResponse {
  /** Unique call ID */
  id: string;

  /** Organization ID */
  orgId: string;

  /** Call type */
  type: "outboundPhoneCall" | "inboundPhoneCall" | "webCall";

  /** Current call status */
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";

  /** Reason the call ended (if ended) */
  endedReason?: string;

  /** Phone number details */
  phoneNumber?: {
    number: string;
    id: string;
  };

  /** Customer details */
  customer?: {
    number: string;
  };

  /** Assistant ID used for the call */
  assistantId?: string;

  /** Call messages/transcript */
  messages?: Array<{
    role: "assistant" | "user" | "system";
    message: string;
    time: number;
  }>;

  /** Full transcript */
  transcript?: string;

  /** Recording URL (if recording enabled) */
  recordingUrl?: string;

  /** Call analysis */
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };

  /** Call costs */
  costs?: Array<{
    amount: number;
    description: string;
  }>;

  /** When the call started */
  startedAt?: string;

  /** When the call ended */
  endedAt?: string;

  /** When the call was created */
  createdAt: string;

  /** When the call was last updated */
  updatedAt: string;
}

/**
 * Detailed call information (alias for semantic clarity)
 */
export type Call = CallResponse;

/**
 * Filters for listing calls
 */
export interface CallFilters {
  /** Maximum number of calls to return */
  limit?: number;

  /** Filter calls created after this date */
  createdAtGt?: Date;

  /** Filter calls created before this date */
  createdAtLt?: Date;

  /** Filter calls created at or after this date */
  createdAtGe?: Date;

  /** Filter calls created at or before this date */
  createdAtLe?: Date;
}

/**
 * Interface for phone call client operations
 */
export interface ICallClient {
  /**
   * Create a new outbound phone call
   *
   * @param config - Call configuration including phone number, assistant, and overrides
   * @returns Call response with call ID and initial status
   * @throws Error if call creation fails
   */
  create(config: CallConfig): Promise<CallResponse>;

  /**
   * Get details for a specific call
   *
   * @param id - Call ID
   * @returns Complete call details including transcript, status, and analysis
   * @throws Error if call not found or retrieval fails
   */
  get(id: string): Promise<Call>;

  /**
   * List calls with optional filters
   *
   * @param filters - Optional filters for date range and limit
   * @returns Array of calls matching the filters
   * @throws Error if listing fails
   */
  list(filters?: CallFilters): Promise<Call[]>;

  /**
   * Cancel an in-progress call
   *
   * @param id - Call ID to cancel
   * @returns Promise that resolves when cancellation is complete
   * @throws Error if cancellation fails or call not found
   */
  cancel(id: string): Promise<void>;
}
