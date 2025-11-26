# VAPI System Prompt: v3.0 vs v4.0 Comparison

## Executive Summary

**v3.0**: Interactive, conversational flow with ~19 variables  
**v4.0**: Advanced clinical system with 50+ variables and AI reasoning

| Metric             | v3.0                 | v4.0                        | Change                  |
| ------------------ | -------------------- | --------------------------- | ----------------------- |
| **Variables Used** | 19                   | 50+                         | +163%                   |
| **Prompt Length**  | ~360 lines           | ~1000 lines                 | +178%                   |
| **Approach**       | Direct interpolation | Hybrid (direct + reasoning) | New paradigm            |
| **Complexity**     | Moderate             | High                        | Significant increase    |
| **Call Duration**  | 3-4 min              | 4-6 min                     | +50%                    |
| **Clinical Depth** | Basic                | Advanced                    | Professional-grade      |
| **Adaptability**   | Good                 | Excellent                   | Context-aware reasoning |

---

## Key Differences

### 1. Variable Usage

**v3.0**: Uses core variables only

```handlebars
{{pet_name}}, {{owner_name}}, {{clinic_name}}, {{medication_names}}, etc.
```

**v4.0**: Uses ALL available variables + provides context dump

```handlebars
{{pet_name}},
{{patient_age}},
{{patient_breed}},
{{patient_weight}},
{{presenting_symptoms}},
{{physical_exam_findings}},
{{vital_temperature}},
{{clinical_notes}},
{{differential_diagnoses}},
{{prognosis}}, etc. PLUS: Context reasoning block with full clinical data JSON
```

---

### 2. Clinical Assessment

**v3.0**: Generic questions

```
"How has {{pet_name}} been doing since the visit?"
"Do you have any questions?"
```

**v4.0**: Condition-specific, structured assessment

```handlebars
{{#if assessment_questions}}
  ### Use knowledge base questions in priority order High Priority (ask first):
  {{#each assessment_questions}}
    {{#if this.required}}
      -
      {{this.question}}
      Concerning responses:
      {{this.concerning_responses}}
      Follow-up:
      {{this.follow_up_if_concerning}}
    {{/if}}
  {{/each}}
{{/if}}
```

**Impact**:

- v3.0: Generic "how are they doing?"
- v4.0: "How's Peanut's appetite and energy level?" with specific follow-up logic

---

### 3. Clinical Context Awareness

**v3.0**: Limited context

```
"{{pet_name}} came in for {{primary_diagnosis}}"
```

**v4.0**: Full clinical context with reasoning

```handlebars
"So
{{pet_name}}
came in{{#if visit_reason}} because of {{visit_reason}}{{/if}}, and
{{#if vet_name}}{{vet_name}}{{else}}the veterinarian{{/if}}
diagnosed
{{primary_diagnosis}}.{{#if procedures}} We did {{procedures}},{{/if}}
{{#if treatments}} gave {{treatments}},{{/if}}
{{#if medication_names}} and sent you home with {{medication_names}}.{{/if}}"
**Context for Reasoning**: { "patient": { age, breed, sex, weight }, "visit": {
reason, chief_complaint, presenting_symptoms }, "diagnosis": { primary, all,
differential, prognosis }, "treatment": { procedures, treatments, medications },
"exam": { findings, vitals }, "notes": "{{clinical_notes}}" }
```

**Impact**:

- v3.0: Says what happened
- v4.0: Provides context for AI to reason about the case

---

### 4. Warning Signs

**v3.0**: Species-specific but generic

```handlebars
{{#if patient_species == "dog"}}
- "Excessive vomiting or not eating for more than a day"
- "Unusual lethargy or weakness"
{{/if}}
```

**v4.0**: Condition-specific from knowledge base

```handlebars
{{#if warning_signs_to_monitor}}
  "Specifically with
  {{primary_diagnosis}}, watch for:
  {{#each warning_signs_to_monitor}}
    -
    {{this}}
  {{/each}}
{{else}}
  [Fallback to species-specific generic warnings]
{{/if}}
```

**Example for Periodontal Disease**:

- v3.0: Generic dog warnings
- v4.0: "Difficulty eating, Swelling in face, Foul odor from mouth, Bleeding gums, Loss of appetite, Pawing at mouth"

