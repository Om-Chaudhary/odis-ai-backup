# VAPI Variable Reference

**Purpose**: Complete reference for all dynamic variables available in VAPI discharge follow-up calls.
**Last Updated**: December 2024

---

## Variable Categories

| Category | Description | Source |
|----------|-------------|--------|
| Core Identity | Always present, required for calls | Clinic config + Entity extraction |
| Patient Info | Pet and owner demographics | Entity extraction |
| Clinical Data | Diagnosis, treatments, visit details | Entity extraction |
| Medications | Prescribed take-home medications | Entity extraction |
| Billing Data | Services performed/declined | Entity extraction (billing) |
| AI Intelligence | LLM-generated assessment content | `generateCallIntelligenceFromEntities()` |
| Boolean Flags | Conditional gating flags | Computed from data presence |
| Formatted Text | Pre-formatted arrays for speech | Formatting helpers |
| Runtime | Added at call execution time | Call scheduling logic |

---

## Core Identity Variables

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `clinic_name` | string | **Always** | Name of the veterinary clinic | "Happy Paws Veterinary" |
| `agent_name` | string | **Always** | First name of vet tech persona | "Sarah" |
| `pet_name` | string | **Always** | Pet's first name only | "Max" |
| `owner_name` | string | **Always** | Pet owner's name | "John Smith" |
| `appointment_date` | string | **Always** | Visit date, spelled out for speech | "November fifteenth" |
| `clinic_phone` | string | **Always** | Clinic phone, spelled out | "four zero eight, two five nine, one two three four" |
| `emergency_phone` | string | **Always** | Emergency phone, spelled out | "four zero eight, nine one one, two two two two" |
| `call_type` | string | **Always** | Type of call | "discharge" or "follow-up" |
| `discharge_summary` | string | **Always** | LLM-generated brief summary | "received vaccinations" or "was seen for ear infection" |

**Source**: `VapiCallConfig` (clinic config) + `extractVapiVariablesFromEntities()` + `generateDischargeSummary()`

---

## Patient Information Variables

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `patient_name` | string | Usually | Full pet name (may include last name) | "Max Smith" |
| `pet_name_first` | string | **Always** | First word of pet name | "Max" |
| `patient_species` | string | Unreliable | Species of pet | "dog", "cat", "other", "unknown" |
| `patient_breed` | string | Sometimes | Breed if extracted | "Golden Retriever" |
| `patient_age` | string | Sometimes | Age with unit | "3 years" |
| `patient_sex` | string | Sometimes | Sex of pet | "male", "spayed female" |
| `patient_weight` | string | Sometimes | Weight with unit | "45 lbs" |
| `owner_phone_extracted` | string | Sometimes | Owner phone from notes | "555-123-4567" |
| `owner_email_extracted` | string | Rarely | Owner email if present | "john@email.com" |

**Note**: `patient_species` is often unreliable ("unknown" or "other"). Avoid species-specific prompt logic.

**Source**: `extractVapiVariablesFromEntities()` from `NormalizedEntities.patient`

---

## Clinical Data Variables

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `case_type` | string | **Always** | Type of case | "vaccination", "diagnostic", "exam", "surgery" |
| `visit_reason` | string | Sometimes | Reason for visit | "annual checkup" |
| `chief_complaint` | string | Sometimes | Primary complaint | "vomiting for 2 days" |
| `presenting_symptoms` | string | Sometimes | Comma-separated symptoms | "lethargy, loss of appetite" |
| `diagnoses` | string | Sometimes | All diagnoses | "otitis externa, allergic dermatitis" |
| `primary_diagnosis` | string | Sometimes | First/main diagnosis | "otitis externa" |
| `differential_diagnoses` | string | Rarely | Alternative diagnoses | "food allergy, contact dermatitis" |
| `treatments` | string | Sometimes | In-hospital treatments | "ear flush, IV fluids" |
| `procedures` | string | Sometimes | Procedures performed | "dental cleaning, mass removal" |
| `physical_exam_findings` | string | Rarely | PE findings | "mild dehydration, enlarged lymph nodes" |
| `lab_results` | string | Rarely | Lab results summary | "elevated liver enzymes" |
| `imaging_results` | string | Rarely | X-ray/ultrasound results | "no foreign body detected" |
| `prognosis` | string | Rarely | Expected outcome | "good with treatment" |
| `clinical_notes` | string | Rarely | Additional notes | "recheck in 2 weeks" |

**Source**: `extractVapiVariablesFromEntities()` from `NormalizedEntities.clinical`

---

