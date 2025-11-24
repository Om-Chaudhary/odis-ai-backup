# VAPI Prompt Files - Organization

## Current Active File

**📄 `VAPI_SYSTEM_PROMPT.txt`** - **USE THIS FILE**

This is the consolidated, authoritative VAPI system prompt that includes:

- ✅ All conversation flows (discharge & follow-up)
- ✅ 40+ AI-extracted dynamic variables
- ✅ Conditional blocks to prevent literal variable names
- ✅ Complete documentation and examples
- ✅ Version history
- ✅ Safety rules and edge cases

**This is the single source of truth for the VAPI assistant prompt.**

---

## Legacy Files (For Reference Only)

### `VAPI_PRODUCTION_PROMPT.txt`

- **Status:** Legacy (superseded by VAPI_SYSTEM_PROMPT.txt)
- **Content:** Original production prompt with conditionals added
- **Recommend:** Archive or delete after verification

### `VAPI_ENHANCED_PROMPT.txt`

- **Status:** Legacy (superseded by VAPI_SYSTEM_PROMPT.txt)
- **Content:** Enhanced prompt with knowledge base references
- **Recommend:** Archive or delete after verification

### `docs/VAPI_ASSISTANT_PROMPT.md`

- **Status:** Legacy documentation
- **Content:** Older markdown version of prompt
- **Recommend:** Archive or delete after verification

---

## Documentation Files (Keep)

### `VAPI_AI_EXTRACTION_VARIABLES.md`

- **Status:** Active documentation
- **Purpose:** Complete reference of all 40+ AI-extracted variables
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

## Recommended Actions

1. **Update VAPI Dashboard**
   - Replace assistant prompt with `VAPI_SYSTEM_PROMPT.txt` content
   - Test with sample calls to verify variable substitution

2. **Archive Legacy Files**

   ```bash
   mkdir -p archive/vapi-prompts
   mv VAPI_PRODUCTION_PROMPT.txt archive/vapi-prompts/
   mv VAPI_ENHANCED_PROMPT.txt archive/vapi-prompts/
   mv docs/VAPI_ASSISTANT_PROMPT.md archive/vapi-prompts/
   ```

3. **Update References**
   - Update CLAUDE.md to reference `VAPI_SYSTEM_PROMPT.txt`
   - Update any deployment scripts or documentation

---

## File Structure Overview

```
odis-ai-web/
├── VAPI_SYSTEM_PROMPT.txt                          ⭐ USE THIS
├── VAPI_AI_EXTRACTION_VARIABLES.md                 📚 Reference
├── VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md       📚 Guide
├── VAPI_KNOWLEDGE_BASE_USAGE.md                    📚 KB Docs
├── VAPI_FINAL_SETUP.md                             📚 Setup
├── VAPI_PRODUCTION_PROMPT.txt                      ⚠️ Legacy
├── VAPI_ENHANCED_PROMPT.txt                        ⚠️ Legacy
└── docs/
    └── VAPI_ASSISTANT_PROMPT.md                    ⚠️ Legacy
```

---

## Quick Start

**To update the VAPI assistant prompt:**

1. Copy content from `VAPI_SYSTEM_PROMPT.txt`
2. Go to VAPI Dashboard → Assistants → [Your Assistant]
3. Paste into "System Prompt" field
4. Save and test

**To understand available variables:**

1. Read `VAPI_AI_EXTRACTION_VARIABLES.md`
2. See examples in `VAPI_SYSTEM_PROMPT.txt`
3. Check integration in `src/lib/vapi/extract-variables.ts`

---

## Version Control

**Current Version:** 2.0
**Last Updated:** 2025-01-16

All changes to the system prompt should be made in `VAPI_SYSTEM_PROMPT.txt` with version notes at the bottom of the file.