---

### 5. Medication Discussion

**v3.0**: Simple check-in

```
"How's it going with giving {{pet_name}} the {{medication_names}}?"
```

**v4.0**: Detailed with context and species-specific tips

```handlebars
"{{pet_name}} is on {{medication_names}}. Have you been able to give those okay?"

{{#if medication_frequency}}
"That's {{medication_frequency}}{{#if medications_detailed}},
and the full instructions are: {{medications_detailed}}{{/if}}."
{{/if}}

**Tips** (species-specific):
{{#if patient_species == "cat"}}
- Pill pockets designed for cats
- Mixing liquid meds with tuna water
{{else}}
- Hiding in peanut butter or cheese
- Pill pockets or treats
{{/if}}

{{#if clinical_notes}}
**Context**: {{clinical_notes}}
{{/if}}
```

---

### 6. Emergency Routing

**v3.0**: Basic severity assessment

```
Emergency: difficulty breathing, collapse
Urgent: persistent vomiting, not eating
```

**v4.0**: Context-aware decision making

```handlebars
### Context for Decision Making Consider: - Symptom description from owner -
{{primary_diagnosis}}
and expected complications - Time since appointment ({{appointment_date}}) -
Current medications ({{medication_names}}) - Patient factors (age:
{{patient_age}}, species:
{{patient_species}}) - Clinical notes:
{{clinical_notes}}

{{#if emergency_criteria}}
  **Condition-specific EMERGENCY** (from knowledge base):
  {{#each emergency_criteria}}
    -
    {{this}}
  {{/each}}
{{/if}}
```

**Impact**:

- v3.0: Rules-based severity
- v4.0: AI reasons about severity using full clinical context

---

### 7. Patient Demographics

**v3.0**: Not mentioned

```
"Hi {{owner_name}}, this is {{agent_name}} calling about {{pet_name}}"
```

**v4.0**: Integrated throughout

```handlebars
"Hi
{{owner_name}}, this is
{{agent_name}}
calling about
{{pet_name}}'s recent appointment{{#if patient_age}}
  - your
  {{patient_age}}
  {{#if
    patient_breed
  }}{{patient_breed}}{{else}}{{patient_species}}{{/if}}{{/if}}." **About
{{pet_name}}**: - Age:
{{patient_age}}
- Breed:
{{patient_breed}}
- Sex:
{{patient_sex}}
- Weight:
{{patient_weight}}
```

**Impact**:

- v3.0: Generic pet
- v4.0: "Your 10-year-old Golden Retriever"

---

### 8. Expectations Setting

**v3.0**: Not included

**v4.0**: Knowledge-base driven

```handlebars
{{#if normal_post_treatment_expectations}}
  "Just so you know what to expect, with
  {{primary_diagnosis}}:

  {{#each normal_post_treatment_expectations}}
    -
    {{this}}
  {{/each}}

  Does that match what you're seeing?"
{{/if}}
```

**Example for Post-Surgical**:

- "Some mild swelling and redness is normal for 24-48 hours"
- "Pet may be drowsy from anesthesia for 12-24 hours"
- "Appetite may take 24 hours to return to normal"

---

### 9. Intelligent Q&A

**v3.0**: Generic deflection

```
"That's a great question for the veterinarian."
```

**v4.0**: Context-aware answering

```
When owner asks a question:

1. Check if answer is in provided context:
   - Clinical notes: {{clinical_notes}}
   - Exam findings: {{physical_exam_findings}}
   - Procedures: {{procedures}}

2. If you have the information: Answer with context
   "Based on {{#if vet_name}}{{vet_name}}'s{{else}}the vet's{{/if}}
   notes, [specific answer]"

3. If uncertain: Defer appropriately
```

---

### 10. Breed & Age Considerations

**v3.0**: Not included

**v4.0**: Integrated reasoning

```handlebars
### Breed-Specific Knowledge
{{#if patient_breed}}
  Consider breed-specific health considerations for
  {{patient_breed}}: - Known breed predispositions - Size-related concerns -
  Exercise expectations - Medication sensitivities
{{/if}}

### Age-Specific Guidance
{{#if patient_age}}
  Adjust guidance based on age ({{patient_age}}): - Puppies/Kittens: Faster
  healing, more energy - Adult: Standard recovery - Senior: Slower healing,
  monitor closely
{{/if}}
```

