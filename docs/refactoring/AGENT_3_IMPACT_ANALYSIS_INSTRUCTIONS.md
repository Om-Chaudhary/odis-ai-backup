# Agent 3: Impact Analysis Instructions

**Agent Type:** Explore
**Phase:** 1 - Discovery
**Execution Mode:** Parallel with Agents 1 & 2
**Deliverable:** `IMPACT_ANALYSIS_REPORT.md`

---

## YOUR MISSION

You are the Impact Analysis agent. Your task is to analyze the dependency fan-out, identify high-impact libraries, assess restructuring risks, estimate effort for improvements, and document completed refactoring work.

---

## OBJECTIVES

### 1. Dependency Fan-Out Analysis
Map which libraries depend on which other libraries (who depends on whom).

**Metrics:**
- **Fan-Out:** For each library, count how many OTHER libraries it depends on
- **Fan-In:** For each library, count how many OTHER libraries depend on IT

**Example:**
```
Library: @odis-ai/types
Fan-In: 28 (28 libraries import from types)
Fan-Out: 0 (types doesn't import from anything)
Impact: HIGH (many dependents)
```

**Your Task:**
1. Parse all import statements in `libs/` directory
2. Build dependency matrix: Library A → depends on → Library B
3. Calculate fan-in and fan-out for each library
4. Create sortable table by fan-in (most impactful first)

**Commands:**
```bash
# Find all imports
grep -r "from '@odis-ai" libs/ > all-imports.txt

# Count imports per library
for lib in libs/*/; do
  libname=$(basename "$lib")
  echo "$libname:"
  grep -r "from '@odis-ai/$libname" libs/ | wc -l
done
```

### 2. High-Impact Library Identification
Identify the top 10 libraries by number of dependents (fan-in).

**Expected High-Impact Libraries:**
1. `@odis-ai/types` - Shared types (likely 25+ dependents)
2. `@odis-ai/utils` - Shared utilities (likely 20+ dependents)
3. `@odis-ai/validators` - Zod schemas (likely 15+ dependents)
4. `@odis-ai/db` - Database access (likely 15+ dependents)
5. `@odis-ai/logger` - Logging (likely 10+ dependents)

**Analysis:**
- List top 10 libraries by fan-in
- For each, calculate "blast radius" if breaking changes were made
- Assess if high impact is justified (foundation libs) or problematic (coupling)

**Blast Radius Calculation:**
```
Direct dependents + transitive dependents
Example:
- types: 28 direct dependents
- If types changes, potentially all 28 libraries need updates
- Blast radius: HIGH (28 projects affected)
```

### 3. Risk Assessment for Restructuring
Assess risk level (Low/Medium/High) for restructuring each library.

**Risk Factors:**
1. **Fan-In:** More dependents = higher risk
2. **Stability:** Critical production code = higher risk
3. **Test Coverage:** Poor tests = higher risk
4. **File Size:** Large files = higher complexity = higher risk
5. **External Dependencies:** External integrations = higher risk

**Risk Levels:**
- **Low Risk:** <5 dependents, well-tested, small files
- **Medium Risk:** 5-15 dependents, some tests, medium files
- **High Risk:** >15 dependents, poor tests, large files, or critical path

**Your Task:**
1. Categorize all 33 libraries by risk level
2. For high-risk libs, document specific concerns
3. Recommend mitigation strategies

**Example:**
```markdown
### High-Risk Libraries
1. **@odis-ai/types** (28 dependents)
   - Risk: HIGH (affects almost entire codebase)
   - Concern: Breaking changes ripple everywhere
   - Mitigation: Version carefully, use deprecation warnings, extensive testing
```

### 4. Effort Estimation
Estimate effort (hours/days) for potential improvements.

**Improvements to Estimate:**

**1. Remove deprecated retell library**
- Effort: 2-4 hours
- Impact: Low (already deprecated, no active usage)
- Steps: Delete directory, remove from package.json, verify no imports

**2. Split large service files**
- `services-cases/cases-service.ts` (2,082 LOC) → 16-24 hours
- `services-discharge/discharge-orchestrator.ts` (1,785 LOC) → 12-16 hours
- Steps: Extract modules, refactor imports, add tests, verify functionality

**3. Standardize import paths**
- Replace `~/lib/*` with `@odis-ai/*` → 8-12 hours
- Steps: Find/replace, update imports, test all affected files

