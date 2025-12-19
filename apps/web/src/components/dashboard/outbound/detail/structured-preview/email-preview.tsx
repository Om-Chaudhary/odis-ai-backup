/**
 * Email Structured Preview
 * Shows what the email will look like with sections
 */

import { PawPrint, CalendarCheck } from "lucide-react";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";

interface EmailStructuredPreviewProps {
  content: StructuredDischargeSummary;
}

export function EmailStructuredPreview({
  content,
}: EmailStructuredPreviewProps) {
  const hasTreatments =
    content.treatmentsToday && content.treatmentsToday.length > 0;
  const hasVaccinations =
    content.vaccinationsGiven && content.vaccinationsGiven.length > 0;
  const hasMedications = content.medications && content.medications.length > 0;
  const hasHomeCare =
    content.homeCare &&
    [
      content.homeCare.activity,
      content.homeCare.diet,
      content.homeCare.woundCare,
      content.homeCare.monitoring && content.homeCare.monitoring.length > 0,
    ].some(Boolean);
  const hasFollowUp = content.followUp?.required;
  const hasWarningSigns =
    content.warningSigns && content.warningSigns.length > 0;

  return (
    <div className="max-h-64 overflow-auto rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
      {/* Email Header */}
      <div className="mb-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
            <PawPrint className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Discharge Summary for {content.patientName}
            </p>
            <p className="text-muted-foreground text-xs">
              Thank you for visiting our clinic!
            </p>
          </div>
        </div>
      </div>

      {/* Appointment Summary */}
      {content.appointmentSummary && (
        <div className="mb-3">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {content.appointmentSummary}
          </p>
        </div>
      )}

      {/* Treatment Summary */}
      {[hasTreatments, hasVaccinations].some(Boolean) && (
        <div className="mb-3 rounded-md bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">
            Today&apos;s Care
          </p>
          {hasTreatments && (
            <ul className="text-muted-foreground space-y-0.5 text-sm">
              {content.treatmentsToday?.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          )}
          {hasVaccinations && (
            <div className="mt-2 flex flex-wrap gap-1">
              {content.vaccinationsGiven?.map((v, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                >
                  💉 {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medications Section */}
      {hasMedications && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
          <p className="mb-2 text-xs font-semibold text-amber-700 uppercase dark:text-amber-400">
            💊 Medications
          </p>
          <div className="space-y-2">
            {content.medications?.map((med, idx) => (
              <div
                key={idx}
                className="rounded bg-white/70 p-2 text-sm dark:bg-slate-900/50"
              >
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  {med.name}
                </span>
                {[med.dosage, med.frequency].some(Boolean) && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {med.dosage}
                    {med.dosage && med.frequency && ", "}
                    {med.frequency}
                  </span>
                )}
                {med.duration && (
                  <span className="text-muted-foreground">
                    {" "}
                    for {med.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Care */}
      {hasHomeCare && (
        <div className="mb-3 rounded-md bg-blue-50 p-3 dark:bg-blue-950/30">
          <p className="mb-2 text-xs font-semibold text-blue-700 uppercase dark:text-blue-400">
            🏠 Home Care
          </p>
          <div className="text-muted-foreground space-y-1 text-sm">
            {content.homeCare?.activity && (
              <p>
                <strong>Activity:</strong> {content.homeCare.activity}
              </p>
            )}
            {content.homeCare?.diet && (
              <p>
                <strong>Diet:</strong> {content.homeCare.diet}
              </p>
            )}
            {content.homeCare?.woundCare && (
              <p>
                <strong>Wound Care:</strong> {content.homeCare.woundCare}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {hasFollowUp && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-violet-50 p-3 dark:bg-violet-950/30">
          <CalendarCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <p className="text-sm text-violet-700 dark:text-violet-300">
            <strong>Follow-up:</strong>{" "}
            {content.followUp?.date ?? "Schedule as needed"}
            {content.followUp?.reason && ` — ${content.followUp.reason}`}
          </p>
        </div>
      )}

      {/* Warning Signs */}
      {hasWarningSigns && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-950/30">
          <p className="mb-1 text-xs font-semibold text-red-700 uppercase dark:text-red-400">
            ⚠️ Call us if you notice:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-400">
            {content.warningSigns?.map((sign, idx) => (
              <li key={idx}>• {sign}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
