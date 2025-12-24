/**
 * Email Template Service
 *
 * Provides professional HTML email templates for discharge summaries
 * wrapping the AI-generated content with a beautiful, branded design.
 */

import { now } from '@odis-ai/extension/shared';

export interface DischargeEmailTemplateData {
  petName: string;
  ownerName: string;
  clinicName?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicAddress?: string;
  visitDate: string;
  dischargeSummaryContent: string;
}

/**
 * Wraps discharge summary content in a professional, branded email template
 */
export const createDischargeEmailTemplate = (data: DischargeEmailTemplateData): string => {
  const {
    petName,
    ownerName,
    clinicName = 'OdisAI Veterinary Clinic',
    clinicPhone = '',
    clinicEmail = '',
    clinicAddress = '',
    visitDate,
    dischargeSummaryContent,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${petName}'s Discharge Instructions - ${clinicName}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7f7; font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f7f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); max-width: 900px; width: 100%;">

          <!-- Header with OdisAI Branding -->
          <tr>
            <td style="background-color: #5ab9b4; padding: 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #ffffff; color: #5ab9b4; width: 40px; height: 40px; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 24px; font-weight: bold; line-height: 40px;">
                          +
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">OdisAI</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Clinic Info Banner -->
          <tr>
            <td style="background-color: #f0f7f7; padding: 24px 32px; border-bottom: 1px solid #e0e0e0;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #2d4857; line-height: 1.3;">
                ${clinicName}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #5f7988; line-height: 1.6;">
                ${clinicAddress ? `${clinicAddress}<br>` : ''}
                ${clinicPhone ? `Phone: ${clinicPhone}` : ''}
                ${clinicEmail && clinicPhone ? ` • ` : ''}
                ${clinicEmail ? `Email: ${clinicEmail}` : ''}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #2d4857; line-height: 1.5;">
                Dear ${ownerName},
              </p>

              <!-- Title -->
              <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #2d4857; line-height: 1.3;">
                <span style="color: #5ab9b4;">Discharge Instructions</span> for ${petName}
              </h2>
              <p style="margin: 0 0 32px 0; font-size: 14px; color: #5f7988; font-style: italic;">
                Visit Date: ${visitDate}
              </p>

              <!-- Discharge Summary Content (from AI/rich text editor) -->
              <div style="font-size: 15px; color: #2d4857; line-height: 1.6;">
                ${dischargeSummaryContent}
              </div>

              <!-- Call to Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 40px;">
                <tr>
                  <td style="text-align: center; padding: 32px 24px; background-color: #f0f7f7; border-radius: 8px;">
                    <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #2d4857;">
                      Questions about your pet's care?
                    </p>
                    ${
                      clinicPhone
                        ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="border-radius: 8px; background-color: #5ab9b4;">
                          <a href="tel:${clinicPhone}" style="background-color: #5ab9b4; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: block; padding: 14px 32px; border-radius: 8px;">
                            Contact Our Clinic
                          </a>
                        </td>
                      </tr>
                    </table>
                    `
                        : `
                    <p style="margin: 0; font-size: 15px; color: #5f7988;">
                      Please reach out to our clinic for any questions or concerns.
                    </p>
                    `
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #f9f9f9;">
              <!-- Divider -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-bottom: 1px solid #e0e0e0; padding-bottom: 24px;">
                  </td>
                </tr>
              </table>

              <!-- Clinic Contact Info -->
              <p style="margin: 24px 0 16px 0; font-size: 14px; color: #5f7988; line-height: 1.6;">
                <strong>Clinic Contact Information:</strong><br>
                ${clinicName}<br>
                ${clinicAddress ? `${clinicAddress}<br>` : ''}
                ${clinicPhone ? `Phone: ${clinicPhone}` : ''}
                ${clinicEmail && clinicPhone ? ` • ` : ''}
                ${clinicEmail ? `Email: ${clinicEmail}` : ''}
              </p>

              <!-- OdisAI Credit -->
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #8a9ba8; line-height: 1.6;">
                This discharge summary was generated by
                <a href="https://odisai.net" style="color: #5ab9b4; text-decoration: underline;">OdisAI</a>,
                an AI-native veterinary scribe.
              </p>

              <!-- Disclaimer -->
              <p style="margin: 0; font-size: 12px; color: #a0aab5; line-height: 1.5; font-style: italic;">
                This email contains confidential information intended only for ${ownerName}.
                If you received this email in error, please delete it immediately.
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
};

/**
 * Extract and format the visit date from various date formats
 */
export const formatVisitDate = (date: Date | string | undefined): string => {
  if (!date) {
    return now().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
