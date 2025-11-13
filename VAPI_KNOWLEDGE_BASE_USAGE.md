# VAPI Knowledge Base Integration Guide

## Overview

You have two options for VAPI calls:

1. **Basic Mode** (Currently in use) - Uses only core variables
2. **Enhanced Mode** (Available) - Uses knowledge base for condition-specific assessment

## Current State

✅ **What's working now:**
- Basic variables are passed and working perfectly
- Simple discharge and follow-up calls
- Manual prompts in the VAPI assistant

✅ **What's available but not yet used:**
- Comprehensive veterinary knowledge base (14 condition categories)
- Condition-specific assessment questions
- Emergency and urgent criteria per condition
- Post-treatment expectations
- Warning signs to monitor

## Option 1: Keep It Simple (Recommended for now)

Use the production prompt (`VAPI_PRODUCTION_PROMPT.txt`) with just the basic variables.

**Variables you pass:**
```typescript
{
  pet_name: "Max",
  owner_name: "John Smith",
  appointment_date: "January tenth",
  call_type: "discharge",
  agent_name: "Sarah",
  clinic_name: "Happy Paws",
  clinic_phone: "five five five...",
  emergency_phone: "five five five...",
  discharge_summary_content: "received vaccines...",
  sub_type: "wellness",  // for discharge
  condition: "ear infection",  // for follow-up
  next_steps: "...",
  medications: "...",
  recheck_date: "..."
}
```

This is production-ready and works great!

## Option 2: Enhanced Mode with Knowledge Base

Use the enhanced prompt (`VAPI_ENHANCED_PROMPT.txt`) and add knowledge base variables.

### How to Enable

1. **Update the VAPI assistant prompt** to use `VAPI_ENHANCED_PROMPT.txt`

2. **Import knowledge base in your schedule endpoint:**

```typescript
// At top of file
import { getKnowledgeBaseForCondition } from "~/lib/vapi/knowledge-base";

// In your schedule call handler
if (validated.callType === "follow-up" && validated.condition) {
  // Get condition-specific knowledge
  const knowledgeBase = getKnowledgeBaseForCondition(validated.condition);

  // Add to callVariables
  const callVariables = {
    // ... existing variables ...

    // Knowledge base additions
    assessment_questions: knowledgeBase.assessmentQuestions,
    normal_post_treatment_expectations: knowledgeBase.normalPostTreatmentExpectations,
    warning_signs_to_monitor: knowledgeBase.warningSignsToMonitor,
    emergency_criteria: knowledgeBase.emergencyCriteria,
    urgent_criteria: knowledgeBase.urgentCriteria,
  };
}
```

### Knowledge Base Categories Available

The system can automatically provide condition-specific guidance for:

- `gastrointestinal` - Vomiting, diarrhea, GI issues
- `dermatological` - Skin conditions, allergies, hot spots
- `respiratory` - Coughing, breathing issues
- `urinary` - UTIs, crystals, incontinence
- `orthopedic` - Limping, arthritis, joint issues
- `post-surgical` - Any post-surgery care
- `neurological` - Seizures, neurological conditions
- `ophthalmic` - Eye conditions
- `cardiac` - Heart conditions
- `endocrine` - Diabetes, thyroid issues
- `dental` - Dental procedures
- `wound-care` - Wound management
- `behavioral` - Anxiety, aggression
- `pain-management` - Pain medication protocols
- `general` - Fallback for unknown conditions

### Example: Enhanced Follow-Up Call

