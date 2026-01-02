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
  outcome?: string | null;
  attention_types?: string[] | null;
  attention_severity?: string | null;
  attention_summary?: string | null;
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
  recording_url?: string | null;
  transcript?: string | null;
  duration_seconds?: number | null;
  summary?: string | null;
  outcome?: string | null;
  attention_types?: string[] | null;
  attention_severity?: string | null;
  attention_summary?: string | null;
  actions_taken?: string[] | null;
  created_at?: string;
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
  // Mooney - Khoa Phan (669) 799-6580 at 3:22 PM
  if (
    matchesPhone(call.customer_phone, [
      "6697996580",
      "669-799-6580",
      "+16697996580",
      "(669) 799-6580",
      "+1 (669) 799-6580",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/Mooney.MP3",
      transcript:
        call.transcript ??
        "Demo transcript for Mooney case - original data preserved",
      duration_seconds: call.duration_seconds ?? 120,
      summary: call.summary ?? "Call regarding pet Mooney - owner Khoa Phan",
    };
  }

  // Baby - Sylvia Rosella (408) 509-8661 at 8:01 AM
  if (
    matchesPhone(call.customer_phone, [
      "4085098661",
      "408-509-8661",
      "+14085098661",
      "(408) 509-8661",
      "+1 (408) 509-8661",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/Baby.MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: My dog cut herself. Really deep.

AI: I'm sorry to hear about your dog's injury. Can you tell me if the bleeding is continuous or if you've been able to stop it with pressure?

User: Yeah, I stopped it.

AI: That's good to hear. Since the bleeding has stopped, we can schedule an appointment for her to be seen by a vet. Are you a current client or is this your first time visiting us?

User: Current client.

AI: Got it. What is your first and last name?

User: Sylvia Rosella.

AI: Thank you, Sylvia. What's the best phone number to reach you?

User: 408-509-8661.

AI: Thank you. Just to confirm, that's 408-509-8661. Is that correct?

User: Yes.

AI: Great. What's your dog's name?

User: Baby.

AI: Thank you. What's the reason for the visit? Is it just the cut, or is there anything else you'd like the vet to check?

User: The cut, yeah.

AI: Do you have a preferred day or time for the appointment?

User: Today.

AI: I've noted your message, and the clinic will get back to you during business hours to schedule an appointment for Baby. Is there anything else I can help you with?

User: No.

AI: Thank you for calling Alum Rock Animal Hospital. Have a good night, and take care of Baby.

User: Thank you.`,
      duration_seconds: 95,
      summary:
        "Sylvia Rosella called about her dog Baby who cut herself deeply. Bleeding has been stopped with pressure. Appointment requested for today to have vet examine the cut.",
      outcome: "Call Back",
      actions_taken: ["Message taken for appointment request"],
    };
  }

  // Bubba - Adriana Skandarian (408) 761-9777 at 10:59 AM
  if (
    matchesPhone(call.customer_phone, [
      "4087619777",
      "408-761-9777",
      "+14087619777",
      "(408) 761-9777",
      "+1 (408) 761-9777",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/Bubba.MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: I need to make an appointment.

AI: Are you a current client, or is this your first time visiting us?

User: Current client.

AI: Great. What is your first and last name?

User: Adriana Skandarian.

AI: Thank you, Adriana. What's the best phone number to reach you?

User: 408-761-9777.

AI: Got it. 408-761-9777. Is that correct?

User: Yes.

AI: Perfect. What's your pet's name?

User: Bubba.

AI: Thank you. What's the reason for Bubba's visit?

User: Ear infection.

AI: Do you have a preferred day or time for Bubba's appointment?

User: Tomorrow.

AI: How about tomorrow at 9 AM? Does that work for you?

User: Is there anything later?

AI: Let me take a message instead so the clinic can help you. Would you like me to proceed with scheduling Bubba's appointment for tomorrow at a later time?

User: Yes.

AI: Thank you for your patience. The clinic will contact you to confirm a specific time for Bubba's appointment tomorrow. Is there anything else I can help you with?

User: That's it.

AI: I've got your message. The clinic will get back to you during business hours to confirm Bubba's appointment time for tomorrow. Thank you for calling Alum Rock Animal Hospital. Have a good night, and take care of Bubba.

User: Thanks. You too. Bye.`,
      duration_seconds: 78,
      summary:
        "Adriana Skandarian called to schedule an appointment for Bubba who has an ear infection. Requested appointment for tomorrow at a later time than 9 AM. Clinic will contact to confirm specific time.",
      outcome: "Call Back",
      actions_taken: ["Message taken for appointment request"],
    };
  }

  // Canela - Yvonne Trigo (408) 921-4136 at 9:00 AM (REMOVE URGENT, set to Call Back)
  if (
    matchesPhone(call.customer_phone, [
      "4089214136",
      "408-921-4136",
      "+14089214136",
      "(408) 921-4136",
      "+1 (408) 921-4136",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/Canela.MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: We'd like to speak to the advice nurse.

AI: I'm here to help with after hours inquiries. If you have a concern about your pet, I can assist with scheduling an appointment or provide basic guidance. Are you looking to schedule an appointment, or do you have a specific question about your pet?

User: My dog has been possibly diagnosed with parvo. Would like to know if she can be seen today.

AI: I'm sorry to hear about your dog's situation. While I can't provide medical advice, I can help schedule an appointment for you. Are you a current client, or is this your first time visiting us?

User: Current client, but with a different dog.

AI: Thank you for letting me know. What is your first and last name?

User: Yvonne Trigo.

AI: Thank you, Yvonne. What's the best phone number to reach you?

User: 408-921-4136.

AI: Got it. 408-921-4136. Is that correct?

User: Yeah.

AI: Great. What's your dog's name?

User: Canela.

AI: Thank you. I understand that you're concerned about Canela possibly having parvo. Do you have a preferred day or time?

User: Today. Afternoon.

AI: Let me go ahead and schedule an appointment request for Canela and the clinic will confirm with you directly. Does that work for you?

User: Yes.

AI: I've scheduled Canela's appointment. The clinic will give you a call to confirm the details. Is there anything else I can help you with?

User: No.

AI: Thank you for calling Alum Rock Animal Hospital. Take care of Canela.`,
      duration_seconds: 89,
      summary:
        "Yvonne Trigo called regarding her dog Canela who has been possibly diagnosed with parvo. Requested appointment for today afternoon. Clinic will call to confirm details.",
      outcome: "Call Back",
      attention_types: null, // Remove urgent tags
      attention_severity: null,
      attention_summary: null,
    };
  }

  // Emma - Armando Mercado (408) 472-8774 at 2:47 PM
  if (
    matchesPhone(call.customer_phone, [
      "4084728774",
      "408-472-8774",
      "+14084728774",
      "(408) 472-8774",
      "+1 (408) 472-8774",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/Emma.MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: Yes. I'd like to ask a question for the doctor regarding Emma's condition. He did say that because she has Addison's disease, there'll be a waxing and waning. And I think right now she's waning. She's been low energy. I gave her her prednisolone this morning, but she doesn't want to eat. And she just wants to stay asleep. So I'd like some guidance as to what to do. I've kept up with the medicine, but she doesn't seem well.

AI: I'm so sorry to hear that Emma isn't feeling well. It sounds like you're doing everything you can to care for her. While I can't provide medical advice, I can help you schedule an appointment with the doctor so they can evaluate her and provide guidance. Would you like me to set up an appointment for you?

User: Yes. As soon as possible on the next available day. It's more like a follow-up because she's under his treatment.

AI: Thank you. Can I get your first and last name, please?

User: Armando Mercado.

AI: Thank you, Armando. What's the best phone number to reach you?

User: 408-472-8774.

AI: Got it. 408-472-8774. Is that correct?

User: Correct.

AI: Great. What's your pet's name?

User: Emma.

AI: Thank you. What's the reason for Emma's visit? You mentioned it's a follow-up for her Addison's disease and current symptoms. Is that correct?

User: That's correct. She's low energy.

AI: Thank you for sharing that. Do you have a preferred day or time for the appointment?

User: Tomorrow. Early.

AI: Perfect. I've scheduled Emma's appointment for tomorrow at 9 AM. The clinic will give you a call to confirm. Is there anything else I can help you with?

User: No. Thank you.

AI: Thank you for calling Alum Rock Animal Hospital. Have a good night, and take care of Emma.

User: Thank you.`,
      duration_seconds: 45,
      summary:
        "Armando Mercado called regarding Emma's Addison's disease follow-up. Emma is showing low energy and not eating despite medication. Appointment scheduled for tomorrow at 9 AM.",
      outcome: "Scheduled",
      actions_taken: ["Appointment scheduled via AI"],
    };
  }

  // Andrea (Lucy) - Cancellation (408) 891-0469
  if (
    matchesPhone(call.customer_phone, [
      "4088910469",
      "408-891-0469",
      "+14088910469",
      "(408) 891-0469",
      "+1 (408) 891-0469",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/Lucy(Andrea).MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: Cancel appointment.

AI: Of course. What's your name?

User: Andrea Watkins.

AI: Thank you, Andrea. And what's the best number to reach you?

User: 408-891-0469.

AI: Got it. 408-891-0469. Is that correct?

User: Yes.

AI: Great. Does this concern a specific pet? If so, what's their name?

User: Lucy.

AI: Thank you. What would you like the message to say?

User: I need to cancel my appointment for December 26th.

AI: I've noted your request to cancel your appointment for December 26th. The clinic will follow up with you during business hours to confirm. Is there anything else I can assist you with?

User: No.

AI: Thank you for calling Alum Rock Animal Hospital. Have a good night, and take care of Lucy.`,
      duration_seconds: 65,
      summary:
        "Andrea Watkins called to cancel Lucy's appointment scheduled for December 26th. Cancellation request noted for clinic follow-up.",
      outcome: "Cancellation",
      actions_taken: ["Message taken for cancellation"],
      // Set to Dec 25, 2024 at 10:08 AM
      created_at: "2024-12-25T18:08:00.000Z", // 10:08 AM PST
    };
  }

  // Yeimy - Amy Marino (562) 662-2330 at 11:02 AM
  if (
    matchesPhone(call.customer_phone, [
      "5626622330",
      "562-662-2330",
      "+15626622330",
      "(562) 662-2330",
      "+1 (562) 662-2330",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/YEIMY.MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: To schedule appointment.

AI: Are you a current client, or is this your first time visiting us?

User: Current client.

AI: Great. What is your first and last name?

User: Amy Marino.

AI: Thank you, Amy Marino. What's the best phone number to reach you?

User: 562-662-2330.

AI: Got it. 562-662-2330. Is that correct?

User: Yeah.

AI: Great. What's your pet's name?

User: Yimi.

AI: And what type of animal is Yimi, dog, cat, or something else?

User: Dog.

AI: Got it. What's the reason for Yimi's visit?

User: I just want to change the appointment.

AI: I understand. Do you have a preferred day or time for the new appointment?

User: Today or tomorrow?

AI: Do you have a preference for a specific time today or tomorrow?

AI: How about tomorrow morning at 9 AM? Does that work for you?

User: Can it be later?

AI: Of course. How about tomorrow afternoon at 2 PM? Does that work for you?

User: Yes.

AI: Perfect. I've scheduled Yimi's appointment for tomorrow at 2 PM. The clinic will give you a call to confirm. Is there anything else I can help you with?

User: No. That's it.

AI: Thank you for calling Alum Rock Animal Hospital. Have a good night, and take care of Yimi.

User: Thank you.`,
      duration_seconds: 98,
      summary:
        "Amy Marino called to change Yeimy's appointment. Rescheduled for tomorrow at 2 PM. Clinic will call to confirm the new appointment time.",
      outcome: "Scheduled",
      actions_taken: ["Appointment scheduled via AI"],
    };
  }

  // Maria Serpa case (phone: 4085612356) - Keep existing override
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

  // Rocky Panicun - Set as Urgent (should match what's in messages section)
  // Try common phone number patterns that might be used for Rocky
  if (
    matchesPhone(call.customer_phone, [
      "6692977276", // From your screenshot (669) 297-7276
      "669-297-7276",
      "+16692977276",
      "(669) 297-7276",
      "+1 (669) 297-7276",
      "4088924795", // Common test number pattern
      "408-892-4795",
      "+14088924795",
      "(408) 892-4795",
      "+1 (408) 892-4795",
      "4082346798", // Another common pattern
      "408-234-6798",
      "+14082346798",
      "(408) 234-6798",
      "+1 (408) 234-6798",
    ])
  ) {
    return {
      ...call,
      outcome: "Urgent",
      attention_types: ["urgent"],
      attention_severity: "high",
      attention_summary:
        "Rocky Panicun case marked as urgent - requires immediate attention",
    };
  }

  // (650) 544-4003 - Lily Melissa call - set to Appt Scheduled
  if (
    matchesPhone(call.customer_phone, [
      "6505444003",
      "650-544-4003",
      "+16505444003",
      "(650) 544-4003",
      "+1 (650) 544-4003",
    ])
  ) {
    return {
      ...call,
      outcome: "Scheduled",
    };
  }

  // (408) 769-8988 - Most recent call with custom audio and transcript
  if (
    matchesPhone(call.customer_phone, [
      "4087698988",
      "408-769-8988",
      "+14087698988",
      "(408) 769-8988",
      "+1 (408) 769-8988",
    ])
  ) {
    return {
      ...call,
      recording_url: "/audio/1226.MP3",
      transcript: `AI: Hello. You have reached the after hours assistant at Alum Rock Animal Hospital. How can I help you today?

User: I was trying to schedule an appointment for Rhino Torres.

AI: I'd be happy to help you schedule an appointment for Rhino. Are you a current client, or is this your first time visiting us?

User: Correct.

AI: Great. Thank you for confirming. What your first and last name?

User: Leonardo Torres.

AI: Thank you, Leonardo. What's the best phone number to reach you?

User: 4 0 8 7 6 9 8 9 8 8.

AI: Got it. 4 0 8 7 6 9 8 9 8 8. Is that correct?

User: Yes.

AI: Thank you. What's the reason for the visit?

User: It is kidney treatment hospitalization for 3 days.

AI: Understood. Rhino is Thank you for sharing that, Leonardo. When would you like to bring Rhino in for his kidney treatment hospitalization?

User: Tomorrow morning,

AI: Let me check availability for tomorrow morning. Let me take your information, and I'll have the clinic call you back first thing the morning to confirm the appointment for Rhino's hospitalization. Does that work for you?

User: Yes.

AI: I'll make sure the clinic contacts you first thing in the morning. Is there anything else I can assist you with tonight?

User: No.

AI: Thank you for calling Alum Rock Animal Hospital, Leonardo. Have a good night, and take care of rhino.

User: Thank you.`,
      duration_seconds: 120,
      summary: "Leonardo Torres called to schedule an appointment for Rhino. Client requests to bring Rhino in the morning for a 3-day hospitalization for kidney treatment. Clinic will call back to confirm appointment details.",
      outcome: "Call Back",
      actions_taken: ["Message taken for appointment request"],
    };
  }

  return null;
}
