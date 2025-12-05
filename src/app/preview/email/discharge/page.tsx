import { DischargeEmailTemplate } from "~/components/email/discharge-email-template";
import { renderEmailToHtml } from "~/lib/email/render-email";
import type { StructuredDischargeSummary } from "~/lib/validators/discharge-summary";
import { EmailPreviewFrame } from "./email-preview-frame";

/**
 * Preview page for discharge email template
 *
 * This page renders the DischargeEmailTemplate component with sample data
 * so developers can preview how the email will look in the browser.
 *
 * Access at: /preview/email/discharge
 *
 * DATA AVAILABILITY ANALYSIS:
 * ===========================
 * Always present: patientName, clinicName, clinicPhone, clinicEmail, logoUrl, date
 * Almost always (~90%): species, diagnosis OR treatmentsToday, caseType
 * Often (~60-80%): medications (if prescribed), breed, homeCare, followUp
 * Sometimes extracted: warningSigns (falls back to curated library if not present)
 */
export default async function DischargeEmailPreviewPage() {
  // Dermatology visit - With extracted warning signs
  const dermatologyVisit: StructuredDischargeSummary = {
    patientName: "Bella",
    caseType: "dermatology",
    diagnosis: "Skin irritation & scratching",
    treatmentsToday: ["Physical exam", "Skin cytology", "Medicated bath"],
    medications: [
      {
        name: "Apoquel",
        dosage: "16mg tablet",
        frequency: "once daily",
        duration: "14 days",
        instructions: "Give with food",
      },
      {
        name: "Chlorhexidine Shampoo",
        dosage: "Apply liberally",
        frequency: "twice weekly",
        duration: "2 weeks",
        instructions: "Leave on 10 min",
      },
    ],
    homeCare: {
      activity:
        "Normal activity. Prevent scratching with an e-collar if needed.",
      diet: "Continue regular diet. Consider omega-3 supplements for skin health.",
      monitoring: [
        "Redness or spreading of affected areas",
        "Increased scratching despite medication",
        "Any hair loss or open sores",
      ],
    },
    followUp: {
      required: true,
      date: "in 2 weeks",
      reason: "recheck skin condition",
    },
    // Extracted warning signs from notes
    warningSigns: [
      "Severe swelling or hives",
      "Difficulty breathing",
      "Open sores or bleeding",
    ],
  };

  // Wellness visit - Uses curated fallback warnings (empty warningSigns)
  const wellnessVisit: StructuredDischargeSummary = {
    patientName: "Max",
    caseType: "vaccination",
    diagnosis: "Healthy adult dog",
    treatmentsToday: ["Comprehensive physical exam", "Heartworm test"],
    vaccinationsGiven: ["DHPP", "Rabies", "Bordetella"],
    medications: [
      {
        name: "Heartgard Plus",
        dosage: "1 chewable",
        frequency: "once monthly",
        duration: "year-round",
        instructions: "Give with food",
      },
    ],
    homeCare: {
      activity: "Mild soreness at injection site is normal for 24-48 hours.",
    },
    followUp: {
      required: true,
      date: "in 1 year",
      reason: "annual wellness exam",
    },
    // No extracted warning signs - will use curated "vaccination" fallback
    warningSigns: [],
  };

  // Surgery visit - Full home care with wound care
  const surgeryVisit: StructuredDischargeSummary = {
    patientName: "Luna",
    caseType: "surgery",
    diagnosis: "Routine spay surgery",
    treatmentsToday: ["Ovariohysterectomy", "Post-operative monitoring"],
    medications: [
      {
        name: "Carprofen",
        dosage: "25mg tablet",
        frequency: "twice daily",
        duration: "5 days",
        instructions: "Give with food",
      },
      {
        name: "Gabapentin",
        dosage: "100mg capsule",
        frequency: "twice daily",
        duration: "3 days",
        instructions: "May cause drowsiness",
      },
    ],
    homeCare: {
      activity:
        "Strict rest for 10-14 days. No running, jumping, or rough play. Short leash walks only for bathroom breaks.",
      diet: "Offer small amounts of water tonight. Resume normal feeding tomorrow morning.",
      woundCare:
        "Keep incision clean and dry. Check daily for redness, swelling, or discharge.",
      monitoring: [
        "Incision site for signs of infection",
        "Appetite and bathroom habits",
        "Energy level and comfort",
      ],
    },
    followUp: {
      required: true,
      date: "in 10-14 days",
      reason: "suture removal and incision check",
    },
    // Extracted warning signs from surgical notes
    warningSigns: [
      "Excessive licking at incision",
      "Bleeding or discharge from incision",
      "Vomiting or not eating for 24+ hours",
    ],
    notes:
      "E-collar must be worn at all times to prevent licking the incision.",
  };

  // Minimal data example - No home care, no follow-up, curated warnings
  const minimalVisit: StructuredDischargeSummary = {
    patientName: "Charlie",
    caseType: "wellness",
    diagnosis: "Healthy senior cat",
    treatmentsToday: ["Physical exam", "Nail trim"],
    // No medications
    // No home care instructions
    // No follow-up
    // No warning signs - will use curated "wellness" fallback
    warningSigns: [],
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Page Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Discharge Email Preview
          </h1>
          <p className="text-sm text-gray-600">
            Preview of how the discharge email template will appear in email
            clients. Shows different visit types with realistic data and the new
            checkbox-style warning signs.
          </p>
        </div>

        {/* Dermatology Visit - Extracted warnings */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Dermatology Visit
              </h2>
              <p className="text-sm text-gray-500">
                Full data with extracted warning signs
              </p>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              caseType: dermatology
            </span>
          </div>
          <EmailPreviewFrame
            html={await renderEmailToHtml(
              <DischargeEmailTemplate
                patientName={dermatologyVisit.patientName}
                ownerName="Sarah Johnson"
                structuredContent={dermatologyVisit}
                date="December 5, 2025"
                breed="Labrador Mix"
                species="Dog"
                clinicName="Alum Rock Animal Hospital"
                clinicPhone="(408) 258-2735"
                clinicEmail="care@alumrockanimalhospital.com"
                logoUrl="https://cdcssl.ibsrv.net/ibimg/smb/280x74_80/webmgr/0p/b/d/60a41fa22fb01_logo.png.webp?f694b7f6a4b54a9f3056e003f175f743"
                primaryColor="#0F766E"
                headerStyle="light"
              />,
            )}
          />
        </div>

        {/* Wellness/Vaccination Visit - Curated fallback */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Vaccination Visit
              </h2>
              <p className="text-sm text-gray-500">
                Uses curated warning signs fallback (no extracted warnings)
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              caseType: vaccination
            </span>
          </div>
          <EmailPreviewFrame
            html={await renderEmailToHtml(
              <DischargeEmailTemplate
                patientName={wellnessVisit.patientName}
                ownerName="Mike Chen"
                structuredContent={wellnessVisit}
                date="December 5, 2025"
                breed="Golden Retriever"
                species="Dog"
                clinicName="Alum Rock Animal Hospital"
                clinicPhone="(408) 258-2735"
                clinicEmail="care@alumrockanimalhospital.com"
                logoUrl="https://cdcssl.ibsrv.net/ibimg/smb/280x74_80/webmgr/0p/b/d/60a41fa22fb01_logo.png.webp?f694b7f6a4b54a9f3056e003f175f743"
                primaryColor="#0F766E"
                headerStyle="light"
              />,
            )}
          />
        </div>

        {/* Surgery Visit - Full home care with wound care */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Post-Surgery
              </h2>
              <p className="text-sm text-gray-500">
                Detailed post-operative care with wound care instructions
              </p>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              caseType: surgery
            </span>
          </div>
          <EmailPreviewFrame
            html={await renderEmailToHtml(
              <DischargeEmailTemplate
                patientName={surgeryVisit.patientName}
                ownerName="Emily Rodriguez"
                structuredContent={surgeryVisit}
                date="December 5, 2025"
                breed="German Shepherd"
                species="Dog"
                clinicName="Alum Rock Animal Hospital"
                clinicPhone="(408) 258-2735"
                clinicEmail="care@alumrockanimalhospital.com"
                logoUrl="https://cdcssl.ibsrv.net/ibimg/smb/280x74_80/webmgr/0p/b/d/60a41fa22fb01_logo.png.webp?f694b7f6a4b54a9f3056e003f175f743"
                primaryColor="#0F766E"
                headerStyle="light"
              />,
            )}
          />
        </div>

        {/* Minimal Visit - Testing empty sections */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Minimal Visit
              </h2>
              <p className="text-sm text-gray-500">
                No medications, no home care, no follow-up - tests fallback
                behavior
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              caseType: wellness
            </span>
          </div>
          <EmailPreviewFrame
            html={await renderEmailToHtml(
              <DischargeEmailTemplate
                patientName={minimalVisit.patientName}
                structuredContent={minimalVisit}
                date="December 5, 2025"
                breed="Domestic Shorthair"
                species="Cat"
                clinicName="Alum Rock Animal Hospital"
                clinicPhone="(408) 258-2735"
                clinicEmail="care@alumrockanimalhospital.com"
                logoUrl="https://cdcssl.ibsrv.net/ibimg/smb/280x74_80/webmgr/0p/b/d/60a41fa22fb01_logo.png.webp?f694b7f6a4b54a9f3056e003f175f743"
                primaryColor="#0F766E"
                headerStyle="light"
              />,
            )}
          />
        </div>

        {/* Info Footer */}
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Design Updates:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Checkbox-style warnings:</strong> Warning signs now
              display with checkbox styling for better readability
            </li>
            <li>
              <strong>Hybrid warnings:</strong> Uses extracted warnings if
              present, falls back to curated library by caseType
            </li>
            <li>
              <strong>No summary paragraph:</strong> Header shows pet name +
              tags only, removed AI-generated summary
            </li>
            <li>
              <strong>Simplified footer:</strong> Compact contact info with
              &quot;Powered by OdisAI&quot; branding
            </li>
            <li>
              <strong>Minimal fallback:</strong> When no home care instructions,
              shows simple &quot;We&apos;re here to help&quot; message
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