---

## Variable Comparison

### Variables Used in Both Versions

| Variable                 | v3.0 | v4.0 |
| ------------------------ | ---- | ---- |
| `agent_name`             | ✅   | ✅   |
| `clinic_name`            | ✅   | ✅   |
| `clinic_phone`           | ✅   | ✅   |
| `emergency_phone`        | ✅   | ✅   |
| `owner_name`             | ✅   | ✅   |
| `pet_name`               | ✅   | ✅   |
| `appointment_date`       | ✅   | ✅   |
| `call_type`              | ✅   | ✅   |
| `patient_species`        | ✅   | ✅   |
| `primary_diagnosis`      | ✅   | ✅   |
| `visit_reason`           | ✅   | ✅   |
| `medication_names`       | ✅   | ✅   |
| `medication_frequency`   | ✅   | ✅   |
| `procedures`             | ✅   | ✅   |
| `treatments`             | ✅   | ✅   |
| `follow_up_instructions` | ✅   | ✅   |
| `recheck_date`           | ✅   | ✅   |
| `vet_name`               | ✅   | ✅   |
| `condition`              | ✅   | ✅   |

**Total Shared**: 19 variables

### NEW Variables in v4.0

**Patient Demographics** (5 new):

- `patient_breed`
- `patient_age`
- `patient_sex`
- `patient_weight`
- `case_type`

**Clinical Context** (10 new):

- `chief_complaint`
- `presenting_symptoms`
- `diagnoses` (all)
- `differential_diagnoses`
- `prognosis`
- `clinical_notes`
- `physical_exam_findings`
- `discharge_summary`
- `condition_category`
- `extraction_confidence`

**Vital Signs** (4 new):

- `vital_temperature`
- `vital_heart_rate`
- `vital_respiratory_rate`
- `vital_weight`

**Medications** (1 new):

- `medications_detailed`

**Follow-Up** (2 new):

- `follow_up_date`
- `next_steps`

**Knowledge Base Arrays** (5 new):

- `assessment_questions`
- `warning_signs_to_monitor`
- `normal_post_treatment_expectations`
- `urgent_criteria`
- `emergency_criteria`

**Total NEW**: 27+ variables

**Grand Total v4.0**: 46+ direct variables + context dump

---

## Call Flow Comparison

### v3.0 Call Flow (3-4 minutes)

```
1. Introduction (15 sec)
   └─> Permission check

2. Quick Brief (15 sec)
   └─> Primary diagnosis

3. Open Questions (30 sec)
   └─> Generic "any questions?"

4. Dynamic Instructions (60 sec)
   └─> IF medications: medication check
   └─> IF procedures: procedure check
   └─> IF treatments: treatment check

5. Warning Signs (45 sec)
   └─> Species-specific warnings

6. Critical Check (15 sec)
   └─> "Any of these signs now?"

7. Transfer/Routing (variable)
   └─> IF concerning: route appropriately

8. Closing (15 sec)
   └─> Recheck reminder + phone numbers
```

### v4.0 Call Flow (4-6 minutes)

```
1. Introduction (15 sec)
   └─> Demographics integrated ("10-year-old Golden Retriever")

2. Clinical Context Brief (30 sec)
   └─> Visit reason + diagnosis + what was done

3. Open-Ended Assessment (30 sec)
   └─> "How's Peanut been doing overall?"

4. Structured Clinical Assessment (90 sec)
   └─> Condition-specific questions from knowledge base
   └─> Priority order (required first)
   └─> Follow-up on concerning responses

5. Medication Compliance (45 sec)
   └─> Detailed check with frequency
   └─> Species-specific administration tips
   └─> Clinical context reference

6. Procedure & Treatment Follow-Up (45 sec)
   └─> Specific to what was done
   └─> Reference exam findings
   └─> Assess healing progress

7. Clinical Reasoning & Education (45 sec)
   └─> Set expectations (knowledge base)
   └─> Discuss prognosis
   └─> Answer "could it be something else?"

8. Warning Signs Education (60 sec)
   └─> Condition-specific (if available)
   └─> Species-specific (fallback)
   └─> Context-aware discussion

9. Emergency/Urgent Routing (variable)
   └─> Context-aware decision making
   └─> Consider all clinical factors
   └─> Appropriate escalation

10. Follow-Up & Recheck (30 sec)
    └─> Importance explained
    └─> Specific dates

11. Closing (20 sec)
    └─> Brief summary + contact info
```

