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
 * Generate mock discharge cases
 */
export function generateMockCases(count = 12): DischargeCase[] {
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
        treatmentsToday: `Completed ${caseTypeInfo.description.toLowerCase()}`,
        medications:
          caseTypeInfo.type === "surgery"
            ? "Pain medication prescribed for 5-7 days"
            : "None required",
        homeCare: "Rest and limited activity for 24-48 hours",
        followUp: "Recheck appointment in 10-14 days",
        warningSigns:
          "Contact us immediately if you notice excessive bleeding, swelling, or lethargy",
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
      // Attention fields
      attentionTypes: null,
      attentionSeverity: null,
      attentionFlaggedAt: null,
      attentionSummary: null,
      needsAttention: false,
    });
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
 * Pre-generated mock cases
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
  needsAttention: 0, // Mock data doesn't include urgent cases
};
