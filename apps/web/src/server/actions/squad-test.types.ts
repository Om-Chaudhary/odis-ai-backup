/**
 * Types and constants for squad test functionality
 * Separated from server actions to allow client-side imports
 */

/**
 * Variables expected by the follow-up squad prompts (snake_case)
 */
export interface SquadTestVariables {
  // Basic Info
  agent_name: string;
  clinic_name: string;
  pet_name: string;
  owner_name: string;
  patient_species: string;
  patient_breed?: string;

  // Visit Details
  visit_reason: string;
  primary_diagnosis: string;
  condition_category: string;
  call_type: string;
  appointment_date: string;

  // Contact Info
  clinic_phone: string;
  emergency_phone: string;
  clinic_is_open: string;

  // Patient Details
  patient_age?: string;
  patient_sex?: string;
  patient_weight?: string;
  prognosis?: string;

  // Medications
  medications_detailed?: string;
  medication_names?: string;

  // Follow-up
  procedures?: string;
  recheck_required?: string;
  recheck_date?: string;

  // Clinical Arrays (JSON stringified)
  warning_signs_to_monitor?: string;
  normal_post_treatment_expectations?: string;
  emergency_criteria?: string;
  urgent_criteria?: string;
  assessment_questions?: string;

  // Billing data (source of truth for what actually happened)
  services_performed?: string; // Semicolon-separated list of services that were actually done
  services_declined?: string; // For debugging only - not used in prompts (silent approach)
}

/**
 * Result of initiating a squad test call
 */
export interface SquadTestCallResult {
  success: boolean;
  callId?: string;
  status?: string;
  error?: string;
}

/**
 * A recent case with valid dynamic_variables for prefilling
 */
export interface RecentCaseOption {
  id: string;
  petName: string;
  ownerName: string;
  diagnosis: string;
  createdAt: string;
  dynamicVariables: Record<string, unknown>;
}

/**
 * Default test variables for a clinical follow-up scenario
 */
export const DEFAULT_SQUAD_TEST_VARIABLES: SquadTestVariables = {
  // Basic Info
  agent_name: "Sarah",
  clinic_name: "Alum Rock Pet Hospital",
  pet_name: "Luna",
  owner_name: "Taylor",
  patient_species: "dog",
  patient_breed: "Golden Retriever",

  // Visit Details
  visit_reason: "vomiting and diarrhea",
  primary_diagnosis: "Acute gastroenteritis",
  condition_category: "gastrointestinal",
  call_type: "follow-up",
  appointment_date: "December eighth",

  // Contact Info
  clinic_phone: "four zero eight, two five eight, two seven three five",
  emergency_phone: "four zero eight, eight six five, four three two one",
  clinic_is_open: "true",

  // Patient Details
  patient_age: "3 years",
  patient_sex: "Female spayed",
  patient_weight: "65 pounds",
  prognosis: "Good with treatment",

  // Medications
  medications_detailed:
    "Metronidazole 250mg twice daily with food for 7 days, Cerenia 60mg once daily for 3 days for nausea",
  medication_names: "Metronidazole, Cerenia",

  // Follow-up
  procedures: "",
  recheck_required: "yes",
  recheck_date: "December fifteenth if symptoms persist",

  // Clinical Arrays
  warning_signs_to_monitor: JSON.stringify([
    "Blood in vomit or stool",
    "Lethargy or weakness",
    "Not eating for more than 24 hours",
    "Fever",
    "Abdominal pain when touched",
  ]),
  normal_post_treatment_expectations: JSON.stringify([
    "Mild decrease in appetite for 1-2 days",
    "Soft stools that gradually firm up",
    "Slightly less energy than usual",
  ]),
  emergency_criteria: JSON.stringify([
    "Bloody diarrhea or vomiting blood",
    "Collapse or inability to stand",
    "Severe abdominal bloating",
    "Difficulty breathing",
  ]),
  urgent_criteria: JSON.stringify([
    "Vomiting more than 3 times in 24 hours",
    "Complete refusal to eat or drink",
    "Severe lethargy",
    "Fever above 103°F",
  ]),
  assessment_questions: JSON.stringify([
    {
      question: "How has {{pet_name}}'s appetite been since the visit?",
      context: "Assess if GI symptoms are improving",
      expectedPositiveResponse: [
        "eating normally",
        "good appetite",
        "eating well",
      ],
      concerningResponses: ["not eating", "refusing food", "no appetite"],
      followUpIfConcerning: "When was the last time {{pet_name}} ate anything?",
      priority: 1,
    },
    {
      question: "Any more vomiting or diarrhea?",
      context: "Monitor primary symptoms",
      expectedPositiveResponse: ["no", "none", "stopped", "much better"],
      concerningResponses: ["yes", "still vomiting", "still has diarrhea"],
      followUpIfConcerning: "How many times today?",
      priority: 1,
    },
    {
      question: "How's {{pet_name}}'s energy level?",
      context: "Assess overall recovery",
      expectedPositiveResponse: ["normal", "good", "playful", "back to normal"],
      concerningResponses: ["tired", "lethargic", "sleeping a lot", "weak"],
      followUpIfConcerning:
        "Is {{pet_name}} able to get up and walk around okay?",
      priority: 2,
    },
  ]),

  // Billing data - source of truth for what actually happened
  // Only items in services_performed should be discussed
  services_performed:
    "Office Visit; Metronidazole 250mg #14; Cerenia 60mg #3; Fecal Test",
  services_declined: "", // Empty = nothing was declined
};
