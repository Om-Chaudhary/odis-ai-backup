import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import type { StructuredDischargeSummary } from "~/lib/validators/discharge-summary";
import { getWarningSignsHybrid } from "~/lib/email/warning-signs-library";

/**
 * Discharge Email Template - Using React Email Components
 *
 * A clean, professional veterinary discharge email template.
 * Uses @react-email/components for optimal email client compatibility.
 *
 * Section Order (natural client flow):
 * 1. Header - Pet name, clinic branding, visit date & highlights
 * 2. Medications - Most actionable: what do I need to give my pet?
 * 3. Caring for [Pet] at Home - Home care instructions
 * 4. What to Watch For - Warning signs
 * 5. What's Next - Follow-up appointment
 * 6. Notes - Additional information
 * 7. Footer - Contact info
 */

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
  primary: "#0F766E", // Teal for Alum Rock
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

// Styles
const main: React.CSSProperties = {
  backgroundColor: colors.background.page,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "24px 16px",
  maxWidth: "600px",
};

const card: React.CSSProperties = {
  backgroundColor: colors.background.card,
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const headerStyle: React.CSSProperties = {
  padding: "28px 32px 24px",
  background: `linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)`,
};

const sectionStyle: React.CSSProperties = {
  padding: "0 32px",
  marginBottom: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: colors.text.secondary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px 0",
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 14px",
  backgroundColor: "rgba(19, 78, 74, 0.12)",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "500",
  color: "#134E4A",
  marginRight: "8px",
  marginBottom: "8px",
};

const medicationRowStyle: React.CSSProperties = {
  padding: "20px",
  marginBottom: "16px",
  backgroundColor: colors.background.accent,
  borderRadius: "12px",
  border: `2px solid #0F766E20`,
};

const medicationBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 16px",
  backgroundColor: "#0F766E",
  color: "white",
  fontSize: "13px",
  fontWeight: "600",
  borderRadius: "8px",
  marginTop: "8px",
};

const medicationHeaderStyle: React.CSSProperties = {
  backgroundColor: "#0F766E",
  color: "white",
  borderRadius: "8px 8px 0 0",
  padding: "16px 20px",
  margin: "0 0 24px 0",
};

const warningBoxStyle: React.CSSProperties = {
  backgroundColor: colors.background.danger,
  borderLeft: `4px solid ${colors.danger}`,
  borderRadius: "0 8px 8px 0",
  padding: "20px",
};

const checkboxStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  border: `2px solid ${colors.danger}`,
  borderRadius: "3px",
  marginRight: "12px",
  display: "inline-block",
  verticalAlign: "top",
  marginTop: "2px",
};

const homeCareBoxStyle: React.CSSProperties = {
  backgroundColor: colors.background.muted,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  padding: "20px",
};

const followUpBoxStyle: React.CSSProperties = {
  backgroundColor: colors.background.info,
  borderRadius: "8px",
  padding: "16px 20px",
};

const footerStyle: React.CSSProperties = {
  padding: "20px 32px",
  backgroundColor: colors.background.muted,
  borderTop: `1px solid ${colors.border}`,
};

const bottomFooterStyle: React.CSSProperties = {
  padding: "12px 32px",
  backgroundColor: colors.background.page,
  borderTop: `1px solid ${colors.border}`,
};

