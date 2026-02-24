/**
 * Demo/hardcoded data for inbound dashboard
 * Used for testing and demonstration purposes
 */

import { isValid } from "date-fns";
import type { Database } from "@odis-ai/shared/types";
import type { AppointmentRequest } from "./types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Safely parse a date string, returning a fallback date if invalid
 */
function safeParseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isValid(date) ? date : new Date();
}

/**
 * Static mapping for known demo phone numbers to caller names
 */
export const DEMO_PHONE_NAMES: Record<string, string> = {
  // Eric Silva
  "4084260512": "Eric Silva",
  "14084260512": "Eric Silva",
  "+14084260512": "Eric Silva",
  // Maria Serpa
  "4085612356": "Maria Serpa",
  "14085612356": "Maria Serpa",
  "+14085612356": "Maria Serpa",
  // Melissa
  "4848455065": "Melissa",
  "14848455065": "Melissa",
  "+14848455065": "Melissa",
  // Demo calls for specific pets/cases
  // Mooney - Khoa Phan (669) 799-6580 at 3:22 PM
  "6697996580": "KHOA PHAN",
  "16697996580": "KHOA PHAN",
  "+16697996580": "KHOA PHAN",
  // Baby - Sylvia Rosella (408) 509-8661 at 8:01 AM
  "4085098661": "Sylvia Rosella",
  "14085098661": "Sylvia Rosella",
  "+14085098661": "Sylvia Rosella",
  // Bubba - Adriana Skandarian (408) 761-9777 at 10:59 AM
  "4087619777": "Adriana Skandarian",
  "14087619777": "Adriana Skandarian",
  "+14087619777": "Adriana Skandarian",
  // Canela - Yvonne Trigo (408) 921-4136 at 9:00 AM
  "4089214136": "Yvonne Trigo",
  "14089214136": "Yvonne Trigo",
  "+14089214136": "Yvonne Trigo",
  // Emma - Armando Mercado (408) 472-8774 at 2:47 PM
  "4084728774": "Armando Mercado",
  "14084728774": "Armando Mercado",
  "+14084728774": "Armando Mercado",
  // Andrea Watkins (Lucy) - Cancellation (408) 891-0469
  "4088910469": "Andrea Watkins",
  "14088910469": "Andrea Watkins",
  "+14088910469": "Andrea Watkins",
  // Yeimy - Amy Marino (562) 662-2330 at 11:02 AM
  "5626622330": "Amy Marino",
  "15626622330": "Amy Marino",
  "+15626622330": "Amy Marino",
  // Rocky Panicun - for urgent case consistency
  "6692977276": "Rocky Panicun",
  "16692977276": "Rocky Panicun",
  "+16692977276": "Rocky Panicun",
  "4088924795": "Rocky Panicun",
  "14088924795": "Rocky Panicun",
  "+14088924795": "Rocky Panicun",
  "4082346798": "Rocky Panicun",
  "14082346798": "Rocky Panicun",
  "+14082346798": "Rocky Panicun",

  // Happy Tails Veterinary Clinic calls
  "9255554872": "Annika Sharma",
  "19255554872": "Annika Sharma",
  "+19255554872": "Annika Sharma",
  "4087810860": "Prince Owner",
  "14087810860": "Prince Owner",
  "+14087810860": "Prince Owner",
  "4088170784": "Dene Garamalo",
  "14088170784": "Dene Garamalo",
  "+14088170784": "Dene Garamalo",
  "4088401398": "Rochelle Woodward",
  "14088401398": "Rochelle Woodward",
  "+14088401398": "Rochelle Woodward",
  "4087068496": "Shirley Steger",
  "14087068496": "Shirley Steger",
  "+14087068496": "Shirley Steger",
  "4086673122": "Justine Carlsow",
  "14086673122": "Justine Carlsow",
  "+14086673122": "Justine Carlsow",
  "4083735832": "Lisette Duarte",
  "14083735832": "Lisette Duarte",
  "+14083735832": "Lisette Duarte",
};

/**
 * Gets caller name from static mapping
 * Tries various phone number formats
 */
