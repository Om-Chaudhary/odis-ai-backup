/**
 * Email utilities and templates
 *
 * This module provides React-based email templates and utilities for
 * rendering them to HTML strings suitable for email clients.
 *
 * Uses only data available from Supabase:
 * - discharge_summaries.content (plain text)
 * - patients: name, species, breed, owner_name, owner_email
 * - users: clinic_name, clinic_phone, clinic_email
 *
 * @example
 * ```tsx
 * import {
 *   DischargeEmailTemplate,
 *   prepareEmailContent
 * } from "~/lib/email";
 * import React from "react";
 *
 * // Render email component with Supabase data
 * const { html, text } = await prepareEmailContent(
 *   React.createElement(DischargeEmailTemplate, {
 *     patientName: patient.name,
 *     dischargeSummaryContent: dischargeSummary.content,
 *     breed: patient.breed,
 *     species: patient.species,
 *     clinicName: user.clinic_name,
 *     clinicPhone: user.clinic_phone,
 *     clinicEmail: user.clinic_email,
 *   })
 * );
 * // Note: ownerName is intentionally excluded
 *
 * // Send email via Resend
 * await sendDischargeEmail({
 *   to: patient.owner_email,
 *   subject: `Discharge Instructions for ${patient.name}`,
 *   html,
 *   text
 * });
 * ```
 */

// Export email templates
export {
  type DischargeEmailProps,
  DischargeEmailTemplate,
} from "~/components/email/discharge-email-template";

// Export rendering utilities
export {
  htmlToPlainText,
  inlineCss,
  prepareEmailContent,
  renderEmailToHtml,
} from "./render-email";
