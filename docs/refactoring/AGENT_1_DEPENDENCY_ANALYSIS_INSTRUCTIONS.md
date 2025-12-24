# Agent 1: Dependency Analysis Instructions

**Agent Type:** Explore
**Phase:** 1 - Discovery
**Execution Mode:** Parallel with Agents 2 & 3
**Deliverable:** `DEPENDENCY_ANALYSIS_REPORT.md`

---

## YOUR MISSION

You are the Dependency Analysis agent. Your task is to comprehensively analyze the dependency structure of the ODIS AI Nx monorepo, verify the claim of zero circular dependencies, and identify patterns that may indicate architectural issues.

---

## OBJECTIVES

### 1. Dependency Graph Generation
Run `nx graph --file=graph.json` to capture the complete dependency structure.

**Location:** `/Users/taylorallen/Development/odis-ai-web/`

**Expected Output:**
- `graph.json` file in workspace root
- Visual dependency graph (optional screenshot)

**Analysis:**
- Total number of nodes (projects)
- Total number of edges (dependencies)
- Graph density (edges / max possible edges)

### 2. Circular Dependency Verification
**Claim to verify:** "Zero circular dependencies" (from MONOREPO_ANALYSIS_REPORT.md)

**Methods:**
```bash
# Method 1: Nx graph analysis
nx graph --file=graph.json
# Inspect graph.json for cycles

# Method 2: Use madge (if available)
npx madge --circular --extensions ts,tsx libs/

# Method 3: Manual import tracing
grep -r "from '@odis-ai" libs/ > all-imports.txt
# Analyze for circular patterns
```

**Report:**
- Circular dependency count (verify: 0)
- If >0: List all circular dependency chains
- If 0: Confidence level in verification

### 3. Import Pattern Analysis
Analyze how libraries import each other across the codebase.

**Patterns to identify:**
- `@odis-ai/*` imports (modern pattern)
- `~/lib/*` imports (legacy pattern - should be deprecated)
- Direct file imports (`@odis-ai/utils/file-name`)
- Barrel imports (`@odis-ai/utils`)

**Count by pattern:**
```bash
# Modern pattern
grep -r "from '@odis-ai" libs/ | wc -l

# Legacy pattern
grep -r "from '~/lib" libs/ | wc -l

# Count per library
for lib in libs/*/; do
  echo "$lib: $(grep -r "from '@odis-ai" "$lib" | wc -l) modern imports"
done
```

**Deliverable:**
- Total import count by pattern
- Libraries still using legacy `~/*` pattern
- Recommendation: standardize on `@odis-ai/*`

### 4. God Library Identification
Identify libraries with excessive dependents (>10 direct dependents).

**Metrics:**
- **Fan-in:** How many libraries depend on this library
- **Fan-out:** How many libraries this library depends on

**Expected "god libraries":**
- `@odis-ai/types` (likely high fan-in)
- `@odis-ai/utils` (likely high fan-in)
- `@odis-ai/validators` (likely high fan-in)
- `@odis-ai/db` (likely high fan-in)

**Analysis:**
1. List top 10 libraries by fan-in (most dependents)
2. List top 10 libraries by fan-out (most dependencies)
3. Flag any library with >15 direct dependents
4. Assess if high coupling is justified (utils/types) or problematic

### 5. Dependency Depth Analysis
Calculate the maximum depth of the dependency tree.

**Methodology:**
- Start from leaf libraries (zero dependencies)
- Calculate depth to root (apps)
- Identify longest dependency chain

**Metrics:**
- Maximum depth (target: <5 levels)
- Average depth across all libraries
- Libraries at each depth level

**Example:**
```
Level 0 (Foundation): types, constants, env
Level 1 (Utils): utils, validators, logger (depend on Level 0)
Level 2 (Data): db (depends on types, utils, logger)
Level 3 (Integrations): vapi, idexx, qstash (depend on db, utils)
Level 4 (Services): services-cases, services-discharge (depend on integrations, db)
Level 5 (Apps): web, chrome-extension, idexx-sync (depend on services)
```

### 6. Platform Separation Verification
Verify that browser/node/neutral platform tags are enforced.

**Critical Rules:**
- `platform:browser` can only depend on `platform:browser` or `platform:neutral`
- `platform:neutral` can only depend on `platform:neutral`
- `platform:node` can depend on any platform (no constraint)

**Check:**
1. Extract all projects with `platform:browser` tag
2. For each, verify dependencies have `platform:browser` or `platform:neutral` tags
3. Flag any violations

**Expected violations:** ZERO (enforced by ESLint)

**Files to check:**
- All `libs/*/project.json` files
- ESLint config: `/Users/taylorallen/Development/odis-ai-web/eslint.config.js`

### 7. Implicit Dependencies Check
Review `project.json` files for implicit dependencies that bypass dependency graph.

**What to look for:**
```json
{
  "implicitDependencies": ["some-lib"]
}
```

**Analysis:**
- Count libraries with implicit dependencies
- Assess if justified (build order) or problematic
- Check for hidden coupling

---

## DATA SOURCES

### Primary Files
- `/Users/taylorallen/Development/odis-ai-web/nx.json` - Nx config
- `/Users/taylorallen/Development/odis-ai-web/tsconfig.base.json` - Path mappings (33 libs)
- `/Users/taylorallen/Development/odis-ai-web/eslint.config.js` - Module boundaries
- All `libs/*/project.json` - Project configs (33 files)
- All `libs/*/src/index.ts` - Barrel exports (33 files)

