# Agent 2: Architecture Assessment Instructions

**Agent Type:** Explore
**Phase:** 1 - Discovery
**Execution Mode:** Parallel with Agents 1 & 3
**Deliverable:** `ARCHITECTURE_ASSESSMENT_REPORT.md`

---

## YOUR MISSION

You are the Architecture Assessment agent. Your task is to evaluate all 33 libraries against the Nx 4-type library model, audit the tagging strategy, verify ESLint boundary enforcement, and assess library sizes.

---

## OBJECTIVES

### 1. Nx 4-Type Library Model Classification
Map all 33 libraries to the Nx recommended 4-type model.

**Nx 4-Type Model:**

1. **Feature Libraries** (Smart Components + Business Logic)
   - Contains: Smart components, state management, business logic
   - Nx tags: `type:service`, `type:integration`
   - Can depend on: data-access, ui, util
   - Examples: services-cases, services-discharge, vapi, idexx

2. **Data-access Libraries** (State + API)
   - Contains: State management, API calls, data fetching
   - Nx tag: `type:data-access`
   - Can depend on: util, config, types
   - Examples: db (Supabase clients + repositories)

3. **UI Libraries** (Presentational Components)
   - Contains: Dumb/presentational components
   - Nx tag: `type:ui`
   - Can depend on: util, types (NO data-access)
   - Examples: ui (shadcn components), hooks

4. **Utility Libraries** (Pure Functions)
   - Contains: Pure functions, helpers, types, config
   - Nx tags: `type:util`, `type:types`, `type:config`
   - Can depend on: other utils, config, types only
   - Examples: utils, validators, types, constants, logger

**Your Task:**
- Classify all 33 libraries into one of these 4 types
- Identify libraries that don't fit cleanly (flag for review)
- Check if current `type:*` tags align with this model

### 2. Tag Audit
Audit all project tags (type, scope, platform) for consistency and correctness.

**Tag Types:**

**Type Tags** (Architectural layer):
- `type:app` - Applications (web, chrome-extension, idexx-sync)
- `type:service` - Domain services
- `type:integration` - External integrations
- `type:data-access` - Data/persistence layer
- `type:ui` - UI components
- `type:util` - Utilities
- `type:config` - Configuration
- `type:types` - Type definitions
- `type:testing` - Testing utilities

**Scope Tags** (Domain boundary):
- `scope:shared` - Shared across all apps
- `scope:server` - Server-only (Node.js)
- `scope:web` - Web app specific
- `scope:extension` - Chrome extension specific

**Platform Tags** (Runtime environment):
- `platform:browser` - Browser only (no Node APIs)
- `platform:node` - Node.js only (no browser APIs)
- `platform:neutral` - Works in both (pure TS, no platform APIs)

**Analysis:**
1. Extract tags from all `project.json` files
2. Create tag matrix: project → tags
3. Identify missing tags (projects without type/scope/platform)
4. Identify inconsistent tags (similar libs with different tags)
5. Verify tag combinations make sense (browser + node together = error)

**Expected Issues:**
- Some libs may be missing `platform:*` tags
- Some libs may have vague `type:util` when they should be `type:integration`
- Extension libs should all have `scope:extension` + `platform:browser`

### 3. Tag Consistency Check
Check that similar libraries use similar tags.

**Consistency Rules:**
- All service libs should have `type:service` + `scope:server`
- All integration libs should have `type:integration`
- All extension libs should have `scope:extension` + `platform:browser`
- All util libs should have `type:util` + `scope:shared` + `platform:neutral`

**Analysis:**
Create groupings:
- **Services group:** services-cases, services-discharge, services-shared
  - Expected: `type:service`, should all be similar
- **Integrations group:** vapi, idexx, qstash, resend, slack
  - Expected: `type:integration`
- **Extension group:** extension-shared, extension-storage, extension-env
  - Expected: `scope:extension` + `platform:browser`