export function getDemoCallerName(phone: string | null): string | null {
  if (!phone) return null;

  // Normalize phone to digits only
  const normalized = phone.replace(/\D/g, "");

  // Check various formats in our static mapping
  const formats = [normalized, `+1${normalized}`, normalized.slice(-10)];
  for (const format of formats) {
    const name = DEMO_PHONE_NAMES[format];
    if (name) return name;
  }

  // Also check the last 10 digits against our mapping
  const last10 = normalized.slice(-10);
  for (const [mappedPhone, name] of Object.entries(DEMO_PHONE_NAMES)) {
    const mappedLast10 = mappedPhone.replace(/\D/g, "").slice(-10);
    if (mappedLast10 === last10) {
      return name;
    }
  }

  return null;
}

/**
 * Check if a phone number matches any of the given patterns
 */
function phoneMatches(phone: string | null, patterns: string[]): boolean {
  if (!phone) return false;
  const normalized = phone.replace(/\D/g, "");
  return patterns.some((pattern) =>
    normalized.includes(pattern.replace(/\D/g, "")),
  );
}

/**
 * Get call modifications for hardcoded demo cases
 * @returns Object with shouldHide, isSilent, and adjustedDate flags
 */
export function getCallModifications(call: InboundCall): {
  shouldHide: boolean;
  isSilent: boolean;
  adjustedDate: Date;
} {
  const phone = call.customer_phone ?? "";
  // Use started_at (actual VAPI call time) with fallback to created_at
  const callDate = safeParseDate(call.started_at ?? call.created_at);

  // Calls to filter out completely
  if (phoneMatches(phone, ["4082346798"])) {
    // Check if this is the 6:22 AM call (to remove) vs other times (to keep)
    const hours = callDate.getHours();
    const minutes = callDate.getMinutes();
    if (hours === 6 && minutes === 22) {
      return { shouldHide: true, isSilent: false, adjustedDate: callDate };
    }
  }

  // Silent calls - blank duration
  const silentPhones = ["727576003", "2532278892", "5103207704"];
  const isSilent = phoneMatches(phone, silentPhones);

  // Timestamp corrections (6:XX PM -> 7:XX PM for demo)
  let adjustedDate = new Date(callDate);
  if (callDate.getHours() === 18) {
    // 6 PM hour
    adjustedDate = new Date(callDate);
    adjustedDate.setHours(19); // Change to 7 PM
  }

  // Specific timestamp fix for +1 (408) 892-4795
  if (phoneMatches(phone, ["4088924795"])) {
    if (callDate.getHours() === 18 && callDate.getMinutes() === 14) {
      // 6:14 PM
      adjustedDate = new Date(callDate);
      adjustedDate.setHours(19); // Change to 7:14 PM
    }
  }

  return {
    shouldHide: false,
    isSilent,
    adjustedDate,
  };
}

/**
 * Get demo call data for specific test cases
 * Returns merged call data with hardcoded transcript, recording, etc.
 */
export function getDemoCallData(
  call: InboundCall,
  vapiQueryData?: {
    recordingUrl?: string | null;
    transcript?: string | null;
    duration?: number | null;
    analysis?: { summary?: string | null };
  },
) {
  // Check for silent call first
  const silentCall = getSilentCallData(call);
  if (silentCall) return silentCall;

  // Check for Eric Silva call
  const ericSilvaCall = getEricSilvaCallData(call);
  if (ericSilvaCall) return ericSilvaCall;

  // Check for Maria Serpa call
  const mariaSerpaCall = getMariaSerpaCallData(call);
  if (mariaSerpaCall) return mariaSerpaCall;

  // Check for Melissa call
  const melissaCall = getMelissa540CallData(call);
  if (melissaCall) return melissaCall;

  // Merge with VAPI data if available
  if (vapiQueryData) {
    return {
      ...call,
      recording_url: vapiQueryData.recordingUrl ?? call.recording_url,
      transcript: vapiQueryData.transcript ?? call.transcript,
      summary: vapiQueryData.analysis?.summary ?? call.summary,
      duration_seconds: vapiQueryData.duration ?? call.duration_seconds,
    };
  }

  return call;
}

function getSilentCallData(call: InboundCall) {
  const silentPhones = ["727576003", "2532278892", "5103207704"];
  const isSilentCall = phoneMatches(call.customer_phone, silentPhones);

  if (!isSilentCall) return null;

  return {
    ...call,
    recording_url: null,
    transcript: "",
    duration_seconds: null,
    summary:
      "Call connected but caller did not speak. The line remained silent and the caller hung up without providing any information.",
  };
}

