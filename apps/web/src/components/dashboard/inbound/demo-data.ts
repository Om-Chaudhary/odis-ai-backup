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
  // Andrea
  "4088910469": "Andrea",
  "14088910469": "Andrea",
  "+14088910469": "Andrea",
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
    transcript: `Assistant: Hello, You have reached the After Hours Assistant at Alam Rock Animal Hospital. How can I help you today?

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
 * Demo appointments array - currently empty
 * Real appointment data comes from the database
 */
export const DEMO_APPOINTMENTS: AppointmentRequest[] = [];

/**
 * Get demo appointments to inject into the appointments list
 */
export function getDemoAppointments(): AppointmentRequest[] {
  return DEMO_APPOINTMENTS;
}