- **Utils group:** utils, validators, logger, constants, crypto
  - Expected: `type:util` + `platform:neutral`

**Flag inconsistencies:**
- Service lib without `type:service` tag
- Integration lib tagged as `type:util`
- Extension lib without `platform:browser`

### 4. ESLint Boundary Enforcement Verification
Verify that `@nx/enforce-module-boundaries` rules in ESLint config match the actual architecture.

**File:** `/Users/taylorallen/Development/odis-ai-web/eslint.config.js`

**Check:**
1. Are all type constraints defined? (app, service, integration, data-access, ui, util, config, types)
2. Are platform constraints enforced? (browser → browser/neutral, neutral → neutral only)
3. Are scope constraints enforced? (extension → extension/shared only)
4. Are the constraints too loose or too strict?

**Verification:**
- Copy depConstraints from ESLint config
- Map to actual library tags
- Identify gaps (tags in projects not in ESLint rules)
- Identify unused rules (ESLint rules with no matching projects)

**Expected:** ESLint rules should cover all existing tag combinations

### 5. Library Size Assessment
Flag libraries with excessively large files (>1500 LOC).

**Known Large Files (from MONOREPO_ANALYSIS_REPORT.md):**
1. `libs/services-cases/src/lib/cases-service.ts` - 2,082 lines
2. `libs/services-discharge/src/lib/discharge-orchestrator.ts` - 1,785 lines
3. `libs/types/src/database.types.ts` - 3,043 lines (auto-generated, exempt)
4. `libs/clinics/src/lib/utils.ts` - 781 lines

**Your Task:**
1. Identify all files >1500 LOC (exclude auto-generated)
2. Categorize by severity:
   - 🔴 Critical (>2000 LOC): Immediate split needed
   - 🟡 Warning (1500-2000 LOC): Consider splitting
   - 🟢 OK (<1500 LOC): Acceptable
3. For each large file, recommend splitting strategy

**Splitting Strategies:**
- **Service files:** Split by domain/feature (e.g., cases-service → case-crud, case-workflow, case-validation)
- **Util files:** Split by category (e.g., date-utils, string-utils, validation-utils)
- **Orchestrator files:** Extract executors, validators, state management

### 6. Scoping Strategy Effectiveness
Assess if the current scope tags (shared/server/web/extension) are effective.

**Questions to answer:**
1. Are scope boundaries clear and well-defined?
2. Is `scope:shared` overused? (Should some be `scope:server` or `scope:extension`?)
3. Do extension libs truly avoid server dependencies?
4. Are there server-only libs incorrectly tagged as shared?

