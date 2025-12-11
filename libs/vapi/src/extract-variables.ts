/**
 * VAPI Dynamic Variables from AI Extraction
 *
 * Transforms normalized entity extraction data into VAPI dynamic variables
 * for personalized and contextually-aware phone calls.
 */

import type { NormalizedEntities } from "@odis-ai/validators/scribe";
import { extractFirstName } from "./utils";
import {
  buildDynamicVariables,
  type BuildVariablesResult,
  type ConditionCategory,
} from "./knowledge-base";

/**
 * Configuration required from clinic/user context
 * These values cannot be extracted from entities and must be provided
 */
export interface VapiCallConfig {
  /** Name of the veterinary clinic */
  clinicName: string;
  /** First name of the vet tech making the call */
  agentName: string;
  /** Clinic phone number spelled out for natural speech */
  clinicPhone: string;
  /** Emergency phone number spelled out for natural speech */
  emergencyPhone: string;
  /** Appointment date spelled out (e.g., "November eighth") */
  appointmentDate: string;
  /** Type of call to make */
  callType: "discharge" | "follow-up";
  /** Optional: subtype for discharge calls */
  subType?: "wellness" | "vaccination";
  /** Optional: scheduled recheck date spelled out */
  recheckDate?: string;
  /** Optional: days since treatment for follow-up context */
  daysSinceTreatment?: number;
  /** Optional: explicit condition category override */
  conditionCategory?: ConditionCategory;
}

/**
 * Generates a discharge summary string from normalized entities
 *
 * Creates a natural-sounding summary that completes the phrase "{petName} [summary]"
 * Used by the VAPI assistant to introduce the call purpose.
 *
 * @param entities - Normalized entities from AI extraction
 * @returns Discharge summary string
 */
export function generateDischargeSummary(entities: NormalizedEntities): string {
  const clinical = entities.clinical;
  const caseType = entities.caseType;

  // Check for vaccination visit
  if (caseType === "vaccination" || clinical.vaccinations?.length) {
    const vaccineNames = clinical.vaccinations
      ?.map((v: { name: string }) => v.name)
      .join(", ");
    if (vaccineNames) {
      return `received ${vaccineNames} vaccination${
        clinical.vaccinations!.length > 1 ? "s" : ""
      }`;
    }
    return "received vaccinations";
  }

  // Check for surgery
  if (caseType === "surgery" || clinical.procedures?.length) {
    const procedure = clinical.procedures?.[0];
    if (procedure) {
      return `had ${procedure}`;
    }
    return "had a procedure";
  }

  // Check for dental
  if (caseType === "dental") {
    return "had a dental procedure";
  }

  // Use primary diagnosis if available
  const diagnosis = clinical.diagnoses?.[0];
  if (diagnosis) {
    return `was seen for ${diagnosis}`;
  }

  // Use chief complaint as fallback
  const chiefComplaint = clinical.chiefComplaint;
  if (chiefComplaint) {
    return `was seen for ${chiefComplaint}`;
  }

  // Use visit reason as final fallback
  const visitReason = clinical.visitReason;
  if (visitReason) {
    return `was seen for ${visitReason}`;
  }

  // Generic fallback based on case type
  switch (caseType) {
    case "checkup":
    case "exam":
      return "was seen for a wellness exam";
    case "emergency":
      return "was seen for an emergency visit";
    case "follow_up":
      return "was seen for a follow-up visit";
    case "diagnostic":
      return "was seen for diagnostic testing";
    case "consultation":
      return "was seen for a consultation";
    default:
      return "was seen at the clinic";
  }
}

/**
 * Builds complete VAPI dynamic variables from normalized entities with knowledge base integration
 *
 * This is the main bridge function that:
 * 1. Extracts flat variables from NormalizedEntities
 * 2. Determines the condition category from diagnoses/chief complaint
 * 3. Loads the appropriate knowledge base for that category
 * 4. Returns complete, validated variables with assessment questions, warning signs, etc.
 *
 * @param entities - Normalized entities from AI extraction (scribe or case metadata)
 * @param config - Clinic configuration (values that can't be extracted from entities)
 * @returns BuildVariablesResult with complete variables and knowledge base
 *
 * @example
 * ```typescript
 * // From scribe API
 * const { entities } = await normalizeScribe(input);
 * const result = buildVapiVariablesFromEntities(entities, {
 *   clinicName: "Happy Paws Vet",
 *   agentName: "Sarah",
 *   clinicPhone: "four zero eight, two five nine, one two three four",
 *   emergencyPhone: "four zero eight, eight six five, four three two one",
 *   appointmentDate: "November eighth",
 *   callType: "follow-up",
 * });
 *
 * // From case metadata
 * const { data: caseData } = await supabase.from('cases').select('metadata').eq('id', caseId).single();
 * const entities = caseData.metadata as NormalizedEntities;
 * const result = buildVapiVariablesFromEntities(entities, clinicConfig);
 * ```
 */