**4. Add missing tags**
- Add type/scope/platform tags to untagged libs → 2-3 hours
- Steps: Categorize each lib, add tags to project.json, verify ESLint

**5. Add library READMEs**
- 27 missing READMEs (6 exist, 27 needed) → 20-30 hours
- Effort per README: ~1 hour
- Steps: Document purpose, API, examples, usage

**6. Fix process.env access**
- Replace 113 direct accesses with typed env → 6-8 hours
- Steps: Find all occurrences, replace with @odis-ai/env imports, test

**Your Task:**
Create effort matrix for all potential improvements:
| Improvement | Effort (hours) | Impact | Priority |
|-------------|----------------|--------|----------|
| Remove retell | 2-4h | Low | Quick Win |
| ... | ... | ... | ... |

### 5. Completed Work Verification
Document refactoring work already completed (Phases 1-3).

**Known Completed Work:**

**Phase 1: Router Splitting ✅**
- Split `dashboard` router (2,029 lines → 6 files)
- Split `cases` router (2,003 lines → 6 files)
- Location: `apps/web/src/server/api/routers/`

**Phase 2: Services Split ✅**
- Created `libs/services-cases/` (case management)
- Created `libs/services-discharge/` (discharge orchestration)
- Created `libs/services-shared/` (shared execution plan logic)
- Implemented repository interfaces (`ICasesRepository`, `IUserRepository`, etc.)
- Added dependency injection support

**Phase 3: Type Consolidation ✅**
- Created `libs/types/` (shared TypeScript types)
- Consolidated types from web app
- 290+ tests preserved

**Your Task:**
1. Verify each completed phase (check files exist, no regressions)
2. Document benefits achieved (e.g., "Router splitting reduced file size by 70%")
3. Identify any incomplete work or regressions
4. Assess quality of completed work (tests, documentation)

**Verification Commands:**
```bash
# Check router splitting
ls apps/web/src/server/api/routers/dashboard/
ls apps/web/src/server/api/routers/cases/

# Check services split
ls libs/services-cases/
ls libs/services-discharge/
ls libs/services-shared/

# Check type consolidation
ls libs/types/src/

# Count tests
find libs/services-* -name "*.test.ts" -o -name "*.spec.ts" | wc -l
find libs/validators -name "*.test.ts" -o -name "*.spec.ts" | wc -l
```

### 6. Integration Planning Considerations
Identify dependencies between new architecture improvements and existing work.

**Questions to Answer:**
1. Does any new refactoring conflict with completed work?
2. Are there prerequisites before starting new improvements?
3. Can improvements be done in parallel or must be sequential?
4. What's the optimal execution order?

**Example Conflicts:**
- Splitting service files (new) depends on router splitting (completed ✅)
- Adding tags (new) should be done before restructuring (to maintain boundaries)
- Removing retell (new) has no dependencies (can be done anytime)

**Your Task:**
Create dependency graph of improvements:
```
Phase 1-3 (Completed) → Phase 4 (Tag standardization) → Phase 5 (Restructuring)
                     ↘ Phase 4a (Remove retell) [No dependencies]
```

---

## DATA SOURCES

### Primary Files
- All `libs/*/src/**/*.ts` - Import statements (~7,164 files)
- All `libs/*/project.json` - Current tags and config (33 files)
- `/Users/taylorallen/Development/odis-ai-web/MONOREPO_ANALYSIS_REPORT.md` - Existing audit
- `/Users/taylorallen/Development/odis-ai-web/CLAUDE.md` - Recent changes documentation

### Git History
```bash
# Check recent commits
git log --oneline --since="2 months ago" -- libs/

# Verify router splitting
git log --oneline -- apps/web/src/server/api/routers/

# Verify services split
git log --oneline -- libs/services-*
```

### Reference Documents
- `/Users/taylorallen/Development/odis-ai-web/docs/architecture/CORE_LIBS.md` - Library overview
- `/Users/taylorallen/Development/odis-ai-web/docs/refactoring/PHASE_1_BRIEFING.md` - Context

---

## DELIVERABLE FORMAT

### Report Structure