**Analysis:**
- List all `scope:shared` libs
- For each, check if truly shared or actually server/browser-specific
- Check for Node.js imports in `scope:shared` libs (shouldn't exist if truly neutral)
- Check for browser APIs in `scope:server` libs (shouldn't exist)

**Example Issues:**
- `@odis-ai/db` is `scope:shared` but uses Node.js-specific Supabase client (might need split)
- `@odis-ai/logger` is `scope:shared` but may have Node-specific logging (check)

---

## DATA SOURCES

### Primary Files
- All `libs/*/project.json` - Project tags (33 files)
- `/Users/taylorallen/Development/odis-ai-web/eslint.config.js` - Module boundaries
- `/Users/taylorallen/Development/odis-ai-web/nx.json` - Nx config
- All `libs/*/src/**/*.ts` - Source files for LOC counting

### Reference Documents
- `/Users/taylorallen/Development/odis-ai-web/MONOREPO_ANALYSIS_REPORT.md` - Initial audit
- `/Users/taylorallen/Development/odis-ai-web/docs/architecture/CORE_LIBS.md` - Library purposes
- `/Users/taylorallen/Development/odis-ai-web/docs/refactoring/PHASE_1_BRIEFING.md` - Context

### Commands
```bash
# Extract all project tags
for proj in apps/* libs/*; do
  if [ -f "$proj/project.json" ]; then
    echo "$proj:"
    jq -r '.tags[]' "$proj/project.json" 2>/dev/null || echo "  (no tags)"
  fi
done

# Count LOC per file
cloc libs/*/src --by-file

# Find large files
find libs/*/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

---

## DELIVERABLE FORMAT

### Report Structure

```markdown
# Architecture Assessment Report

**Generated:** [timestamp]
**Agent:** Architecture Assessment (Agent 2)
**Phase:** 1 - Discovery

---

## EXECUTIVE SUMMARY
[2-3 paragraph overview of findings]

---

## 1. NX 4-TYPE LIBRARY MODEL CLASSIFICATION

### Classification Matrix
| Library | Current Type Tag | Recommended Type | 4-Type Model Category | Alignment |
|---------|------------------|------------------|-----------------------|-----------|
| services-cases | type:service | type:service | Feature (Service) | ✅ Aligned |
| db | type:data-access | type:data-access | Data-access | ✅ Aligned |
| ui | type:ui | type:ui | UI | ✅ Aligned |
| utils | type:util | type:util | Utility | ✅ Aligned |
| ... | ... | ... | ... | ... |

### Misalignments Found
[List libraries that don't fit cleanly into 4-type model]

### Recommendations
[Suggest retagging or restructuring]

---

## 2. TAG AUDIT

### Tag Coverage
- Projects with `type:*` tag: [X]/36
- Projects with `scope:*` tag: [X]/36
- Projects with `platform:*` tag: [X]/36
- Projects with ALL three tags: [X]/36

### Missing Tags
| Project | Missing Tags |
|---------|-------------|
| lib-name | platform:* |
| ... | ... |

### Tag Distribution
**Type Tags:**
- type:app: [count]
- type:service: [count]
- type:integration: [count]
- type:data-access: [count]
- type:ui: [count]
- type:util: [count]
- type:types: [count]
- type:config: [count]
- type:testing: [count]

**Scope Tags:**
- scope:shared: [count]
- scope:server: [count]
- scope:web: [count]
- scope:extension: [count]

**Platform Tags:**
- platform:browser: [count]
- platform:node: [count]
- platform:neutral: [count]

---

## 3. TAG CONSISTENCY CHECK

### Service Group Consistency
| Library | Type Tag | Scope Tag | Platform Tag | Consistent? |
|---------|----------|-----------|--------------|-------------|
| services-cases | type:service | scope:server | platform:node | ✅ |
| services-discharge | type:service | scope:server | platform:node | ✅ |
| services-shared | type:service | scope:shared | platform:neutral | 🟡 (scope different) |

[Repeat for other groups]

### Inconsistencies Identified
1. [Inconsistency 1]
2. [Inconsistency 2]
3. ...

### Recommendations
[Suggest standardization]

---

## 4. ESLINT BOUNDARY ENFORCEMENT

### Constraints Defined in ESLint
[Copy depConstraints from eslint.config.js]

### Coverage Analysis
- Tag combinations in projects: [X]
- Constraints in ESLint: [Y]
- Coverage percentage: [Z%]

### Gaps Identified
**Tags not covered by ESLint rules:**
- [tag combination 1]
- [tag combination 2]

**ESLint rules with no matching projects:**
- [unused rule 1]

### Verification
[Are constraints properly enforced?]

---

## 5. LIBRARY SIZE ASSESSMENT

### Large Files Identified
| File | LOC | Severity | Recommendation |
|------|-----|----------|----------------|
| services-cases/cases-service.ts | 2,082 | 🔴 Critical | Split into modules |
| services-discharge/discharge-orchestrator.ts | 1,785 | 🔴 Critical | Extract executors |
| clinics/utils.ts | 781 | 🟡 Warning | Consider splitting |
| ... | ... | ... | ... |

### Size Distribution
- Files >2000 LOC: [count] (Critical)
- Files 1500-2000 LOC: [count] (Warning)
- Files <1500 LOC: [count] (OK)

### Splitting Strategies
**For services-cases (2,082 LOC):**
- Extract: case-crud.ts (CRUD operations)
- Extract: case-workflow.ts (Workflow management)
- Extract: case-validation.ts (Validation logic)
- Keep: cases-service.ts (Orchestration only)

[Repeat for other large files]

---

## 6. SCOPING STRATEGY EFFECTIVENESS

### Scope:Shared Analysis
**Libraries with scope:shared tag:**
1. types
2. validators
3. utils
4. db
5. ... (list all)

**Are they truly shared?**
| Library | Truly Shared? | Node-specific? | Browser-specific? | Recommendation |
|---------|---------------|----------------|-------------------|----------------|
| types | ✅ Yes | No | No | Keep shared |
| db | 🟡 Partial | Yes (service client) | Yes (browser client) | Consider split |
| ... | ... | ... | ... | ... |

### Scope:Extension Analysis
**Extension libraries:**
- extension-shared
- extension-storage
- extension-env

**Verification:**
- Do they avoid server dependencies? [Yes/No]
- Are they properly isolated? [Yes/No]

### Scope:Server Analysis
**Server libraries:**
- services-cases
- services-discharge
- ... (list all)

**Verification:**
- Do they avoid browser APIs? [Yes/No]
- Are they Node.js-only? [Yes/No]

### Recommendations
[Suggest scope adjustments]

---

## KEY FINDINGS

### Strengths ✅
1. [Finding 1]
2. [Finding 2]
3. ...

### Issues Identified 🔴
1. [Issue 1]
2. [Issue 2]
3. ...

### Recommendations 💡
1. [Recommendation 1]
2. [Recommendation 2]
3. ...

---

## APPENDIX

### A. Complete Tag Matrix
[CSV or table of all projects and their tags]

### B. ESLint Constraints Reference
[Full depConstraints from eslint.config.js]

### C. File Size Report
[cloc output or summary]

---

**Report End**
```

---

## SUCCESS CRITERIA

Your report is complete when:
- ✅ All 33 libraries classified into Nx 4-type model
- ✅ Complete tag audit (type, scope, platform)
- ✅ Tag consistency checked across similar libraries
- ✅ ESLint boundary enforcement verified
- ✅ All files >1500 LOC identified and assessed
- ✅ Scoping strategy effectiveness evaluated
- ✅ Clear recommendations provided

---

## TIMELINE

**Target:** 2-4 hours (wall time)

**Estimated breakdown:**
- 4-type classification: 45 minutes
- Tag audit: 45 minutes
- Consistency check: 30 minutes
- ESLint verification: 30 minutes
- Size assessment: 30 minutes
- Scoping analysis: 30 minutes
- Report writing: 45 minutes

---

## OUTPUT LOCATION

**Save report to:**
`/Users/taylorallen/Development/odis-ai-web/docs/refactoring/ARCHITECTURE_ASSESSMENT_REPORT.md`

---

## COORDINATION

- **Execution Mode:** Parallel (no waiting for other agents)
- **Dependencies:** None (you work independently)
- **Handoff:** Report to coordinator when complete
- **Next Phase:** Your findings inform Phase 2 Design agents

---

## QUESTIONS & ASSUMPTIONS

If you encounter issues:

1. **Missing tags:** Document which projects lack tags
2. **Ambiguous classification:** Use best judgment, note uncertainty
3. **ESLint config unclear:** Reference docs or make reasonable assumption
4. **LOC counting:** Use `cloc` or manual `wc -l`, exclude comments
5. **Scope ambiguity:** Check for Node.js/browser imports to determine platform

---

**BEGIN ASSESSMENT NOW**

Your work establishes the architectural baseline. Be thorough in classification and tagging analysis.

**Coordinator is waiting for your ARCHITECTURE_ASSESSMENT_REPORT.md**
