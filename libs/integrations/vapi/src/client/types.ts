/**
 * VAPI Client Types
 *
 * Shared type definitions for VAPI client operations.
 */

/**
 * Voicemail detection plan configuration.
 * Used to configure which provider handles voicemail detection and how.
 */
export interface VoicemailDetectionPlan {
  /**
   * The voicemail detection provider to use.
   * - "vapi" - Vapi's AI-powered detection (recommended, fastest)
   * - "twilio" - Twilio's carrier-level AMD
   * - "google" - Google's AI detection
   * - "openai" - OpenAI's detection
   */
  provider: "vapi" | "twilio" | "google" | "openai";
  /**
   * Detection type (for vapi/google/openai providers).
   * - "audio" - Uses native audio models (default, recommended for vapi/google)
   * - "transcript" - Uses ASR/transcript-based detection (recommended for openai)
   */
  type?: "audio" | "transcript";
  /**
   * Whether detection is enabled. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Twilio-specific: Maximum seconds to wait for detection.
   * Lower values = faster but potentially less accurate.
   * Default: 30, Recommended: 5-15 for faster detection.
   */
  machineDetectionTimeout?: number;
  /**
   * Twilio-specific: Detection types to treat as voicemail.
   * Default: ["machine_end_beep", "machine_end_silence"]
   */
  voicemailDetectionTypes?: string[];
}

/**
 * Voicemail tool configuration
 */
export interface VoicemailTool {
  type: "voicemail";
  function: {
    name: string;
    description: string;
  };
  messages?: Array<{
    type: string;
    content: string;
  }>;
}

/**
 * Transfer call tool configuration for warm transfers
 * See: https://docs.vapi.ai/calls/assistant-based-warm-transfer
 */
export interface TransferCallTool {
  type: "transferCall";
  function: {
    name: string;
    description?: string;
  };
  destinations: Array<TransferDestination>;
  messages?: Array<{
    type: "request-start" | "request-complete" | "request-failed";
    content: string;
    endCallAfterSpokenEnabled?: boolean;
  }>;
}

/**
 * Transfer destination with warm transfer plan
 */
export interface TransferDestination {
  type: "number";
  number: string;
  description?: string;
  transferPlan: {
    mode: "warm-transfer-experimental";
    transferAssistant: TransferAssistant;
  };
}

/**
 * Transfer assistant configuration for warm handoff
 */
export interface TransferAssistant {
  /** Initial message spoken when operator answers */
  firstMessage: string;
  /** Controls when the transfer assistant delivers the first message */
  firstMessageMode?: "assistant-speaks-first" | "assistant-waits-for-user";
  /** Maximum duration in seconds for the operator call */
  maxDurationSeconds?: number;
  /** Seconds to wait during silence before cancelling */
  silenceTimeoutSeconds?: number;
  /** Model configuration */
  model: {
    provider: "openai" | "anthropic" | "google";
    model: string;
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
  };
}

/**
 * VAPI call response structure
 */
export interface VapiCallResponse {
  id: string;
  orgId: string;
  type: "outboundPhoneCall" | "inboundPhoneCall" | "webCall";
  phoneNumber?: {
    number: string;
    id: string;
  };
  customer?: {
    number: string;
  };
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  endedReason?: string;
  messages?: Array<{
    role: "assistant" | "user" | "system";
    message: string;
    time: number;
  }>;
  transcript?: string;
  recordingUrl?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
  costs?: Array<{
    amount: number;
    description: string;
  }>;
  startedAt?: string;
  endedAt?: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Server configuration for VAPI assistant webhooks
 */
export interface AssistantServerConfig {
  /** The webhook URL where VAPI will send events */
  url: string;
  /** Optional timeout for webhook requests (in seconds) */
  timeoutSeconds?: number;
  /** Optional secret for webhook signature verification */
  secret?: string;
}
