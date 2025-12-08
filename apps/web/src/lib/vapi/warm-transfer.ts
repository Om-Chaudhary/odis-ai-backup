/**
 * VAPI Warm Transfer Configuration
 *
 * Builds the transferCall tool configuration for warm handoffs to the clinic front desk.
 * See: https://docs.vapi.ai/calls/assistant-based-warm-transfer
 */

import type { TransferCallTool } from "./client";

/**
 * Context passed to the transfer assistant for the warm handoff
 */
export interface WarmTransferContext {
  /** Pet name */
  petName: string;
  /** Pet owner name */
  ownerName: string;
  /** Primary diagnosis or reason for visit */
  primaryDiagnosis?: string;
  /** Condition being treated */
  condition?: string;
  /** Type of call (discharge or follow-up) */
  callType: "discharge" | "follow-up";
  /** Brief reason for the transfer */
  transferReason?: string;
  /** Clinic name for context */
  clinicName: string;
  /** Appointment date */
  appointmentDate?: string;
}

/**
 * Build the transfer assistant system prompt
 * This prompt instructs the AI on how to brief the front desk
 */
function buildTransferAssistantPrompt(context: WarmTransferContext): string {
  const patientInfo = [
    `Patient: ${context.petName}`,
    `Owner: ${context.ownerName}`,
    context.primaryDiagnosis && `Diagnosis: ${context.primaryDiagnosis}`,
    context.condition && `Condition: ${context.condition}`,
    context.appointmentDate && `Visit date: ${context.appointmentDate}`,
  ]
    .filter(Boolean)
    .join(", ");

  return `You are a transfer assistant for ${context.clinicName}. Your ONLY job is to briefly inform the front desk about an incoming call and then complete the transfer.

## Patient Context
${patientInfo}

## Your Task
1. When the front desk answers, immediately say your first message
2. Wait for them to acknowledge (e.g., "okay", "got it", "sure")
3. Call transferSuccessful to connect the pet owner

## Rules
- Be EXTREMELY brief - max 2 sentences
- Don't ask questions unless the front desk asks you something
- If you hear voicemail or no answer for 20+ seconds, call transferCancel
- If the front desk says they can't take the call, call transferCancel
- Never mention you are an AI or transfer assistant

## Built-in Tools
- transferSuccessful: Use when front desk is ready to take the call
- transferCancel: Use if front desk is unavailable or declines`;
}

/**
 * Build the first message the transfer assistant speaks to the front desk
 */
function buildFirstMessage(context: WarmTransferContext): string {
  const reason =
    context.transferReason ?? context.primaryDiagnosis ?? context.condition;

  if (reason) {
    return `Hi, I have ${context.ownerName} on the line regarding ${context.petName}. They have a concern about ${reason}. Are you available?`;
  }

  return `Hi, I have ${context.ownerName} on the line about ${context.petName}'s recent ${context.callType === "discharge" ? "visit" : "follow-up"}. Can you take the call?`;
}

/**
 * Build the warm transfer tool configuration
 *
 * @param clinicPhone - Clinic phone number in E.164 format (+1234567890)
 * @param context - Patient and call context for the transfer assistant
 * @returns TransferCallTool configuration or null if clinic phone is missing
 */
export function buildWarmTransferTool(
  clinicPhone: string | undefined | null,
  context: WarmTransferContext,
): TransferCallTool | null {
  // Validate clinic phone - must be E.164 format
  if (!clinicPhone?.startsWith("+")) {
    console.warn("[WARM_TRANSFER] Invalid or missing clinic phone", {
      clinicPhone,
      expected: "E.164 format (+1234567890)",
    });
    return null;
  }

  const firstMessage = buildFirstMessage(context);
  const systemPrompt = buildTransferAssistantPrompt(context);

  console.log("[WARM_TRANSFER] Building transfer tool", {
    clinicPhone,
    petName: context.petName,
    ownerName: context.ownerName,
    callType: context.callType,
    firstMessagePreview: firstMessage.substring(0, 50) + "...",
  });

  return {
    type: "transferCall",
    function: {
      name: "transferToClinic",
      description:
        "Transfer the call to the clinic front desk when the pet owner requests to speak with staff or has urgent concerns",
    },
    destinations: [
      {
        type: "number",
        number: clinicPhone,
        description: "Clinic front desk",
        transferPlan: {
          mode: "warm-transfer-experimental",
          transferAssistant: {
            firstMessage,
            firstMessageMode: "assistant-speaks-first",
            maxDurationSeconds: 60, // 1 minute max for the handoff
            silenceTimeoutSeconds: 20, // Cancel if no response for 20 seconds
            model: {
              provider: "openai",
              model: "gpt-4o-mini", // Fast, cheap model for simple handoff
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
              ],
            },
          },
        },
      },
    ],
    messages: [
      {
        type: "request-start",
        content:
          "I'll connect you to our clinic right now. Please hold for just a moment.",
      },
      {
        type: "request-complete",
        // This plays as hold music - using a pleasant tone/silence URL or default VAPI ringtone
        content: "", // Empty = default VAPI ringtone
      },
      {
        type: "request-failed",
        content:
          "I'm sorry, I wasn't able to connect you to the clinic. You can reach them directly at {{clinic_phone}}. Is there anything else I can help you with?",
      },
    ],
  };
}

/**
 * Extract E.164 phone number from various formats
 * Returns null if the input is not a valid phone number
 */
export function extractE164Phone(
  phone: string | undefined | null,
): string | null {
  if (!phone) return null;

  // If already in E.164 format, return as-is
  if (phone.startsWith("+") && /^\+\d{10,15}$/.test(phone)) {
    return phone;
  }

  // Try to extract digits and format as E.164 (assuming US)
  const digits = phone.replace(/\D/g, "");

  // US number: 10 digits
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // US number with country code: 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // International number: 11-15 digits
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  console.warn("[WARM_TRANSFER] Could not extract E.164 phone", {
    input: phone,
    digits,
    digitCount: digits.length,
  });

  return null;
}