```markdown
# Impact Analysis Report

**Generated:** [timestamp]
**Agent:** Impact Analysis (Agent 3)
**Phase:** 1 - Discovery

---

## EXECUTIVE SUMMARY
[2-3 paragraph overview of findings]

---

## 1. DEPENDENCY FAN-OUT ANALYSIS

### Fan-Out Matrix
| Library | Fan-Out (Dependencies) | Fan-In (Dependents) | Impact Level |
|---------|------------------------|---------------------|--------------|
| types | 0 | 28 | 🔴 HIGH |
| utils | 3 | 22 | 🔴 HIGH |
| validators | 2 | 18 | 🟡 MEDIUM |
| ... | ... | ... | ... |

### Dependency Graph Summary
- Total dependency edges: [count]
- Average fan-in: [X]
- Average fan-out: [Y]
- Max fan-in: [Z] (library name)

---

## 2. HIGH-IMPACT LIBRARY IDENTIFICATION

### Top 10 Libraries by Dependents
1. **@odis-ai/types** - 28 dependents
   - Blast Radius: 🔴 CRITICAL (affects entire codebase)
   - Nature: Foundation library (justified high impact)
   - Recommendation: Extreme caution on breaking changes

2. **@odis-ai/utils** - 22 dependents
   - Blast Radius: 🔴 HIGH
   - Nature: Shared utilities
   - Recommendation: Version carefully, add comprehensive tests

[Continue for top 10]

### Impact Analysis
[Assess whether high coupling is appropriate]

---

## 3. RISK ASSESSMENT FOR RESTRUCTURING

### Risk Categorization
**High-Risk Libraries (>15 dependents or critical path):**
1. types (28 dependents) - Foundation library
2. utils (22 dependents) - Widely used utilities
3. ... (continue)

**Medium-Risk Libraries (5-15 dependents):**
1. validators (18 dependents) - Well-tested, lower risk
2. ... (continue)

**Low-Risk Libraries (<5 dependents):**
1. retell (0 dependents, deprecated) - Safe to remove
2. ... (continue)

### Risk Factors by Library
| Library | Dependents | Test Coverage | File Size | External Deps | Overall Risk |
|---------|------------|---------------|-----------|---------------|--------------|
| types | 28 | Low | Large | None | 🔴 HIGH |
| services-cases | 12 | Low | Very Large | Many | 🔴 HIGH |
| validators | 18 | Excellent | Medium | None | 🟢 LOW |
| ... | ... | ... | ... | ... | ... |

### Mitigation Strategies
**For High-Risk Libraries:**
1. [Strategy 1]
2. [Strategy 2]
3. ...

---

## 4. EFFORT ESTIMATION

### Improvement Effort Matrix
| Improvement | Effort (hours) | Complexity | Impact | Priority | Dependencies |
|-------------|----------------|------------|--------|----------|--------------|
| Remove retell lib | 2-4h | Low | Low | Quick Win | None |
| Split cases-service | 16-24h | High | High | Critical | Router split (done) |
| Standardize imports | 8-12h | Medium | Medium | Important | None |
| Add missing tags | 2-3h | Low | Medium | Quick Win | None |
| Add READMEs (27) | 20-30h | Low | Medium | Nice-to-Have | None |
| Fix process.env | 6-8h | Medium | Medium | Important | None |
| ... | ... | ... | ... | ... | ... |

### Effort by Category
- **Quick Wins** (<4 hours): [count] items, [total hours]
- **Important** (4-12 hours): [count] items, [total hours]
- **Critical** (>12 hours): [count] items, [total hours]

### Total Estimated Effort
- Total hours: [X]
- Total days (8h days): [Y]
- Parallelizable work: [Z hours]
- Critical path: [W hours]

---

## 5. COMPLETED WORK VERIFICATION

### Phase 1: Router Splitting ✅
**Status:** COMPLETE

**What was done:**
- Split dashboard router (2,029 lines → 6 files)
  - Original: apps/web/src/server/api/routers/dashboard.ts
  - New: apps/web/src/server/api/routers/dashboard/ (6 files)
- Split cases router (2,003 lines → 6 files)
  - Original: apps/web/src/server/api/routers/cases.ts
  - New: apps/web/src/server/api/routers/cases/ (6 files)

**Verification:**
- Files exist: [Yes/No]
- Tests passing: [Yes/No]
- Reduction: [~70% file size reduction]

**Benefits Achieved:**
1. Improved maintainability (smaller files)
2. Better code organization (feature-based)
3. Easier code review (isolated changes)

**Issues Found:**
[None / List any regressions]

### Phase 2: Services Split ✅
**Status:** COMPLETE

**What was done:**
- Created libs/services-cases/ (case management service)
- Created libs/services-discharge/ (discharge orchestration)
- Created libs/services-shared/ (shared execution plan)
- Implemented repository pattern (ICasesRepository, IUserRepository, etc.)
- Added dependency injection support

**Verification:**
- Libraries exist: [Yes/No]
- Tests exist: [count] test files
- Repository interfaces defined: [Yes/No]
- DI working: [Yes/No]

**Benefits Achieved:**
1. Testable services (DI-enabled)
2. Clear separation of concerns
3. Reusable service logic

**Issues Found:**
[None / List any incomplete work]

### Phase 3: Type Consolidation ✅
**Status:** COMPLETE

**What was done:**
- Created libs/types/ (shared TypeScript types)
- Consolidated types from web app
- Established single source of truth for domain types

**Verification:**
- Library exists: [Yes/No]
- Types exported: [count]
- Tests preserved: [290+ tests still passing]
- Imports updated: [Yes/No]

**Benefits Achieved:**
1. Single source of truth for types
2. Reduced duplication
3. Better type consistency

**Issues Found:**
[None / List any regressions]

### Overall Completed Work Assessment
- **Quality:** [Excellent/Good/Fair/Poor]
- **Completeness:** [100% / X% complete]
- **Regressions:** [None / List]
- **Documentation:** [Adequate / Needs improvement]

---

## 6. INTEGRATION PLANNING CONSIDERATIONS

### Dependency Graph of Improvements
```
Completed Work (Phases 1-3)
    ↓