function getEricSilvaCallData(call: InboundCall) {
  const isEricSilvaCall = phoneMatches(call.customer_phone, ["4084260512"]);

  if (!isEricSilvaCall) return null;

  return {
    ...call,
    recording_url: "/audio/JackStitches.MP3",
    transcript: `User: Hello?

AI: Thank you for calling Alum Rock Animal Hospital. You've reached the after hours assistant. Are you looking to schedule an appointment? Or do you have a concern about your pet?

User: Concern.

AI: Alright. Can you tell me a little about what's going on with your pet?

User: Stitches are coming out.

AI: I see. It sounds like your pet's stitches might be coming loose. That can be concerning. Let me ask, are they bleeding or showing signs of discomfort?

User: No.

AI: Okay, that's good to hear. There's no bleeding or discomfort. Since this isn't urgent, I recommend keeping the area clean and preventing your pet from licking or scratching it. The clinic can assist you during business hours to check the stitches and ensure everything is healing properly. Would you like me to take a message for the clinic to follow up with you?

User: Yes.

AI: Of course, I can take a message for you. What's your name?

User: Eric Silva.

AI: Thank you, Eric. What's the best phone number to reach you?

User: 408-426-0512.

AI: Got it. 408-426-0512. Does this concern a specific pet? What's their name?

User: Jack.

AI: Got it, Jack. What would you like the message to say?

User: If they can call me back, I need to know about the stitches. I've seen that they're coming off, but he's not bleeding a lot, just very little.

AI: I've got your message, Eric. The clinic will call you back during business hours to assist with Jack's stitches. Is there anything else I can help you with?

User: No.`,
    duration_seconds: 141,
    summary:
      "Eric Silva called the after-hours assistant at Alum Rock Animal Hospital because his pet, Jack, had stitches coming out. The assistant determined it was not urgent and advised keeping the area clean. A message was taken for the clinic to call Eric back.",
  };
}

function getMariaSerpaCallData(call: InboundCall) {
  const isMariaSerpaCall = phoneMatches(call.customer_phone, ["4085612356"]);

  if (!isMariaSerpaCall) return null;

  return {
    ...call,
    recording_url: "/audio/cancelAppt.MP3",
    transcript: `AI: Hello, you have reached the after-hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: I need to cancel my dog's appointment.

AI: I understand you'd like to cancel your dog's appointment. I can take a message for the clinic to process that during business hours. May I have your name please?

User: Maria Serpa.

AI: Thank you, Maria. What's the best phone number to reach you?

User: 408-561-2356.

AI: Got it. And what's your pet's name?

User: Bella.

AI: Thank you, Maria. I'll leave a message for the clinic to cancel Bella's appointment. They may call you back to confirm. Is there anything else I can help you with?

User: No, that's all. Thank you.

AI: You're welcome, Maria. Have a great day!`,
    duration_seconds: 78,
    summary:
      "Maria Serpa called to cancel her dog Bella's appointment. The assistant took her information and will pass the cancellation request to the clinic.",
  };
}

function getMelissa540CallData(call: InboundCall) {
  const isMelissaCall = phoneMatches(call.customer_phone, ["4848455065"]);
  if (!isMelissaCall) return null;

  // Check for the 5:40 AM call specifically
  const callDate = safeParseDate(call.started_at ?? call.created_at);
  const hours = callDate.getHours();
  const minutes = callDate.getMinutes();
  if (hours !== 5 || minutes !== 40) return null;

  return {
    ...call,
    recording_url: "/audio/Melissa540.MP3",
    transcript: `AI: Thank you for calling Alum Rock Animal Hospital. You've reached the after hours assistant. How can I help you today?

User: Hi, I just wanted to check on my cat who's been boarded there.

AI: Of course, I'd be happy to help you check on your cat. Can you tell me your name?

User: Melissa.

AI: Thank you, Melissa. And what's your cat's name?

User: Whiskers.

AI: Got it. Unfortunately, I don't have access to the boarding records after hours, but I can leave a message for the staff to call you back first thing in the morning with an update on Whiskers. Would that work for you?

User: Yes, that would be great.

AI: Perfect. What's the best phone number to reach you?

User: 484-845-5065.

AI: Got it. The staff will call you back in the morning with an update on Whiskers. Is there anything else I can help you with?

User: No, that's all. Thank you.

AI: You're welcome, Melissa. Have a good night!`,
    duration_seconds: 95,
    summary:
      "Melissa called to check on her cat Whiskers who is being boarded at the hospital. The assistant took a message for the staff to call her back in the morning with an update.",
  };
}

// =============================================================================
// Demo Appointments
// =============================================================================