### Reference Documents
- `/Users/taylorallen/Development/odis-ai-web/MONOREPO_ANALYSIS_REPORT.md` - Initial audit
- `/Users/taylorallen/Development/odis-ai-web/CLAUDE.md` - Recent changes
- `/Users/taylorallen/Development/odis-ai-web/docs/refactoring/PHASE_1_BRIEFING.md` - Context

---

## DELIVERABLE FORMAT

### Report Structure

```markdown
# Dependency Analysis Report

**Generated:** [timestamp]
**Agent:** Dependency Analysis (Agent 1)
**Phase:** 1 - Discovery

---

## EXECUTIVE SUMMARY
[2-3 paragraph overview of findings]

---

## 1. DEPENDENCY GRAPH ANALYSIS

### Graph Metrics
- Total projects: [count]
- Total dependencies: [count]
- Graph density: [calculation]

### Visual Graph
[Link to graph.json or screenshot]

---

## 2. CIRCULAR DEPENDENCY VERIFICATION

### Verification Method
[Describe approach used]

### Results
- Circular dependencies found: [count]
- Confidence level: [High/Medium/Low]

[If >0: List all circular chains]
[If 0: Explain verification approach]

---

## 3. IMPORT PATTERN ANALYSIS

### Pattern Distribution
| Pattern | Count | Percentage |
|---------|-------|------------|
| @odis-ai/* (modern) | [X] | [Y%] |
| ~/lib/* (legacy) | [X] | [Y%] |

### Libraries Using Legacy Patterns
[List libraries still using ~/lib/*]

### Recommendation
[Standardization recommendation]

---

## 4. GOD LIBRARY IDENTIFICATION

### High Fan-In Libraries (Most Dependents)
| Rank | Library | Dependents | Justified? |
|------|---------|------------|------------|
| 1 | types | 28 | ✅ Yes (foundation) |
| ... | ... | ... | ... |

### High Fan-Out Libraries (Most Dependencies)
| Rank | Library | Dependencies | Concern? |
|------|---------|--------------|----------|
| 1 | services-cases | 12 | 🟡 Review |
| ... | ... | ... | ... |

### Analysis
[Assess coupling levels]

---

## 5. DEPENDENCY DEPTH ANALYSIS

### Depth Metrics
- Maximum depth: [X] levels
- Average depth: [Y] levels
- Target depth: <5 levels

### Libraries by Depth
**Level 0 (Foundation):**
- types, constants, env, ...

**Level 1 (Utils):**
- utils, validators, logger, ...

[Continue for all levels]

### Longest Dependency Chain
[Example: app → service → integration → data-access → util → types]

---

## 6. PLATFORM SEPARATION VERIFICATION

### Platform Tags Overview
- `platform:browser`: [count] projects
- `platform:node`: [count] projects
- `platform:neutral`: [count] projects

### Violations Found
[List any violations]

### Confidence
[High/Medium/Low] - ESLint should enforce these rules

---

## 7. IMPLICIT DEPENDENCIES

### Projects with Implicit Dependencies
[List projects and their implicit deps]

### Analysis
[Assess if justified]

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

### A. Graph.json Location
[Path to generated file]

### B. Raw Data
[Any raw counts or analysis data]

### C. Verification Commands
[Commands used for analysis]

---

**Report End**
```

---

## SUCCESS CRITERIA

Your report is complete when:
- ✅ Circular dependency claim verified (count: 0 or list of violations)
- ✅ All import patterns quantified (@odis-ai/* vs ~/lib/*)
- ✅ God libraries identified (top 10 by fan-in)
- ✅ Dependency depth calculated (max and average)
- ✅ Platform violations checked (expected: 0)
- ✅ Implicit dependencies documented
- ✅ graph.json generated and referenced
- ✅ Clear recommendations provided

---

## TIMELINE

**Target:** 2-4 hours (wall time)

**Estimated breakdown:**
- Graph generation: 15 minutes
- Circular dep verification: 30 minutes
- Import pattern analysis: 45 minutes
- God library identification: 30 minutes
- Depth analysis: 30 minutes
- Platform verification: 30 minutes
- Report writing: 45 minutes

---

## OUTPUT LOCATION

**Save report to:**
`/Users/taylorallen/Development/odis-ai-web/docs/refactoring/DEPENDENCY_ANALYSIS_REPORT.md`

---

## COORDINATION

- **Execution Mode:** Parallel (no waiting for other agents)
- **Dependencies:** None (you work independently)
- **Handoff:** Report to coordinator when complete
- **Next Phase:** Your findings inform Phase 2 Design agents

---

## QUESTIONS & ASSUMPTIONS

If you encounter issues:

1. **Nx commands fail:** Document error, proceed with manual analysis
2. **Graph.json too large:** Summarize key metrics only
3. **Madge not available:** Use nx graph and manual import tracing
4. **Ambiguous dependencies:** Make reasonable assumption, document it
5. **ESLint rules unclear:** Check eslint.config.js for source of truth

---

**BEGIN ANALYSIS NOW**

Your work is critical for establishing the dependency baseline. Be thorough, be accurate, and flag any surprising findings.

**Coordinator is waiting for your DEPENDENCY_ANALYSIS_REPORT.md**