export function DischargeEmailTemplate({
  patientName,
  ownerName,
  structuredContent,
  dischargeSummaryContent,
  date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  clinicName,
  clinicPhone,
  clinicEmail: _clinicEmail,
  primaryColor = colors.primary,
  logoUrl,
}: DischargeEmailProps) {
  const hasStructuredContent =
    structuredContent !== null && structuredContent !== undefined;

  // Build visit tags from diagnosis + treatments
  const visitTags: string[] = [];
  if (hasStructuredContent) {
    if (structuredContent.diagnosis) {
      visitTags.push(structuredContent.diagnosis);
    }
    if (structuredContent.treatmentsToday) {
      visitTags.push(...structuredContent.treatmentsToday.slice(0, 3));
    }
  }

  // Get warning signs (extracted or curated fallback)
  // ONLY show warning signs for truly serious/high-risk cases
  const shouldShowWarningSigns =
    hasStructuredContent &&
    structuredContent.caseType &&
    // ONLY show for surgery, emergency, and specific serious conditions
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

  // Check for home care content
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

  // Check if follow-up is explicitly mentioned
  const hasExplicitFollowUp =
    hasStructuredContent &&
    (structuredContent.followUp?.required ??
      (structuredContent.notes &&
        (structuredContent.notes.toLowerCase().includes("follow") ||
          structuredContent.notes.toLowerCase().includes("recheck") ||
          structuredContent.notes.toLowerCase().includes("return") ||
          structuredContent.notes.toLowerCase().includes("schedule"))));

  // Get owner's first name for greeting
  const ownerFirstName = ownerName?.split(" ")[0];

  // Use appointment summary if available, otherwise fall back to generic greeting
  const appointmentSummary = hasStructuredContent
    ? structuredContent.appointmentSummary
    : undefined;

  const greeting = ownerFirstName ? `Hi ${ownerFirstName},` : "Hello,";

  // Fallback intro text if no appointment summary
  const fallbackIntro = `Here's everything you need to know about ${patientName}'s visit.`;

  return (
    <Html>
      <Head />
      <Preview>
        {patientName}&apos;s visit summary from {clinicName ?? "your vet"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* ============ HEADER ============ */}
            <Section style={headerStyle}>
              {/* Clinic branding row */}
              <Row>
                <Column>
                  {logoUrl ? (
                    <Img
                      src={logoUrl}
                      alt={clinicName ?? "Clinic Logo"}
                      height="44"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <Text
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#134E4A",
                      }}
                    >
                      {clinicName ?? "Your Veterinary Clinic"}
                    </Text>
                  )}
                </Column>
                <Column align="right">
                  <Text
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "rgba(19, 78, 74, 0.6)",
                    }}
                  >
                    {date}
                  </Text>
                </Column>
              </Row>

              {/* Pet name title */}
              <Heading
                style={{
                  margin: "20px 0 8px",
                  fontSize: "26px",
                  fontWeight: "700",
                  color: "#134E4A",
                }}
              >
                {patientName}&apos;s Visit Summary
              </Heading>

              {/* Greeting text */}
              <Text
                style={{
                  margin: "0 0 4px",
                  fontSize: "15px",
                  color: "rgba(19, 78, 74, 0.75)",
                  lineHeight: "1.5",
                }}
              >
                {greeting}
              </Text>

              {/* Appointment Summary or Fallback Intro */}
              <Text
                style={{
                  margin: "0 0 16px",
                  fontSize: "15px",
                  color: "rgba(19, 78, 74, 0.85)",
                  lineHeight: "1.6",
                }}
              >
                {appointmentSummary ?? fallbackIntro}
              </Text>

              {/* Visit highlight tags */}
              {visitTags.length > 0 && (
                <Section>
                  {visitTags.slice(0, 4).map((tag, index) => (
                    <span key={index} style={tagStyle}>
                      {tag}
                    </span>
                  ))}
                </Section>
              )}
            </Section>

            {/* ============ MAIN CONTENT ============ */}
            <Section style={{ padding: "28px 0" }}>
              {hasStructuredContent ? (
                <>
                  {/* -------- MEDICATIONS -------- */}
                  {takeHomeMeds.length > 0 && (
                    <Section style={sectionStyle}>
                      {/* Medication Header */}
                      <Section style={medicationHeaderStyle}>
                        <Text
                          style={{
                            margin: "0 0 6px 0",
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "white",
                          }}
                        >
                          💊 {patientName}&apos;s Medications
                        </Text>
                        <Text
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.9)",
                          }}
                        >
                          Please give these medications as directed:
                        </Text>
                      </Section>

                      {/* Medication List */}
                      {takeHomeMeds.map((med, index) => (
                        <Section key={index} style={medicationRowStyle}>
                          <Row>
                            <Column>
                              {/* Medication Name - Large and prominent */}
                              <Text
                                style={{
                                  margin: "0 0 8px 0",
                                  fontSize: "20px",
                                  fontWeight: "700",
                                  color: "#0F766E",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {med.name}
                              </Text>

                              {/* Dosage and Details - Formatted like "24mg - 4 tablets total" */}
                              {(med.dosage ??
                                med.frequency ??
                                med.duration ??
                                med.totalQuantity) && (
                                <Text
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "17px",
                                    fontWeight: "600",
                                    color: "#374151",
                                  }}
                                >
                                  {/* Primary dosage info like "24mg - 4 tablets total" */}
                                  {med.dosage && med.totalQuantity
                                    ? `${med.dosage} - ${med.totalQuantity}`
                                    : [med.dosage, med.totalQuantity]
                                        .filter(Boolean)
                                        .join(" - ")}
                                </Text>
                              )}

                              {/* Frequency and Duration */}
                              {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                              {(med.frequency || med.duration) && (
                                <Text
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "15px",
                                    fontWeight: "500",
                                    color: "#6B7280",
                                  }}
                                >
                                  {[med.frequency, med.duration]
                                    .filter(Boolean)
                                    .join(" for ")}
                                </Text>
                              )}

                              {/* Medication Purpose */}
                              {med.purpose && (
                                <Text
                                  style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "14px",
                                    fontStyle: "italic",
                                    color: "#059669",
                                  }}
                                >
                                  {med.purpose}
                                </Text>
                              )}

                              {/* Instructions Badge */}
                              {med.instructions && (
                                <Text style={{ margin: 0 }}>
                                  <span style={medicationBadgeStyle}>
                                    💡 {med.instructions}
                                  </span>
                                </Text>
                              )}
                            </Column>
                          </Row>
                        </Section>
                      ))}
                    </Section>
                  )}

                  {/* -------- HOME CARE -------- */}
                  {hasHomeCare && (
                    <Section style={sectionStyle}>
                      <Text style={sectionTitleStyle}>
                        Caring for {patientName} at Home
                      </Text>
                      <Section style={homeCareBoxStyle}>
                        {structuredContent.homeCare!.activity && (
                          <Section style={{ marginBottom: "16px" }}>
                            <Text
                              style={{
                                margin: "0 0 4px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: colors.text.primary,
                              }}
                            >
                              Activity
                            </Text>
                            <Text
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: colors.text.secondary,
                                lineHeight: "1.5",
                              }}
                            >
                              {structuredContent.homeCare!.activity}
                            </Text>
                          </Section>
                        )}

                        {structuredContent.homeCare!.diet && (
                          <Section style={{ marginBottom: "16px" }}>
                            <Text
                              style={{
                                margin: "0 0 4px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: colors.text.primary,
                              }}
                            >
                              Diet
                            </Text>
                            <Text
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: colors.text.secondary,
                                lineHeight: "1.5",
                              }}
                            >
                              {structuredContent.homeCare!.diet}
                            </Text>
                          </Section>
                        )}

                        {structuredContent.homeCare!.woundCare && (
                          <Section style={{ marginBottom: "16px" }}>
                            <Text
                              style={{
                                margin: "0 0 4px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: colors.text.primary,
                              }}
                            >
                              Wound Care
                            </Text>
                            <Text
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: colors.text.secondary,
                                lineHeight: "1.5",
                              }}
                            >
                              {structuredContent.homeCare!.woundCare}
                            </Text>
                          </Section>
                        )}

                        {structuredContent.homeCare!.monitoring &&
                          structuredContent.homeCare!.monitoring.length > 0 && (
                            <Section>
                              <Text
                                style={{
                                  margin: "0 0 8px",
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: colors.text.primary,
                                }}
                              >
                                Things to Monitor
                              </Text>
                              {structuredContent.homeCare!.monitoring.map(
                                (item, index) => (
                                  <Text
                                    key={index}
                                    style={{
                                      margin: "0 0 4px",
                                      fontSize: "14px",
                                      color: colors.text.secondary,
                                      lineHeight: "1.5",
                                    }}
                                  >
                                    • {item}
                                  </Text>
                                ),
                              )}
                            </Section>
                          )}
                      </Section>
                    </Section>
                  )}

                  {/* -------- WARNING SIGNS -------- */}
                  {warningSigns.length > 0 && (
                    <Section style={sectionStyle}>
                      <Text style={sectionTitleStyle}>What to Watch For</Text>
                      <Section style={warningBoxStyle}>
                        <Text
                          style={{
                            margin: "0 0 16px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.danger,
                          }}
                        >
                          Contact us right away if you notice any of these:
                        </Text>
                        {warningSigns.map((sign, index) => (
                          <Row key={index} style={{ marginBottom: "10px" }}>
                            <Column
                              style={{ width: "28px", verticalAlign: "top" }}
                            >
                              <div style={checkboxStyle} />
                            </Column>
                            <Column>
                              <Text
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  color: colors.danger,
                                  lineHeight: "1.5",
                                }}
                              >
                                {sign}
                              </Text>
                            </Column>
                          </Row>
                        ))}
                        {clinicPhone && (
                          <Text
                            style={{
                              margin: "16px 0 0",
                              fontSize: "13px",
                              color: colors.danger,
                            }}
                          >
                            Call us immediately at:{" "}
                            <Link
                              href={`tel:${clinicPhone.replace(/\D/g, "")}`}
                              style={{
                                color: colors.danger,
                                fontWeight: "600",
                                textDecoration: "none",
                              }}
                            >
                              {clinicPhone}
                            </Link>
                          </Text>
                        )}
                      </Section>
                    </Section>
                  )}

                  {/* -------- FOLLOW-UP -------- */}
                  {hasExplicitFollowUp && (
                    <Section style={sectionStyle}>
                      <Text style={sectionTitleStyle}>What&apos;s Next</Text>
                      <Section style={followUpBoxStyle}>
                        <Row>
                          <Column
                            style={{ width: "32px", verticalAlign: "top" }}
                          >
                            <Text style={{ margin: 0, fontSize: "20px" }}>
                              📅
                            </Text>
                          </Column>
                          <Column style={{ paddingLeft: "12px" }}>
                            <Text
                              style={{
                                margin: "0 0 2px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: colors.text.primary,
                              }}
                            >
                              Follow-up Appointment
                            </Text>
                            <Text
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: colors.text.secondary,
                              }}
                            >
                              {structuredContent.followUp?.date
                                ? `We'd like to see ${patientName} again ${structuredContent.followUp.date}`
                                : `Please call us to schedule a follow-up`}
                              {structuredContent.followUp?.reason &&
                                ` for ${structuredContent.followUp.reason}`}
                              .
                            </Text>
                          </Column>
                        </Row>
                      </Section>
                    </Section>
                  )}

                  {/* -------- NOTES -------- */}
                  {structuredContent.notes &&
                    // Filter out clinic-only information
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
                      .includes("client educated") && (
                      <Section style={sectionStyle}>
                        <Section
                          style={{
                            backgroundColor: colors.background.warning,
                            borderLeft: `4px solid ${colors.warning}`,
                            borderRadius: "0 8px 8px 0",
                            padding: "16px 20px",
                          }}
                        >
                          <Text
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#92400E",
                              lineHeight: "1.6",
                            }}
                          >
                            <strong>Important:</strong>{" "}
                            {structuredContent.notes}
                          </Text>
                        </Section>
                      </Section>
                    )}

                  {/* -------- QUESTIONS BOX (always appears) -------- */}
                  <Section style={sectionStyle}>
                    <Section style={homeCareBoxStyle}>
                      <Text
                        style={{
                          margin: "0 0 8px",
                          fontSize: "14px",
                          color: colors.text.secondary,
                          textAlign: "center" as const,
                          lineHeight: "1.5",
                        }}
                      >
                        Questions about {patientName}&apos;s care? We&apos;re
                        here to help — just give us a call.
                      </Text>
                      <Text
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: "600",
                          color: primaryColor,
                          textAlign: "center" as const,
                        }}
                      >
                        <Link
                          href={`tel:${clinicPhone?.replace(/\D/g, "") ?? ""}`}
                          style={{
                            color: primaryColor,
                            textDecoration: "none",
                          }}
                        >
                          {clinicPhone ?? "(408) 258-2735"}
                        </Link>
                      </Text>
                    </Section>
                  </Section>
                </>
              ) : dischargeSummaryContent ? (
                /* Plaintext fallback */
                <Section style={sectionStyle}>
                  <Text
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: "15px",
                      lineHeight: "1.7",
                      color: colors.text.primary,
                    }}
                  >
                    {dischargeSummaryContent}
                  </Text>
                </Section>
              ) : (
                <Section style={sectionStyle}>
                  <Text
                    style={{
                      color: colors.text.muted,
                      fontStyle: "italic",
                      textAlign: "center" as const,
                    }}
                  >
                    No discharge instructions available.
                  </Text>
                </Section>
              )}
            </Section>

            <Hr style={{ borderColor: colors.border, margin: 0 }} />

            {/* ============ FOOTER ============ */}
            <Section style={footerStyle}>
              <Text
                style={{
                  margin: "0 0 4px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.text.primary,
                  textAlign: "center" as const,
                }}
              >
                Sent with care from {clinicName ?? "your veterinary clinic"}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: colors.text.secondary,
                  textAlign: "center" as const,
                  lineHeight: "1.4",
                }}
              >
                2810 Alum Rock Ave, San Jose, CA 95127
              </Text>
            </Section>

            {/* ============ BOTTOM FOOTER ============ */}
            <Section style={bottomFooterStyle}>
              <Text
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: colors.text.muted,
                  textAlign: "center" as const,
                }}
              >
                Powered by <strong>OdisAI</strong>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
