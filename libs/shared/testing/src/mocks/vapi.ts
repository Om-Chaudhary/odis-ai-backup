/**
 * VAPI mock utilities
 *
 * Provides mocks for VAPI client and webhook handling
 */
import { vi } from "vitest";

/**
 * Mock VAPI call object
 */
export interface MockVapiCall {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  type: "inboundPhoneCall" | "outboundPhoneCall" | "webCall";
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  endedReason?: string;
  assistantId?: string;
  customer?: {
    number?: string;
    name?: string;
  };
  phoneNumber?: {
    id: string;
    number: string;
  };
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  assistantOverrides?: {
    variableValues?: Record<string, unknown>;
  };
}

/**
 * Create a mock VAPI call
 */
export function createMockVapiCall(overrides?: Partial<MockVapiCall>): MockVapiCall {
  return {
    id: `call-${Date.now()}`,
    orgId: "test-org-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: "outboundPhoneCall",
    status: "ended",
    endedReason: "assistant-ended-call",
    assistantId: "test-assistant-id",
    customer: {
      number: "+15551234567",
      name: "Test Customer",
    },
    phoneNumber: {
      id: "phone-id",
      number: "+15559876543",
    },
    transcript: "Hello, this is a test call. How can I help you today?",
    recordingUrl: "https://example.com/recording.mp3",
    summary: "Test call summary",
    analysis: {},
    metadata: {},
    ...overrides,
  };
}

/**
 * Mock VAPI webhook payload types
 */
export type VapiWebhookType =
  | "assistant-request"
  | "function-call"
  | "status-update"
  | "end-of-call-report"
  | "hang"
  | "speech-update"
  | "transcript"
  | "tool-calls"
  | "transfer-destination-request"
  | "conversation-update"
  | "model-output";

/**
 * Create a mock VAPI webhook payload
 */
export function createMockVapiWebhook(
  type: VapiWebhookType,
  overrides?: Record<string, unknown>
): { message: { type: VapiWebhookType; call?: MockVapiCall; [key: string]: unknown } } {
  const basePayload = {
    type,
    call: createMockVapiCall(),
    timestamp: new Date().toISOString(),
  };

  // Add type-specific defaults
  const typeDefaults: Record<VapiWebhookType, Record<string, unknown>> = {
    "assistant-request": {},
    "function-call": {
      functionCall: {
        name: "test-function",
        parameters: {},
      },
    },
    "status-update": {
      status: "in-progress",
    },
    "end-of-call-report": {
      endedReason: "assistant-ended-call",
      transcript: "Test transcript",
      summary: "Test summary",
      recordingUrl: "https://example.com/recording.mp3",
    },
    hang: {
      endedReason: "customer-ended-call",
    },
    "speech-update": {
      status: "started",
      role: "assistant",
    },
    transcript: {
      transcript: "Hello, this is a test.",
      role: "assistant",
    },
    "tool-calls": {
      toolCalls: [
        {
          id: "tool-call-1",
          type: "function",
          function: {
            name: "test-tool",
            arguments: "{}",
          },
        },
      ],
    },
    "transfer-destination-request": {
      destination: {
        type: "number",
        number: "+15551234567",
      },
    },
    "conversation-update": {
      conversation: [],
    },
    "model-output": {
      output: "Test model output",
    },
  };

  return {
    message: {
      ...basePayload,
      ...typeDefaults[type],
      ...overrides,
    },
  };
}

/**
 * Mock VAPI client
 */
export function createMockVapiClient() {
  return {
    calls: {
      create: vi.fn().mockResolvedValue(createMockVapiCall()),
      get: vi.fn().mockResolvedValue(createMockVapiCall()),
      list: vi.fn().mockResolvedValue({ data: [createMockVapiCall()] }),
      update: vi.fn().mockResolvedValue(createMockVapiCall()),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    assistants: {
      create: vi.fn().mockResolvedValue({ id: "assistant-id" }),
      get: vi.fn().mockResolvedValue({ id: "assistant-id", name: "Test Assistant" }),
      list: vi.fn().mockResolvedValue({ data: [] }),
      update: vi.fn().mockResolvedValue({ id: "assistant-id" }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    phoneNumbers: {
      list: vi.fn().mockResolvedValue({
        data: [{ id: "phone-id", number: "+15559876543" }],
      }),
      get: vi.fn().mockResolvedValue({ id: "phone-id", number: "+15559876543" }),
    },
  };
}

/**
 * Create mock VAPI assistant variable values
 */
export function createMockVariableValues(
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  return {
    patientName: "Buddy",
    petSpecies: "dog",
    petBreed: "Golden Retriever",
    ownerName: "John Smith",
    ownerPhone: "+15551234567",
    clinicName: "Test Veterinary Clinic",
    clinicPhone: "+15559876543",
    procedureType: "Dental cleaning",
    dischargeDate: new Date().toISOString().split("T")[0],
    veterinarianName: "Dr. Smith",
    ...overrides,
  };
}
