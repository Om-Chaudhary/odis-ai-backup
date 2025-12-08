import type { IdexxPageData } from "./types";
import type { ScheduleCallInput } from "~/lib/retell/validators";
import { extractFirstName } from "@odis/vapi/utils";

/**
 * Transform IDEXX Neo consultation data to call request format
 *
 * @param idexxData - Raw IDEXX Neo page data
 * @param scheduledFor - When to schedule the call
 * @param userNotes - Optional user-provided notes
 * @returns Formatted call request ready for scheduling
 */
export function transformIdexxToCallRequest(
  idexxData: IdexxPageData,
  scheduledFor: Date,
  userNotes?: string,
): ScheduleCallInput {
  const { pageData } = idexxData;

  // Select primary provider (first in list)
  const primaryProvider = pageData.providers[0];

  // Format appointment date for voice (e.g., "November twelfth, twenty twenty five")
  const consultationDate = pageData.consultation.date
    ? new Date(pageData.consultation.date)
    : new Date();
  const appointmentDate = formatDateForVoice(consultationDate);

  // Format phone numbers for voice
  const clinicPhoneFormatted = formatPhoneForVoice(pageData.clinic.phone);
  const emergencyPhoneFormatted = formatPhoneForVoice(
    process.env.DEFAULT_EMERGENCY_PHONE ?? pageData.clinic.phone,
  );

  return {
    phoneNumber: formatPhoneNumber(pageData.client.phone),
    // Use extractFirstName to get only the first word of the pet name
    // (many vet systems store "FirstName LastName" but we only want first name for calls)
    petName: extractFirstName(pageData.patient.name),
    ownerName: pageData.client.name,
    appointmentDate,

    // VAPI call configuration
    callType: "discharge" as const, // IDEXX imports are typically discharge calls
    agentName: "Sarah",
    clinicName: pageData.clinic.name,
    clinicPhone: clinicPhoneFormatted,
    emergencyPhone: emergencyPhoneFormatted,

    // Clinical details
    dischargeSummary:
      pageData.consultation.dischargeSummary ?? pageData.consultation.notes,
    subType: "wellness", // Most IDEXX imports are wellness checks

    // Optional fields
    vetName: primaryProvider?.name ?? "Unknown Veterinarian",
    nextSteps: undefined, // Can be extracted from consultation notes if needed

    // Scheduling
    scheduledFor,
    notes:
      userNotes ??
      `Consultation #${pageData.consultation.id} - ${pageData.consultation.reason}`,
  };
}

/**
 * Format date for voice output (e.g., "November twelfth, twenty twenty five")
 */
function formatDateForVoice(date: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const ordinals = [
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "twenty first",
    "twenty second",
    "twenty third",
    "twenty fourth",
    "twenty fifth",
    "twenty sixth",
    "twenty seventh",
    "twenty eighth",
    "twenty ninth",
    "thirtieth",
    "thirty first",
  ];

  const month = months[date.getMonth()];
  const day = ordinals[date.getDate() - 1];
  const year = date.getFullYear().toString().split("").join(" "); // "2025" -> "2 0 2 5"

  return `${month} ${day}, ${year}`;
}

/**
 * Format phone number for voice output (e.g., "five five five, one two three, four five six seven")
 */
function formatPhoneForVoice(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Map digits to words
  const digitWords: Record<string, string> = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
  };

  // Get the last 10 digits (US phone number)
  const phoneDigits = cleaned.slice(-10);

  // Format as "555, 123, 4567" -> "five five five, one two three, four five six seven"
  const areaCode = phoneDigits
    .slice(0, 3)
    .split("")
    .map((d) => digitWords[d])
    .join(" ");
  const exchange = phoneDigits
    .slice(3, 6)
    .split("")
    .map((d) => digitWords[d])
    .join(" ");
  const subscriber = phoneDigits
    .slice(6)
    .split("")
    .map((d) => digitWords[d])
    .join(" ");

  return `${areaCode}, ${exchange}, ${subscriber}`;
}

/**
 * Format phone number to E.164 international format
 *
 * @param phone - Phone number in any format
 * @returns Phone number in E.164 format (e.g., +12137774445)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Handle US/Canada numbers (11 digits starting with 1)
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  // Handle 10-digit US numbers (assume US country code)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // Already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  // Default to US if unclear
  return `+1${cleaned}`;
}

/**
 * Extract consultation ID from IDEXX Neo URL
 *
 * @param url - IDEXX Neo consultation URL
 * @returns Consultation ID or null if not found
 *
 * @example
 * extractConsultationId("https://us.idexxneo.com/consultations/12345/details")
 * // Returns: "12345"
 */
export function extractConsultationId(url: string): string | null {
  // Extract from URL like: https://us.idexxneo.com/consultations/12345/...
  const match = /\/consultations\/(\d+)/.exec(url);
  return match ? (match[1] ?? null) : null;
}

/**
 * Validate IDEXX data has required fields
 *
 * @param idexxData - IDEXX page data to validate
 * @returns Validation result with errors if any
 */
export function validateIdexxData(idexxData: IdexxPageData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!idexxData.pageData) {
    errors.push("Missing pageData");
    return { valid: false, errors };
  }

  const { pageData } = idexxData;

  // Check required fields
  if (!pageData.patient?.name) {
    errors.push("Missing patient name");
  }

  if (!pageData.client?.name) {
    errors.push("Missing client (owner) name");
  }

  if (!pageData.client?.phone) {
    errors.push("Missing client phone number");
  }

  if (!pageData.clinic?.name) {
    errors.push("Missing clinic name");
  }

  if (!pageData.providers || pageData.providers.length === 0) {
    errors.push("No providers found");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
