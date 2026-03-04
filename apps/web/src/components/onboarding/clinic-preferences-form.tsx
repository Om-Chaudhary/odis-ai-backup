"use client";

import { useState } from "react";
import { Button, Input, Label } from "@odis-ai/shared/ui";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("clinic-preferences-form");

const SPECIES_OPTIONS = [
  "Dogs",
  "Cats",
  "Small mammals",
  "Birds",
  "Reptiles",
] as const;

const EMERGENCY_SYMPTOM_OPTIONS = [
  "Difficulty breathing",
  "Uncontrolled bleeding",
  "Seizures",
  "Ingestion of toxins/poisons",
  "Inability to urinate",
  "Severe vomiting/diarrhea (blood present)",
  "Collapse/inability to stand",
  "Bloated/distended abdomen",
  "Trauma (hit by car, fall, etc.)",
  "Eye injuries",
] as const;

const DEFAULT_GREETING =
  "Thank you for calling [Clinic Name]. We are currently closed. Our regular business hours are [hours]. If this is a life-threatening emergency, please contact [ER Hospital] at [ER phone]. Otherwise, leave a message and we will return your call during business hours.";

interface ClinicPreferencesFormProps {
  existingData?: {
    clinic_email: string | null;
    after_hours_greeting: string | null;
    species: string[] | null;
    species_other: string | null;
    never_schedule_types: string | null;
    emergency_symptoms: string[] | null;
    emergency_symptoms_other: string | null;
    er_referral_preference: string | null;
    preferred_er_name: string | null;
    scheduling_instructions: string | null;
    cancellation_handling: string | null;
    completed_at: string | null;
  } | null;
}

