import React from "react";

/**
 * Discharge Email Template Component
 *
 * A React-based email template for discharge summaries using only data
 * available from Supabase: discharge_summaries, patients, users tables.
 *
 * Data available from Supabase:
 * - discharge_summaries.content (plain text)
 * - patients: name, species, breed, owner_name, owner_email
 * - users: clinic_name, clinic_phone, clinic_email
 */

export interface DischargeEmailProps {
  // Required fields from Supabase
  patientName: string;
  dischargeSummaryContent: string; // Plain text from discharge_summaries.content

  // Optional fields from Supabase patients table
  date?: string;
  breed?: string | null;
  species?: string | null;

  // Optional fields from Supabase users table
  clinicName?: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;

  // Customization (not stored in DB)
  primaryColor?: string;
}

/**
 * Main discharge email template component
 *
 * Simple, clean email template that displays discharge instructions
 * using only data that exists in Supabase.
 */
export function DischargeEmailTemplate({
  patientName,
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
  primaryColor = "#4F46E5",
}: DischargeEmailProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#f5f5f5",
          lineHeight: "1.6",
        }}
      >
        <table
          role="presentation"
          style={{
            width: "100%",
            backgroundColor: "#f5f5f5",
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
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "30px 30px 20px 30px",
                          borderBottom: `2px solid ${primaryColor}`,
                        }}
                      >
                        <h1
                          style={{
                            color: primaryColor,
                            margin: 0,
                            fontSize: "24px",
                            fontWeight: "600",
                          }}
                        >
                          🏥 Discharge Instructions
                        </h1>
                        {clinicName && (
                          <p
                            style={{
                              margin: "10px 0 0 0",
                              fontSize: "16px",
                              color: "#666",
                            }}
                          >
                            {clinicName}
                          </p>
                        )}
                      </td>
                    </tr>

                    {/* Content */}
                    <tr>
                      <td style={{ padding: "30px" }}>
                        {/* Patient Info */}
                        <table
                          role="presentation"
                          style={{
                            width: "100%",
                            backgroundColor: "#F3F4F6",
                            borderRadius: "6px",
                            padding: "15px",
                            marginBottom: "25px",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td>
                                <p
                                  style={{
                                    margin: "5px 0",
                                    fontSize: "14px",
                                    color: "#333",
                                  }}
                                >
                                  <strong>Patient:</strong> {patientName}
                                </p>
                                {breed && (
                                  <p
                                    style={{
                                      margin: "5px 0",
                                      fontSize: "14px",
                                      color: "#333",
                                    }}
                                  >
                                    <strong>Breed:</strong> {breed}
                                  </p>
                                )}
                                {species && (
                                  <p
                                    style={{
                                      margin: "5px 0",
                                      fontSize: "14px",
                                      color: "#333",
                                    }}
                                  >
                                    <strong>Species:</strong> {species}
                                  </p>
                                )}
                                <p
                                  style={{
                                    margin: "5px 0",
                                    fontSize: "14px",
                                    color: "#333",
                                  }}
                                >
                                  <strong>Date:</strong> {date}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Introduction */}
                        <p
                          style={{
                            margin: "0 0 20px 0",
                            fontSize: "15px",
                            color: "#333",
                          }}
                        >
                          Thank you for trusting us with {patientName}&apos;s
                          care. Please review the following discharge
                          instructions carefully:
                        </p>

                        {/* Discharge Summary Content */}
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "15px",
                            lineHeight: "1.6",
                            color: "#333",
                            marginBottom: "25px",
                          }}
                        >
                          {dischargeSummaryContent}
                        </div>

                        {/* Warning Banner */}
                        <table
                          role="presentation"
                          style={{
                            width: "100%",
                            backgroundColor: "#FEF3C7",
                            borderRadius: "4px",
                            padding: "15px",
                            borderLeft: "4px solid #F59E0B",
                            marginTop: "30px",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontWeight: "bold",
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
                                    lineHeight: "1.6",
                                    color: "#92400E",
                                  }}
                                >
                                  If you notice any concerning symptoms or have
                                  questions about {patientName}&apos;s recovery,
                                  please don&apos;t hesitate to contact us
                                  immediately.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Contact Info (if available) */}
                        {(clinicPhone ?? clinicEmail) && (
                          <table
                            role="presentation"
                            style={{
                              width: "100%",
                              backgroundColor: "#F9FAFB",
                              borderRadius: "6px",
                              padding: "15px",
                              marginTop: "20px",
                            }}
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <p
                                    style={{
                                      margin: "0 0 10px 0",
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      color: "#333",
                                    }}
                                  >
                                    Contact Information:
                                  </p>
                                  {clinicPhone && (
                                    <p
                                      style={{
                                        margin: "5px 0",
                                        fontSize: "14px",
                                        color: "#555",
                                      }}
                                    >
                                      <strong>Phone:</strong> {clinicPhone}
                                    </p>
                                  )}
                                  {clinicEmail && (
                                    <p
                                      style={{
                                        margin: "5px 0",
                                        fontSize: "14px",
                                        color: "#555",
                                      }}
                                    >
                                      <strong>Email:</strong> {clinicEmail}
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
                          backgroundColor: "#f9fafb",
                          padding: "20px 30px",
                          textAlign: "center",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            fontSize: "12px",
                            color: "#6b7280",
                            lineHeight: "1.5",
                          }}
                        >
                          This email was sent by OdisAI on behalf of your
                          veterinary clinic.
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#6b7280",
                            lineHeight: "1.5",
                          }}
                        >
                          Please do not reply to this email. Contact your
                          veterinarian directly for questions.
                        </p>
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
