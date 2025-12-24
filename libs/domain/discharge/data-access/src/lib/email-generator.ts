/**
 * Email Content Generator
 *
 * Generates discharge email content from templates with clinic branding.
 * Extracted from discharge-orchestrator.ts for modularity.
 */

import type { StructuredDischargeSummary } from "@odis-ai/shared/validators/discharge-summary";
import type { ClinicBranding } from "@odis-ai/shared/types/clinic-branding";

/**
 * Generate email content from discharge summary using HTML template
 *
 * Uses data from Supabase:
 * - discharge_summaries.content (plaintext) or structured_content (JSON)
 * - patients: name, species, breed (owner_name intentionally excluded)
 * - clinics/users: clinic_name, clinic_phone, clinic_email, branding
 */
export async function generateEmailContent(
  dischargeSummary: string,
  patientName: string,
  species: string | null | undefined,
  breed: string | null | undefined,
  branding: ClinicBranding,
  structuredContent?: StructuredDischargeSummary | null,
  _visitDate?: string | Date | null,
): Promise<{ subject: string; html: string; text: string }> {
  const subject = `Discharge Instructions for ${patientName}`;

  // Use generic text instead of specific date
  const formattedDate = "Recent Visit";

  // Dynamic import to avoid Next.js bundling issues during static generation
  const { DischargeEmailTemplate } =
    await import("@odis-ai/shared/email/discharge-email-template");
  const { htmlToPlainText } = await import("@odis-ai/shared/email");

  // Generate HTML email (now returns plain HTML string, no React components)
  const html = DischargeEmailTemplate({
    patientName,
    dischargeSummaryContent: dischargeSummary,
    structuredContent: structuredContent ?? undefined,
    breed,
    species,
    clinicName: branding.clinicName,
    clinicPhone: branding.clinicPhone,
    clinicEmail: branding.clinicEmail,
    primaryColor: branding.primaryColor,
    logoUrl: branding.logoUrl,
    headerText: branding.emailHeaderText,
    footerText: branding.emailFooterText,
    date: formattedDate,
  });

  // Generate plain text version from HTML
  const text = htmlToPlainText(html);

  return { subject, html, text };
}