┌───┴───┬───────────┬──────────┐
│       │           │          │
Tag     Remove      Fix        Add
Standard retell    imports    READMEs
    ↓       ↓
    │       └─→ (No conflicts)
    ↓
Split Service Files
    ↓
Advanced Restructuring
```

### Execution Order Recommendations
1. **Phase 4a (Parallel):** Remove retell + Fix imports + Add tags
2. **Phase 4b (Sequential):** Add READMEs (ongoing, parallel to other work)
3. **Phase 5 (After 4a):** Split service files (depends on tag standardization)
4. **Phase 6 (After 5):** Advanced restructuring

### Conflicts & Prerequisites
**No Conflicts:**
- Remove retell (independent)
- Fix imports (independent)
- Add READMEs (independent)

**Prerequisites:**
- Tag standardization → Must complete before restructuring
- Router splitting (done) → Prerequisite for service splitting

### Parallelization Opportunities
- Remove retell || Fix imports || Add tags (can all run in parallel)
- README writing (can happen anytime, doesn't block other work)

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

### A. Complete Dependency Matrix
[CSV or detailed table]

### B. Effort Estimation Details
[Breakdown of estimates]

### C. Verification Commands Used
[Commands for verification]

---

**Report End**
```

---

## SUCCESS CRITERIA

Your report is complete when:
- ✅ Dependency fan-out matrix created (fan-in + fan-out for all libs)
- ✅ Top 10 high-impact libraries identified
- ✅ Risk assessment completed (Low/Medium/High for all libs)
- ✅ Effort estimation provided for all improvements
- ✅ Completed work verified (Phases 1-3)
- ✅ Integration dependencies mapped
- ✅ Clear execution order recommended

---

## TIMELINE

**Target:** 2-4 hours (wall time)

**Estimated breakdown:**
- Dependency fan-out analysis: 60 minutes
- High-impact lib identification: 30 minutes
- Risk assessment: 45 minutes
- Effort estimation: 45 minutes
- Completed work verification: 30 minutes
- Integration planning: 30 minutes
- Report writing: 45 minutes

---

## OUTPUT LOCATION

**Save report to:**
`/Users/taylorallen/Development/odis-ai-web/docs/refactoring/IMPACT_ANALYSIS_REPORT.md`

---

## COORDINATION

- **Execution Mode:** Parallel (no waiting for other agents)
- **Dependencies:** None (you work independently)
- **Handoff:** Report to coordinator when complete
- **Next Phase:** Your findings inform Phase 2 Design agents

---

## QUESTIONS & ASSUMPTIONS

If you encounter issues:

1. **Import parsing:** Focus on `@odis-ai/*` imports, ignore internal imports
2. **Effort estimation:** Use industry standards (20-30 LOC/hour for refactoring)
3. **Risk assessment:** Err on side of caution (mark as higher risk if uncertain)
4. **Completed work:** Verify via file existence + git history
5. **Dependencies:** Document assumptions about execution order

---

**BEGIN ANALYSIS NOW**

Your work is critical for understanding the impact of proposed changes and ensuring safe execution.

**Coordinator is waiting for your IMPACT_ANALYSIS_REPORT.md**
