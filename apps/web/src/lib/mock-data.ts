import type { DashboardCase, DischargeSettings } from "~/types/dashboard";

export const MOCK_DISCHARGE_SETTINGS: DischargeSettings = {
  clinicName: "Happy Paws Veterinary Clinic",
  clinicPhone: "+1 (555) 123-4567",
  clinicEmail: "info@happypaws.com",
  emergencyPhone: "+1 (555) 999-8888",
  vetName: "Dr. Sarah Smith",
  testModeEnabled: false,
  testContactName: "",
  testContactEmail: "",
  testContactPhone: "",
};

export const MOCK_CASES: DashboardCase[] = [
  {
    id: "case-1",
    status: "ongoing",
    source: "idexx_neo",
    type: "checkup",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    scheduled_at: null,
    patient: {
      id: "pat-1",
      name: "Luna",
      species: "Canine",
      breed: "Golden Retriever",
      owner_name: "John Doe",
      owner_email: "john.doe@example.com",
      owner_phone: "+1 (555) 987-6543",
    },
    has_clinical_notes: true,
    is_ready_for_discharge: true,
    missing_requirements: [],
    discharge_summary: {
      id: "ds-1",
      content: "Patient is recovering well from anesthesia...",
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    scheduled_discharge_calls: [
      {
        id: "call-1",
        status: "queued",
        scheduled_for: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // in 30 mins
        ended_at: null,
        ended_reason: null,
        vapi_call_id: "vapi-123",
        transcript: null,
        recording_url: null,
        duration_seconds: null,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
    scheduled_discharge_emails: [
      {
        id: "email-1",
        status: "sent",
        scheduled_for: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        sent_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
  },
  {
    id: "case-2",
    status: "completed",
    source: "chrome_extension",
    type: "follow_up",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    scheduled_at: null,
    patient: {
      id: "pat-2",
      name: "Simba",
      species: "Feline",
      breed: "Maine Coon",
      owner_name: "Jane Smith",
      owner_email: "jane.smith@example.com",
      owner_phone: "+1 (555) 456-7890",
    },
    has_clinical_notes: true,
    is_ready_for_discharge: true,
    missing_requirements: [],
    discharge_summary: {
      id: "ds-2",
      content: "Routine checkup completed. Vaccinations updated.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    scheduled_discharge_calls: [
      {
        id: "call-2",
        status: "completed",
        scheduled_for: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        ended_at: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(),
        ended_reason: "assistant-ended-call",
        vapi_call_id: "vapi-456",
        transcript: "Call transcript here...",
        recording_url: "https://example.com/recording.mp3",
        duration_seconds: 180,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
    scheduled_discharge_emails: [],
  },
  {
    id: "case-3",
    status: "draft",
    source: "manual",
    type: "emergency",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    scheduled_at: null,
    patient: {
      id: "pat-3",
      name: "Bella",
      species: "Canine",
      breed: "French Bulldog",
      owner_name: "Mike Johnson",
      owner_email: "mike.j@example.com",
      owner_phone: "+1 (555) 111-2222",
    },
    has_clinical_notes: false,
    is_ready_for_discharge: false,
    missing_requirements: [
      "Clinical notes (SOAP, discharge summary, or transcription)",
    ],
    scheduled_discharge_calls: [],
    scheduled_discharge_emails: [],
    // No discharge summary or scheduled items yet
  },
  {
    id: "case-4",
    status: "ongoing",
    source: "idexx_neo",
    type: "surgery",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    scheduled_at: null,
    patient: {
      id: "pat-4",
      name: "Max",
      species: "Canine",
      breed: "German Shepherd",
      owner_name: "Sarah Williams",
      owner_email: "sarah.w@example.com",
      owner_phone: "+1 (555) 333-4444",
    },
    has_clinical_notes: true,
    is_ready_for_discharge: true,
    missing_requirements: [],
    discharge_summary: {
      id: "ds-4",
      content: "Surgery successful. Monitoring recovery.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    },
    scheduled_discharge_calls: [
      {
        id: "call-4",
        status: "failed",
        scheduled_for: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        ended_at: new Date(Date.now() - 1000 * 60 * 60 * 21.9).toISOString(),
        ended_reason: "dial-failed",
        vapi_call_id: "vapi-789",
        transcript: null,
        recording_url: null,
        duration_seconds: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      },
    ],
    scheduled_discharge_emails: [],
  },
];
