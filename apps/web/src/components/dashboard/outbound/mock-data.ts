import type {
  DischargeCase,
  DischargeSummaryStats,
  DischargeCaseStatus,
  CaseType,
  DeliveryStatus,
} from "./types";

/**
 * Mock Data for Development
 *
 * Generate 10-12 realistic veterinary discharge cases with:
 * - Mix of all statuses
 * - Various species (dogs, cats, occasional exotic)
 * - Different procedures (dental, surgery, wellness, emergency)
 * - Some with missing contact info
 * - Some failed with realistic failure reasons
 */

const SPECIES_BREEDS = {
  Canine: [
    "Labrador Retriever",
    "Golden Retriever",
    "French Bulldog",
    "German Shepherd",
    "Poodle",
    "Beagle",
    "Bulldog",
    "Rottweiler",
    "Dachshund",
    "Boxer",
  ],
  Feline: [
    "Domestic Shorthair",
    "Maine Coon",
    "Siamese",
    "Persian",
    "Ragdoll",
    "Bengal",
    "British Shorthair",
    "Abyssinian",
  ],
  Avian: ["Cockatiel", "Parakeet", "African Grey", "Macaw"],
  Exotic: ["Rabbit", "Guinea Pig", "Ferret", "Bearded Dragon"],
};

const PET_NAMES = {
  Canine: [
    "Max",
    "Bella",
    "Charlie",
    "Luna",
    "Cooper",
    "Daisy",
    "Buddy",
    "Sadie",
    "Rocky",
    "Molly",
  ],
  Feline: [
    "Oliver",
    "Leo",
    "Milo",
    "Simba",
    "Loki",
    "Nala",
    "Cleo",
    "Luna",
    "Whiskers",
    "Shadow",
  ],
  Avian: ["Rio", "Kiwi", "Sunny", "Blue", "Tweety"],
  Exotic: ["Oreo", "Cinnamon", "Patches", "Spike"],
};

const OWNER_NAMES = [
  "Sarah Johnson",
  "Michael Chen",
  "Emily Rodriguez",
  "James Williams",
  "Jessica Martinez",
  "David Kim",
  "Amanda Thompson",
  "Robert Garcia",
  "Michelle Lee",
  "Christopher Brown",
  "Ashley Davis",
  "Matthew Wilson",
];

const CASE_TYPES: Array<{ type: CaseType; description: string }> = [
  { type: "checkup", description: "Annual Wellness Exam" },
  { type: "checkup", description: "Puppy/Kitten Vaccination" },
  { type: "surgery", description: "Dental Cleaning & Extraction" },
  { type: "surgery", description: "Spay/Neuter Surgery" },
  { type: "surgery", description: "Mass Removal" },
  { type: "surgery", description: "ACL Repair" },
  { type: "emergency", description: "Laceration Repair" },
  { type: "emergency", description: "Foreign Body Removal" },
  { type: "emergency", description: "GI Upset/Vomiting" },
  { type: "follow_up", description: "Post-Surgery Recheck" },
  { type: "follow_up", description: "Skin Condition Follow-up" },
];

const VETERINARIANS = [
  "Dr. Emily Chen",
  "Dr. Michael Roberts",
  "Dr. Sarah Mitchell",
  "Dr. James Park",
  "Dr. Lisa Thompson",
];

const FAILURE_REASONS = [
  "No answer after 3 attempts",
  "Phone number disconnected",
  "Voicemail box full",
  "Invalid phone number format",
  "Call rejected by recipient",
  "Network error during call",
];

/**
 * Generate a random date within the last N hours
 */
function randomRecentDate(hoursAgo: number): Date {
  const now = new Date();
  const msAgo = Math.random() * hoursAgo * 60 * 60 * 1000;
  return new Date(now.getTime() - msAgo);
}

/**
 * Generate a random phone number
 */
function randomPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${prefix}${line}`;
}

/**
 * Generate a random email from name
 */
function emailFromName(name: string): string {
  const [first, last] = name.toLowerCase().split(" ");
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${first}.${last}@${domain}`;
}

/**
 * Attention scenario templates for comprehensive mock data
 */
interface AttentionScenarioTemplate {
  attentionTypes: string[];
  attentionSeverity: "critical" | "urgent" | "routine";
  attentionSummary: string;
  patient: { name: string; species?: string; breed?: string };
  owner: { name: string };
  caseType?: "checkup" | "emergency" | "surgery" | "follow_up";
  veterinarian?: string;
}

const ATTENTION_SCENARIOS: AttentionScenarioTemplate[] = [
  // Critical scenarios - Emergency situations requiring immediate attention
  {
    attentionTypes: ["health_concern", "emergency_signs"],
    attentionSeverity: "critical",
    attentionSummary: "**[EMERGENCY] - Severe symptoms observed: Owner reports pet showing signs of bloat, contact emergency vet immediately**",
    patient: { name: "Max", species: "Canine", breed: "German Shepherd" },
    owner: { name: "Sarah Johnson" },
    caseType: "emergency",
    veterinarian: "Dr. Emily Chen",
  },
  {
    attentionTypes: ["medication_question", "health_concern"],
    attentionSeverity: "critical",
    attentionSummary: "**[MEDICATION] - Adverse reaction reported: Owner states pet vomiting after medication, stop immediately and bring in**",
    patient: { name: "Luna", species: "Feline", breed: "Persian" },
    owner: { name: "Michael Chen" },
    caseType: "follow_up",
    veterinarian: "Dr. Sarah Mitchell",
  },

  // Urgent scenarios - Need prompt attention within 24 hours
  {
    attentionTypes: ["dissatisfaction", "billing_question"],
    attentionSeverity: "urgent",
    attentionSummary: "**[CALLBACK] - Owner dissatisfied with care: Concerns about treatment plan and unexpected charges**",
    patient: { name: "Charlie", species: "Canine", breed: "Labrador Retriever" },
    owner: { name: "Jessica Martinez" },
    caseType: "surgery",
    veterinarian: "Dr. James Park",
  },
  {
    attentionTypes: ["health_concern", "appointment_needed"],
    attentionSeverity: "urgent",
    attentionSummary: "**[FOLLOW-UP] - Wound healing concerns: Owner reports incision site swelling, schedule recheck within 24 hours**",
    patient: { name: "Bella", species: "Canine", breed: "Golden Retriever" },
    owner: { name: "David Kim" },
    caseType: "surgery",
    veterinarian: "Dr. Lisa Thompson",
  },
  {
    attentionTypes: ["medication_question"],
    attentionSeverity: "urgent",
    attentionSummary: "**[MEDICATION] - Dosing confusion: Owner unsure about pain medication schedule, requires clarification**",
    patient: { name: "Rocky", species: "Canine", breed: "Bulldog" },
    owner: { name: "Amanda Thompson" },
    caseType: "surgery",
    veterinarian: "Dr. Michael Roberts",
  },

  // Routine scenarios - Standard follow-up needed
  {
    attentionTypes: ["medication_question"],
    attentionSeverity: "routine",
    attentionSummary: "**[MEDICATION] - Clarification needed: Confirm if antibiotic should be given with food**",
    patient: { name: "Daisy", species: "Feline", breed: "Maine Coon" },
    owner: { name: "Robert Garcia" },
    caseType: "checkup",
    veterinarian: "Dr. Emily Chen",
  },
  {
    attentionTypes: ["billing_question"],
    attentionSeverity: "routine",
    attentionSummary: "**[BILLING] - Invoice question: Owner requesting itemized breakdown of lab work charges**",
    patient: { name: "Buddy", species: "Canine", breed: "Beagle" },
    owner: { name: "Michelle Lee" },
    caseType: "checkup",
    veterinarian: "Dr. Sarah Mitchell",
  },

  // Complex multi-issue scenarios
  {
    attentionTypes: ["health_concern", "medication_question", "dissatisfaction"],
    attentionSeverity: "urgent",
    attentionSummary: "**[COMPLEX] - Multiple concerns: Address medication questions, health monitoring, and owner frustrations**",
    patient: { name: "Zeus", species: "Canine", breed: "Rottweiler" },
    owner: { name: "Christopher Brown" },
    caseType: "surgery",
    veterinarian: "Dr. James Park",
  },

  // Legacy unstructured format examples
  {
    attentionTypes: ["health_concern"],
    attentionSeverity: "urgent",
    attentionSummary: "Owner concerned about lethargy and decreased appetite since dental procedure yesterday",
    patient: { name: "Molly", species: "Feline", breed: "Siamese" },
    owner: { name: "Ashley Davis" },
    caseType: "surgery",
    veterinarian: "Dr. Lisa Thompson",
  },

  // Edge cases for testing
  {
    attentionTypes: [],
    attentionSeverity: "routine",
    attentionSummary: "General follow-up needed - no specific concerns noted",
    patient: { name: "Ginger", species: "Canine", breed: "Dachshund" },
    owner: { name: "Matthew Wilson" },
    caseType: "checkup",
    veterinarian: "Dr. Michael Roberts",
  },
];