/**
 * Demo appointments array - includes cancellation status demo
 * Real appointment data comes from the database
 */
export const DEMO_APPOINTMENTS: AppointmentRequest[] = [
  // Andrea's cancelled appointment has been hidden - keeping only Yvonne's appointment
  // Yvonne's appointment for Canela - 9:00am (Call Back)
  {
    id: "demo-yvonne-canela-appointment",
    clinicId: "demo-clinic",
    providerId: null,
    clientName: "Yvonne Trigo",
    clientPhone: "408-921-4136",
    patientName: "Canela",
    species: "dog",
    breed: null,
    reason: "Possible parvo diagnosis - needs examination today afternoon",
    requestedDate: "2024-12-25",
    requestedStartTime: "afternoon",
    requestedEndTime: null,
    status: "pending" as const,
    isNewClient: false,
    isOutlier: null,
    notes:
      "Client concerned about possible parvo diagnosis. Requested appointment for today afternoon.",
    vapiCallId: "demo-vapi-call-yvonne",
    confirmedAppointmentId: null,
    metadata: {
      urgentConcern: "Possible parvo",
      requestedTime: "Today afternoon",
      demoData: true,
    },
    // Set createdAt to Dec 25, 2024 at 9:00am
    createdAt: "2024-12-25T17:00:00.000Z", // 9:00 AM PST
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get demo appointments to inject into the appointments list
 */
export function getDemoAppointments(): AppointmentRequest[] {
  return DEMO_APPOINTMENTS;
}

// =============================================================================
// Demo Calls
// =============================================================================

/** Tomorrow's date in YYYY-MM-DD format (for scheduled appointment demos) */
const DEMO_TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0]!;

/**
 * Demo calls array - for cases that need call records but don't exist in DB
 */
export const DEMO_CALLS = [
  // Happy Tails Veterinary Clinic calls - Annika Sharma / Sumo limping (Scheduled)
  {
    id: "happy-tails-call-annika-sumo",
    vapi_call_id: "happy-tails-vapi-annika-sumo",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "9255554872",
    customer_number: "9255554872",
    status: "completed",
    type: "inbound",
    outcome: "scheduled",
    user_sentiment: "neutral",
    duration_seconds: 158,
    cost: 0.22,
    transcript:
      "Assistant: Hi. Thanks for calling Animal Wellness Center. This is Stacy, the virtual assistant answering after hours calls. How can I help you?\n\nUser: Hi, Stacy. Um, yes. I'm calling because I'm really worried about my dog. He started limping pretty badly a few hours ago, and I'm not sure if I should take him to the emergency vet or what I should do.\n\nAssistant: I'm sorry to hear that your dog is limping. Let's make sure we take care of him. Can your dog walk on the leg right now? Is he eating and drinking normally?\n\nUser: He can walk on it, but he really doesn't wanna put any weight on it. He keeps trying to hold it up when he's standing. He ate dinner fine, and he's been drinking water. So I think so.\n\nAssistant: Since he can still walk on it and is eating and drinking normally, it doesn't sound like an emergency right now. However, it's best to schedule an appointment to have it checked out. Would you like me to help book that for you?\n\nUser: Yes, please.\n\nAssistant: Great. What day would you like to come in? And do you prefer morning or afternoon?\n\nUser: Your first available appointment would be best.\n\nAssistant: Our first available appointment is tomorrow, Wednesday, February eighteenth at 11:30 AM. Does that work for you?\n\nUser: Yes. That works.\n\nAssistant: Great. Are you a current client? Or is this your first time with us?\n\nUser: I'm a current client.\n\nAssistant: Perfect. Could you confirm your first and last name and your dog's name?\n\nUser: Annika Sharma. And my dog's name is Sumo.\n\nAssistant: Thank you, Annika. The reason for Sumo's visit? Should I note it as limping?\n\nUser: Yes.\n\nAssistant: Got it. Could you please provide the best phone number to reach you?\n\nUser: Yeah. It's 925-555-4872.\n\nAssistant: Thank you. To confirm, I have you scheduled for Wednesday, February eighteenth at 11:30 AM for Sumo to address the limping. Is that correct?\n\nUser: Yes. That is correct.\n\nAssistant: Perfect. You're all set for tomorrow at 11:30 AM. Someone from the clinic will follow up tomorrow regarding the appointment. Is there anything else I can help you with?\n\nUser: No. That's all.\n\nAssistant: Thank you, Annika. Take care of Sumo, and have a good night.",
    summary:
      "Annika Sharma called concerned about her dog Sumo limping and not putting weight on his leg. Determined not an emergency since Sumo can still walk and is eating/drinking normally. Appointment scheduled for Wednesday, February 18th at 11:30 AM.",
    recording_url: "/audio/Annika_Sharma.MP3",
    created_at: "2026-02-18T05:28:00.000Z", // Feb 17 at 9:28 PM PST = Feb 18 05:28 UTC
    updated_at: "2026-02-18T05:28:00.000Z",
    started_at: "2026-02-18T05:28:00.000Z",
    ended_at: "2026-02-18T05:30:38.000Z", // 2 min 38 sec later
    ended_reason: "customer-ended-call",
    actions_taken: ["Appointment scheduled via AI"],
    phone_number_id: null,
    user_id: null,
    attention_types: null,
    attention_severity: null,
    attention_summary: null,
    attention_flagged_at: null,
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "scheduled",
      appointment_data: {
        patient_name: "Sumo",
        client_name: "Annika Sharma",
        date: "2026-02-18",
        time: "11:30",
        reason: "Limping, not putting weight on leg",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Annika Sharma",
    extracted_pet_name: "Sumo",
    clinic_phone: null,
  },

  // Happy Tails Veterinary Clinic calls - Prince Pedialyte (Info)
  {
    id: "happy-tails-call-prince-pedialyte",
    vapi_call_id: "happy-tails-vapi-prince-pedialyte",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "4087810860",
    customer_number: "4087810860",
    status: "completed",
    type: "inbound",
    outcome: "info",
    user_sentiment: "neutral",
    duration_seconds: 90,
    cost: 0.15,
    transcript:
      "Assistant: Hello. You have reached the after hours assistant at Happy Tails Veterinary Clinic. How can I help you today?\n\nUser: Yeah. I have Prince here that's supposed to be drinking the Pedialyte. And he doesn't want to drink it. How can I get him to drink it?\n\nAssistant: I understand Prince isn't drinking the Pedialyte. You might try offering it in a different bowl or mixing a small amount with his regular water to see if he'll take it that way. If you're concerned, it might be a good idea to schedule an appointment to have him checked out. Would you like me to help with that?\n\nUser: He's supposed to have surgery Wednesday. So he's already been checked out. But they said they were worried about his electrolytes, so they wanted him to drink that Pedialyte till Wednesday and he doesn't want to drink it.\n\nAssistant: Since Prince has surgery scheduled, it's important to keep him hydrated. You might try flavoring the Pedialyte with a small amount of low sodium chicken broth to make it more appealing.\n\nUser: No. So I could put chicken broth in it?\n\nAssistant: Yes. You can try adding a small amount of low sodium chicken broth to the Pedialyte more appealing for Prince. Just make sure its not too much as you still want him to get the benefits of the Pedialyte. If you have any concerns, reaching out to the clinic during business hours would be a good idea.\n\nUser: Okay. I guess that's all I can do.\n\nAssistant: Alright if you have any other questions or need further assistance, feel free to reach out. Take care of Prince.\n\nUser: Thanks. Bye bye.",
    summary:
      "Owner called about Prince having difficulty drinking prescribed Pedialyte before surgery. Provided advice on making it more appealing with low sodium chicken broth.",
    recording_url:
      "https://nndjdbdnhnhxkasjgxqk.supabase.co/storage/v1/object/public/public-assets/4087810860.MP3",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 90000).toISOString(), // 90 seconds later
    ended_reason: "customer-ended-call",
    actions_taken: ["Information provided to caller"],
    phone_number_id: null,
    user_id: null,
    attention_types: null,
    attention_severity: null,
    attention_summary: null,
    attention_flagged_at: null,
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "info",
      info_data: {
        reason: "Pedialyte hydration advice before surgery",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Prince Owner",
    extracted_pet_name: "Prince",
    clinic_phone: null,
  },

  // Dene Garamalo - Dog seizures (Urgent)
  {
    id: "happy-tails-call-dene-seizures",
    vapi_call_id: "happy-tails-vapi-dene-seizures",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "4088170784",
    customer_number: "4088170784",
    status: "completed",
    type: "inbound",
    outcome: "emergency",
    user_sentiment: "negative",
    duration_seconds: 50,
    cost: 0.08,
    transcript:
      "Assistant: Thank you for calling Happy Tails Animal Hospital. This is Stacy. How can I help you?\n\nUser: Is there an emergency hello?\n\nAssistant: If you're experiencing an emergency with your pet, it's important to get immediate help. Could you tell me what's going on with your pet?\n\nUser: My dog keeps having seizures.\n\nAssistant: I'm really sorry to hear that your dog is having seizures. This sounds like it needs immediate attention. I recommend taking your dog to an emergency veterinary hospital right away. Can I get your name and phone number to log the situation for our team?\n\nUser: Dene Garamalo. 408-817\n\nAssistant: Thank you. Could you please provide your full phone number?\n\nUser: 408-817-0784.\n\nAssistant: Thank you. I've logged this information for our team. Please take your dog to the nearest emergency veterinary hospital right away. Get your dog to an emergency vet as soon as possible. Take care.",
    summary:
      "URGENT: Dene Garamalo called about dog having seizures. Directed to emergency veterinary hospital immediately.",
    recording_url:
      "https://nndjdbdnhnhxkasjgxqk.supabase.co/storage/v1/object/public/public-assets/4088170784.MP3",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 50000).toISOString(), // 50 seconds later
    ended_reason: "customer-ended-call",
    actions_taken: ["Emergency referral provided"],
    phone_number_id: null,
    user_id: null,
    attention_types: ["urgent"],
    attention_severity: "high",
    attention_summary:
      "Dog having seizures - requires immediate emergency care",
    attention_flagged_at: new Date(
      Date.now() - 3 * 60 * 60 * 1000,
    ).toISOString(),
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "emergency",
      emergency_data: {
        symptoms: ["Recurring seizures"],
        er_name: null,
        urgency_level: "critical",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Dene Garamalo",
    extracted_pet_name: null,
    clinic_phone: null,
  },

  // Rochelle Woodward - Cat eye infection (Scheduled)
  {
    id: "happy-tails-call-rochelle-cat",
    vapi_call_id: "happy-tails-vapi-rochelle-cat",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "4088401398",
    customer_number: "4088401398",
    status: "completed",
    type: "inbound",
    outcome: "scheduled",
    user_sentiment: "neutral",
    duration_seconds: 93,
    cost: 0.16,
    transcript:
      "Assistant: Thank you for calling Happy Tails Animal Hospital. This is Stacy. How can I help you?\n\nUser: Hi. Are you guys open for emergency care tonight? Or urgent care?\n\nAssistant: We don't provide emergency care after hours. But I can guide you to the nearest emergency veterinary hospital if needed. What's going on with your pet?\n\nUser: I have a cat that's f o c positive. That has milky discharge from the eyes. And is squinting.\n\nAssistant: Oh, I'm sorry to hear your cat isn't feeling well. While this doesn't sound like an immediate emergency, it would be best to have a vet check it out soon. Would you like to schedule an appointment for when we're open?\n\nUser: Yes. Tomorrow, early morning.\n\nAssistant: I have availability tomorrow at 9, 9 15, and 9 30 in the morning. Which time works best for you?\n\nUser: 9 30.\n\nAssistant: Great. So that's Sunday at 9 30 AM. What's your first and last name?\n\nUser: Rochelle Woodward.\n\nAssistant: Thank you, Rochelle. What's your cat's name?\n\nUser: Milo,\n\nAssistant: Thanks. And what's the best phone number to reach you?\n\nUser: 4 0 8 8 4 0 1 3 9 8.\n\nAssistant: Perfect. You're all set for tomorrow at 9 30 AM. Is there anything else I can help you with?\n\nUser: No.\n\nAssistant: Have a good night, and take care of Milo.\n\nUser: Goodbye. Bye bye.\n\nAssistant: Thank you",
    summary:
      "Rochelle Woodward scheduled appointment for cat Milo - eye discharge and squinting. Appointment set for 9:30 AM.",
    recording_url:
      "https://nndjdbdnhnhxkasjgxqk.supabase.co/storage/v1/object/public/public-assets/Rochelle_Woodward.MP3",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 4 * 60 * 60 * 1000 + 93000).toISOString(), // 93 seconds later
    ended_reason: "customer-ended-call",
    actions_taken: ["Appointment scheduled via AI"],
    phone_number_id: null,
    user_id: null,
    attention_types: null,
    attention_severity: null,
    attention_summary: null,
    attention_flagged_at: null,
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "scheduled",
      appointment_data: {
        patient_name: "Milo",
        client_name: "Rochelle Woodward",
        date: DEMO_TOMORROW,
        time: "09:30",
        reason: "Eye discharge and squinting",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Rochelle Woodward",
    extracted_pet_name: "Milo",
    clinic_phone: null,
  },

  // Shirley Steger - Reschedule (Cancellation)
  {
    id: "happy-tails-call-shirley-reschedule",
    vapi_call_id: "happy-tails-vapi-shirley-reschedule",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "4087068496",
    customer_number: "4087068496",
    status: "completed",
    type: "inbound",
    outcome: "cancellation",
    user_sentiment: "neutral",
    duration_seconds: 83,
    cost: 0.14,
    transcript:
      "Assistant: Thank you for calling Happy Tails Animal Hospital. This is Stacy. Can I help you?\n\nUser: Hello? Stacy? I had something come up in my family, and I had a 2 o'clock appointment for my dog, Mabel, yes and I totally, totally forgot about it because, need to check my work calendar. But I don't know yeah. I don't know when I could bring her in this week right now, though. So I'll probably be calling tomorrow to reschedule appointment.\n\nAssistant: Problem. I understand. I can log your request to reschedule Mabel's appointment. What's your full name?\n\nUser: My name is Shirley Steger.\n\nAssistant: Thank you, Shirley. What's the best phone number to reach you?\n\nUser: 4 0 8 7 0 6 8 4 9 6.\n\nAssistant: You, Shirley. I'll log your request to reschedule Mabel's appointment and someone from the clinic will confirm this during business hours. Is there anything else I can help you with?\n\nUser: No. That's it for now. Thank you so much. I'm so sorry about yesterday. It was it was kinda chaos.\n\nAssistant: No problem at all, Shirley. I've logged your request. Thank you for calling Happy Tails Animal Hospital. Have a good day and take care of Mabel.\n\nUser: Thank you. Thank you. Thank you.",
    summary:
      "Shirley Steger called to reschedule Mabel's 2 o'clock appointment due to family emergency. Will call back tomorrow to reschedule.",
    recording_url:
      "https://nndjdbdnhnhxkasjgxqk.supabase.co/storage/v1/object/public/public-assets/Shirley_Steger.MP3",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 5 * 60 * 60 * 1000 + 83000).toISOString(), // 83 seconds later
    ended_reason: "customer-ended-call",
    actions_taken: ["Message taken for cancellation"],
    phone_number_id: null,
    user_id: null,
    attention_types: null,
    attention_severity: null,
    attention_summary: null,
    attention_flagged_at: null,
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "cancellation",
      appointment_data: {
        patient_name: "Mabel",
        client_name: "Shirley Steger",
        cancellation_reason: "Family emergency, will call back to reschedule",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Shirley Steger",
    extracted_pet_name: "Mabel",
    clinic_phone: null,
  },

  // Justine Carlsow - Vaccine appointment (Scheduled)
  {
    id: "happy-tails-call-justine-vaccine",
    vapi_call_id: "happy-tails-vapi-justine-vaccine",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "4086673122",
    customer_number: "4086673122",
    status: "completed",
    type: "inbound",
    outcome: "scheduled",
    user_sentiment: "positive",
    duration_seconds: 101,
    cost: 0.17,
    transcript:
      "Assistant: Thank you for calling Happy Tails Animal Hospital. This is Stacy. How can I help you?\n\nUser: Hi. Good morning. I was wondering if vaccine appointments are walk-in, or do I still need to make an appointment for my pet?\n\nAssistant: Good morning. You'll need to make an appointment for vaccines. Would you like me to help you schedule one?\n\nUser: Yes, please.\n\nAssistant: Great. What day would you like to come in?\n\nUser: Is there anything available for tomorrow morning?\n\nAssistant: I have availability tomorrow morning at 8, 8:30, and 8:45. Which time works best for you?\n\nUser: 8:45, please.\n\nAssistant: Got it. What is your first and last name?\n\nUser: Justine Carlsow.\n\nAssistant: What's your pet's name?\n\nUser: Matcha.\n\nAssistant: And what's the best phone number to reach you?\n\nUser: 408-667-3122.\n\nAssistant: What's the reason for Matcha's visit? Is it just for vaccines?\n\nUser: Yes. Vaccines\n\nAssistant: You're all set for tomorrow at 8:45 AM for Matcha's vaccine. Is there anything else I can help you with?\n\nUser: Can I get a cost or a price estimation?\n\nAssistant: I'd recommend calling the clinic during business hours for pricing information. Is there anything else I can help you with?\n\nUser: No. That's all.\n\nAssistant: Thank you for calling Happy Tails Animal Hospital. Have a good night, and take care of Matcha.\n\nUser: Thank you.",
    summary:
      "Justine Carlsow scheduled vaccine appointment for Matcha at 8:45 AM tomorrow. Asked about pricing - referred to clinic hours.",
    recording_url:
      "https://nndjdbdnhnhxkasjgxqk.supabase.co/storage/v1/object/public/public-assets/Justine_Carlsow.MP3",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 6 * 60 * 60 * 1000 + 101000).toISOString(), // 101 seconds later
    ended_reason: "customer-ended-call",
    actions_taken: ["Appointment scheduled via AI"],
    phone_number_id: null,
    user_id: null,
    attention_types: null,
    attention_severity: null,
    attention_summary: null,
    attention_flagged_at: null,
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "scheduled",
      appointment_data: {
        patient_name: "Matcha",
        client_name: "Justine Carlsow",
        date: DEMO_TOMORROW,
        time: "08:45",
        reason: "Vaccines",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Justine Carlsow",
    extracted_pet_name: "Matcha",
    clinic_phone: null,
  },

  // Lisette Duarte - Blood test results (Call Back)
  {
    id: "happy-tails-call-lisette-bloodwork",
    vapi_call_id: "happy-tails-vapi-lisette-bloodwork",
    assistant_id: "happy-tails-assistant",
    clinic_name: "Happy Tails Veterinary Clinic",
    customer_phone: "4083735832",
    customer_number: "4083735832",
    status: "completed",
    type: "inbound",
    outcome: "callback",
    user_sentiment: "neutral",
    duration_seconds: 57,
    cost: 0.1,
    transcript:
      "Assistant: Thank you for calling Happy Tails Animal Hospital. This is Stacy, I'm an AI assistaint helping answer calls while the clinic is closed. How can I help you?\n\nUser: Hi. I'm calling in regards to my cat's blood test results. I still haven't received a callback.\n\nAssistant: I can help with that. What's your name and the best phone number to reach you?\n\nUser: It's Lisette Duarte. My phone number is 4 0 8 3 7 3 5 8 3 2.\n\nAssistant: Thank you, Lizette. What would you like me to pass along to the team regarding your cat's blood test results?\n\nUser: If they could just give me a callback on what his results say,\n\nAssistant: I've passed your message along to the team. Someone will call you back during business hours. Is there anything else I can help you with?\n\nUser: No. That'll be all.\n\nAssistant: Thank you for calling Happy Tails Animal Hospital. Have a good day.\n\nUser: Thank you. Bye bye.\n\nAssistant: Thank you for calling Happy Tails Animal Hospital. Have a good night.",
    summary:
      "Lisette Duarte called requesting callback about cat's blood test results. Message taken for clinic to call back during business hours.",
    recording_url:
      "https://nndjdbdnhnhxkasjgxqk.supabase.co/storage/v1/object/public/public-assets/Lisette_Duarte.MP3",
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    updated_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 7 * 60 * 60 * 1000 + 57000).toISOString(), // 57 seconds later
    ended_reason: "customer-ended-call",
    actions_taken: ["Message taken for callback request"],
    phone_number_id: null,
    user_id: null,
    attention_types: null,
    attention_severity: null,
    attention_summary: null,
    attention_flagged_at: null,
    cleaned_transcript: null,
    display_transcript: null,
    use_display_transcript: false,
    action_confirmed: null,
    call_analysis: null,
    call_outcome_data: null,
    escalation_data: null,
    follow_up_data: null,
    medication_compliance_data: null,
    owner_sentiment_data: null,
    pet_health_data: null,
    structured_data: {
      card_type: "callback",
      callback_data: {
        reason: "Blood test results callback",
        phone_number: "4083735832",
        caller_name: "Lisette Duarte",
        pet_name: "Cat",
      },
    },
    success_evaluation: null,
    transcript_messages: null,
    metadata: null,
    stereo_recording_url: null,
    extracted_caller_phone: null,
    extracted_caller_name: "Lisette Duarte",
    extracted_pet_name: null,
    clinic_phone: null,
  },
];

/**
 * Get demo calls to inject into the calls list
 */
export function getDemoCalls(): InboundCall[] {
  return DEMO_CALLS;
}
