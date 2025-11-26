/**
 * VAPI Dynamic Variables from AI Extraction
 *
 * Transforms normalized entity extraction data into VAPI dynamic variables
 * for personalized and contextually-aware phone calls.
 */

import type { NormalizedEntities } from "~/lib/validators/scribe";

/**
 * Extract VAPI dynamic variables from AI-extracted entities
 *
 * Takes the normalized entities from AI extraction and converts them
 * into snake_case variables that can be interpolated in VAPI prompts.
 *
 * @param entities - Normalized entities from AI extraction
 * @returns Object with dynamic variables for VAPI
 */
export function extractVapiVariablesFromEntities(
  entities: NormalizedEntities | null | undefined,
): Record<string, string> {
  if (!entities) {
    return {};
  }

  const variables: Record<string, string> = {};

  // Patient Information
  if (entities.patient) {
    const patient = entities.patient;

    // Patient demographics
    if (patient.name) variables.patient_name = patient.name;
    if (patient.species) variables.patient_species = patient.species;
    if (patient.breed) variables.patient_breed = patient.breed;
    if (patient.age) variables.patient_age = patient.age;
    if (patient.sex) variables.patient_sex = patient.sex;
    if (patient.weight) variables.patient_weight = patient.weight;

    // Owner information
    if (patient.owner?.name)
      variables.owner_name_extracted = patient.owner.name;
    if (patient.owner?.phone)
      variables.owner_phone_extracted = patient.owner.phone;
    if (patient.owner?.email)
      variables.owner_email_extracted = patient.owner.email;
  }

  // Clinical Information
  if (entities.clinical) {
    const clinical = entities.clinical;

    // Chief complaint and visit reason
    if (clinical.chiefComplaint) {
      variables.chief_complaint = clinical.chiefComplaint;
    }
    if (clinical.visitReason) {
      variables.visit_reason = clinical.visitReason;
    }
    if (clinical.presentingSymptoms && clinical.presentingSymptoms.length > 0) {
      variables.presenting_symptoms = clinical.presentingSymptoms.join(", ");
    }

    // Vital signs
    if (clinical.vitalSigns) {
      const vitals = clinical.vitalSigns;
      if (vitals.temperature) variables.vital_temperature = vitals.temperature;
      if (vitals.heartRate) variables.vital_heart_rate = vitals.heartRate;
      if (vitals.respiratoryRate)
        variables.vital_respiratory_rate = vitals.respiratoryRate;
      if (vitals.weight) variables.vital_weight = vitals.weight;
    }

    // Physical exam and findings
    if (
      clinical.physicalExamFindings &&
      clinical.physicalExamFindings.length > 0
    ) {
      variables.physical_exam_findings =
        clinical.physicalExamFindings.join(", ");
    }

    // Diagnoses
    if (clinical.diagnoses && clinical.diagnoses.length > 0) {
      variables.diagnoses = clinical.diagnoses.join(", ");
      variables.primary_diagnosis = clinical.diagnoses[0] ?? "";
    }

    if (
      clinical.differentialDiagnoses &&
      clinical.differentialDiagnoses.length > 0
    ) {
      variables.differential_diagnoses =
        clinical.differentialDiagnoses.join(", ");
    }

    // Medications - format for natural speech
    if (clinical.medications && clinical.medications.length > 0) {
      const medicationsList = clinical.medications
        .map((med) => {
          let medStr = med.name;
          if (med.dosage) medStr += ` ${med.dosage}`;
          if (med.frequency) medStr += ` ${med.frequency}`;
          if (med.route) medStr += ` by ${med.route}`;
          if (med.duration) medStr += ` for ${med.duration}`;
          return medStr;
        })
        .join("; ");

      variables.medications_detailed = medicationsList;

      // Also provide simple medication names list
      variables.medication_names = clinical.medications
        .map((m) => m.name)
        .join(", ");

      // Extract frequency for medication reminders (use first medication as representative)
      const firstMed = clinical.medications[0];
      if (firstMed?.frequency) {
        variables.medication_frequency = firstMed.frequency;
      }
    }

    // Treatments and procedures
    if (clinical.treatments && clinical.treatments.length > 0) {
      variables.treatments = clinical.treatments.join(", ");
    }
    if (clinical.procedures && clinical.procedures.length > 0) {
      variables.procedures = clinical.procedures.join(", ");
    }

    // Lab and imaging results
    if (clinical.labResults && clinical.labResults.length > 0) {
      variables.lab_results = clinical.labResults.join("; ");
    }
    if (clinical.imagingResults && clinical.imagingResults.length > 0) {
      variables.imaging_results = clinical.imagingResults.join("; ");
    }

    // Follow-up information
    if (clinical.followUpInstructions) {
      variables.follow_up_instructions = clinical.followUpInstructions;
    }
    if (clinical.followUpDate) {
      variables.follow_up_date = clinical.followUpDate;
    }
    if (clinical.recheckRequired !== undefined) {
      variables.recheck_required = clinical.recheckRequired ? "yes" : "no";
    }

    // Clinical notes and prognosis
    if (clinical.clinicalNotes) {
      variables.clinical_notes = clinical.clinicalNotes;
    }
    if (clinical.prognosis) {
      variables.prognosis = clinical.prognosis;
    }
  }

  // Case Type
  if (entities.caseType && entities.caseType !== "unknown") {
    variables.case_type = entities.caseType;
  }

  // Confidence scores (for debugging/monitoring)
  if (entities.confidence) {
    variables.extraction_confidence = entities.confidence.overall.toFixed(2);
  }

  return variables;
}

/**
 * Merge extracted variables with manually provided variables
 *
 * Manually provided variables take precedence over extracted ones.
 * This allows overriding extracted data if needed.
 *
 * @param extractedVars - Variables from AI extraction
 * @param manualVars - Variables manually provided
 * @returns Merged variables with manual vars taking precedence
 */
export function mergeVapiVariables(
  extractedVars: Record<string, string>,
  manualVars: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...extractedVars,
    ...manualVars,
  };
}

/**
 * Create VAPI-ready medications string for natural speech
 *
 * Formats medication data into a natural-sounding string that
 * the VAPI assistant can speak clearly to pet owners.
 *
 * Example output:
 * "Carprofen 75 milligrams twice daily by mouth for 7 days,
 *  and Cephalexin 500 milligrams three times daily by mouth for 10 days"
 *
 * @param medications - Array of medication objects from extraction
 * @returns Formatted medication string for speech
 */
export function formatMedicationsForSpeech(
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    route?: string;
  }>,
): string {
  if (!medications || medications.length === 0) {
    return "";
  }

  const formatted = medications.map((med) => {
    const parts = [med.name];

    // Add dosage (convert "mg" to "milligrams" for speech)
    if (med.dosage) {
      const dosage = med.dosage
        .replace(/mg/gi, "milligrams")
        .replace(/ml/gi, "milliliters")
        .replace(/g/gi, "grams");
      parts.push(dosage);
    }

    // Add frequency
    if (med.frequency) {
      parts.push(med.frequency);
    }

    // Add route
    if (med.route) {
      parts.push(`by ${med.route}`);
    }

    // Add duration
    if (med.duration) {
      parts.push(`for ${med.duration}`);
    }

    return parts.join(" ");
  });

  // Join with commas and "and" for last item
  if (formatted.length === 1) {
    return formatted[0]!;
  } else if (formatted.length === 2) {
    return `${formatted[0]} and ${formatted[1]}`;
  } else {
    const allButLast = formatted.slice(0, -1).join(", ");
    const last = formatted[formatted.length - 1];
    return `${allButLast}, and ${last}`;
  }
}
