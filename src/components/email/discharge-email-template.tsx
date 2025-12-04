import React from "react";
import type { StructuredDischargeSummary } from "~/lib/validators/discharge-summary";

/**
 * Discharge Email Template Component
 *
 * A beautiful, structured email template for discharge summaries.
 * Supports both structured JSON content (preferred) and plaintext fallback.
 *
 * Design principles:
 * - Clean, scannable sections with color coding
 * - Pet-owner friendly language
 * - Mobile-responsive
 * - Prominent warning signs
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

// Color palette for sections
const colors = {
  primary: "#2563EB", // Blue
  success: "#059669", // Green
  warning: "#D97706", // Amber
  danger: "#DC2626", // Red
  muted: "#6B7280", // Gray
  background: "#F9FAFB",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
};

/**
 * Section header component for consistent styling
 */
function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: string;
  title: string;
  color: string;
}) {
  return (
    <tr>
      <td
        style={{
          padding: "12px 16px",
          backgroundColor: color,
          borderRadius: "6px 6px 0 0",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "600",
            color: "#FFFFFF",
          }}
        >
          {icon} {title}
        </p>
      </td>
    </tr>
  );
}

/**
 * Render structured content with beautiful formatting
 */
function StructuredContent({
  content,
  patientName: _patientName,
}: {
  content: StructuredDischargeSummary;
  patientName: string;
}) {
  return (
    <>
      {/* Visit Summary */}
      {content.visitSummary && (
        <table
          role="presentation"
          style={{
            width: "100%",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <SectionHeader
              icon="📋"
              title="Visit Summary"
              color={colors.primary}
            />
            <tr>
              <td
                style={{
                  padding: "16px",
                  backgroundColor: "#EFF6FF",
                  borderRadius: "0 0 6px 6px",
                  border: `1px solid ${colors.border}`,
                  borderTop: "none",
                }}
              >
                <p style={{ margin: 0, fontSize: "15px", color: "#1E40AF" }}>
                  {content.visitSummary}
                </p>
                {content.diagnosis && (
                  <p
                    style={{
                      margin: "10px 0 0 0",
                      fontSize: "14px",
                      color: "#3B82F6",
                    }}
                  >
                    <strong>Diagnosis:</strong> {content.diagnosis}
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Treatments Today */}
      {content.treatmentsToday && content.treatmentsToday.length > 0 && (
        <table
          role="presentation"
          style={{
            width: "100%",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <SectionHeader
              icon="✅"
              title="What We Did Today"
              color={colors.success}
            />
            <tr>
              <td
                style={{
                  padding: "16px",
                  backgroundColor: "#ECFDF5",
                  borderRadius: "0 0 6px 6px",
                  border: `1px solid ${colors.border}`,
                  borderTop: "none",
                }}
              >
                {content.treatmentsToday.map((treatment, index) => (
                  <p
                    key={index}
                    style={{
                      margin: index === 0 ? 0 : "8px 0 0 0",
                      fontSize: "14px",
                      color: "#065F46",
                    }}
                  >
                    • {treatment}
                  </p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Medications - Important section */}
      {content.medications && content.medications.length > 0 && (
        <table
          role="presentation"
          style={{
            width: "100%",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <SectionHeader
              icon="💊"
              title="Medications"
              color={colors.primary}
            />
            <tr>
              <td
                style={{
                  padding: "16px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "0 0 6px 6px",
                  border: `1px solid ${colors.border}`,
                  borderTop: "none",
                }}
              >
                {content.medications.map((med, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      backgroundColor: index % 2 === 0 ? "#F9FAFB" : "#FFFFFF",
                      borderRadius: "4px",
                      marginBottom:
                        index < content.medications!.length - 1 ? "8px" : 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#1F2937",
                      }}
                    >
                      {med.name}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: "#4B5563",
                      }}
                    >
                      {[
                        med.dosage,
                        med.frequency,
                        med.duration && `for ${med.duration}`,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    {med.instructions && (
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "13px",
                          color: "#6B7280",
                          fontStyle: "italic",
                        }}
                      >
                        📝 {med.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Home Care Instructions */}
      {content.homeCare &&
        (Boolean(content.homeCare.activity) ||
          Boolean(content.homeCare.diet) ||
          Boolean(content.homeCare.woundCare) ||
          (content.homeCare.monitoring &&
            content.homeCare.monitoring.length > 0)) && (
          <table
            role="presentation"
            style={{
              width: "100%",
              marginBottom: "20px",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <SectionHeader
                icon="🏠"
                title="Home Care"
                color={colors.success}
              />
              <tr>
                <td
                  style={{
                    padding: "16px",
                    backgroundColor: "#ECFDF5",
                    borderRadius: "0 0 6px 6px",
                    border: `1px solid ${colors.border}`,
                    borderTop: "none",
                  }}
                >
                  {content.homeCare.activity && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#065F46",
                      }}
                    >
                      <strong>🏃 Activity:</strong> {content.homeCare.activity}
                    </p>
                  )}
                  {content.homeCare.diet && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#065F46",
                      }}
                    >
                      <strong>🍽️ Diet:</strong> {content.homeCare.diet}
                    </p>
                  )}
                  {content.homeCare.woundCare && (
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#065F46",
                      }}
                    >
                      <strong>🩹 Wound Care:</strong>{" "}
                      {content.homeCare.woundCare}
                    </p>
                  )}
                  {content.homeCare.monitoring &&
                    content.homeCare.monitoring.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#065F46",
                          }}
                        >
                          👀 Watch for:
                        </p>
                        {content.homeCare.monitoring.map((item, index) => (
                          <p
                            key={index}
                            style={{
                              margin: "4px 0 0 12px",
                              fontSize: "14px",
                              color: "#065F46",
                            }}
                          >
                            • {item}
                          </p>
                        ))}
                      </div>
                    )}
                </td>
              </tr>
            </tbody>
          </table>
        )}

      {/* Follow-up */}
      {content.followUp && content.followUp.required && (
        <table
          role="presentation"
          style={{
            width: "100%",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <SectionHeader
              icon="📅"
              title="Follow-Up Appointment"
              color={colors.primary}
            />
            <tr>
              <td
                style={{
                  padding: "16px",
                  backgroundColor: "#EFF6FF",
                  borderRadius: "0 0 6px 6px",
                  border: `1px solid ${colors.border}`,
                  borderTop: "none",
                }}
              >
                <p style={{ margin: 0, fontSize: "15px", color: "#1E40AF" }}>
                  {content.followUp.date
                    ? `Please schedule a follow-up ${content.followUp.date}`
                    : "Please schedule a follow-up appointment"}
                  {content.followUp.reason && ` for ${content.followUp.reason}`}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Warning Signs - CRITICAL SECTION */}
      {content.warningSigns && content.warningSigns.length > 0 && (
        <table
          role="presentation"
          style={{
            width: "100%",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <SectionHeader
              icon="⚠️"
              title="Call Us Immediately If You Notice"
              color={colors.danger}
            />
            <tr>
              <td
                style={{
                  padding: "16px",
                  backgroundColor: "#FEF2F2",
                  borderRadius: "0 0 6px 6px",
                  border: `2px solid ${colors.danger}`,
                  borderTop: "none",
                }}
              >
                {content.warningSigns.map((sign, index) => (
                  <p
                    key={index}
                    style={{
                      margin: index === 0 ? 0 : "8px 0 0 0",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#991B1B",
                    }}
                  >
                    🚨 {sign}
                  </p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Additional Notes */}
      {content.notes && (
        <table
          role="presentation"
          style={{
            width: "100%",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "16px",
                  backgroundColor: "#F9FAFB",
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#4B5563",
                  }}
                >
                  📝 <strong>Note:</strong> {content.notes}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  );
}

/**
 * Render plaintext content (fallback)
 */
function PlaintextContent({ content }: { content: string }) {
  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        fontSize: "15px",
        lineHeight: "1.6",
        color: "#333",
        marginBottom: "25px",
      }}
    >
      {content}
    </div>
  );
}

/**
 * Compute a darker shade of a hex color for gradient
 */
function darkenColor(hex: string, percent: number): string {
  // Remove # if present
  const color = hex.replace("#", "");

  // Parse hex to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Darken each component
  const darkenComponent = (c: number) =>
    Math.max(0, Math.floor(c * (1 - percent / 100)));

  const newR = darkenComponent(r);
  const newG = darkenComponent(g);
  const newB = darkenComponent(b);

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * Main discharge email template component
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

  // Compute gradient colors based on primary color
  const gradientEnd = darkenColor(primaryColor, 20);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#F3F4F6",
          lineHeight: "1.6",
        }}
      >
        <table
          role="presentation"
          style={{
            width: "100%",
            backgroundColor: "#F3F4F6",
            padding: "40px 20px",
          }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  style={{
                    maxWidth: "600px",
                    width: "100%",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "32px 32px 24px 32px",
                          background: `linear-gradient(135deg, ${primaryColor} 0%, ${gradientEnd} 100%)`,
                        }}
                      >
                        {/* Logo - using img tag since this is for email templates, not Next.js pages */}
                        {logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt={clinicName ?? "Clinic Logo"}
                            style={{
                              maxHeight: "60px",
                              maxWidth: "200px",
                              marginBottom: "16px",
                            }}
                          />
                        )}
                        <h1
                          style={{
                            color: "#FFFFFF",
                            margin: 0,
                            fontSize: "28px",
                            fontWeight: "700",
                          }}
                        >
                          🐾 Discharge Instructions
                        </h1>
                        {clinicName && (
                          <p
                            style={{
                              margin: "12px 0 0 0",
                              fontSize: "16px",
                              color: "rgba(255, 255, 255, 0.9)",
                            }}
                          >
                            {clinicName}
                          </p>
                        )}
                      </td>
                    </tr>

                    {/* Patient Info Card */}
                    <tr>
                      <td style={{ padding: "24px 24px 0 24px" }}>
                        <table
                          role="presentation"
                          style={{
                            width: "100%",
                            backgroundColor: "#F9FAFB",
                            borderRadius: "8px",
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: "16px" }}>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    color: "#111827",
                                  }}
                                >
                                  🐕 {patientName}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "14px",
                                    color: "#6B7280",
                                  }}
                                >
                                  {[species, breed].filter(Boolean).join(" • ")}
                                  {(Boolean(species) || Boolean(breed)) &&
                                    " • "}
                                  {date}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Main Content */}
                    <tr>
                      <td style={{ padding: "24px" }}>
                        {/* Introduction - use custom header text if provided */}
                        <p
                          style={{
                            margin: "0 0 24px 0",
                            fontSize: "15px",
                            color: "#4B5563",
                            textAlign: "center",
                          }}
                        >
                          {headerText ??
                            `Thank you for trusting us with ${patientName}'s care! Here's everything you need to know:`}
                        </p>

                        {/* Content - Structured or Plaintext */}
                        {hasStructuredContent ? (
                          <StructuredContent
                            content={structuredContent}
                            patientName={patientName}
                          />
                        ) : dischargeSummaryContent ? (
                          <PlaintextContent content={dischargeSummaryContent} />
                        ) : (
                          <p
                            style={{ color: colors.muted, fontStyle: "italic" }}
                          >
                            No discharge instructions available.
                          </p>
                        )}

                        {/* Generic Warning (only for plaintext) */}
                        {!hasStructuredContent && (
                          <table
                            role="presentation"
                            style={{
                              width: "100%",
                              backgroundColor: "#FEF3C7",
                              borderRadius: "6px",
                              borderLeft: `4px solid ${colors.warning}`,
                              marginTop: "24px",
                            }}
                          >
                            <tbody>
                              <tr>
                                <td style={{ padding: "16px" }}>
                                  <p
                                    style={{
                                      margin: "0 0 8px 0",
                                      fontWeight: "600",
                                      color: "#92400E",
                                      fontSize: "14px",
                                    }}
                                  >
                                    ⚠️ Important Reminder
                                  </p>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "14px",
                                      color: "#92400E",
                                    }}
                                  >
                                    If you notice any concerning symptoms or
                                    have questions about {patientName}&apos;s
                                    recovery, please contact us immediately.
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* Contact Info */}
                        {(clinicPhone ?? clinicEmail) && (
                          <table
                            role="presentation"
                            style={{
                              width: "100%",
                              backgroundColor: "#EFF6FF",
                              borderRadius: "8px",
                              marginTop: "24px",
                            }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: "0 0 12px 0",
                                      fontSize: "15px",
                                      fontWeight: "600",
                                      color: "#1E40AF",
                                    }}
                                  >
                                    📞 Questions? Contact Us!
                                  </p>
                                  {clinicPhone && (
                                    <p
                                      style={{
                                        margin: "4px 0",
                                        fontSize: "16px",
                                        color: "#1E40AF",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {clinicPhone}
                                    </p>
                                  )}
                                  {clinicEmail && (
                                    <p
                                      style={{
                                        margin: "4px 0",
                                        fontSize: "14px",
                                        color: "#3B82F6",
                                      }}
                                    >
                                      {clinicEmail}
                                    </p>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: "#F9FAFB",
                          padding: "20px 24px",
                          textAlign: "center",
                          borderTop: `1px solid ${colors.border}`,
                        }}
                      >
                        {/* Custom footer text if provided */}
                        {footerText ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#9CA3AF",
                            }}
                          >
                            {footerText}
                          </p>
                        ) : (
                          <>
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "12px",
                                color: "#9CA3AF",
                              }}
                            >
                              Sent with ❤️ by OdisAI on behalf of your
                              veterinary clinic
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#9CA3AF",
                              }}
                            >
                              Please contact your veterinarian directly for
                              questions.
                            </p>
                          </>
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
