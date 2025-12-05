import React from "react";
import type { StructuredDischargeSummary } from "~/lib/validators/discharge-summary";

/**
 * Discharge Email Template Component - Clinical Redesign
 *
 * A clean, professional veterinary discharge email template.
 * Optimized for email client compatibility with table-based layouts.
 *
 * Design principles:
 * - Clean, clinical aesthetic with generous whitespace
 * - Table-based layout for email client compatibility
 * - Professional tone with accessible language
 * - Focus on take-home medications and actionable instructions
 * - No excessive emojis - subtle, professional icons only
 */

export interface DischargeEmailProps {
  // Patient info
  patientName: string;

  // Content - prefer structured, fall back to plaintext
  structuredContent?: StructuredDischargeSummary | null;
  dischargeSummaryContent?: string; // Plaintext fallback

  // Optional patient details
  date?: string;
  breed?: string | null;
  species?: string | null;

  // Clinic info
  clinicName?: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;

  // Branding customization
  primaryColor?: string;
  logoUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
}

// Clean clinical color palette
const colors = {
  primary: "#3B82F6", // Softer blue
  danger: "#EF4444", // Clear red for warnings
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    muted: "#9CA3AF",
  },
  background: {
    main: "#FFFFFF",
    card: "#F9FAFB",
    accent: "#F3F4F6",
  },
  border: "#E5E7EB",
};

// Font stack with Inter
const fontStack =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * General recovery tips - shown when no specific home care instructions
 */
const generalRecoveryTips = [
  "Ensure fresh water is always available",
  "Monitor appetite and eating habits",
  "Observe bathroom habits for any changes",
  "Keep your pet calm and comfortable",
  "Note any changes in behavior or energy level",
];

/**
 * Section header component - clean, no emojis
 */
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border={0}
      style={{ width: "100%", marginBottom: "16px" }}
    >
      <tbody>
        <tr>
          <td>
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: colors.text.primary,
                fontFamily: fontStack,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: colors.text.secondary,
                  fontFamily: fontStack,
                }}
              >
                {subtitle}
              </p>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Icon row component - table-based for email compatibility
 */