## Medication Variables

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `medication_names` | string | When Rx | Simple comma list | "Carprofen, Cephalexin" |
| `medications_detailed` | string | When Rx | Full details with dosage | "Carprofen 75mg twice daily; Cephalexin 500mg three times daily" |
| `medication_frequency` | string | When Rx | Representative frequency | "twice daily" |
| `vaccinations` | string | When given | Vaccines administered | "Rabies, DHPP" |
| `vaccinations_detailed` | string | When given | With manufacturer | "Rabies (Merial); DHPP (Zoetis)" |

**Source**: `extractVapiVariablesFromEntities()` from `NormalizedEntities.clinical.medications`

---

## Billing Data Variables

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `services_performed` | string | **Always** | Semicolon-separated billing items | "EXAMINATION OFFICE VISIT; BORDETELLA K9 INJECTABLE; RABIES K9 3 YEAR" |
| `services_declined` | string | Sometimes | Services owner declined | "Bloodwork panel" |

**CRITICAL RULE**: The AI must **NEVER** mention, recommend, or bring up anything in `services_declined`. This is enforced in the prompt.

**Source**: `extractVapiVariablesFromEntities()` from `NormalizedEntities.clinical.productsServicesProvided/Declined`

---

## Follow-Up Variables

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `follow_up_instructions` | string | Sometimes | Care instructions | "Keep incision dry for 10 days" |
| `follow_up_date` | string | Sometimes | Follow-up date | "January 20th" |
| `recheck_required` | string | Sometimes | Whether recheck needed | "yes" or "no" |
| `recheck_date` | string | Sometimes | Scheduled recheck date | "January twentieth" |
| `next_steps` | string | Sometimes | Next steps summary | "Recheck in 2 weeks" |

**Source**: `extractVapiVariablesFromEntities()` from `NormalizedEntities.clinical`

---

## AI Intelligence Variables

These are generated by LLM analysis of the case data. Use `formatAIIntelligenceForVapi()` to get formatted versions.

| Variable | Type | Reliability | Description | Example |
|----------|------|-------------|-------------|---------|
| `assessment_questions_text` | string | LLM-generated | Numbered question list | "1. Is Max still scratching?\n2. How's his appetite?" |
| `emergency_criteria_text` | string | LLM-generated | Comma-separated | "Collapse, Difficulty breathing, Seizures" |
| `urgent_criteria_text` | string | LLM-generated | Comma-separated | "Not eating for 24 hours, Persistent vomiting" |
| `warning_signs_text` | string | LLM-generated | Comma-separated | "Excessive redness, Swelling at incision" |
| `normal_expectations_text` | string | LLM-generated | Comma-separated | "Mild drowsiness, Reduced appetite for 24 hours" |
| `case_context_summary` | string | LLM-generated | Brief case context | "Ear infection treated with drops" |
| `should_ask_clinical_questions` | string | LLM-generated | Whether to ask questions | "true" or "false" |
| `call_approach` | string | LLM-generated | Recommended call style | "brief-checkin", "standard-assessment", "detailed-monitoring" |

**Source**: `formatAIIntelligenceForVapi()` from `generateCallIntelligenceFromEntities()`

---

## Boolean Flag Variables

All boolean flags are strings "true" or "false" for LiquidJS compatibility.

### Entity-Based Flags

| Variable | Meaning | Source |
|----------|---------|--------|
| `has_medications` | Medications were prescribed | medications array length > 0 |
| `has_vaccinations` | Vaccinations were given | vaccinations array length > 0 |
| `has_diagnoses` | Diagnoses are present | diagnoses array length > 0 |
| `has_recheck` | Recheck is required | recheckRequired === true |
| `has_follow_up_instructions` | Instructions provided | followUpInstructions exists |

### AI Intelligence Flags

| Variable | Meaning | Source |
|----------|---------|--------|
| `has_assessment_questions` | AI questions available | assessmentQuestions length > 0 |
| `has_emergency_criteria` | Specific emergency criteria | emergencyCriteria length > 0 |
| `has_urgent_criteria` | Specific urgent criteria | urgentCriteria length > 0 |
| `has_warning_signs` | Warning signs available | warningSignsToMonitor length > 0 |
| `has_normal_expectations` | Expectations available | normalPostTreatmentExpectations length > 0 |

**Usage in Prompts**:
```liquid
{% if has_medications == "true" %}
  How's it going with the medications?
{% endif %}
```

---

## Runtime Variables

Added at call execution time, not from entity extraction.

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `clinic_is_open` | string | Business hours check | "true" or "false" |
| `days_since_treatment` | string | Computed | "2" (days since visit) |
| `sub_type` | string | Config | "wellness" or "vaccination" |
| `condition_category` | string | Inferred | "gastrointestinal", "post-surgical", etc. |

