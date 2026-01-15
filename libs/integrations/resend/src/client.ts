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
  const { env } = await import("@odis-ai/shared/env");
  return new Resend(env.RESEND_API_KEY);
}

/**
 * Lazily get the site URL for email links
 */
async function getSiteUrl(): Promise<string> {
  const { env } = await import("@odis-ai/shared/env");
  return env.NEXT_PUBLIC_SITE_URL ?? "https://odisai.net";
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

/**
 * Send a clinic invitation email
 *
 * Sends an invitation email to a user to join a clinic team.
 *
 * @param params - Invitation email parameters
 * @returns Resend email response with email ID
 *
 * @example
 * ```typescript
 * const { data, error } = await sendInvitationEmail({
 *   to: "newuser@example.com",
 *   clinicName: "Happy Paws Veterinary",
 *   inviterName: "Dr. Smith",
 *   role: "member",
 *   token: "abc123-uuid-token",
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 * });
 * ```
 */
export async function sendInvitationEmail({
  to,
  clinicName,
  inviterName,
  inviterEmail,
  role,
  token,
  expiresAt,
}: {
  to: string;
  clinicName: string;
  inviterName: string;
  inviterEmail?: string;
  role: string;
  token: string;
  expiresAt: Date;
}) {
  try {
    // Dynamically import the template to avoid Next.js issues
    const { ClinicInvitationEmailTemplate } =
      await import("@odis-ai/shared/email/clinic-invitation-template");

    const siteUrl = await getSiteUrl();
    const inviteUrl = `${siteUrl}/onboarding?token=${token}`;

    const html = ClinicInvitationEmailTemplate({
      clinicName,
      inviterName,
      inviterEmail,
      recipientEmail: to,
      role,
      inviteUrl,
      expiresAt,
    });

    const resend = await getResendClient();
    const response = await resend.emails.send({
      from: "OdisAI <noreply@odisai.net>",
      to: [to],
      subject: `You've been invited to join ${clinicName} on OdisAI`,
      html,
    });

    return { data: response.data, error: null };
  } catch (error) {
    console.error("[Resend] Error sending invitation email:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