function IconRow({
  icon,
  text,
  textColor = colors.text.primary,
  fontWeight = "400",
}: {
  icon: string;
  text: string;
  textColor?: string;
  fontWeight?: string;
}) {
  return (
    <table cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%" }}>
      <tbody>
        <tr>
          <td
            style={{
              width: "24px",
              verticalAlign: "top",
              paddingTop: "2px",
              paddingRight: "12px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{icon}</span>
          </td>
          <td
            style={{
              verticalAlign: "top",
              fontSize: "15px",
              lineHeight: "1.5",
              color: textColor,
              fontWeight,
              fontFamily: fontStack,
            }}
          >
            {text}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Render structured content with clinical styling
 */
function StructuredContent({
  content,
  clinicPhone,
  primaryColor,
  patientName,
}: {
  content: StructuredDischargeSummary;
  clinicPhone?: string | null;
  primaryColor: string;
  patientName: string;
}) {
  const hasHomeCare =
    content.homeCare &&
    (Boolean(content.homeCare.activity) ||
      Boolean(content.homeCare.diet) ||
      Boolean(content.homeCare.woundCare) ||
      (content.homeCare.monitoring && content.homeCare.monitoring.length > 0));

  return (
    <>
      {/* Visit Summary - Simple text block */}
      {content.visitSummary && (
        <div style={{ marginBottom: "28px" }}>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: "1.7",
              color: colors.text.primary,
              fontFamily: fontStack,
            }}
          >
            {content.visitSummary}
          </p>
        </div>
      )}

      {/* Prescribed Medications - Take-home only */}
      {content.medications && content.medications.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <SectionHeader
            title="Prescribed Medications"
            subtitle="Take-home medications to give at home"
          />
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            style={{
              width: "100%",
              backgroundColor: colors.background.main,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              borderCollapse: "separate",
              overflow: "hidden",
            }}
          >
            <tbody>
              {content.medications.map((med, index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding: "16px 20px",
                      borderBottom:
                        index < content.medications!.length - 1
                          ? `1px solid ${colors.border}`
                          : "none",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: colors.text.primary,
                        fontFamily: fontStack,
                      }}
                    >
                      {med.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: colors.text.secondary,
                        fontFamily: fontStack,
                        lineHeight: "1.5",
                      }}
                    >
                      {[
                        med.dosage,
                        med.frequency,
                        med.duration && `for ${med.duration}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {med.instructions && (
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          fontSize: "14px",
                          color: colors.text.secondary,
                          fontFamily: fontStack,
                          fontStyle: "italic",
                          lineHeight: "1.5",
                        }}
                      >
                        Note: {med.instructions}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* When to Contact Us - Warning Signs */}
      {content.warningSigns && content.warningSigns.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <SectionHeader title="When to Contact Us" />
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            style={{
              width: "100%",
              backgroundColor: "#FEF2F2",
              borderLeft: `4px solid ${colors.danger}`,
              borderRadius: "0 8px 8px 0",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "20px" }}>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#991B1B",
                      fontFamily: fontStack,
                    }}
                  >
                    Please contact us immediately if you notice:
                  </p>
                  <table
                    cellPadding="0"
                    cellSpacing="0"
                    border={0}
                    style={{ width: "100%" }}
                  >
                    <tbody>
                      {content.warningSigns.map((sign, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              paddingBottom:
                                index < content.warningSigns!.length - 1
                                  ? "8px"
                                  : 0,
                            }}
                          >
                            <IconRow
                              icon="•"
                              text={sign}
                              textColor="#991B1B"
                              fontWeight="500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Call button */}
                  {clinicPhone && (
                    <table
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                      style={{ width: "100%", marginTop: "16px" }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ textAlign: "center" }}>
                            <a
                              href={`tel:${clinicPhone.replace(/\D/g, "")}`}
                              style={{
                                display: "inline-block",
                                padding: "12px 24px",
                                backgroundColor: colors.danger,
                                color: "#FFFFFF",
                                textDecoration: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "600",
                                fontFamily: fontStack,
                              }}
                            >
                              Call {clinicPhone}
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Care Instructions - Home Care or General Tips */}
      <div style={{ marginBottom: "28px" }}>
        <SectionHeader title="Care Instructions" />
        <table
          cellPadding="0"
          cellSpacing="0"
          border={0}
          style={{
            width: "100%",
            backgroundColor: colors.background.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "20px" }}>
                {hasHomeCare ? (
                  <>
                    {content.homeCare!.activity && (
                      <div style={{ marginBottom: "16px" }}>
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.text.primary,
                            fontFamily: fontStack,
                          }}
                        >
                          Activity
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: colors.text.secondary,
                            fontFamily: fontStack,
                            lineHeight: "1.5",
                          }}
                        >
                          {content.homeCare!.activity}
                        </p>
                      </div>
                    )}

                    {content.homeCare!.diet && (
                      <div style={{ marginBottom: "16px" }}>
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.text.primary,
                            fontFamily: fontStack,
                          }}
                        >
                          Diet
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: colors.text.secondary,
                            fontFamily: fontStack,
                            lineHeight: "1.5",
                          }}
                        >
                          {content.homeCare!.diet}
                        </p>
                      </div>
                    )}

                    {content.homeCare!.woundCare && (
                      <div style={{ marginBottom: "16px" }}>
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.text.primary,
                            fontFamily: fontStack,
                          }}
                        >
                          Wound Care
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: colors.text.secondary,
                            fontFamily: fontStack,
                            lineHeight: "1.5",
                          }}
                        >
                          {content.homeCare!.woundCare}
                        </p>
                      </div>
                    )}

                    {content.homeCare!.monitoring &&
                      content.homeCare!.monitoring.length > 0 && (
                        <div>
                          <p
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: colors.text.primary,
                              fontFamily: fontStack,
                            }}
                          >
                            Monitor For
                          </p>
                          <table
                            cellPadding="0"
                            cellSpacing="0"
                            border={0}
                            style={{ width: "100%" }}
                          >
                            <tbody>
                              {content.homeCare!.monitoring.map(
                                (item, index) => (
                                  <tr key={index}>
                                    <td style={{ paddingBottom: "4px" }}>
                                      <p
                                        style={{
                                          margin: 0,
                                          fontSize: "14px",
                                          color: colors.text.secondary,
                                          fontFamily: fontStack,
                                          lineHeight: "1.5",
                                        }}
                                      >
                                        • {item}
                                      </p>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </>
                ) : (
                  /* General Recovery Tips when no specific home care */
                  <>
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "14px",
                        color: colors.text.secondary,
                        fontFamily: fontStack,
                        lineHeight: "1.5",
                      }}
                    >
                      To support {patientName}&apos;s recovery:
                    </p>
                    <table
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                      style={{ width: "100%" }}
                    >
                      <tbody>
                        {generalRecoveryTips.map((tip, index) => (
                          <tr key={index}>
                            <td style={{ paddingBottom: "6px" }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  color: colors.text.secondary,
                                  fontFamily: fontStack,
                                  lineHeight: "1.5",
                                }}
                              >
                                • {tip}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Next Steps - Follow-up */}
      {content.followUp && content.followUp.required && (
        <div style={{ marginBottom: "28px" }}>
          <SectionHeader title="Next Steps" />
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            style={{
              width: "100%",
              backgroundColor: "#EFF6FF",
              border: `1px solid ${primaryColor}30`,
              borderRadius: "8px",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "16px 20px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      lineHeight: "1.6",
                      color: colors.text.primary,
                      fontFamily: fontStack,
                    }}
                  >
                    {content.followUp.date
                      ? `Please schedule a follow-up appointment ${content.followUp.date}`
                      : "Please schedule a follow-up appointment"}
                    {content.followUp.reason &&
                      ` for ${content.followUp.reason}`}
                    .
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Additional Notes */}
      {content.notes && (
        <div style={{ marginBottom: "28px" }}>
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            style={{
              width: "100%",
              backgroundColor: colors.background.accent,
              borderRadius: "8px",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "16px 20px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: colors.text.secondary,
                      fontFamily: fontStack,
                      lineHeight: "1.6",
                    }}
                  >
                    <strong>Note:</strong> {content.notes}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/**
 * Render plaintext content (fallback)
 */
function PlaintextContent({
  content,
  patientName,
}: {
  content: string;
  patientName: string;
}) {
  return (
    <>
      <div
        style={{
          whiteSpace: "pre-wrap",
          fontSize: "15px",
          lineHeight: "1.7",
          color: colors.text.primary,
          fontFamily: fontStack,
          marginBottom: "28px",
        }}
      >
        {content}
      </div>

      {/* General Recovery Tips for plaintext */}
      <div style={{ marginBottom: "28px" }}>
        <SectionHeader title="Care Instructions" />
        <table
          cellPadding="0"
          cellSpacing="0"
          border={0}
          style={{
            width: "100%",
            backgroundColor: colors.background.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "20px" }}>
                <p
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    color: colors.text.secondary,
                    fontFamily: fontStack,
                    lineHeight: "1.5",
                  }}
                >
                  To support {patientName}&apos;s recovery:
                </p>
                <table
                  cellPadding="0"
                  cellSpacing="0"
                  border={0}
                  style={{ width: "100%" }}
                >
                  <tbody>
                    {generalRecoveryTips.map((tip, index) => (
                      <tr key={index}>
                        <td style={{ paddingBottom: "6px" }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: colors.text.secondary,
                              fontFamily: fontStack,
                              lineHeight: "1.5",
                            }}
                          >
                            • {tip}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Generic contact reminder */}
      <table
        cellPadding="0"
        cellSpacing="0"
        border={0}
        style={{
          width: "100%",
          backgroundColor: "#FEF3C7",
          borderLeft: `4px solid #D97706`,
          borderRadius: "0 8px 8px 0",
          marginBottom: "28px",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "16px 20px" }}>
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontWeight: "600",
                  color: "#92400E",
                  fontSize: "14px",
                  fontFamily: fontStack,
                }}
              >
                Important
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#92400E",
                  fontFamily: fontStack,
                  lineHeight: "1.5",
                }}
              >
                If you notice any concerning symptoms or have questions about{" "}
                {patientName}&apos;s recovery, please contact us immediately.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

/**
 * Main discharge email template component - Clinical Redesign
 */
export function DischargeEmailTemplate({
  patientName,
  structuredContent,
  dischargeSummaryContent,
  date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  breed,
  species,
  clinicName,
  clinicPhone,
  clinicEmail,
  primaryColor = colors.primary,
  logoUrl,
  headerText,
  footerText,
}: DischargeEmailProps) {
  const hasStructuredContent =
    structuredContent !== null && structuredContent !== undefined;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: fontStack,
          backgroundColor: colors.background.main,
          lineHeight: "1.6",
        }}
      >
        {/* Full-width container */}
        <table
          cellPadding="0"
          cellSpacing="0"
          border={0}
          style={{
            width: "100%",
            backgroundColor: colors.background.main,
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "24px 16px" }}>
                {/* Content wrapper - max width on desktop */}
                <table
                  cellPadding="0"
                  cellSpacing="0"
                  border={0}
                  style={{
                    maxWidth: "600px",
                    width: "100%",
                    margin: "0 auto",
                    backgroundColor: colors.background.main,
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <tbody>
                    {/* Header - Logo with title inline */}
                    <tr>
                      <td
                        style={{
                          padding: "20px 32px",
                          borderBottom: `1px solid ${colors.border}`,
                          backgroundColor: colors.background.card,
                        }}
                      >
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          border={0}
                          style={{ width: "100%" }}
                        >
                          <tbody>
                            <tr>
                              {/* Logo and title side by side */}
                              {logoUrl && (
                                <td
                                  style={{
                                    width: "auto",
                                    paddingRight: "16px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={logoUrl}
                                    alt={clinicName ?? "Clinic Logo"}
                                    style={{
                                      height: "40px",
                                      width: "auto",
                                      maxWidth: "160px",
                                      display: "block",
                                    }}
                                  />
                                </td>
                              )}
                              <td
                                style={{
                                  verticalAlign: "middle",
                                }}
                              >
                                <h1
                                  style={{
                                    color: colors.text.primary,
                                    margin: 0,
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    fontFamily: fontStack,
                                  }}
                                >
                                  Discharge Summary
                                </h1>
                                {clinicName && !logoUrl && (
                                  <p
                                    style={{
                                      margin: "2px 0 0 0",
                                      fontSize: "13px",
                                      color: colors.text.secondary,
                                      fontFamily: fontStack,
                                    }}
                                  >
                                    {clinicName}
                                  </p>
                                )}
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                  verticalAlign: "middle",
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: colors.text.muted,
                                    fontFamily: fontStack,
                                  }}
                                >
                                  {date}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Patient Info Bar */}
                    <tr>
                      <td
                        style={{
                          padding: "20px 32px",
                          backgroundColor: primaryColor,
                        }}
                      >
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          border={0}
                          style={{ width: "100%" }}
                        >
                          <tbody>
                            <tr>
                              <td>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "22px",
                                    fontWeight: "600",
                                    color: "#FFFFFF",
                                    fontFamily: fontStack,
                                  }}
                                >
                                  {patientName}
                                </p>
                                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                                {(species || breed) && (
                                  <p
                                    style={{
                                      margin: "4px 0 0 0",
                                      fontSize: "14px",
                                      color: "rgba(255, 255, 255, 0.85)",
                                      fontFamily: fontStack,
                                    }}
                                  >
                                    {[species, breed]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Main Content Area */}
                    <tr>
                      <td style={{ padding: "32px" }}>
                        {/* Introduction text */}
                        {headerText && (
                          <p
                            style={{
                              margin: "0 0 24px 0",
                              fontSize: "15px",
                              color: colors.text.secondary,
                              fontFamily: fontStack,
                              lineHeight: "1.6",
                            }}
                          >
                            {headerText}
                          </p>
                        )}

                        {/* Content - Structured or Plaintext */}
                        {hasStructuredContent ? (
                          <StructuredContent
                            content={structuredContent}
                            clinicPhone={clinicPhone}
                            primaryColor={primaryColor}
                            patientName={patientName}
                          />
                        ) : dischargeSummaryContent ? (
                          <PlaintextContent
                            content={dischargeSummaryContent}
                            patientName={patientName}
                          />
                        ) : (
                          <p
                            style={{
                              color: colors.text.muted,
                              fontStyle: "italic",
                              textAlign: "center",
                              fontFamily: fontStack,
                            }}
                          >
                            No discharge instructions available.
                          </p>
                        )}
                      </td>
                    </tr>

                    {/* Contact Info Footer */}
                    {(clinicPhone ?? clinicEmail) && (
                      <tr>
                        <td
                          style={{
                            padding: "24px 32px",
                            backgroundColor: colors.background.card,
                            borderTop: `1px solid ${colors.border}`,
                          }}
                        >
                          <table
                            cellPadding="0"
                            cellSpacing="0"
                            border={0}
                            style={{ width: "100%" }}
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <p
                                    style={{
                                      margin: "0 0 8px 0",
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      color: colors.text.primary,
                                      fontFamily: fontStack,
                                    }}
                                  >
                                    Questions? Contact us:
                                  </p>
                                  {clinicPhone && (
                                    <p
                                      style={{
                                        margin: "4px 0",
                                        fontSize: "14px",
                                        fontFamily: fontStack,
                                      }}
                                    >
                                      <a
                                        href={`tel:${clinicPhone.replace(/\D/g, "")}`}
                                        style={{
                                          color: primaryColor,
                                          textDecoration: "none",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {clinicPhone}
                                      </a>
                                    </p>
                                  )}
                                  {clinicEmail && (
                                    <p
                                      style={{
                                        margin: "4px 0",
                                        fontSize: "14px",
                                        fontFamily: fontStack,
                                      }}
                                    >
                                      <a
                                        href={`mailto:${clinicEmail}`}
                                        style={{
                                          color: colors.text.secondary,
                                          textDecoration: "none",
                                        }}
                                      >
                                        {clinicEmail}
                                      </a>
                                    </p>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: "16px 32px",
                          backgroundColor: colors.background.accent,
                          borderTop: `1px solid ${colors.border}`,
                        }}
                      >
                        {footerText ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: colors.text.muted,
                              fontFamily: fontStack,
                              textAlign: "center",
                            }}
                          >
                            {footerText}
                          </p>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: colors.text.muted,
                              fontFamily: fontStack,
                              textAlign: "center",
                            }}
                          >
                            This discharge summary was sent on behalf of{" "}
                            {clinicName ?? "your veterinary clinic"}
                          </p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