---

## Variable Reliability Legend

| Rating | Meaning |
|--------|---------|
| **Always** | Guaranteed to be present and populated |
| Usually | Present in 90%+ of cases |
| Sometimes | Present in 50-90% of cases |
| When Rx | Only present when medications prescribed |
| When given | Only present when vaccines administered |
| Rarely | Present in less than 50% of cases |
| LLM-generated | Generated by AI, may not always be available |
| Unreliable | Often missing, empty, or incorrect |

---

## Real Production Examples

### Example 1: Vaccination Case (FRESA)

```javascript
{
  clinic_name: "Oak Valley Vet Clinic",
  agent_name: "Maria",
  pet_name: "Fresa",
  owner_name: "Garcia Family",
  appointment_date: "December fifteenth",
  discharge_summary: "received DHPP and Bordetella vaccinations",
  case_type: "vaccination",
  services_performed: "DHPP CANINE; BORDETELLA K9 INJECTABLE; EXAMINATION OFFICE VISIT",

  // These are EMPTY for simple vaccination:
  medication_names: "",
  primary_diagnosis: "",
  assessment_questions_text: "",

  // Boolean flags:
  has_medications: "false",
  has_vaccinations: "true",
  has_assessment_questions: "false",
  has_recheck: "false"
}
```

### Example 2: Diagnostic Case (MIMI)

```javascript
{
  clinic_name: "Happy Paws Vet",
  agent_name: "Sarah",
  pet_name: "Mimi",
  owner_name: "Johnson Family",
  appointment_date: "December tenth",
  discharge_summary: "was seen for chronic ear scratching",
  case_type: "diagnostic",
  primary_diagnosis: "otitis externa",
  services_performed: "EXAMINATION OFFICE VISIT; EAR CYTOLOGY; OTOMAX 15ML",

  medication_names: "Otomax",
  medications_detailed: "Otomax 15ml apply to ears twice daily for 7 days",

  assessment_questions_text: "1. Is Mimi still scratching at her ears?\n2. Have you been able to apply the ear drops okay?\n3. Any head shaking or discharge?",
  emergency_criteria_text: "Severe head tilt, Loss of balance, Bleeding from ears",
  warning_signs_text: "Increased redness, Foul odor from ears, Swelling",

  has_medications: "true",
  has_vaccinations: "false",
  has_assessment_questions: "true",
  has_emergency_criteria: "true",
  has_recheck: "true",
  recheck_date: "December twenty-fourth"
}
```

---

## Code References

### Entity Extraction
`libs/vapi/src/extract-variables.ts`:
- `extractVapiVariablesFromEntities()` - Main extraction function (line 240)
- `generateDischargeSummary()` - Creates discharge summary (line 52)
- `formatAIIntelligenceForVapi()` - Formats AI intelligence (line 608)

### Formatting Helpers
`libs/vapi/src/utils.ts`:
- `formatArrayForSpeech()` - Array to comma string (line 186)
- `formatAssessmentQuestionsForPrompt()` - Questions to numbered list (line 225)
- `extractFirstName()` - Gets first word of name (line 23)

### Variable Types
`libs/vapi/src/types.ts`:
- `DynamicVariables` interface - All variable types (line 74)
- `AssessmentQuestion` interface - Question structure (line 32)

---

## Troubleshooting

### Variable is Empty

1. **Check entity extraction** - Is the data present in NormalizedEntities?
2. **Check case type** - Some variables only apply to certain case types
3. **Check AI generation** - Did `generateCallIntelligenceFromEntities()` run?
4. **Check formatting** - Is `formatAIIntelligenceForVapi()` being called?

### Variable Has Wrong Format

1. **Phone numbers** - Should be spelled out for speech ("four zero eight...")
2. **Dates** - Should be spelled out ("December fifteenth")
3. **Arrays** - Should use `*_text` versions, not raw arrays

### Boolean Flag Not Working

1. **Check string comparison** - Use `== "true"` not `== true`
2. **Check variable exists** - Empty string is falsy in LiquidJS
3. **Check LiquidJS syntax** - Use `{% if %}` not `{{ if }}`

---

## Adding New Variables

1. **Add to `extractVapiVariablesFromEntities()`** in `extract-variables.ts`
2. **Use snake_case naming** for consistency
3. **Add boolean flag** if variable is optional (e.g., `has_new_thing`)
4. **Add formatted version** if it's an array (`new_thing_text`)
5. **Document here** with reliability rating
6. **Update prompt** to use the new variable