export function buildVapiVariablesFromEntities(
  entities: NormalizedEntities,
  config: VapiCallConfig,
): BuildVariablesResult {
  // Step 1: Extract flat variables from entities
  const extracted = extractVapiVariablesFromEntities(entities);

  // Step 2: Determine condition from diagnoses, chief complaint, or treatments
  // Priority: primary diagnosis > chief complaint > first treatment > procedures
  const condition =
    extracted.primary_diagnosis ??
    extracted.chief_complaint ??
    entities.clinical.chiefComplaint ??
    entities.clinical.treatments?.[0] ??
    entities.clinical.procedures?.[0];

  // Step 3: Determine pet species for species-specific guidance
  const petSpecies = mapSpeciesToVapi(entities.patient.species);

  // Step 4: Generate discharge summary from entities
  const dischargeSummary = generateDischargeSummary(entities);

  // Step 5: Build complete variables with knowledge base integration
  return buildDynamicVariables({
    baseVariables: {
      // Required clinic config
      clinicName: config.clinicName,
      agentName: config.agentName,
      clinicPhone: config.clinicPhone,
      emergencyPhone: config.emergencyPhone,
      appointmentDate: config.appointmentDate,
      callType: config.callType,

      // Generated discharge summary
      dischargeSummary,

      // Patient info from entities
      petName: extracted.pet_name_first ?? entities.patient.name,
      ownerName: extracted.owner_name_extracted ?? entities.patient.owner.name,

      // Clinical info from entities
      condition,
      medications: extracted.medications_detailed,
      vaccinations: extracted.vaccinations,

      // Optional config fields
      subType: config.subType,
      recheckDate: config.recheckDate,
      daysSinceTreatment: config.daysSinceTreatment,

      // Pet metadata for context
      petSpecies,

      // Billing data - SOURCE OF TRUTH for what actually happened
      // Only discuss items in servicesPerformed, ignore servicesDeclined
      servicesPerformed: entities.clinical.productsServicesProvided,
      servicesDeclined: entities.clinical.productsServicesDeclined,
    },
    // Use explicit category if provided, otherwise let it be inferred from condition
    conditionCategory: config.conditionCategory,
    strict: false,
    // Disable static knowledge base defaults - only use AI-generated intelligence
    useDefaults: false,
  });
}

/**
 * Maps entity species to VAPI species type
 */
function mapSpeciesToVapi(
  species: string | undefined,
): "dog" | "cat" | "other" | undefined {
  if (!species) return undefined;

  const normalized = species.toLowerCase();
  if (normalized === "dog" || normalized === "canine") return "dog";
  if (normalized === "cat" || normalized === "feline") return "cat";
  return "other";
}

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
    // patient_name stores the full name for reference/logging
    // pet_name_first stores only the first word (for natural speech in VAPI calls)
    if (patient.name) {
      variables.patient_name = patient.name;
      variables.pet_name_first = extractFirstName(patient.name);
    }
    if (patient.species) variables.patient_species = patient.species;
    if (patient.breed) variables.patient_breed = patient.breed;
    if (patient.age) variables.patient_age = patient.age;
    if (patient.sex) variables.patient_sex = patient.sex;
    if (patient.weight) variables.patient_weight = patient.weight;

    // Owner information
    if (patient.owner?.name) {
      variables.owner_name_extracted = patient.owner.name;
    }
    if (patient.owner?.phone) {
      variables.owner_phone_extracted = patient.owner.phone;
    }
    if (patient.owner?.email) {
      variables.owner_email_extracted = patient.owner.email;
    }
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
      if (vitals.respiratoryRate) {
        variables.vital_respiratory_rate = vitals.respiratoryRate;
      }
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

    // Medications - format for natural speech (prescribed take-home meds ONLY)
    if (clinical.medications && clinical.medications.length > 0) {
      const medicationsList = clinical.medications
        .map(
          (med: {
            name: string;
            dosage?: string;
            frequency?: string;
            route?: string;
            duration?: string;
          }) => {
            let medStr = med.name;
            if (med.dosage) medStr += ` ${med.dosage}`;
            if (med.frequency) medStr += ` ${med.frequency}`;
            if (med.route) medStr += ` by ${med.route}`;
            if (med.duration) medStr += ` for ${med.duration}`;
            return medStr;
          },
        )
        .join("; ");

      variables.medications_detailed = medicationsList;

      // Also provide simple medication names list
      variables.medication_names = clinical.medications
        .map((m: { name: string }) => m.name)
        .join(", ");

      // Extract frequency for medication reminders (use first medication as representative)
      const firstMed = clinical.medications[0];
      if (firstMed?.frequency) {
        variables.medication_frequency = firstMed.frequency;
      }
    }

    // Vaccinations - vaccines administered during the visit (separate from medications)
    if (clinical.vaccinations && clinical.vaccinations.length > 0) {
      // Simple list of vaccine names
      variables.vaccinations = clinical.vaccinations
        .map((v: { name: string }) => v.name)
        .join(", ");

      // Detailed list including manufacturer if available
      const vaccinationsList = clinical.vaccinations
        .map((vax: { name: string; manufacturer?: string }) => {
          let vaxStr = vax.name;
          if (vax.manufacturer) vaxStr += ` (${vax.manufacturer})`;
          return vaxStr;
        })
        .join("; ");
      variables.vaccinations_detailed = vaccinationsList;
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

    // Billing data - SOURCE OF TRUTH for what actually happened
    // This takes precedence over notes when determining what to discuss
    if (
      clinical.productsServicesProvided &&
      clinical.productsServicesProvided.length > 0
    ) {
      variables.services_performed =
        clinical.productsServicesProvided.join("; ");
    }

    // Services declined by owner - exposed so agent knows what NOT to mention
    if (
      clinical.productsServicesDeclined &&
      clinical.productsServicesDeclined.length > 0
    ) {
      variables.services_declined =
        clinical.productsServicesDeclined.join("; ");
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
