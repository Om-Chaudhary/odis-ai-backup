/**
 * Call Script Structured Preview
 * Shows what the AI voice agent will say in a conversational format
 */

import { Pill, Heart, CalendarCheck, AlertTriangle } from "lucide-react";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";

interface CallScriptStructuredPreviewProps {
  content: StructuredDischargeSummary;
}

export function CallScriptStructuredPreview({
  content,
}: CallScriptStructuredPreviewProps) {
  const hasMedications = content.medications && content.medications.length > 0;
  const hasHomeCare =
    content.homeCare &&
    [
      content.homeCare.activity,
      content.homeCare.diet,
      content.homeCare.woundCare,
    ].some(Boolean);
  const hasFollowUp = content.followUp?.required;
  const hasWarningSigns =
    content.warningSigns && content.warningSigns.length > 0;

  return (
    <div className="max-h-64 space-y-3 overflow-auto rounded-lg border bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-4 dark:from-teal-950/30 dark:to-emerald-950/20">
      {/* Opening - Greeting */}
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
          1
        </div>
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Greeting
          </p>
          <p className="text-muted-foreground text-sm">
            &ldquo;Hi, this is ODIS calling from the veterinary clinic about{" "}
            <span className="font-medium text-teal-700 dark:text-teal-400">
              {content.patientName}
            </span>
            &apos;s visit today...&rdquo;
          </p>
        </div>
      </div>

      {/* Visit Summary */}
      {content.appointmentSummary && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
            2
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Visit Summary
            </p>
            <p className="text-muted-foreground text-sm">
              {content.appointmentSummary}
            </p>
          </div>
        </div>
      )}

      {/* Medications */}
      {hasMedications && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            <Pill className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Medications to Give
            </p>
            <ul className="mt-1 space-y-1">
              {content.medications?.map((med, idx) => (
                <li key={idx} className="text-muted-foreground text-sm">
                  • <span className="font-medium">{med.name}</span>
                  {med.frequency && ` - ${med.frequency}`}
                  {med.duration && ` for ${med.duration}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Home Care */}
      {hasHomeCare && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            <Heart className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Home Care Tips
            </p>
            <div className="text-muted-foreground mt-1 space-y-0.5 text-sm">
              {content.homeCare?.activity && (
                <p>• Activity: {content.homeCare.activity}</p>
              )}
              {content.homeCare?.diet && <p>• Diet: {content.homeCare.diet}</p>}
              {content.homeCare?.woundCare && (
                <p>• Wound care: {content.homeCare.woundCare}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up */}
      {hasFollowUp && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
            <CalendarCheck className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              Follow-up Reminder
            </p>
            <p className="text-muted-foreground text-sm">
              &ldquo;Please schedule a follow-up
              {content.followUp?.date && ` ${content.followUp.date}`}
              {content.followUp?.reason && ` for ${content.followUp.reason}`}
              ...&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Warning Signs */}
      {hasWarningSigns && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            <AlertTriangle className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              When to Call Back
            </p>
            <p className="text-muted-foreground text-sm">
              &ldquo;Please call us right away if you notice:{" "}
              {content.warningSigns?.join(", ")}...&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Closing */}
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-white">
          ✓
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Closing
          </p>
          <p className="text-muted-foreground text-sm">
            &ldquo;Do you have any questions about {content.patientName}&apos;s
            care?&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
