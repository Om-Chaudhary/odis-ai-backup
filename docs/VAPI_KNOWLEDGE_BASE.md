# VAPI Knowledge Base System Documentation

## Overview

The VAPI Knowledge Base System is a comprehensive, scalable framework for managing condition-specific assessment questions, treatment expectations, and warning criteria for veterinary follow-up calls. This system enables the OdisAI Follow-Up Assistant to provide intelligent, context-aware conversations tailored to each pet's specific condition.

## Table of Contents

- [Architecture](#architecture)
- [Knowledge Base Categories](#knowledge-base-categories)
- [Usage](#usage)
- [Adding New Knowledge Bases](#adding-new-knowledge-bases)
- [Validation and Error Handling](#validation-and-error-handling)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Architecture

### Core Components

```
src/lib/vapi/
├── types.ts                     # TypeScript type definitions
├── validators.ts                # Validation and sanitization functions
└── knowledge-base/
    ├── index.ts                 # Main knowledge base registry and utilities
    ├── gastrointestinal.ts      # GI conditions knowledge base
    ├── post-surgical.ts         # Post-operative care knowledge base
    ├── dermatological.ts        # Skin/allergy conditions
    ├── respiratory.ts           # Breathing/cough conditions
    ├── urinary.ts               # UTI/bladder conditions
    ├── orthopedic.ts            # Joint/mobility conditions
    ├── neurological.ts          # Neurological conditions
    ├── ophthalmic.ts            # Eye conditions
    ├── cardiac.ts               # Heart conditions
    ├── endocrine.ts             # Hormone/diabetes conditions
    ├── dental.ts                # Dental/oral conditions
    ├── wound-care.ts            # Wounds/trauma conditions
    ├── behavioral.ts            # Anxiety/behavioral conditions
    ├── pain-management.ts       # Pain management
    └── general.ts               # Fallback for uncategorized conditions
```

### Design Principles

1. **Type Safety**: Full TypeScript coverage with strict mode enabled
2. **Scalability**: Easy to add new categories without modifying core logic
3. **Validation**: Comprehensive input validation with helpful error messages
4. **Defensive Programming**: Handles worst-case inputs gracefully
5. **Extensibility**: Custom knowledge bases can override defaults
6. **Performance**: Efficient registry-based lookups with no runtime overhead

## Knowledge Base Categories

The system includes **15 comprehensive knowledge base categories**:

| Category             | Conditions Covered                                | Common Medications                    |
| -------------------- | ------------------------------------------------- | ------------------------------------- |
| **Gastrointestinal** | Vomiting, diarrhea, pancreatitis, gastroenteritis | Metronidazole, Cerenia, Famotidine    |
| **Post-Surgical**    | Spay/neuter, mass removals, dental surgeries      | Carprofen, Gabapentin, Cephalexin     |
| **Dermatological**   | Allergies, hot spots, pyoderma, mange             | Apoquel, Prednisone, Cephalexin       |
| **Respiratory**      | Kennel cough, pneumonia, bronchitis               | Doxycycline, Hydrocodone, Clavamox    |
| **Urinary**          | UTIs, bladder stones, crystals                    | Clavamox, Baytril, Proin              |
| **Orthopedic**       | Arthritis, limping, cruciate tears                | Rimadyl, Galliprant, Dasuquin         |
| **Neurological**     | Seizures, vestibular disease, IVDD                | Phenobarbital, Keppra, Prednisone     |
| **Ophthalmic**       | Conjunctivitis, corneal ulcers, glaucoma          | Neopolybac, Gentamicin, Dorzolamide   |
| **Cardiac**          | Heart murmurs, CHF, arrhythmias                   | Vetmedin, Lasix, Enalapril            |
| **Endocrine**        | Diabetes, Cushing's, thyroid disease              | Insulin, Vetoryl, Levothyroxine       |
| **Dental**           | Periodontal disease, extractions                  | Clindamycin, Carprofen, Chlorhexidine |
| **Wound Care**       | Lacerations, abscesses, bite wounds               | Clavamox, Silver sulfadiazine         |
| **Behavioral**       | Anxiety, aggression, separation anxiety           | Fluoxetine, Trazodone, Gabapentin     |
| **Pain Management**  | Chronic/acute pain management                     | Tramadol, Gabapentin, Buprenorphine   |
| **General**          | Fallback for uncategorized conditions             | N/A                                   |

## Usage

### Basic Usage

```typescript
import { buildDynamicVariables } from "~/lib/vapi/knowledge-base";

// Build variables with automatic knowledge base integration
const result = buildDynamicVariables({
  baseVariables: {
    clinicName: "Alum Rock Pet Hospital",
    agentName: "Sarah",
    petName: "Bella",
    ownerName: "John Smith",
    appointmentDate: "November eighth",
    callType: "follow-up",
    condition: "vomiting and diarrhea",
    clinicPhone: "four zero eight, two five nine, eight seven six five",
    emergencyPhone: "four zero eight, eight six five, four three two one",
    dischargeSummary: "came in with acute gastroenteritis...",
    medications: "metronidazole twice daily",
  },
});

// Result includes:
// - variables: Complete DynamicVariables with all knowledge base data
// - knowledgeBase: The gastrointestinal knowledge base (auto-detected)
// - validation: Validation result with errors/warnings
// - warnings: Array of warning messages
```

### Explicit Category Selection

```typescript
const result = buildDynamicVariables({
  baseVariables: {
    /* ... */
  },
  conditionCategory: "post-surgical", // Explicit category
});
```

### Custom Knowledge Base

```typescript
const result = buildDynamicVariables({
  baseVariables: { /* ... */ },
  customKnowledgeBase: {
    assessmentQuestions: [
      {
        question: 'Custom question here?',
        context: 'Why we're asking',
        expectedPositiveResponse: ['good', 'better'],
        concerningResponses: ['worse', 'bad'],
        priority: 1,
      },
    ],
    warningSignsToMonitor: ['Custom warning sign'],
    // ... other custom fields
  },
});
```

### Test Scenario Creation

```typescript
import { createTestScenario } from "~/lib/vapi/knowledge-base";

const testVariables = createTestScenario({
  clinicName: "Test Clinic",
  petName: "Test Pet",
  // ... minimal required fields
});

// Automatically includes all knowledge base data
```

## Adding New Knowledge Bases

### Step 1: Create Knowledge Base File

Create a new file in `src/lib/vapi/knowledge-base/`:

```typescript
// src/lib/vapi/knowledge-base/example.ts
import type { ConditionKnowledgeBase } from "../types";

export const exampleKnowledge: ConditionKnowledgeBase = {
  conditionCategory: "example",
  displayName: "Example Conditions",
  description: "Description of conditions covered",

  keywords: [
    "keyword1",
    "keyword2",
    // Keywords for auto-detection
  ],

  assessmentQuestions: [
    {
      question: "How is {{petName}} doing?",
      context: "General assessment",
      expectedPositiveResponse: ["better", "improved"],
      concerningResponses: ["worse", "same"],
      followUpIfConcerning: "Follow-up question if concerning",
      priority: 1,
      required: true,
    },
    // ... more questions
  ],

  normalPostTreatmentExpectations: ["Expected outcome 1", "Expected outcome 2"],

  warningSignsToMonitor: ["Warning sign 1", "Warning sign 2"],

  emergencyCriteria: ["Emergency criterion 1"],

  urgentCriteria: ["Urgent criterion 1"],

  typicalRecoveryDays: 7,

  commonMedications: ["medication1", "medication2"],
};
```

### Step 2: Add to Type Definitions

Update `ConditionCategory` type in `src/lib/vapi/types.ts`:

```typescript
export type ConditionCategory =
  | "gastrointestinal"
  | "post-surgical"
  // ... existing categories
  | "example" // Add your new category
  | "general";
```

### Step 3: Register in Index

Update `src/lib/vapi/knowledge-base/index.ts`:

```typescript
// 1. Import the knowledge base
import { exampleKnowledge } from "./example";

// 2. Add to registry
const KNOWLEDGE_BASE_REGISTRY: Record<
  ConditionCategory,
  ConditionKnowledgeBase
> = {
  gastrointestinal: gastrointestinalKnowledge,
  // ... existing entries
  example: exampleKnowledge, // Add your new entry
  general: generalKnowledge,
};

// 3. Export for direct access
export { exampleKnowledge } from "./example";
```

### Step 4: Update Validator (Optional)

Add keywords to the `inferConditionCategory` function in `src/lib/vapi/validators.ts`:

```typescript
if (/keyword1|keyword2|keyword3/.test(normalized)) {
  return "example";
}
```

## Validation and Error Handling

### Validation Levels

The system provides two validation modes:

#### 1. Non-Strict Mode (Default)

```typescript
const result = buildDynamicVariables({
  baseVariables: {
    /* ... */
  },
  strict: false, // Default
});

if (!result.validation.valid) {
  console.error("Validation errors:", result.validation.errors);
  console.warn("Warnings:", result.validation.warnings);
  // Variables are still returned (with general knowledge base as fallback)
}
```

#### 2. Strict Mode

```typescript
try {
  const result = buildDynamicVariables({
    baseVariables: {
      /* ... */
    },
    strict: true, // Throws on validation failure
  });
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

### Validation Rules

#### Required Core Fields

All calls require:

- `clinicName` (non-empty string)
- `agentName` (first name only, no titles)
- `petName` (non-empty string)
- `ownerName` (non-empty string)
- `appointmentDate` (spelled out, e.g., "November eighth")
- `callType` ("discharge" or "follow-up")
- `clinicPhone` (spelled out for natural speech)
- `emergencyPhone` (spelled out for natural speech)
- `dischargeSummary` (non-empty string)

#### Call-Type Specific Rules

**Discharge Calls:**

- `subType` (optional): Must be "wellness" or "vaccination"
- `nextSteps` (optional): Follow-up care instructions

**Follow-Up Calls:**

- `condition` (required): What pet was treated for
- `medications` (optional): Prescribed medications
- `recheckDate` (optional): Spelled-out date
- `conditionCategory` (optional but recommended)

#### Validation Warnings

Warnings are non-blocking but indicate potential issues:

- Phone numbers should be spelled out (not "555-1234")
- Dates should be spelled out (not "11/8/2024")
- Agent name should not include titles ("Dr.", "Doctor")
- Wrong fields for call type (e.g., `condition` on discharge call)

## Best Practices

### 1. Always Specify Condition Category for Follow-Ups

```typescript
// ❌ BAD - Relies on auto-detection
const result = buildDynamicVariables({
  baseVariables: {
    condition: "limping",
    // ...
  },
});

// ✅ GOOD - Explicit category
const result = buildDynamicVariables({
  baseVariables: {
    condition: "limping",
    conditionCategory: "orthopedic",
    // ...
  },
});
```

### 2. Use Spelled-Out Formats

```typescript
// ❌ BAD
clinicPhone: "(408) 259-8765";
appointmentDate: "11/8/2024";

// ✅ GOOD
clinicPhone: "four zero eight, two five nine, eight seven six five";
appointmentDate: "November eighth";
```

### 3. Provide Comprehensive Discharge Summaries

```typescript
// ❌ BAD
dischargeSummary: "had surgery";

// ✅ GOOD
dischargeSummary: `had her spay surgery three days ago on November seventh. The procedure went smoothly with no complications. Doctor Rodriguez performed the surgery and she recovered well from anesthesia. Her incision is a small abdominal incision with internal dissolvable sutures and external skin glue.`;
```

### 4. Handle Validation Results Properly

```typescript
const result = buildDynamicVariables({
  /* ... */
});

// Check validation
if (!result.validation.valid) {
  // Log errors for debugging
  console.error("Validation errors:", result.validation.errors);

  // Show warnings to user (non-blocking)
  result.validation.warnings.forEach((warn) => console.warn(warn));
}

// Always check if knowledge base is appropriate
console.log(`Using knowledge base: ${result.knowledgeBase.displayName}`);
```

### 5. Test with Edge Cases

Always test with:

- Missing required fields
- Invalid field values
- Mixed call types
- Unknown conditions
- Special characters in text fields
- Very long text fields
- Empty strings vs undefined

## API Reference

### Primary Functions

#### `buildDynamicVariables(options: BuildVariablesOptions): BuildVariablesResult`

Main function for building complete variable sets with knowledge base integration.

**Parameters:**

- `baseVariables`: Partial\<DynamicVariables\> - Core variables to start with
- `conditionCategory?`: ConditionCategory - Explicit category (recommended)
- `strict?`: boolean - Whether to throw on validation errors (default: false)
- `useDefaults?`: boolean - Auto-populate with knowledge base data (default: true)
- `customKnowledgeBase?`: Partial\<ConditionKnowledgeBase\> - Custom override

**Returns:** BuildVariablesResult containing:

- `variables`: Complete DynamicVariables object
- `knowledgeBase`: Applied knowledge base
- `validation`: ValidationResult with errors/warnings
- `warnings`: String array of warnings

#### `createTestScenario(baseVariables: Partial<DynamicVariables>): DynamicVariables`

Helper for creating test scenarios with automatic knowledge base integration.

#### `getKnowledgeBase(category: ConditionCategory): ConditionKnowledgeBase`

Retrieve a specific knowledge base by category.

#### `getAllKnowledgeBases(): ConditionKnowledgeBase[]`

Get array of all 15 knowledge bases.

#### `validateDynamicVariables(variables: Partial<DynamicVariables>, strict?: boolean): ValidationResult`

Validate variables without building complete set.

#### `inferConditionCategory(conditionString: string): ConditionCategory`

Auto-detect category from condition description using keyword matching.

### Types

#### `DynamicVariables`

Complete interface for VAPI call variables. See `src/lib/vapi/types.ts`.

#### `ConditionKnowledgeBase`

Knowledge base structure. Includes:

- Assessment questions with priorities
- Normal expectations
- Warning signs
- Emergency/urgent criteria
- Typical recovery timeline
- Common medications

#### `AssessmentQuestion`

Individual assessment question structure:

- `question`: The question text (supports {{petName}} substitution)
- `context`: Why we're asking (for AI understanding)
- `expectedPositiveResponse`: Array of good response patterns
- `concerningResponses`: Array of concerning response patterns
- `followUpIfConcerning`: Follow-up question if concerning
- `priority`: 1-5 (1 = highest)
- `required`: boolean (default: true for priority 1-2)

## Performance Considerations

### Registry-Based Lookups

Knowledge bases use an O(1) lookup registry - no iteration required:

```typescript
const KNOWLEDGE_BASE_REGISTRY: Record<
  ConditionCategory,
  ConditionKnowledgeBase
> = {
  gastrointestinal: gastrointestinalKnowledge,
  // ... all categories
};

// O(1) lookup
const kb = KNOWLEDGE_BASE_REGISTRY[category];
```

### Lazy Evaluation

Knowledge bases are imported and cached at module load time - no runtime overhead for repeated calls.

### Validation Caching

For repeated validation of the same variables, validation results can be cached:

```typescript
const validationCache = new Map<string, ValidationResult>();

function getCachedValidation(variables: DynamicVariables): ValidationResult {
  const key = JSON.stringify(variables);
  if (!validationCache.has(key)) {
    validationCache.set(key, validateDynamicVariables(variables));
  }
  return validationCache.get(key)!;
}
```

## Troubleshooting

### Common Issues

#### "Validation failed: condition is required for follow-up calls"

**Cause:** Follow-up calls must specify what condition the pet was treated for.

**Fix:**

```typescript
baseVariables: {
  callType: 'follow-up',
  condition: 'acute gastroenteritis',  // Add this
  // ...
}
```

#### "Could not determine specific condition category"

**Cause:** Condition description doesn't match any keywords.

**Fix:** Explicitly set `conditionCategory`:

```typescript
baseVariables: {
  condition: 'some rare condition',
  conditionCategory: 'general',  // Explicit fallback
  // ...
}
```

#### Variables missing assessment questions

**Cause:** `useDefaults: false` was set.

**Fix:**

```typescript
buildDynamicVariables({
  baseVariables: {
    /* ... */
  },
  useDefaults: true, // Ensure this is true or omitted
});
```

## Future Enhancements

Potential future improvements:

1. **Multi-language Support**: Translate questions to Spanish, etc.
2. **Species-Specific Questions**: Different questions for cats vs dogs
3. **Age-Appropriate Questions**: Adjust for puppies/kittens vs seniors
4. **Severity Levels**: Different question sets based on condition severity
5. **Learning from Outcomes**: AI-driven question optimization based on call outcomes
6. **Integration with EHR**: Auto-populate from medical records

## Related Documentation

- [VAPI Test Page Documentation](./VAPI_TEST_PAGE.md)
- [VAPI Setup Guide](./VAPI_SETUP.md)
- [Project Architecture](../CLAUDE.md)

## Support

For issues or questions about the knowledge base system:

1. Check TypeScript compiler errors first (`pnpm typecheck`)
2. Review validation warnings in console
3. Examine knowledge base files for examples
4. Refer to this documentation

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
**Maintainer:** OdisAI Development Team