```typescript
// Schedule a follow-up call with knowledge base
const callVariables = {
  // Core variables
  pet_name: "Luna",
  owner_name: "Sarah Johnson",
  appointment_date: "January fifth",
  call_type: "follow-up",
  agent_name: "Sarah",
  clinic_name: "Happy Paws",
  clinic_phone: "five five five...",
  emergency_phone: "five five five...",
  discharge_summary_content: "was prescribed Otomax for bacterial ear infection",

  // Follow-up specific
  condition: "ear infection",
  medications: "Otomax ear drops, twice daily for seven days",
  recheck_date: "January nineteenth",
  next_steps: "Continue medication for full course",

  // Knowledge base (auto-populated based on condition)
  assessment_questions: [
    {
      question: "Is Luna still scratching or shaking her head as much?",
      priority: 1,
      concerning_responses: ["worse", "no improvement", "still shaking"],
      follow_up_if_concerning: "Can you tell me more about how often that's happening?"
    },
    {
      question: "Have you noticed any improvement in the redness or smell?",
      priority: 2
    },
    {
      question: "How's the medication application going? Any trouble getting it on?",
      priority: 3
    }
  ],

  normal_post_treatment_expectations: [
    "some mild head shaking for the first day or two",
    "gradual reduction in scratching over three to five days",
    "slight redness that improves by day three"
  ],

  warning_signs_to_monitor: [
    "increased head shaking after three days",
    "worsening redness or swelling",
    "foul odor getting stronger",
    "discharge from the ear"
  ],

  emergency_criteria: [
    "severe head tilt",
    "loss of balance",
    "inability to walk straight",
    "facial paralysis on one side"
  ],

  urgent_criteria: [
    "significant swelling around the ear",
    "yelping when ear is touched",
    "bleeding from the ear canal",
    "no improvement after five days of medication"
  ]
};
```

## When to Use Enhanced Mode

**Use Basic Mode when:**
- ✅ Simple discharge/wellness calls
- ✅ Routine vaccination follow-ups
- ✅ You want simple, predictable conversations
- ✅ You're just getting started

**Use Enhanced Mode when:**
- ✅ Complex medical follow-ups
- ✅ Post-surgical monitoring
- ✅ Chronic condition management
- ✅ You want condition-specific assessment
- ✅ You need consistent, thorough questioning

## Migration Path

### Phase 1: Keep Using Basic (Current) ✅
- You're here now
- Everything works
- No changes needed

### Phase 2: Test Enhanced on Follow-Ups
- Keep discharge calls basic
- Try enhanced mode for follow-up calls only
- Compare call quality

### Phase 3: Full Enhanced Rollout
- Use enhanced for all follow-up calls
- Keep discharge simple or enhance if needed
- Monitor and refine

## File Structure

```
Current Implementation:
- Simple variables only
- Manual prompt customization
- Works great for basic use cases

Available for Enhancement:
src/lib/vapi/
├── types.ts                     # Full type definitions (advanced)
├── simple-types.ts              # Simplified types (current use)
├── validators.ts                # Validation for all variables
└── knowledge-base/
    ├── index.ts                 # Export getKnowledgeBaseForCondition()
    ├── gastrointestinal.ts      # GI-specific knowledge
    ├── dermatological.ts        # Skin-specific knowledge
    ├── respiratory.ts           # Respiratory-specific knowledge
    ├── urinary.ts               # Urinary-specific knowledge
    ├── orthopedic.ts            # Orthopedic-specific knowledge
    ├── post-surgical.ts         # Post-surgery specific knowledge
    ├── neurological.ts          # Neuro-specific knowledge
    ├── ophthalmic.ts            # Eye-specific knowledge
    ├── cardiac.ts               # Heart-specific knowledge
    ├── endocrine.ts             # Endocrine-specific knowledge
    ├── dental.ts                # Dental-specific knowledge
    ├── wound-care.ts            # Wound care-specific knowledge
    ├── behavioral.ts            # Behavioral-specific knowledge
    ├── pain-management.ts       # Pain management-specific knowledge
    └── general.ts               # Fallback for unknown conditions
```

## Recommendations

1. **Start simple** - Use `VAPI_PRODUCTION_PROMPT.txt` (you're already doing this!)

2. **Test enhanced gradually** - Try one follow-up call with knowledge base

3. **Compare quality** - See if enhanced assessment provides better care

4. **Rollout when ready** - Full knowledge base integration when you want it

## Support

- **Basic variables**: Fully documented in `VAPI_DYNAMIC_VARIABLES_COMPLETE.md`
- **Enhanced variables**: Full type definitions in `src/lib/vapi/types.ts`
- **Knowledge base**: Each condition file has detailed questions and criteria
- **Validation**: All variables validated in `src/lib/vapi/validators.ts`

You have both options available - use what works best for your workflow! 🎯
