// Re-export utilities for backward compatibility
// These can be safely imported without pulling in @react-email
export { isValidEmail, htmlToPlainText } from "./utils";

/**
 * Lazily get the Resend client instance
 * This avoids importing the resend library (which includes @react-email)
 * at module initialization time, preventing issues with Next.js static generation.
 */
async function getResendClient() {
  const { Resend } = await import("resend");
  const { env } = await import("@odis/env");
  return new Resend(env.RESEND_API_KEY);
}

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
    const resend = await getResendClient();
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
