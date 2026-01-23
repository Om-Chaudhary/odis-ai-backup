/**
 * Step Utilities
 *
 * Shared utilities for discharge step handlers.
 */

/**
 * Clean HTML tags and entities from text
 */
export function cleanHtmlContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if text contains euthanasia indicators
 */
export function detectEuthanasia(
  text: string | null,
  metadata: {
    entities?: { caseType?: string };
    idexx?: { appointment_type?: string };
  } | null,
): boolean {
  const lowerText = text?.toLowerCase() ?? "";

  return (
    metadata?.entities?.caseType === "euthanasia" ||
    lowerText.includes("euthanasia") ||
    lowerText.includes("euthanize") ||
    (metadata?.idexx?.appointment_type?.toLowerCase().includes("euthanasia") ??
      false)
  );
}

/**
 * Extract consultation notes from IDEXX metadata
 */
export function extractIdexxConsultationNotes(
  metadata: { idexx?: { consultation_notes?: string } } | null,
): string | null {
  const consultationNotes = metadata?.idexx?.consultation_notes;
  if (!consultationNotes) return null;
  return cleanHtmlContent(consultationNotes);
}