---

## Implementation Decision Matrix

### Choose v3.0 If:

- ✅ You want simple, quick calls (3-4 min)
- ✅ Basic follow-up is sufficient
- ✅ Limited clinical data available
- ✅ Faster deployment is priority
- ✅ Lower token costs are important
- ✅ Testing the system initially

### Choose v4.0 If:

- ✅ You want professional-grade clinical follow-up
- ✅ Rich clinical data is available
- ✅ Longer, more thorough calls are acceptable
- ✅ AI reasoning about cases is desired
- ✅ Condition-specific guidance is needed
- ✅ You have knowledge base implemented
- ✅ Higher token costs are acceptable
- ✅ You want maximum sophistication

---

## Cost Comparison

### Prompt Size Impact

**v3.0**:

- Base prompt: ~2,500 tokens
- Variable interpolation: ~500 tokens
- **Total per call**: ~3,000 tokens

**v4.0**:

- Base prompt: ~6,000 tokens
- Variable interpolation: ~1,500 tokens
- Context dump: ~1,000 tokens
- **Total per call**: ~8,500 tokens

**Cost Impact**: v4.0 is **~2.8x more expensive** per call in prompt tokens

### Call Duration Impact

**v3.0**: 3-4 minutes = 180-240 seconds audio
**v4.0**: 4-6 minutes = 240-360 seconds audio

**Cost Impact**: v4.0 is **~1.5x more expensive** in audio processing

### Total Cost Increase

**Estimated**: v4.0 costs **~2-3x more** per call than v3.0

**ROI Considerations**:

- Better client experience
- More thorough follow-up
- Reduced need for callback calls
- Higher perceived value

---

## Migration Path

### Option 1: Direct Upgrade (Recommended for Testing)

1. Upload v4.0 prompt to VAPI dashboard
2. Test with a few cases
3. Evaluate call quality and duration
4. Decide whether to keep or revert

### Option 2: Gradual Migration

1. Start with v3.0 for all calls
2. Use v4.0 for complex cases only:
   - Post-surgical cases
   - Chronic condition management
   - Cases with complications
3. Expand v4.0 usage as you validate effectiveness

### Option 3: A/B Testing

1. Route 50% of calls to v3.0
2. Route 50% of calls to v4.0
3. Compare:
   - Call completion rates
   - Client satisfaction
   - Callback rates
   - Escalation appropriateness
4. Choose winner based on data

---

## Recommendations

### For Most Users: **Start with v3.0**

- Proven conversational flow
- Lower cost
- Easier to debug
- Sufficient for most follow-ups

### Upgrade to v4.0 When:

1. **You have rich clinical data**:
   - Complete SOAP notes
   - Detailed exam findings
   - Clinical notes populated

2. **You want professional-grade calls**:
   - Specialty practices
   - Complex cases
   - High-touch client service

3. **Knowledge base is fully implemented**:
   - Assessment questions configured
   - Warning signs customized
   - Post-treatment expectations defined

4. **You've validated v3.0 works well**:
   - Proven the system works
   - Ready to enhance

---

## Summary

| Aspect                | v3.0       | v4.0       | Winner |
| --------------------- | ---------- | ---------- | ------ |
| **Simplicity**        | ⭐⭐⭐⭐⭐ | ⭐⭐       | v3.0   |
| **Cost**              | ⭐⭐⭐⭐⭐ | ⭐⭐       | v3.0   |
| **Speed**             | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | v3.0   |
| **Clinical Depth**    | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | v4.0   |
| **Adaptability**      | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | v4.0   |
| **Client Experience** | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | v4.0   |
| **Data Utilization**  | ⭐⭐       | ⭐⭐⭐⭐⭐ | v4.0   |
| **Professional Feel** | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | v4.0   |

**Recommendation**:

- **Launch**: Use v3.0 ✅
- **Long-term**: Migrate to v4.0 when ready 🎯
- **Premium clients**: Use v4.0 immediately 💎

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-26  
**Comparison**: v3.0 vs v4.0
