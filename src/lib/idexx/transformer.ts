import type { IdexxPageData } from "./types";
import type { ScheduleCallInput } from "../retell/validators";

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

  return {
    phoneNumber: formatPhoneNumber(pageData.client.phone),
    petName: pageData.patient.name,
    ownerName: pageData.client.name,
    vetName: primaryProvider?.name ?? "Unknown Veterinarian",
    clinicName: pageData.clinic.name,
    clinicPhone: pageData.clinic.phone,
    dischargeSummary:
      pageData.consultation.dischargeSummary ?? pageData.consultation.notes,
    scheduledFor,
    notes:
      userNotes ??
      `Consultation #${pageData.consultation.id} - ${pageData.consultation.reason}`,
  };
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