export function ClinicPreferencesForm({
  existingData,
}: ClinicPreferencesFormProps) {
  const isAlreadyCompleted = !!existingData?.completed_at;

  const [clinicEmail, setClinicEmail] = useState(
    existingData?.clinic_email ?? "",
  );
  const [afterHoursGreeting, setAfterHoursGreeting] = useState(
    existingData?.after_hours_greeting ?? DEFAULT_GREETING,
  );
  const [species, setSpecies] = useState<string[]>(existingData?.species ?? []);
  const [speciesOther, setSpeciesOther] = useState(
    existingData?.species_other ?? "",
  );
  const [neverScheduleTypes, setNeverScheduleTypes] = useState(
    existingData?.never_schedule_types ?? "",
  );
  const [emergencySymptoms, setEmergencySymptoms] = useState<string[]>(
    existingData?.emergency_symptoms ?? [],
  );
  const [emergencySymptomsOther, setEmergencySymptomsOther] = useState(
    existingData?.emergency_symptoms_other ?? "",
  );
  const [erReferralPreference, setErReferralPreference] = useState<
    "nearest" | "preferred"
  >(
    (existingData?.er_referral_preference as "nearest" | "preferred") ??
      "nearest",
  );
  const [preferredErName, setPreferredErName] = useState(
    existingData?.preferred_er_name ?? "",
  );
  const [schedulingInstructions, setSchedulingInstructions] = useState(
    existingData?.scheduling_instructions ?? "",
  );
  const [cancellationHandling, setCancellationHandling] = useState<string>(
    existingData?.cancellation_handling ?? "notify_staff",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);

  const toggleSpecies = (s: string) => {
    setSpecies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const toggleSymptom = (s: string) => {
    setEmergencySymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/onboarding/clinic-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicEmail,
          afterHoursGreeting,
          species,
          speciesOther,
          neverScheduleTypes,
          emergencySymptoms,
          emergencySymptomsOther,
          erReferralPreference,
          preferredErName,
          schedulingInstructions,
          cancellationHandling,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save preferences");
      }

      logger.info("Clinic preferences saved successfully");
      setIsCompleted(true);
    } catch (error) {
      logger.error("Failed to save clinic preferences", { error });
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">
              Clinic Preferences Saved
            </h3>
            <p className="text-sm text-green-700">
              Thank you! We'll use these preferences to configure your AI
              assistant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Clinic Email */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="clinic-email" className="text-base font-semibold">
            Best clinic email for clients
          </Label>
          <p className="text-sm text-slate-500">
            The email address clients should use to reach your clinic.
          </p>
        </div>
        <Input
          id="clinic-email"
          type="email"
          placeholder="clinic@example.com"
          value={clinicEmail}
          onChange={(e) => setClinicEmail(e.target.value)}
        />
      </div>

      {/* Section 2: After-hours Greeting */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="greeting" className="text-base font-semibold">
            After-hours greeting message
          </Label>
          <p className="text-sm text-slate-500">
            The message Odis will use when answering after-hours calls.
          </p>
        </div>
        <textarea
          id="greeting"
          className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={afterHoursGreeting}
          onChange={(e) => setAfterHoursGreeting(e.target.value)}
        />
      </div>

      {/* Section 3: Species */}
      <div className="space-y-3">
        <div>
          <span className="text-base font-semibold">
            Species your clinic sees
          </span>
          <p className="text-sm text-slate-500">Select all that apply.</p>
        </div>
        <div className="space-y-2">
          {SPECIES_OPTIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={species.includes(s)}
                onChange={() => toggleSpecies(s)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              />
              {s}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={species.includes("Other")}
              onChange={() => toggleSpecies("Other")}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Other
          </label>
          {species.includes("Other") && (
            <Input
              placeholder="Please specify other species"
              value={speciesOther}
              onChange={(e) => setSpeciesOther(e.target.value)}
              className="ml-6 max-w-xs"
            />
          )}
        </div>
      </div>

      {/* Section 4: Never Schedule */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="never-schedule" className="text-base font-semibold">
            Appointment types Odis should NEVER schedule after hours
          </Label>
          <p className="text-sm text-slate-500">
            List any appointment types that should not be booked by the AI.
          </p>
        </div>
        <Input
          id="never-schedule"
          type="text"
          placeholder="e.g., Surgery, Dental procedures, etc."
          value={neverScheduleTypes}
          onChange={(e) => setNeverScheduleTypes(e.target.value)}
        />
      </div>

      {/* Section 5: Emergency Symptoms */}
      <div className="space-y-3">
        <div>
          <span className="text-base font-semibold">
            Symptoms to treat as emergency/ER
          </span>
          <p className="text-sm text-slate-500">
            Select symptoms that should trigger an emergency referral.
          </p>
        </div>
        <div className="space-y-2">
          {EMERGENCY_SYMPTOM_OPTIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={emergencySymptoms.includes(s)}
                onChange={() => toggleSymptom(s)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              />
              {s}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={emergencySymptoms.includes("Other")}
              onChange={() => toggleSymptom("Other")}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Other
          </label>
          {emergencySymptoms.includes("Other") && (
            <Input
              placeholder="Please specify other symptoms"
              value={emergencySymptomsOther}
              onChange={(e) => setEmergencySymptomsOther(e.target.value)}
              className="ml-6 max-w-xs"
            />
          )}
        </div>
      </div>

      {/* Section 6: ER Referral */}
      <div className="space-y-3">
        <div>
          <span className="text-base font-semibold">
            Emergency referral preference
          </span>
          <p className="text-sm text-slate-500">
            When an emergency is identified, how should the caller be directed?
          </p>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="er-referral"
              checked={erReferralPreference === "nearest"}
              onChange={() => setErReferralPreference("nearest")}
              className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Direct to nearest ER
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="er-referral"
              checked={erReferralPreference === "preferred"}
              onChange={() => setErReferralPreference("preferred")}
              className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Direct to our preferred ER hospital
          </label>
          {erReferralPreference === "preferred" && (
            <Input
              placeholder="Preferred ER hospital name"
              value={preferredErName}
              onChange={(e) => setPreferredErName(e.target.value)}
              className="ml-6 max-w-xs"
            />
          )}
        </div>
      </div>

      {/* Section 7: Scheduling Instructions */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="scheduling" className="text-base font-semibold">
            How to place after-hours appointments on schedule
          </Label>
          <p className="text-sm text-slate-500">
            Instructions for how Odis should add appointments to your calendar.
          </p>
        </div>
        <textarea
          id="scheduling"
          className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="e.g., Add to the next available slot on the following business day..."
          value={schedulingInstructions}
          onChange={(e) => setSchedulingInstructions(e.target.value)}
        />
      </div>

      {/* Section 8: Cancellation Handling */}
      <div className="space-y-3">
        <div>
          <span className="text-base font-semibold">
            Appointment cancellation handling
          </span>
          <p className="text-sm text-slate-500">
            When a caller wants to cancel an appointment, what should Odis do?
          </p>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="cancellation"
              checked={cancellationHandling === "cancel_auto"}
              onChange={() => setCancellationHandling("cancel_auto")}
              className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Cancel automatically
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="cancellation"
              checked={cancellationHandling === "offer_reschedule"}
              onChange={() => setCancellationHandling("offer_reschedule")}
              className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Offer to reschedule
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="cancellation"
              checked={cancellationHandling === "notify_staff"}
              onChange={() => setCancellationHandling("notify_staff")}
              className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            Notify staff only (don't cancel)
          </label>
        </div>
      </div>

      {/* Submit */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Preferences"
        )}
      </Button>
    </div>
  );
}