/**
 * Generate mock discharge cases with optional attention scenarios
 * @param count - Total number of cases to generate
 * @param includeAttentionCases - Whether to include attention scenarios in the generated cases
 */
export function generateMockCases(count = 12, includeAttentionCases = false): DischargeCase[] {
  const cases: DischargeCase[] = [];

  // Define status distribution
  const statusDistribution: DischargeCaseStatus[] = [
    "pending_review",
    "pending_review",
    "pending_review",
    "scheduled",
    "scheduled",
    "ready",
    "in_progress",
    "in_progress",
    "completed",
    "completed",
    "completed",
    "failed",
  ];

  for (let i = 0; i < count; i++) {
    const speciesType = (Object.keys(SPECIES_BREEDS)[
      Math.floor(Math.random() * 3)
    ] ?? "Canine") as keyof typeof SPECIES_BREEDS; // Mostly dogs/cats
    const breeds = SPECIES_BREEDS[speciesType];
    const names = PET_NAMES[speciesType];
    const breed = breeds[Math.floor(Math.random() * breeds.length)] ?? "Mixed";
    const petName = names[Math.floor(Math.random() * names.length)] ?? "Buddy";
    const ownerName =
      OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)] ?? "John Doe";
    const caseTypeInfo = CASE_TYPES[
      Math.floor(Math.random() * CASE_TYPES.length)
    ] ?? { type: "checkup" as CaseType, description: "Wellness Exam" };
    const vet =
      VETERINARIANS[Math.floor(Math.random() * VETERINARIANS.length)] ??
      "Dr. Staff";
    const status =
      statusDistribution[i % statusDistribution.length] ?? "pending_review";

    // Some cases missing contact info (10% chance each)
    const hasPhone = Math.random() > 0.1;
    const hasEmail = Math.random() > 0.1;

    // Derive delivery status from case status
    let phoneSent: DeliveryStatus = null;
    let emailSent: DeliveryStatus = null;
    let failureReason: string | undefined;

    switch (status) {
      case "pending_review":
        phoneSent = hasPhone ? null : "not_applicable";
        emailSent = hasEmail ? null : "not_applicable";
        break;
      case "scheduled":
        phoneSent = hasPhone ? "pending" : "not_applicable";
        emailSent = hasEmail ? "pending" : "not_applicable";
        break;
      case "ready":
        phoneSent = hasPhone ? "pending" : "not_applicable";
        emailSent = hasEmail ? "pending" : "not_applicable";
        break;
      case "in_progress":
        phoneSent = hasPhone ? "pending" : "not_applicable";
        emailSent = hasEmail ? "sent" : "not_applicable";
        break;
      case "completed":
        phoneSent = hasPhone ? "sent" : "not_applicable";
        emailSent = hasEmail ? "sent" : "not_applicable";
        break;
      case "failed":
        phoneSent = hasPhone ? "failed" : "not_applicable";
        emailSent = hasEmail ? "sent" : "not_applicable";
        failureReason =
          FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)] ??
          "Unknown error";
        break;
    }

    const timestamp = randomRecentDate(8); // Within last 8 hours

    // Calculate scheduled times for scheduled/ready cases
    const emailScheduledFor =
      status === "scheduled" || status === "ready"
        ? new Date(
            timestamp.getTime() +
              (status === "scheduled" ? 24 * 60 * 60 * 1000 : 0),
          ) // 1 day for scheduled, now for ready
        : null;
    const callScheduledFor =
      status === "scheduled" || status === "ready"
        ? new Date(
            timestamp.getTime() +
              (status === "scheduled" ? 48 * 60 * 60 * 1000 : 0),
          ) // 2 days for scheduled, now for ready
        : null;

    const sexOptions = ["Male", "Female", "Male Neutered", "Female Spayed"];

    cases.push({
      id: `case-${String(i + 1).padStart(3, "0")}`,
      caseId: `case-${String(i + 1).padStart(3, "0")}`,
      patient: {
        id: `patient-${String(i + 1).padStart(3, "0")}`,
        name: petName,
        species: speciesType,
        breed,
        dateOfBirth: new Date(
          Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000,
        ),
        sex: sexOptions[Math.floor(Math.random() * 4)] ?? "Male",
        weightKg: Math.round((Math.random() * 30 + 2) * 10) / 10,
      },
      owner: {
        name: ownerName,
        phone: hasPhone ? randomPhone() : null,
        email: hasEmail ? emailFromName(ownerName) : null,
      },
      caseType: caseTypeInfo.type,
      caseStatus: "completed",
      veterinarian: vet,
      status,
      phoneSent,
      emailSent,
      dischargeSummary: `${petName} was seen today for ${caseTypeInfo.description.toLowerCase()}. The procedure went well and ${petName} is recovering normally. ${ownerName} should monitor for any signs of complications and follow the home care instructions provided.`,
      structuredContent: {
        patientName: petName,
        visitSummary: `${caseTypeInfo.description} performed successfully`,
        diagnosis: caseTypeInfo.description,
        treatmentsToday: [
          `Completed ${caseTypeInfo.description.toLowerCase()}`,
        ],
        medications:
          caseTypeInfo.type === "surgery"
            ? [
                {
                  name: "Carprofen",
                  dosage: "75mg",
                  frequency: "twice daily",
                  duration: "5-7 days",
                  purpose: "pain relief",
                },
              ]
            : [],
        homeCare: {
          activity: "Rest and limited activity for 24-48 hours",
        },
        followUp: {
          required: true,
          date: "in 10-14 days",
          reason: "post-procedure checkup",
        },
        warningSigns: ["Excessive bleeding", "Swelling", "Lethargy"],
      },
      callScript: `Hi ${ownerName}, this is calling from the veterinary clinic regarding ${petName}'s visit today. ${petName} did great during the ${caseTypeInfo.description.toLowerCase()} and is recovering well. I wanted to go over the home care instructions with you...`,
      emailContent: `Dear ${ownerName},\n\nThank you for bringing ${petName} in today for ${caseTypeInfo.description.toLowerCase()}. We're pleased to report that everything went smoothly.\n\nPlease review the attached discharge instructions and don't hesitate to contact us if you have any questions.\n\nBest regards,\n${vet}`,
      scheduledCall:
        status !== "pending_review"
          ? {
              id: `call-${String(i + 1).padStart(3, "0")}`,
              userId: "user-001",
              caseId: `case-${String(i + 1).padStart(3, "0")}`,
              vapiCallId: status === "completed" ? `vapi-call-${i}` : null,
              customerPhone: hasPhone ? randomPhone() : null,
              scheduledFor: new Date(timestamp.getTime() + 2 * 60 * 1000),
              status:
                status === "completed"
                  ? "completed"
                  : status === "failed"
                    ? "failed"
                    : status === "in_progress"
                      ? "in_progress"
                      : "queued",
              startedAt:
                status === "completed" || status === "in_progress"
                  ? timestamp
                  : null,
              endedAt: status === "completed" ? timestamp : null,
              durationSeconds:
                status === "completed"
                  ? 120 + Math.floor(Math.random() * 180)
                  : null,
              recordingUrl: null,
              transcript: null,
              cleanedTranscript: null,
              summary: null,
              successEvaluation: null,
              userSentiment: null,
              reviewCategory: "to_review",
              endedReason: status === "failed" ? (failureReason ?? null) : null,
              cost:
                status === "completed"
                  ? Math.round(Math.random() * 50) / 100
                  : null,
              dynamicVariables: {},
              metadata: {},
              createdAt: timestamp,
              updatedAt: timestamp,
            }
          : null,
      scheduledEmail:
        status !== "pending_review"
          ? {
              id: `email-${String(i + 1).padStart(3, "0")}`,
              userId: "user-001",
              caseId: `case-${String(i + 1).padStart(3, "0")}`,
              recipientEmail: hasEmail ? emailFromName(ownerName) : "",
              recipientName: ownerName ?? null,
              subject: `Discharge Instructions for ${petName}`,
              htmlContent: "<p>Email content here...</p>",
              textContent: null,
              scheduledFor: emailScheduledFor ?? timestamp,
              status:
                status === "completed" ||
                status === "in_progress" ||
                status === "failed"
                  ? "sent"
                  : "queued",
              sentAt:
                status === "completed" ||
                status === "in_progress" ||
                status === "failed"
                  ? timestamp
                  : null,
              resendEmailId: null,
              metadata: {},
              createdAt: timestamp,
              updatedAt: timestamp,
            }
          : null,
      scheduledEmailFor: emailScheduledFor,
      scheduledCallFor: callScheduledFor,
      idexxNotes: null, // IDEXX notes from metadata
      soapNotes: [], // SOAP notes from soap_notes table
      timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      failureReason,
      // Attention fields (will be populated below if includeAttentionCases is true)
      attentionTypes: null,
      attentionSeverity: null,
      attentionFlaggedAt: null,
      attentionSummary: null,
      needsAttention: false,
    });
  }

  // Add attention scenarios if requested
  if (includeAttentionCases) {
    const attentionCases = generateAttentionScenarios(Math.min(6, count));
    // Replace the first N cases with attention scenarios
    for (let i = 0; i < attentionCases.length && i < cases.length; i++) {
      const attentionCase = attentionCases[i]!;
      const baseCase = cases[i]!;

      cases[i] = {
        ...baseCase,
        // Only override defined properties from attention case
        ...(attentionCase.patient && { patient: attentionCase.patient }),
        ...(attentionCase.owner && { owner: attentionCase.owner }),
        ...(attentionCase.attentionTypes !== undefined && { attentionTypes: attentionCase.attentionTypes }),
        ...(attentionCase.attentionSeverity !== undefined && { attentionSeverity: attentionCase.attentionSeverity }),
        ...(attentionCase.attentionSummary !== undefined && { attentionSummary: attentionCase.attentionSummary }),
        ...(attentionCase.attentionFlaggedAt !== undefined && { attentionFlaggedAt: attentionCase.attentionFlaggedAt }),
        ...(attentionCase.needsAttention !== undefined && { needsAttention: attentionCase.needsAttention }),
        ...(attentionCase.timestamp && { timestamp: attentionCase.timestamp }),
        id: baseCase.id, // Keep original ID
        caseId: baseCase.caseId, // Keep original case ID
      };
    }
  }

  // Sort by timestamp descending (most recent first)
  return cases.sort((a, b) => {
    const timeA =
      a.timestamp instanceof Date
        ? a.timestamp.getTime()
        : new Date(a.timestamp).getTime();
    const timeB =
      b.timestamp instanceof Date
        ? b.timestamp.getTime()
        : new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
}

/**
 * Pre-generated mock cases (default without attention scenarios)
 */
export const mockDischargeCases: DischargeCase[] = generateMockCases(12);

/**
 * Mock statistics computed from mock cases
 */
export const mockStats: DischargeSummaryStats = {
  readyToSend:
    mockDischargeCases.filter((c) => c.status === "pending_review").length +
    mockDischargeCases.filter((c) => c.status === "ready").length +
    mockDischargeCases.filter((c) => c.status === "in_progress").length,
  scheduled: mockDischargeCases.filter((c) => c.status === "scheduled").length,
  sent: mockDischargeCases.filter((c) => c.status === "completed").length,
  failed: mockDischargeCases.filter((c) => c.status === "failed").length,
  failureCategories: {
    silenceTimeout: 0,
    noAnswer: 0,
    connectionError: 0,
    voicemail: 0,
    emailFailed: 0,
    other: mockDischargeCases.filter((c) => c.status === "failed").length,
  },
  total: mockDischargeCases.length,
  needsReview: mockDischargeCases.filter(
    (c) => !c.owner.phone || !c.owner.email,
  ).length,
  needsAttention: mockDischargeCases.filter((c) => c.needsAttention).length,
  needsAttentionBreakdown: {
    critical: mockDischargeCases.filter((c) => c.attentionSeverity === "critical").length,
    urgent: mockDischargeCases.filter((c) => c.attentionSeverity === "urgent").length,
    routine: mockDischargeCases.filter((c) => c.attentionSeverity === "routine").length,
  },
};


/**
 * Generate attention scenario cases for demo/testing
 * @param count - Number of attention cases to generate (max 10)
 * @returns Array of partial DischargeCase objects with attention data
 */
export function generateAttentionScenarios(count: number): Partial<DischargeCase>[] {
  const scenarios: Partial<DischargeCase>[] = [];
  const maxScenarios = Math.min(count, ATTENTION_SCENARIOS.length);

  for (let i = 0; i < maxScenarios; i++) {
    const scenario = ATTENTION_SCENARIOS[i]!;
    const timestamp = new Date(Date.now() - (i + 1) * 30 * 60 * 1000); // Each case 30 mins older

    scenarios.push({
      // Override patient info
      patient: {
        id: `patient-attention-${i + 1}`,
        name: scenario.patient.name,
        species: scenario.patient.species ?? "Canine",
        breed: scenario.patient.breed ?? "Mixed Breed",
        dateOfBirth: new Date(Date.now() - Math.random() * 8 * 365 * 24 * 60 * 60 * 1000),
        sex: ["Male", "Female", "Male Neutered", "Female Spayed"][Math.floor(Math.random() * 4)]!,
        weightKg: Math.round((Math.random() * 30 + 2) * 10) / 10,
      },

      // Override owner info
      owner: {
        name: scenario.owner.name,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        email: `${scenario.owner.name.toLowerCase().replace(' ', '.')}@example.com`,
      },

      // Case details
      caseType: scenario.caseType ?? "checkup",
      veterinarian: scenario.veterinarian ?? "Dr. Staff",
      status: "completed", // All attention cases should be completed calls

      // Attention data
      needsAttention: true,
      attentionTypes: scenario.attentionTypes,
      attentionSeverity: scenario.attentionSeverity,
      attentionSummary: scenario.attentionSummary,
      attentionFlaggedAt: timestamp.toISOString(),

      // Update timestamps
      timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return scenarios;
}

