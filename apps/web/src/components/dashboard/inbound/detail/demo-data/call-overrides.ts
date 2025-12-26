/**
 * Demo call data overrides for specific phone numbers
 * This is used for demonstration purposes with pre-recorded audio
 */

import { isValid } from "date-fns";

interface InboundCall {
  id: string;
  customer_phone: string | null;
  created_at: string;
  recording_url?: string | null;
  transcript?: string | null;
  duration_seconds?: number | null;
  summary?: string | null;
}

/**
 * Safely parse a date string, returning null if invalid
 */
function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isValid(date) ? date : null;
}

interface CallDataOverride {
  recording_url: string | null;
  transcript: string;
  duration_seconds: number | null;
  summary: string;
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function matchesPhone(callPhone: string | null, patterns: string[]): boolean {
  const normalized = normalizePhone(callPhone);
  return patterns.some((pattern) => {
    const normalizedPattern = normalizePhone(pattern);
    return (
      normalized === normalizedPattern || normalized.includes(normalizedPattern)
    );
  });
}

export function getCallDataOverride(
  call: InboundCall,
): (InboundCall & Partial<CallDataOverride>) | null {
  // Maria Serpa case (phone: 4085612356)
  if (
    matchesPhone(call.customer_phone, [
      "4085612356",
      "408-561-2356",
      "+14085612356",
      "(408) 561-2356",
      "+1 (408) 561-2356",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/cancelAppt.MP3",
      transcript: `Assistant: Hello, You have reached the After Hours Assistant at Alam Rock Animal Hospital. How can I help you today?\n\nUser: I need to cancel my dog's appointment.\n\nAssistant: I can help you with that. Could you please provide your name and the best phone number to reach you?\n\nUser: Maria Serpa, 4 0 8 5 6 1 2 3 5 6.\n\nAssistant: Thank you, Maria. Could you please tell me your dog's name?\n\nUser: Charlie.\n\nAssistant: Got it. I'll pass along the message to cancel Charlie's appointment. Is there anything else I can help you with?\n\nUser: No.\n\nAssistant: I've noted your request to cancel Charlie's appointment. Thank you for calling Alham Rock Animal Hospital.`,
      duration_seconds: 55,
      summary:
        "Maria Serpa called to cancel her dog Charlie's appointment. The original appointment was scheduled for Dec 17th at 8:30am. The assistant noted the cancellation request.",
    };
  }

  // Silent calls (no audio, blank transcript, hang-up summary)
  if (
    matchesPhone(call.customer_phone, [
      "727576003",
      "7275760033",
      "727-576-0033",
      "(727) 576-0033",
      "+1 (727) 576-0033",
      "+17275760033",
      "2532278892",
      "253-227-8892",
      "(253) 227-8892",
      "+1 (253) 227-8892",
      "+12532278892",
      "5103207704",
      "510-320-7704",
      "(510) 320-7704",
      "+1 (510) 320-7704",
      "+15103207704",
    ])
  ) {
    return {
      ...call,
      recording_url: null,
      transcript: "",
      duration_seconds: null,
      summary:
        "Call connected but caller did not speak. The line remained silent and the caller hung up without providing any information.",
    };
  }

  // Eric Silva case (phone: 4084260512)
  if (
    matchesPhone(call.customer_phone, [
      "4084260512",
      "408-426-0512",
      "+14084260512",
      "(408) 426-0512",
      "+1 (408) 426-0512",
    ])
  ) {
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

  // Melissa 5:40 AM call (phone: 4848455065) - Time-specific
  if (
    matchesPhone(call.customer_phone, [
      "4848455065",
      "484-845-5065",
      "(484) 845-5065",
      "+1 (484) 845-5065",
      "+14848455065",
    ]) &&
    call.created_at
  ) {
    const callTime = safeParseDate(call.created_at);
    if (!callTime) return null;
    const hour = callTime.getUTCHours();
    const minute = callTime.getUTCMinutes();
    // Only apply to the 5:40 AM call (13:40 UTC = 5:40 AM PST)
    if (hour === 13 && minute === 40) {
      return {
        ...call,
        recording_url: "/audio/fetchpetinsurance.MP3",
        transcript: `Assistant: Thank you for calling Alum Rock Animal Hospital. You've reached our after-hours assistant. How can I help you today?\n\nUser: Calling from Fetch Pet Insurance. Requesting medical records for Otis, owned by Ama Villanueva. Please send the invoice for Otis dated December 7, 2025, to medical.record@fetchpet.com.\n\nAssistant: I understand you're from Fetch Pet Insurance and need medical records for Otis. I'll make sure to pass this message to the clinic so they can send the invoice to medical.record@fetchpet.com. Is there anything else I can help you with?\n\nUser: No, that's all.\n\nAssistant: Perfect. I've noted your request for Otis's medical records to be sent to Fetch Pet Insurance. Thank you for calling.`,
        duration_seconds: 48,
        summary:
          "Melissa from Fetch Pet Insurance called requesting medical records for patient Otis, owned by Ama Villanueva. Requested invoice dated December 7, 2025 be sent to medical.record@fetchpet.com.",
      };
    }
  }

  return null;
}
