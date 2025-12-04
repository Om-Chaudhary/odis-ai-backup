# VAPI Prompt Files - Organization

## Current Active File

**📄 `prompts/VAPI_SYSTEM_PROMPT_V4.txt`** - **USE THIS FILE**

This is the consolidated, authoritative VAPI system prompt (Version 4.0) that includes:

- ✅ Visit Type Classification (clinical, surgical, wellness, grooming)
- ✅ Question Gating Rules (skip irrelevant questions)
- ✅ All conversation flows (discharge & follow-up)
- ✅ 50+ AI-extracted dynamic variables
- ✅ Conditional blocks for adaptive conversations
- ✅ Complete documentation and examples
- ✅ Safety rules and edge cases
- ✅ Euthanasia/death handling

**This is the single source of truth for the VAPI assistant prompt.**

---

## Version 4.0 Key Improvements

1. **Visit Type Classification**: Automatically classifies visits as clinical, surgical, wellness, or grooming
2. **Question Gating**: Skips irrelevant questions (e.g., no medication questions for grooming visits)
3. **Improved Closing**: Brief, warm closings that don't repeat phone numbers
4. **Better Phase Flow**: More adaptive flow based on owner responses
5. **Enhanced Safety Rules**: Never ask for information we should already have

---

## Documentation Files (Keep)

### `VAPI_AI_EXTRACTION_VARIABLES.md`

- **Status:** Active documentation
- **Purpose:** Complete reference of all 50+ AI-extracted variables
- **Usage:** Technical reference for developers

### `VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md`

- **Status:** Active documentation
- **Purpose:** Integration guide and implementation summary
- **Usage:** Developer onboarding and troubleshooting

### `VAPI_KNOWLEDGE_BASE_USAGE.md`

- **Status:** Active documentation
- **Purpose:** Knowledge base system documentation
- **Usage:** Understanding condition-specific responses

### `VAPI_FINAL_SETUP.md`

- **Status:** Active documentation
- **Purpose:** Setup and configuration guide
- **Usage:** Initial VAPI setup instructions

---

## File Structure

```
docs/vapi/
├── prompts/
│   └── VAPI_SYSTEM_PROMPT_V4.txt      ⭐ USE THIS (Version 4.0)
├── VAPI_PROMPT_FILES.md                📚 This file
├── VAPI_AI_EXTRACTION_VARIABLES.md     📚 Variables reference
├── VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md  📚 Integration guide
├── VAPI_KNOWLEDGE_BASE_USAGE.md        📚 KB documentation
└── VAPI_FINAL_SETUP.md                 📚 Setup guide
```

---

## Quick Start

**To update the VAPI assistant prompt:**

1. Copy content from `prompts/VAPI_SYSTEM_PROMPT_V4.txt`
2. Go to VAPI Dashboard → Assistants → [Your Assistant]
3. Paste into "System Prompt" field
4. Save and test

**To understand available variables:**

1. Read `VAPI_AI_EXTRACTION_VARIABLES.md`
2. See examples in `prompts/VAPI_SYSTEM_PROMPT_V4.txt`
3. Check integration in `src/lib/vapi/extract-variables.ts`

---

## Version Control

**Current Version:** 4.0
**Last Updated:** 2025-12-04

All changes to the system prompt should be made in `prompts/VAPI_SYSTEM_PROMPT_V4.txt` with version notes at the bottom of the file.
