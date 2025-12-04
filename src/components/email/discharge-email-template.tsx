import React from "react";
import type { StructuredDischargeSummary } from "~/lib/validators/discharge-summary";

/**
 * Discharge Email Template Component - Redesigned
 *
 * A beautiful, full-width email template optimized for mobile with clear visual hierarchy.
 * Emphasizes critical information (medications, warning signs) while keeping other details accessible.
 *
 * Design principles:
 * - Full-width responsive (max 700px on desktop)
 * - Mobile-first with large touch targets
 * - Clear visual hierarchy - medications and warnings are primary
 * - Clean, scannable layout with generous white space
 * - Minimal color usage - primary brand color and red for warnings only
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

// Simplified color palette
const colors = {
  primary: "#2563EB", // Blue
  danger: "#DC2626", // Red
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    muted: "#9CA3AF",
  },
  background: {
    main: "#F9FAFB",
    card: "#FFFFFF",
  },
  border: "#E5E7EB",
};

/**
 * Compute a darker shade of a hex color for gradient
 */
function darkenColor(hex: string, percent: number): string {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const darkenComponent = (c: number) =>
    Math.max(0, Math.floor(c * (1 - percent / 100)));

  const newR = darkenComponent(r);
  const newG = darkenComponent(g);
  const newB = darkenComponent(b);

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * Simple section header - no colored backgrounds
 */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: "700",
          color: colors.text.primary,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "22px" }}>{icon}</span>
        {title}
      </h2>
    </div>
  );
}

/**
 * Render structured content with visual hierarchy
 */
