import { Resend } from "resend";
import { env } from "~/env";

/**
 * Resend client instance for sending emails
 * Initialized with API key from environment variables
 */
export const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send a discharge email to a pet owner
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param html - HTML content of the email
 * @param text - Plain text version of the email (optional, will be auto-generated from HTML if not provided)
 * @returns Resend email response with email ID
 *
 * @example
 * ```typescript
 * const { data, error } = await sendDischargeEmail({
 *   to: "owner@example.com",
 *   subject: "Discharge Instructions for Max",
 *   html: "<h1>Welcome home, Max!</h1><p>Here are your discharge instructions...</p>",
 *   text: "Welcome home, Max! Here are your discharge instructions..."
 * });
 * ```
 */
export async function sendDischargeEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const response = await resend.emails.send({
      from: "OdisAI <noreply@odisai.net>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text ?? undefined, // Resend will auto-generate from HTML if not provided
    });

    return { data: response.data, error: null };
  } catch (error) {
    console.error("[Resend] Error sending email:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate plain text version from HTML content
 * Strips HTML tags and converts common elements to plain text equivalents
 *
 * @param html - HTML content
 * @returns Plain text version
 */
export function htmlToPlainText(html: string): string {
  return (
    html
      // Convert line breaks
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      // Convert headings
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
      // Remove remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim()
  );
}
