/**
 * Clinic Invitation Email Template - Plain HTML Generator
 *
 * Generates clean, professional invitation emails for clinic team members.
 * Uses the same plain HTML approach as DischargeEmailTemplate to avoid
 * Next.js static generation issues.
 */

export interface ClinicInvitationEmailProps {
  clinicName: string;
  inviterName: string;
  inviterEmail?: string;
  recipientEmail: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

// Color palette (consistent with discharge template)
const colors = {
  primary: "#0F766E",
  text: {
    primary: "#111827",
    secondary: "#4B5563",
    muted: "#9CA3AF",
    inverse: "#FFFFFF",
  },
  background: {
    page: "#F3F4F6",
    card: "#FFFFFF",
    muted: "#F9FAFB",
    accent: "#F0FDFA",
  },
  border: "#E5E7EB",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: "Owner",
    admin: "Administrator",
    member: "Team Member",
    viewer: "Viewer",
  };
  return roleMap[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ClinicInvitationEmailTemplate(
  props: ClinicInvitationEmailProps,
): string {
  const {
    clinicName,
    inviterName,
    recipientEmail,
    role,
    inviteUrl,
    expiresAt,
  } = props;

  const formattedRole = formatRole(role);
  const expiryDate = formatExpiryDate(expiresAt);
  const previewText = `You've been invited to join ${clinicName} on OdisAI`;

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(previewText)}</title>
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; }
    .outlook-group-fix { width: 100% !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background.page}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(previewText)}
  </div>

  <!-- Main Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: ${colors.background.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%); text-align: center;">
              <!-- Logo/Brand -->
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1px;">
                OdisAI
              </p>

              <!-- Main Title -->
              <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #134E4A;">
                You're Invited!
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0; font-size: 15px; color: rgba(19, 78, 74, 0.75); line-height: 1.5;">
                ${escapeHtml(inviterName)} has invited you to join their team
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Invitation Details Card -->
              <div style="background-color: ${colors.background.accent}; border: 2px solid rgba(15, 118, 110, 0.12); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td>
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                        Clinic
                      </p>
                      <p style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: ${colors.primary};">
                        ${escapeHtml(clinicName)}
                      </p>

                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                        Your Role
                      </p>
                      <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                        ${escapeHtml(formattedRole)}
                      </p>

                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                        Invited Email
                      </p>
                      <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
                        ${escapeHtml(recipientEmail)}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; padding: 16px 48px; background-color: ${colors.primary}; color: ${colors.text.inverse}; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <div style="background-color: ${colors.background.muted}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: ${colors.text.secondary};">
                  This invitation expires on <strong>${escapeHtml(expiryDate)}</strong>
                </p>
              </div>

              <!-- Button Not Working Link -->
              <p style="margin: 24px 0 0; font-size: 13px; color: ${colors.text.muted}; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: ${colors.primary}; text-align: center; word-break: break-all;">
                <a href="${escapeHtml(inviteUrl)}" style="color: ${colors.primary}; text-decoration: underline;">
                  ${escapeHtml(inviteUrl)}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer Divider -->
          <tr>
            <td>
              <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: ${colors.background.muted}; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${colors.text.secondary}; line-height: 1.4;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 13px; color: ${colors.text.muted};">
                Questions? Contact the person who invited you.
              </p>
            </td>
          </tr>

          <!-- Bottom Footer -->
          <tr>
            <td style="padding: 12px 32px; background-color: ${colors.background.page}; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${colors.text.muted};">
                Powered by <strong>OdisAI</strong> - Veterinary Practice Automation
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`.trim();
}