function StructuredContent({
  content,
  clinicPhone,
  primaryColor,
}: {
  content: StructuredDischargeSummary;
  clinicPhone?: string | null;
  primaryColor: string;
}) {
  return (
    <>
      {/* Visit Summary - Simple text block */}
      {content.visitSummary && (
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              lineHeight: "1.6",
              color: colors.text.primary,
            }}
          >
            {content.visitSummary}
          </p>
          {content.diagnosis && (
            <div
              style={{
                display: "inline-block",
                padding: "6px 14px",
                backgroundColor: "#EFF6FF",
                borderRadius: "20px",
                border: `1px solid ${primaryColor}20`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: primaryColor,
                }}
              >
                Diagnosis: {content.diagnosis}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Medications - PRIMARY FOCUS with visual prominence */}
      {content.medications && content.medications.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader icon="💊" title="Medications" />
          <div
            style={{
              backgroundColor: colors.background.card,
              border: `2px solid ${primaryColor}`,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {content.medications.map((med, index) => (
              <div
                key={index}
                style={{
                  padding: "20px",
                  borderBottom:
                    index < content.medications!.length - 1
                      ? `1px solid ${colors.border}`
                      : "none",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    fontWeight: "700",
                    color: colors.text.primary,
                  }}
                >
                  {med.name}
                </p>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.text.secondary,
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
                      margin: 0,
                      fontSize: "15px",
                      color: colors.text.secondary,
                      fontStyle: "italic",
                    }}
                  >
                    📝 {med.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Signs - HIGH VISIBILITY with red accent */}
      {content.warningSigns && content.warningSigns.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader icon="⚠️" title="Call Us Immediately If You Notice" />
          <div
            style={{
              backgroundColor: "#FEF2F2",
              borderLeft: `6px solid ${colors.danger}`,
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            {content.warningSigns.map((sign, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom:
                    index < content.warningSigns!.length - 1 ? "12px" : 0,
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  🚨
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#991B1B",
                    lineHeight: "1.5",
                  }}
                >
                  {sign}
                </p>
              </div>
            ))}

            {/* CTA Button if phone available */}
            {clinicPhone && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <a
                  href={`tel:${clinicPhone.replace(/\D/g, "")}`}
                  style={{
                    display: "inline-block",
                    padding: "14px 32px",
                    backgroundColor: colors.danger,
                    color: "#FFFFFF",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "700",
                  }}
                >
                  📞 Call {clinicPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* What We Did Today - Compact list */}
      {content.treatmentsToday && content.treatmentsToday.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader icon="✅" title="What We Did Today" />
          <div style={{ paddingLeft: "8px" }}>
            {content.treatmentsToday.map((treatment, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom:
                    index < content.treatmentsToday!.length - 1 ? "8px" : 0,
                }}
              >
                <span style={{ fontSize: "18px", marginTop: "2px" }}>✓</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    color: colors.text.primary,
                    lineHeight: "1.5",
                  }}
                >
                  {treatment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Care - Icon-based layout */}
      {content.homeCare &&
        (Boolean(content.homeCare.activity) ||
          Boolean(content.homeCare.diet) ||
          Boolean(content.homeCare.woundCare) ||
          (content.homeCare.monitoring &&
            content.homeCare.monitoring.length > 0)) && (
          <div style={{ marginBottom: "32px" }}>
            <SectionHeader icon="🏠" title="Home Care" />
            <div
              style={{
                backgroundColor: colors.background.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              {content.homeCare.activity && (
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: colors.text.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🏃</span>
                    Activity
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: colors.text.secondary,
                      paddingLeft: "28px",
                    }}
                  >
                    {content.homeCare.activity}
                  </p>
                </div>
              )}

              {content.homeCare.diet && (
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: colors.text.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🍽️</span>
                    Diet
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: colors.text.secondary,
                      paddingLeft: "28px",
                    }}
                  >
                    {content.homeCare.diet}
                  </p>
                </div>
              )}

              {content.homeCare.woundCare && (
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: colors.text.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🩹</span>
                    Wound Care
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: colors.text.secondary,
                      paddingLeft: "28px",
                    }}
                  >
                    {content.homeCare.woundCare}
                  </p>
                </div>
              )}

              {content.homeCare.monitoring &&
                content.homeCare.monitoring.length > 0 && (
                  <div>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "15px",
                        fontWeight: "700",
                        color: colors.text.primary,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>👀</span>
                      Watch For
                    </p>
                    {content.homeCare.monitoring.map((item, index) => (
                      <p
                        key={index}
                        style={{
                          margin: "4px 0",
                          fontSize: "15px",
                          color: colors.text.secondary,
                          paddingLeft: "28px",
                        }}
                      >
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

      {/* Follow-up - Calendar style */}
      {content.followUp && content.followUp.required && (
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader icon="📅" title="Follow-Up Appointment" />
          <div
            style={{
              backgroundColor: "#EFF6FF",
              border: `1px solid ${primaryColor}40`,
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: "1.6",
                color: colors.text.primary,
              }}
            >
              {content.followUp.date
                ? `Please schedule a follow-up ${content.followUp.date}`
                : "Please schedule a follow-up appointment"}
              {content.followUp.reason && ` for ${content.followUp.reason}`}
            </p>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {content.notes && (
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              backgroundColor: colors.background.main,
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: colors.text.secondary,
              }}
            >
              📝 {content.notes}
            </p>
          </div>
        </div>
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
        fontSize: "16px",
        lineHeight: "1.6",
        color: colors.text.primary,
        marginBottom: "32px",
      }}
    >
      {content}
    </div>
  );
}

/**
 * Main discharge email template component - Redesigned
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: colors.background.main,
          lineHeight: "1.6",
        }}
      >
        {/* Full-width container */}
        <div
          style={{
            width: "100%",
            backgroundColor: colors.background.main,
            padding: "20px 0",
          }}
        >
          {/* Content wrapper - max width on desktop */}
          <div
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              backgroundColor: colors.background.card,
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Header - Clean gradient */}
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px",
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${gradientEnd} 100%)`,
              }}
            >
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={clinicName ?? "Clinic Logo"}
                  style={{
                    maxHeight: "60px",
                    maxWidth: "240px",
                    marginBottom: "16px",
                  }}
                />
              )}
              <h1
                style={{
                  color: "#FFFFFF",
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "700",
                }}
              >
                Discharge Instructions
              </h1>
              {clinicName && (
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "16px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {clinicName}
                </p>
              )}
            </div>

            {/* Patient Hero Section */}
            <div
              style={{ padding: "32px 24px 24px 24px", textAlign: "center" }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "20px 32px",
                  backgroundColor: colors.background.main,
                  borderRadius: "12px",
                  border: `2px solid ${colors.border}`,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "32px",
                    fontWeight: "800",
                    color: colors.text.primary,
                  }}
                >
                  🐾 {patientName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    color: colors.text.secondary,
                  }}
                >
                  {[species, breed].filter(Boolean).join(" • ")}
                  {(Boolean(species) || Boolean(breed)) && " • "}
                  {date}
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ padding: "0 24px 32px 24px" }}>
              {/* Introduction text */}
              {headerText && (
                <p
                  style={{
                    margin: "0 0 32px 0",
                    fontSize: "16px",
                    color: colors.text.secondary,
                    textAlign: "center",
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
                />
              ) : dischargeSummaryContent ? (
                <>
                  <PlaintextContent content={dischargeSummaryContent} />
                  {/* Generic Warning for plaintext */}
                  <div
                    style={{
                      backgroundColor: "#FEF3C7",
                      borderLeft: `4px solid #D97706`,
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "32px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontWeight: "600",
                        color: "#92400E",
                        fontSize: "15px",
                      }}
                    >
                      ⚠️ Important Reminder
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        color: "#92400E",
                      }}
                    >
                      If you notice any concerning symptoms or have questions
                      about {patientName}&apos;s recovery, please contact us
                      immediately.
                    </p>
                  </div>
                </>
              ) : (
                <p
                  style={{
                    color: colors.text.muted,
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  No discharge instructions available.
                </p>
              )}

              {/* Contact Info Card */}
              {(clinicPhone ?? clinicEmail) && (
                <div
                  style={{
                    backgroundColor: colors.background.main,
                    borderRadius: "12px",
                    padding: "24px",
                    textAlign: "center",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "17px",
                      fontWeight: "700",
                      color: colors.text.primary,
                    }}
                  >
                    📞 Questions? We&apos;re Here to Help
                  </p>
                  {clinicPhone && (
                    <p
                      style={{
                        margin: "8px 0",
                        fontSize: "18px",
                        color: primaryColor,
                        fontWeight: "600",
                      }}
                    >
                      <a
                        href={`tel:${clinicPhone.replace(/\D/g, "")}`}
                        style={{
                          color: primaryColor,
                          textDecoration: "none",
                        }}
                      >
                        {clinicPhone}
                      </a>
                    </p>
                  )}
                  {clinicEmail && (
                    <p
                      style={{
                        margin: "8px 0",
                        fontSize: "15px",
                        color: colors.text.secondary,
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
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                backgroundColor: colors.background.main,
                padding: "24px",
                textAlign: "center",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              {footerText ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: colors.text.muted,
                  }}
                >
                  {footerText}
                </p>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: colors.text.muted,
                  }}
                >
                  Sent with care by OdisAI on behalf of{" "}
                  {clinicName ?? "your veterinary clinic"}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
