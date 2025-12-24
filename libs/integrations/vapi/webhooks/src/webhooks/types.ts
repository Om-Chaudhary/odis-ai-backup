/**
 * VAPI Webhook Types
 *
 * Comprehensive TypeScript types for all VAPI webhook events.
 * Based on VAPI Server URL documentation: https://docs.vapi.ai/server_url
 *
 * @module vapi/webhooks/types
 */

// =============================================================================
// Base Types
// =============================================================================

/**
 * VAPI call response structure (webhook version)
 * More permissive than the SDK type to handle all webhook data
 */
export interface VapiWebhookCall {
  id: string;
  orgId?: string;
  type?: "outboundPhoneCall" | "inboundPhoneCall" | "webCall";
  phoneNumber?: {
    number: string;
    id: string;
  };
  customer?: {
    number: string;
  };
  status?: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  transcript?: string;
  messages?: VapiMessage[];
  analysis?: VapiAnalysis;
  costs?: VapiCost[];
  assistantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Call analysis from VAPI
 */
export interface VapiAnalysis {
  summary?: string;
  successEvaluation?: string;
  structuredData?: Record<string, unknown>;
}

/**
 * Cost breakdown from VAPI
 */
export interface VapiCost {
  amount: number;
  description: string;
}

/**
 * Message in call transcript
 */
export interface VapiMessage {
  role: "assistant" | "user" | "system" | "tool";
  message?: string;
  content?: string;
  time?: number;
  timestamp?: number;
}

/**
 * Artifact data from end-of-call-report
 */
export interface VapiArtifact {
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  logUrl?: string;
  transcript?: string;
  messages?: VapiMessage[];
  messagesOpenAIFormatted?: Array<{ role: string; content: string }>;
  structuredOutputs?: Record<string, unknown>;
}

// =============================================================================
// Tool Call Types
// =============================================================================

/**
 * Tool call request from VAPI
 * Sent when an assistant invokes a server-side tool/function
 */
export interface VapiToolCall {
  /** Unique ID for this tool call - must be returned in response */
  id: string;
  /** Name of the tool/function being called */
  name: string;
  /** Parameters passed to the tool */
  parameters: Record<string, unknown>;
}

/**
 * Tool call result to return to VAPI
 */
export interface VapiToolCallResult {
  /** The tool call ID from the request */
  toolCallId: string;
  /** JSON string result of the tool execution */
  result: string;
}

/**
 * Tool with its call (alternative format from VAPI)
 */
export interface VapiToolWithCall {
  name: string;
  toolCall: VapiToolCall;
}

// =============================================================================
// Transfer Types
// =============================================================================

/**
 * Transfer destination types
 */
export type TransferDestinationType = "number" | "sip" | "assistant";

/**
 * Phone number transfer destination
 */
export interface NumberTransferDestination {
  type: "number";
  number: string;
  callerId?: string;
  extension?: string;
  message?: string;
}

/**
 * SIP transfer destination
 */
export interface SipTransferDestination {
  type: "sip";
  sipUri: string;
  sipHeaders?: Record<string, string>;
  message?: string;
}

/**
 * Assistant transfer destination
 */
export interface AssistantTransferDestination {
  type: "assistant";
  assistantId: string;
  message?: string;
}

/**
 * Union of all transfer destination types
 */
export type TransferDestination =
  | NumberTransferDestination
  | SipTransferDestination
  | AssistantTransferDestination;

// =============================================================================
// Message Type Definitions
// =============================================================================

/**
 * Status update message
 * Sent when call status changes (queued, ringing, in-progress, ended)
 */
export interface StatusUpdateMessage {
  type: "status-update";
  call: VapiWebhookCall;
  status?: string;
  timestamp?: string;
}

/**
 * End of call report message
 * Sent when a call ends with comprehensive call data
 */
export interface EndOfCallReportMessage {
  type: "end-of-call-report";
  call: VapiWebhookCall;
  endedReason?: string;
  artifact?: VapiArtifact;
  // These fields may appear at message level for end-of-call-report
  analysis?: VapiAnalysis;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  cost?: number;
  status?: string;
}

/**
 * Hang notification message
 * Sent when a call is terminated/hung up
 */
export interface HangMessage {
  type: "hang";
  call: VapiWebhookCall;
}

/**
 * Tool calls message
 * Sent when assistant invokes server-side tools
 */
export interface ToolCallsMessage {
  type: "tool-calls";
  call?: VapiWebhookCall;
  toolCallList?: VapiToolCall[];
  toolWithToolCallList?: VapiToolWithCall[];
}

/**
 * Transcript message
 * Sent for real-time transcription updates
 */
export interface TranscriptMessage {
  type: "transcript";
  call?: VapiWebhookCall;
  role: "user" | "assistant";
  transcriptType: "partial" | "final";
  transcript: string;
  isFiltered?: boolean;
  detectedThreats?: string[];
  originalTranscript?: string;
}

/**
 * Speech update message
 * Sent for speech detection events
 */
export interface SpeechUpdateMessage {
  type: "speech-update";
  call?: VapiWebhookCall;
  status: "started" | "stopped";
  role: "user" | "assistant";
}

/**
 * Assistant request message
 * Sent for dynamic assistant selection on inbound calls
 */
export interface AssistantRequestMessage {
  type: "assistant-request";
  call: VapiWebhookCall;
  phoneNumber?: {
    id: string;
    number: string;
  };
}

/**
 * Transfer update message
 * Sent when a call transfer occurs
 */
export interface TransferUpdateMessage {
  type: "transfer-update";
  call?: VapiWebhookCall;
  destination: TransferDestination;
}

/**
 * Transfer destination request message
 * Sent when assistant needs a transfer destination
 */
export interface TransferDestinationRequestMessage {
  type: "transfer-destination-request";
  call: VapiWebhookCall;
}

/**
 * Conversation update message
 * Sent for conversation state changes
 */
export interface ConversationUpdateMessage {
  type: "conversation-update";
  call?: VapiWebhookCall;
  messages?: VapiMessage[];
  messagesOpenAIFormatted?: Array<{ role: string; content: string }>;
}

/**
 * Model output message
 * Sent when LLM generates a response
 */
export interface ModelOutputMessage {
  type: "model-output";
  call?: VapiWebhookCall;
  output: string;
  role?: "assistant";
}

/**
 * Function call message (legacy format)
 * Some older integrations may use this format
 */
export interface FunctionCallMessage {
  type: "function-call";
  call?: VapiWebhookCall;
  functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Voice input message
 * Sent when voice input is detected
 */
export interface VoiceInputMessage {
  type: "voice-input";
  call?: VapiWebhookCall;
  input: string;
}

// =============================================================================
// Union Types
// =============================================================================

/**
 * All possible VAPI webhook message types
 */
export type VapiWebhookMessage =
  | StatusUpdateMessage
  | EndOfCallReportMessage
  | HangMessage
  | ToolCallsMessage
  | TranscriptMessage
  | SpeechUpdateMessage
  | AssistantRequestMessage
  | TransferUpdateMessage
  | TransferDestinationRequestMessage
  | ConversationUpdateMessage
  | ModelOutputMessage
  | FunctionCallMessage
  | VoiceInputMessage;

/**
 * All supported webhook message type strings
 */
export type VapiWebhookMessageType = VapiWebhookMessage["type"];

/**
 * VAPI webhook payload structure
 */
export interface VapiWebhookPayload {
  message: VapiWebhookMessage & Record<string, unknown>;
}

// =============================================================================
// Response Types
// =============================================================================

/**
 * Standard webhook response
 */
export interface WebhookResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Tool calls response
 */
export interface ToolCallsResponse {
  results: VapiToolCallResult[];
  /** Optional message for assistant to speak after tool execution */
  message?: string;
}

/**
 * Assistant request response - provide an assistant
 */
export interface AssistantRequestResponse {
  assistant?: {
    id?: string;
    name?: string;
    model?: unknown;
    voice?: unknown;
    firstMessage?: string;
    [key: string]: unknown;
  };
  assistantId?: string;
  /** Error message if assistant cannot be provided */
  error?: string;
}

/**
 * Assistant request response - transfer call
 */
export interface AssistantRequestTransferResponse {
  destination: TransferDestination;
  error?: string;
}

/**
 * Transfer destination response
 */
export interface TransferDestinationResponse {
  destination: TransferDestination;
  message?: {
    type: "request-start" | "request-complete" | "request-failed";
    message: string;
  };
}

// =============================================================================
// Handler Types
// =============================================================================

/**
 * Context passed to webhook handlers
 */
export interface WebhookHandlerContext {
  /** Whether this is an inbound call */
  isInbound: boolean;
  /** Raw request for additional context if needed */
  rawPayload?: unknown;
}

/**
 * Generic webhook handler function type
 */
export type WebhookHandler<
  TMessage extends VapiWebhookMessage,
  TResponse = WebhookResponse,
> = (
  message: TMessage,
  context: WebhookHandlerContext,
) => Promise<TResponse | void>;

/**
 * Tool handler function type
 */
export type ToolHandler = (
  params: Record<string, unknown>,
  context: {
    callId: string;
    toolCallId: string;
    assistantId?: string;
  },
) => Promise<Record<string, unknown>>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for status-update message
 */
export function isStatusUpdateMessage(
  message: VapiWebhookMessage,
): message is StatusUpdateMessage {
  return message.type === "status-update";
}

/**
 * Type guard for end-of-call-report message
 */
export function isEndOfCallReportMessage(
  message: VapiWebhookMessage,
): message is EndOfCallReportMessage {
  return message.type === "end-of-call-report";
}

/**
 * Type guard for hang message
 */
export function isHangMessage(
  message: VapiWebhookMessage,
): message is HangMessage {
  return message.type === "hang";
}

/**
 * Type guard for tool-calls message
 */
export function isToolCallsMessage(
  message: VapiWebhookMessage,
): message is ToolCallsMessage {
  return message.type === "tool-calls";
}

/**
 * Type guard for transcript message
 */
export function isTranscriptMessage(
  message: VapiWebhookMessage,
): message is TranscriptMessage {
  return message.type === "transcript";
}

/**
 * Type guard for speech-update message
 */
export function isSpeechUpdateMessage(
  message: VapiWebhookMessage,
): message is SpeechUpdateMessage {
  return message.type === "speech-update";
}

/**
 * Type guard for assistant-request message
 */
export function isAssistantRequestMessage(
  message: VapiWebhookMessage,
): message is AssistantRequestMessage {
  return message.type === "assistant-request";
}

/**
 * Type guard for transfer-update message
 */
export function isTransferUpdateMessage(
  message: VapiWebhookMessage,
): message is TransferUpdateMessage {
  return message.type === "transfer-update";
}

/**
 * Type guard for transfer-destination-request message
 */
export function isTransferDestinationRequestMessage(
  message: VapiWebhookMessage,
): message is TransferDestinationRequestMessage {
  return message.type === "transfer-destination-request";
}

/**
 * Type guard for conversation-update message
 */
export function isConversationUpdateMessage(
  message: VapiWebhookMessage,
): message is ConversationUpdateMessage {
  return message.type === "conversation-update";
}

/**
 * Type guard for model-output message
 */
export function isModelOutputMessage(
  message: VapiWebhookMessage,
): message is ModelOutputMessage {
  return message.type === "model-output";
}

/**
 * Type guard for function-call message (legacy)
 */
export function isFunctionCallMessage(
  message: VapiWebhookMessage,
): message is FunctionCallMessage {
  return message.type === "function-call";
}
