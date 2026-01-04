/**
 * Mock Data Generator
 *
 * Generates realistic mock case data for demo purposes.
 * Supports all 6 sidebar states with appropriate timestamps and data.
 */

import {
  type CaseDataForWorkflow,
  type SidebarState,
  buildWorkflow,
  type WorkflowData,
} from "./workflow-builder";

interface MockPatient {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  weightKg: number | null;
}

interface MockOwner {
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface MockCaseData extends CaseDataForWorkflow {
  patient: MockPatient;
  owner: MockOwner;
}

// Sample data pools
const petNames = [
  "Lori",
  "Max",
  "Bella",
  "Charlie",
  "Luna",
  "Cooper",
  "Daisy",
  "Buddy",
];
const ownerNames = [
  "Nina Garcia",
  "John Smith",
  "Sarah Johnson",
  "Michael Chen",
  "Emily Davis",
];
const breeds = [
  "Mixed Breed",
  "Golden Retriever",
  "Labrador",
  "German Shepherd",
  "Beagle",
  "Siamese",
  "Persian",
  "Maine Coon",
];
const caseTypes = [
  "wellness",
  "vaccination",
  "dental",
  "surgery",
  "emergency",
  "follow_up",
];

// Sample transcript
const sampleTranscript = `AI: Hi. This is Alum Rock Animal Hospital calling to check on Lori. Do you have a minute?
User: Leave a message, and I will get back to you. Thank you.
AI: Goodbye.`;

const sampleTranscriptPositive = `AI: Hi. This is Alum Rock Animal Hospital calling to check on Bella. Do you have a minute?
User: Yes, of course. What's this about?
AI: I'm calling to follow up on Bella's visit yesterday. How is she doing today?
User: She's doing great! Much better than yesterday. Thank you so much for calling to check on her.
AI: That's wonderful to hear. Is she eating and drinking normally?
User: Yes, everything is back to normal. We really appreciate the care.
AI: Perfect. If you have any concerns, please don't hesitate to call us. Have a great day!
User: Thank you so much!`;

const attentionTypes = [
  ["owner_callback_requested", "medication_concerns"],
  ["follow_up_needed", "symptoms_worsening"],
  ["owner_questions", "dietary_concerns"],
];

const attentionSummaries = [
  "Owner expressed concern about medication dosage and requested a callback from the veterinarian.",
  "Pet showing signs of continued discomfort. Owner reports symptoms have not improved.",
  "Owner has questions about dietary restrictions and post-operative care instructions.",
];

/**
 * Generate a random timestamp relative to now
 */
function generateTimestamp(hoursAgo: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

/**
 * Generate a mock UUID
 */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate mock case data for a specific sidebar state
 */
export function generateMockCase(state: SidebarState): MockCaseData {
  const petNameIndex = Math.floor(Math.random() * petNames.length);
  const ownerNameIndex = Math.floor(Math.random() * ownerNames.length);
  const breedIndex = Math.floor(Math.random() * breeds.length);
  const caseTypeIndex = Math.floor(Math.random() * caseTypes.length);

  const baseCase: MockCaseData = {
    id: generateId(),
    caseId: generateId(),
    status: "completed",
    caseType: caseTypes[caseTypeIndex] ?? "wellness",
    timestamp: generateTimestamp(4),
    emailSent: null,
    scheduledEmailFor: null,
    phoneSent: null,
    scheduledCallFor: null,
    scheduledCall: null,
    owner: {
      name: ownerNames[ownerNameIndex] ?? "Nina Garcia",
      phone: "+14089303940",
      email: "msninag@yahoo.com",
    },
    patient: {
      id: generateId(),
      name: petNames[petNameIndex] ?? "Lori",
      species: "Canine",
      breed: breeds[breedIndex] ?? "Mixed Breed",
      dateOfBirth: "2021-06-15",
      sex: "Female Spayed",
      weightKg: 12.5,
    },
  };

  switch (state) {
    case "pending_review":
      return {
        ...baseCase,
        status: "pending_review",
        emailSent: null,
        phoneSent: null,
      };

    case "email_only":
      return {
        ...baseCase,
        emailSent: "sent",
        scheduledEmailFor: generateTimestamp(3),
        phoneSent: null,
      };

    case "call_only":
      return {
        ...baseCase,
        emailSent: null,
        phoneSent: "sent",
        scheduledCallFor: generateTimestamp(2),
        scheduledCall: {
          id: generateId(),
          durationSeconds: 9,
          transcript: sampleTranscript,
          recordingUrl: "https://example.com/recording.mp3",
          summary:
            "Owner was unable to speak and requested the caller leave a message.",
          endedReason: "assistant-ended-call",
        },
      };

    case "both_sent":
      return {
        ...baseCase,
        emailSent: "sent",
        scheduledEmailFor: generateTimestamp(3),
        phoneSent: "sent",
        scheduledCallFor: generateTimestamp(2),
        scheduledCall: {
          id: generateId(),
          durationSeconds: 45,
          transcript: sampleTranscriptPositive,
          recordingUrl: "https://example.com/recording.mp3",
          summary: "Owner reported pet is doing well. No concerns raised.",
          endedReason: "customer-ended-call",
        },
      };

    case "with_attention":
      const attentionIndex = Math.floor(Math.random() * attentionTypes.length);
      return {
        ...baseCase,
        phoneSent: "sent",
        scheduledCallFor: generateTimestamp(1),
        scheduledCall: {
          id: generateId(),
          durationSeconds: 120,
          transcript: sampleTranscriptPositive,
          recordingUrl: "https://example.com/recording.mp3",
          summary: attentionSummaries[attentionIndex] ?? null,
          endedReason: "customer-ended-call",
        },
        needsAttention: true,
        attentionTypes: attentionTypes[attentionIndex],
        attentionSeverity: "urgent",
        attentionSummary: attentionSummaries[attentionIndex],
      };

    case "failed":
      return {
        ...baseCase,
        phoneSent: "failed",
        scheduledCallFor: generateTimestamp(1),
        scheduledCall: {
          id: generateId(),
          durationSeconds: null,
          transcript: null,
          recordingUrl: null,
          summary: null,
          endedReason: "dial-no-answer",
        },
      };

    default:
      return baseCase;
  }
}

/**
 * Get mock workflow data for a specific state
 */
export function getMockWorkflow(state: SidebarState): WorkflowData {
  const mockCase = generateMockCase(state);
  return buildWorkflow(mockCase);
}

/**
 * Static mock cases for consistent demo experience
 */
export const DEMO_CASES: Record<SidebarState, MockCaseData> = {
  pending_review: {
    id: "demo-pending",
    caseId: "case-pending",
    status: "pending_review",
    caseType: "wellness",
    timestamp: generateTimestamp(2),
    emailSent: null,
    scheduledEmailFor: null,
    phoneSent: null,
    scheduledCallFor: null,
    scheduledCall: null,
    owner: {
      name: "Nina Garcia",
      phone: "+14089303940",
      email: "msninag@yahoo.com",
    },
    patient: {
      id: "patient-1",
      name: "Lori",
      species: "Canine",
      breed: "Mixed Breed",
      dateOfBirth: "2021-06-15",
      sex: "Female Spayed",
      weightKg: 12.5,
    },
  },

  email_only: {
    id: "demo-email",
    caseId: "case-email",
    status: "completed",
    caseType: "vaccination",
    timestamp: generateTimestamp(4),
    emailSent: "sent",
    scheduledEmailFor: generateTimestamp(3),
    phoneSent: null,
    scheduledCallFor: null,
    scheduledCall: null,
    owner: {
      name: "John Smith",
      phone: "+14155551234",
      email: "john.smith@email.com",
    },
    patient: {
      id: "patient-2",
      name: "Max",
      species: "Canine",
      breed: "Golden Retriever",
      dateOfBirth: "2019-03-20",
      sex: "Male Neutered",
      weightKg: 32.0,
    },
  },

  call_only: {
    id: "demo-call",
    caseId: "case-call",
    status: "completed",
    caseType: "dental",
    timestamp: generateTimestamp(4),
    emailSent: null,
    scheduledEmailFor: null,
    phoneSent: "sent",
    scheduledCallFor: generateTimestamp(2),
    scheduledCall: {
      id: "call-1",
      durationSeconds: 9,
      transcript: sampleTranscript,
      recordingUrl: "https://example.com/recording.mp3",
      summary:
        "Owner was unable to speak and requested the caller leave a message, promising to return the call.",
      endedReason: "assistant-ended-call",
    },
    owner: {
      name: "Sarah Johnson",
      phone: "+14085559876",
      email: "sarah.j@gmail.com",
    },
    patient: {
      id: "patient-3",
      name: "Bella",
      species: "Feline",
      breed: "Siamese",
      dateOfBirth: "2020-11-10",
      sex: "Female Spayed",
      weightKg: 4.2,
    },
  },

  both_sent: {
    id: "demo-both",
    caseId: "case-both",
    status: "completed",
    caseType: "wellness",
    timestamp: generateTimestamp(5),
    emailSent: "sent",
    scheduledEmailFor: generateTimestamp(4),
    phoneSent: "sent",
    scheduledCallFor: generateTimestamp(3),
    scheduledCall: {
      id: "call-2",
      durationSeconds: 45,
      transcript: sampleTranscriptPositive,
      recordingUrl: "https://example.com/recording.mp3",
      summary:
        "Owner reported pet is doing wonderfully. Very satisfied with care provided.",
      endedReason: "customer-ended-call",
    },
    owner: {
      name: "Michael Chen",
      phone: "+16505553456",
      email: "mchen@outlook.com",
    },
    patient: {
      id: "patient-4",
      name: "Charlie",
      species: "Canine",
      breed: "Labrador",
      dateOfBirth: "2018-07-25",
      sex: "Male Neutered",
      weightKg: 28.5,
    },
  },

  with_attention: {
    id: "demo-attention",
    caseId: "case-attention",
    status: "completed",
    caseType: "surgery",
    timestamp: generateTimestamp(3),
    emailSent: "sent",
    scheduledEmailFor: generateTimestamp(2),
    phoneSent: "sent",
    scheduledCallFor: generateTimestamp(1),
    scheduledCall: {
      id: "call-3",
      durationSeconds: 180,
      transcript: sampleTranscriptPositive,
      recordingUrl: "https://example.com/recording.mp3",
      summary:
        "Owner expressed concern about post-surgery swelling and medication side effects.",
      endedReason: "customer-ended-call",
    },
    needsAttention: true,
    attentionTypes: ["owner_callback_requested", "medication_concerns"],
    attentionSeverity: "urgent",
    attentionSummary:
      "Owner expressed concern about medication dosage and requested a callback from the veterinarian to discuss post-operative care.",
    owner: {
      name: "Emily Davis",
      phone: "+14087778899",
      email: "emily.d@yahoo.com",
    },
    patient: {
      id: "patient-5",
      name: "Luna",
      species: "Feline",
      breed: "Persian",
      dateOfBirth: "2022-02-14",
      sex: "Female Spayed",
      weightKg: 3.8,
    },
  },

  failed: {
    id: "demo-failed",
    caseId: "case-failed",
    status: "failed",
    caseType: "follow_up",
    timestamp: generateTimestamp(2),
    emailSent: null,
    scheduledEmailFor: null,
    phoneSent: "failed",
    scheduledCallFor: generateTimestamp(1),
    scheduledCall: {
      id: "call-4",
      durationSeconds: null,
      transcript: null,
      recordingUrl: null,
      summary: null,
      endedReason: "dial-no-answer",
    },
    owner: {
      name: "Robert Wilson",
      phone: "+14089991111",
      email: "rwilson@email.com",
    },
    patient: {
      id: "patient-6",
      name: "Cooper",
      species: "Canine",
      breed: "Beagle",
      dateOfBirth: "2017-09-05",
      sex: "Male Neutered",
      weightKg: 14.2,
    },
  },
};

/**
 * Get a static demo workflow for a specific state
 */
export function getDemoWorkflow(state: SidebarState): {
  caseData: MockCaseData;
  workflow: WorkflowData;
} {
  const caseData = DEMO_CASES[state];
  const workflow = buildWorkflow(caseData);
  return { caseData, workflow };
}
