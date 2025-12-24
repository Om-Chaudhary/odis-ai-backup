/**
 * Call fixture generators
 *
 * Provides factories for creating test call data
 */

/**
 * Mock call record (database representation)
 */
export interface MockCallRecord {
  id: string;
  clinic_id: string;
  patient_id?: string;
  case_id?: string;
  vapi_call_id?: string;
  type: "follow_up" | "reminder" | "inbound" | "outbound";
  status: "scheduled" | "in_progress" | "completed" | "failed" | "no_answer";
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  recording_url?: string;
  customer_phone: string;
  customer_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function createMockCallRecord(
  overrides?: Partial<MockCallRecord>,
): MockCallRecord {
  const id = overrides?.id ?? `call-record-${Date.now()}`;
  const now = new Date();

  return {
    id,
    clinic_id: `clinic-${Date.now()}`,
    patient_id: undefined,
    case_id: undefined,
    vapi_call_id: `vapi-call-${Date.now()}`,
    type: "follow_up",
    status: "completed",
    scheduled_at: now.toISOString(),
    started_at: now.toISOString(),
    ended_at: new Date(now.getTime() + 5 * 60 * 1000).toISOString(), // 5 minutes later
    duration_seconds: 300,
    transcript: "Hello, this is ODIS calling from Test Veterinary Clinic...",
    summary:
      "Follow-up call completed successfully. Patient is recovering well.",
    recording_url: "https://example.com/recordings/test.mp3",
    customer_phone: "+15551234567",
    customer_name: "John Smith",
    metadata: {},
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

/**
 * Mock scheduled call (for call scheduling tests)
 */
export interface MockScheduledCall {
  id: string;
  clinic_id: string;
  case_id: string;
  patient_id: string;
  scheduled_time: string;
  customer_phone: string;
  customer_name: string;
  call_type: "follow_up" | "reminder";
  attempt_number: number;
  max_attempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  variable_values: Record<string, unknown>;
  created_at: string;
}

export function createMockScheduledCall(
  overrides?: Partial<MockScheduledCall>,
): MockScheduledCall {
  const id = overrides?.id ?? `scheduled-call-${Date.now()}`;
  const scheduledTime =
    overrides?.scheduled_time ??
    new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

  return {
    id,
    clinic_id: `clinic-${Date.now()}`,
    case_id: `case-${Date.now()}`,
    patient_id: `patient-${Date.now()}`,
    scheduled_time: scheduledTime,
    customer_phone: "+15551234567",
    customer_name: "John Smith",
    call_type: "follow_up",
    attempt_number: 1,
    max_attempts: 3,
    status: "pending",
    variable_values: {
      patientName: "Buddy",
      procedureType: "Dental cleaning",
      clinicName: "Test Veterinary Clinic",
    },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock inbound call record
 */
export interface MockInboundCall {
  id: string;
  clinic_id: string;
  vapi_call_id: string;
  caller_phone: string;
  caller_name?: string;
  status: "ringing" | "in_progress" | "completed" | "missed" | "transferred";
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript?: string;
  intent?: string;
  sentiment?: "positive" | "neutral" | "negative";
  transferred_to?: string;
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

export function createMockInboundCall(
  overrides?: Partial<MockInboundCall>,
): MockInboundCall {
  const id = overrides?.id ?? `inbound-call-${Date.now()}`;
  const now = new Date();

  return {
    id,
    clinic_id: `clinic-${Date.now()}`,
    vapi_call_id: `vapi-${Date.now()}`,
    caller_phone: "+15551234567",
    caller_name: "Jane Doe",
    status: "completed",
    started_at: now.toISOString(),
    ended_at: new Date(now.getTime() + 3 * 60 * 1000).toISOString(),
    duration_seconds: 180,
    transcript: "Hi, I'm calling about my dog Buddy...",
    intent: "appointment_inquiry",
    sentiment: "neutral",
    transferred_to: undefined,
    recording_url: "https://example.com/recordings/inbound.mp3",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

/**
 * Create a list of call records for testing
 */
export function createMockCallList(
  count: number,
  options?: {
    clinicId?: string;
    types?: MockCallRecord["type"][];
    statuses?: MockCallRecord["status"][];
  },
): MockCallRecord[] {
  const types = options?.types ?? [
    "follow_up",
    "reminder",
    "inbound",
    "outbound",
  ];
  const statuses = options?.statuses ?? ["completed", "failed", "no_answer"];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - i);

    return createMockCallRecord({
      id: `call-${i + 1}`,
      clinic_id: options?.clinicId ?? "clinic-1",
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      started_at: date.toISOString(),
    });
  });
}
