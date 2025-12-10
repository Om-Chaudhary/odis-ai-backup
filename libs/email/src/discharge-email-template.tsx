/**
 * Discharge Email Template - Plain HTML Generator
 *
 * Generates clean, professional veterinary discharge emails without React Email components.
 * This avoids the "Html should not be imported outside of pages/_document" error
 * during Next.js static generation.
 */

import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import { getWarningSignsHybrid } from "@odis-ai/email/warning-signs-library";

export interface DischargeEmailProps {
  patientName: string;
  ownerName?: string | null;
  structuredContent?: StructuredDischargeSummary | null;
  dischargeSummaryContent?: string;
  date?: string;
  breed?: string | null;
  species?: string | null;
  clinicName?: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  primaryColor?: string;
  logoUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  headerStyle?: "dark" | "light";
}

// Color palette
const colors = {
  primary: "#0F766E",
  danger: "#DC2626",
  warning: "#D97706",
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
    danger: "#FEF2F2",
    warning: "#FFFBEB",
    info: "#EFF6FF",
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

export function DischargeEmailTemplate(props: DischargeEmailProps): string {
  const {
    patientName,
    ownerName,
    structuredContent,
    dischargeSummaryContent,
    date = "Recent Visit",
    clinicName,
    clinicPhone,
    primaryColor = colors.primary,
    logoUrl,
  } = props;

  const hasStructuredContent =
    structuredContent !== null && structuredContent !== undefined;

  // Build visit tags
  const visitTags: string[] = [];
  if (hasStructuredContent) {
    if (structuredContent.diagnosis) {
      visitTags.push(structuredContent.diagnosis);
    }
    if (structuredContent.treatmentsToday) {
      visitTags.push(...structuredContent.treatmentsToday.slice(0, 3));
    }
  }

  // Warning signs logic
  const shouldShowWarningSigns =
    hasStructuredContent &&
    structuredContent.caseType &&
    (structuredContent.caseType === "surgery" ||
      structuredContent.caseType === "emergency" ||
      (structuredContent.caseType === "dental" &&
        (structuredContent.appointmentSummary
          ?.toLowerCase()
          .includes("extraction") ??
          false)) ||
      (structuredContent.caseType === "orthopedic" &&
        (structuredContent.appointmentSummary
          ?.toLowerCase()
          .includes("fracture") ??
          false)));

  const warningSigns = shouldShowWarningSigns
    ? getWarningSignsHybrid(
        structuredContent.warningSigns,
        structuredContent.caseType,
      )
    : [];

  // Home care
  const hasHomeCare =
    hasStructuredContent &&
    structuredContent.homeCare &&
    (Boolean(structuredContent.homeCare.activity) ||
      Boolean(structuredContent.homeCare.diet) ||
      Boolean(structuredContent.homeCare.woundCare) ||
      (structuredContent.homeCare.monitoring &&
        structuredContent.homeCare.monitoring.length > 0));

  // Filter take-home medications
  const takeHomeMeds = hasStructuredContent
    ? (structuredContent.medications ?? []).filter((med) => {
        const instructions = (med.instructions ?? "").toLowerCase();
        const excludePatterns = [
          "administered at clinic",
          "given at clinic",
          "one-time dose",
        ];
        return !excludePatterns.some((p) => instructions.includes(p));
      })
    : [];

  // Follow-up
  const hasExplicitFollowUp =
    hasStructuredContent &&
    structuredContent.followUp &&
    (structuredContent.followUp.date ?? structuredContent.followUp.reason);

  // Greeting
  const ownerFirstName = ownerName?.split(" ")[0];
  const greeting = ownerFirstName ? `Hi ${ownerFirstName},` : "Hello,";

  // Process appointment summary
  const processAppointmentSummary = (
    summary: string | undefined,
  ): string | undefined => {
    if (!summary) return undefined;

    const replacements: Array<[RegExp, string]> = [
      [/came in today for/gi, "came in for"],
      [/visited us today for/gi, "visited us for"],
      [/came in yesterday for/gi, "came in for"],
      [/visited us yesterday for/gi, "visited us for"],
      [/\btoday\b/gi, "during the visit"],
      [/\byesterday\b/gi, "during the visit"],
      [/\blast night\b/gi, "during the visit"],
      [/\bthis (morning|afternoon|evening)\b/gi, "during the visit"],
      [/\bearlier this week\b/gi, "during the recent visit"],
    ];

    const cleaned = replacements.reduce(
      (current, [pattern, replacement]) =>
        current.replace(pattern, replacement),
      summary,
    );

    const withoutWeekdays = cleaned.replace(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      "during the visit",
    );

    return withoutWeekdays.replace(/\s{2,}/g, " ").trim();
  };

  const appointmentSummary = hasStructuredContent
    ? processAppointmentSummary(structuredContent.appointmentSummary)
    : undefined;

  const fallbackIntro = `Here's everything you need to know about ${patientName}'s visit.`;
  const previewText = `${patientName}'s visit summary from ${clinicName ?? "your vet"}`;

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
            <td style="padding: 28px 32px 24px; background: linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%);">
              <!-- Clinic branding -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 50%;">
                    ${
                      logoUrl
                        ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(clinicName ?? "Clinic Logo")}" height="44" style="display: block; height: 44px;">`
                        : `<p style="margin: 0; font-size: 16px; font-weight: 600; color: #134E4A;">${escapeHtml(clinicName ?? "Your Veterinary Clinic")}</p>`
                    }
                  </td>
                  <td align="right" style="width: 50%;">
                    <p style="margin: 0; font-size: 13px; color: rgba(19, 78, 74, 0.6);">${escapeHtml(date)}</p>
                  </td>
                </tr>
              </table>

              <!-- Pet name title -->
              <h1 style="margin: 20px 0 8px; font-size: 26px; font-weight: 700; color: #134E4A;">
                ${escapeHtml(patientName)}'s Visit Summary
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 4px; font-size: 15px; color: rgba(19, 78, 74, 0.75); line-height: 1.5;">
                ${escapeHtml(greeting)}
              </p>

              <!-- Appointment Summary -->
              <p style="margin: 0 0 16px; font-size: 15px; color: rgba(19, 78, 74, 0.85); line-height: 1.6;">
                ${escapeHtml(appointmentSummary ?? fallbackIntro)}
              </p>

              <!-- Visit Tags -->
              ${
                visitTags.length > 0
                  ? `
              <div style="margin-top: 12px;">
                ${visitTags
                  .slice(0, 4)
                  .map(
                    (tag) => `
                  <span style="display: inline-block; padding: 6px 14px; background-color: rgba(19, 78, 74, 0.12); border-radius: 20px; font-size: 13px; font-weight: 500; color: #134E4A; margin-right: 8px; margin-bottom: 8px;">
                    ${escapeHtml(tag)}
                  </span>
                `,
                  )
                  .join("")}
              </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 0;">
              ${
                hasStructuredContent
                  ? `
                ${
                  takeHomeMeds.length > 0
                    ? `
                  <!-- Medications Section -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <!-- Medication Header -->
                        <div style="background-color: ${primaryColor}; color: white; border-radius: 8px 8px 0 0; padding: 16px 20px; margin: 0 0 24px 0;">
                          <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700;">
                            💊 ${escapeHtml(patientName)}'s Medications
                          </p>
                          <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                            Please give these medications as directed:
                          </p>
                        </div>

                        <!-- Medication List -->
                        ${takeHomeMeds
                          .map(
                            (med) => `
                          <div style="padding: 20px; margin-bottom: 16px; background-color: ${colors.background.accent}; border-radius: 12px; border: 2px solid rgba(15, 118, 110, 0.12);">
                            <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: ${primaryColor}; letter-spacing: 0.5px;">
                              ${escapeHtml(med.name)}
                            </p>
                            ${
                              med.dosage || med.totalQuantity
                                ? `
                              <p style="margin: 0 0 8px 0; font-size: 17px; font-weight: 600; color: #374151;">
                                ${escapeHtml([med.dosage, med.totalQuantity].filter(Boolean).join(" - "))}
                              </p>
                            `
                                : ""
                            }
                            ${
                              med.frequency || med.duration
                                ? `
                              <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500; color: #6B7280;">
                                ${escapeHtml([med.frequency, med.duration].filter(Boolean).join(" for "))}
                              </p>
                            `
                                : ""
                            }
                            ${
                              med.purpose
                                ? `
                              <p style="margin: 0 0 12px 0; font-size: 14px; font-style: italic; color: #059669;">
                                ${escapeHtml(med.purpose)}
                              </p>
                            `
                                : ""
                            }
                            ${
                              med.instructions
                                ? `
                              <span style="display: inline-block; padding: 8px 16px; background-color: ${primaryColor}; color: white; font-size: 13px; font-weight: 600; border-radius: 8px; margin-top: 8px;">
                                💡 ${escapeHtml(med.instructions)}
                              </span>
                            `
                                : ""
                            }
                          </div>
                        `,
                          )
                          .join("")}
                      </td>
                    </tr>
                  </table>
                `
                    : ""
                }

                ${
                  hasHomeCare
                    ? `
                  <!-- Home Care Section -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                          Caring for ${escapeHtml(patientName)} at Home
                        </p>
                        <div style="background-color: ${colors.background.muted}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px;">
                          ${
                            structuredContent.homeCare!.activity
                              ? `
                            <div style="margin-bottom: 16px;">
                              <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">Activity</p>
                              <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                                ${escapeHtml(structuredContent.homeCare!.activity)}
                              </p>
                            </div>
                          `
                              : ""
                          }
                          ${
                            structuredContent.homeCare!.diet
                              ? `
                            <div style="margin-bottom: 16px;">
                              <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">Diet</p>
                              <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                                ${escapeHtml(structuredContent.homeCare!.diet)}
                              </p>
                            </div>
                          `
                              : ""
                          }
                          ${
                            structuredContent.homeCare!.woundCare
                              ? `
                            <div style="margin-bottom: 16px;">
                              <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">Wound Care</p>
                              <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                                ${escapeHtml(structuredContent.homeCare!.woundCare)}
                              </p>
                            </div>
                          `
                              : ""
                          }
                          ${
                            structuredContent.homeCare!.monitoring &&
                            structuredContent.homeCare!.monitoring.length > 0
                              ? `
                            <div>
                              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">Things to Monitor</p>
                              ${structuredContent
                                .homeCare!.monitoring.map(
                                  (item) => `
                                <p style="margin: 0 0 4px; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                                  • ${escapeHtml(item)}
                                </p>
                              `,
                                )
                                .join("")}
                            </div>
                          `
                              : ""
                          }
                        </div>
                      </td>
                    </tr>
                  </table>
                `
                    : ""
                }

                ${
                  warningSigns.length > 0
                    ? `
                  <!-- Warning Signs Section -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                          What to Watch For
                        </p>
                        <div style="background-color: ${colors.background.danger}; border-left: 4px solid ${colors.danger}; border-radius: 0 8px 8px 0; padding: 20px;">
                          <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: ${colors.danger};">
                            Contact us right away if you notice any of these:
                          </p>
                          ${warningSigns
                            .map(
                              (sign: string) => `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 10px;">
                              <tr>
                                <td style="width: 28px; vertical-align: top;">
                                  <div style="width: 16px; height: 16px; border: 2px solid ${colors.danger}; border-radius: 3px; margin-top: 2px;"></div>
                                </td>
                                <td>
                                  <p style="margin: 0; font-size: 14px; font-weight: 500; color: ${colors.danger}; line-height: 1.5;">
                                    ${escapeHtml(sign)}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          `,
                            )
                            .join("")}
                          ${
                            clinicPhone
                              ? `
                            <p style="margin: 16px 0 0; font-size: 13px; color: ${colors.danger};">
                              Call us immediately at: <a href="tel:${clinicPhone.replace(/\D/g, "")}" style="color: ${colors.danger}; font-weight: 600; text-decoration: none;">${escapeHtml(clinicPhone)}</a>
                            </p>
                          `
                              : ""
                          }
                        </div>
                      </td>
                    </tr>
                  </table>
                `
                    : ""
                }

                ${
                  hasExplicitFollowUp
                    ? `
                  <!-- Follow-up Section -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                          What's Next
                        </p>
                        <div style="background-color: ${colors.background.info}; border-radius: 8px; padding: 16px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="width: 32px; vertical-align: top;">
                                <p style="margin: 0; font-size: 20px;">📅</p>
                              </td>
                              <td style="padding-left: 12px;">
                                <p style="margin: 0 0 2px; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
                                  Follow-up Appointment
                                </p>
                                <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
                                  ${
                                    structuredContent.followUp?.date
                                      ? `We'd like to see ${escapeHtml(patientName)} again ${escapeHtml(structuredContent.followUp.date)}`
                                      : "Please call us to schedule a follow-up"
                                  }${
                                    structuredContent.followUp?.reason
                                      ? ` for ${escapeHtml(structuredContent.followUp.reason)}`
                                      : ""
                                  }.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>
                `
                    : ""
                }

                ${
                  structuredContent.notes &&
                  !structuredContent.notes
                    .toLowerCase()
                    .includes("owner declined") &&
                  !structuredContent.notes
                    .toLowerCase()
                    .includes("recheck instructions provided") &&
                  !structuredContent.notes
                    .toLowerCase()
                    .includes("follow-up scheduled") &&
                  !structuredContent.notes
                    .toLowerCase()
                    .includes("client educated")
                    ? `
                  <!-- Notes Section -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <div style="background-color: ${colors.background.warning}; border-left: 4px solid ${colors.warning}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                          <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">
                            <strong>Important:</strong> ${escapeHtml(structuredContent.notes)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                `
                    : ""
                }

                <!-- Questions Box -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px; margin-bottom: 24px;">
                  <tr>
                    <td>
                      <div style="background-color: ${colors.background.muted}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                          Questions about ${escapeHtml(patientName)}'s care? We're here to help — just give us a call.
                        </p>
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${primaryColor};">
                          <a href="tel:${clinicPhone?.replace(/\D/g, "") ?? ""}" style="color: ${primaryColor}; text-decoration: none;">
                            ${escapeHtml(clinicPhone ?? "(408) 258-2735")}
                          </a>
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              `
                  : dischargeSummaryContent
                    ? `
                <!-- Plaintext fallback -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px;">
                  <tr>
                    <td>
                      <p style="white-space: pre-wrap; font-size: 15px; line-height: 1.7; color: ${colors.text.primary};">
                        ${escapeHtml(dischargeSummaryContent)}
                      </p>
                    </td>
                  </tr>
                </table>
              `
                    : `
                <!-- No content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding: 0 32px;">
                  <tr>
                    <td style="text-align: center;">
                      <p style="color: ${colors.text.muted}; font-style: italic;">
                        No discharge instructions available.
                      </p>
                    </td>
                  </tr>
                </table>
              `
              }
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
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: ${colors.text.primary};">
                Sent with care from ${escapeHtml(clinicName ?? "your veterinary clinic")}
              </p>
              <p style="margin: 0; font-size: 13px; color: ${colors.text.secondary}; line-height: 1.4;">
                2810 Alum Rock Ave, San Jose, CA 95127
              </p>
            </td>
          </tr>

          <!-- Bottom Footer -->
          <tr>
            <td style="padding: 12px 32px; background-color: ${colors.background.page}; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${colors.text.muted};">
                Powered by <strong>OdisAI</strong>
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
