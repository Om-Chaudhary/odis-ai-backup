# Phase 1: Discovery - Agent Briefing Document

**Generated:** 2025-12-23
**Coordinator:** Multi-Agent Coordinator
**Phase:** 1 - Discovery
**Execution Mode:** Parallel (3 agents)

---

## MISSION OVERVIEW

Execute comprehensive discovery phase to establish baseline understanding of the ODIS AI Nx monorepo structure. This is the first phase of a 3-phase analysis aimed at optimizing library structure, eliminating issues, and ensuring Nx best practices compliance.

### Approved Plan Context

- **Primary Goal**: Verify existing work, fix issues found, optimize structure where beneficial
- **Risk Tolerance**: Moderate - balance stability with improvement
- **Validation Approach**: Trust audit docs claiming zero circular dependencies, but verify
- **Execution**: Full orchestration across all 3 phases

### Workspace Overview

- **Total apps:** 3 (web, chrome-extension, idexx-sync)
- **Total libs:** 33 (see inventory below)
- **Primary stack:** Next.js 15, React 19, TypeScript 5.8, Supabase, tRPC, Vitest
- **Total TypeScript/JavaScript files:** ~7,164
- **Lines of code estimate:** ~153,000+
- **Nx version:** 22.1.3
- **Package manager:** pnpm 10.23.0

---

## PHASE 1 OBJECTIVES

### Agent 1: Dependency Analysis (Explore)
**Deliverable:** `DEPENDENCY_ANALYSIS_REPORT.md`

Analyze the dependency graph and import patterns:
- Run `nx graph --file=graph.json` to capture dependency structure
- Verify circular dependency claim (current: 0)
- Map import patterns across all 33 libs
- Identify "god libraries" (high dependency count)
- Document dependency depth
- Verify platform separation (browser/node/neutral)
- Check implicit dependencies in project.json files
- Analyze import statement patterns

**Key Files:**
- All `libs/*/project.json` (33 files)
- `/Users/taylorallen/Development/odis-ai-web/tsconfig.base.json` (path mappings)
- All `libs/*/src/index.ts` (barrel exports)
- Output: Generate `graph.json` via Nx

**Focus Areas:**
1. Circular dependencies (claim: 0, verify)
2. Import pattern analysis (@odis-ai/* vs ~/* aliases)
3. Platform tag violations (browser accessing node)
4. God library identification (>10 dependents)
5. Dependency depth (max depth in tree)

---

### Agent 2: Architecture Assessment (Explore)
**Deliverable:** `ARCHITECTURE_ASSESSMENT_REPORT.md`

Review all 33 libs against Nx 4-type model:
- Audit tagging strategy (type:*, scope:*, platform:* tags)
- Check tag consistency across similar libs
- Verify `@nx/enforce-module-boundaries` in ESLint config
- Assess library sizes (flag >1500 LOC)
- Review scoping strategy effectiveness
- Identify missing or incorrect tags
- Map libs to Nx 4-type model (feature, data-access, util, ui)

**Key Files:**
- All `libs/*/project.json` (33 files)
- `/Users/taylorallen/Development/odis-ai-web/eslint.config.js` (module boundaries)
- `/Users/taylorallen/Development/odis-ai-web/nx.json` (Nx config)
- `/Users/taylorallen/Development/odis-ai-web/MONOREPO_ANALYSIS_REPORT.md` (existing audit)

**Nx 4-Type Model:**
1. **Feature libraries**: Smart components, business logic (type:service, type:integration)
2. **Data-access libraries**: State management, API calls (type:data-access)
3. **UI libraries**: Presentational components (type:ui)
4. **Utility libraries**: Pure functions, helpers (type:util, type:types, type:config)

**Focus Areas:**
1. Tag compliance (all libs properly tagged)
2. Tag consistency (similar libs use similar tags)
3. ESLint boundary enforcement
4. Library size violations (>1500 LOC main files)
5. Scoping effectiveness (scope:shared, scope:server, scope:extension)

---

### Agent 3: Impact Analysis (Explore)
**Deliverable:** `IMPACT_ANALYSIS_REPORT.md`

Analyze dependency fan-out and restructuring impact:
- Parse import statements across codebase
- Map dependency fan-out (who depends on what)
- Identify high-impact libraries (most dependents)
- Assess risk levels for restructuring
- Estimate effort for improvements
- Document completed vs remaining work
- Analyze refactoring Phases 1-3 completion status

**Key Files:**
- All TypeScript/JavaScript files (~7,164 files)
- `/Users/taylorallen/Development/odis-ai-web/MONOREPO_ANALYSIS_REPORT.md` (existing work)
- `/Users/taylorallen/Development/odis-ai-web/CLAUDE.md` (recent changes)
- Git history (recent commits showing refactoring)

**Focus Areas:**
1. Dependency fan-out matrix
2. High-impact library identification (top 10)
3. Risk assessment (low/medium/high)
4. Effort estimation (hours/days per improvement)
5. Completed work verification (router split, services split)

---

## WORKSPACE INVENTORY

### Applications (3)

1. **web** - Main Next.js app
   - Tags: `type:app`, `scope:web`, `platform:node`
   - Files: ~6,644
   - Notes: Recently refactored tRPC routers (6 modular files)

2. **chrome-extension** - Browser extension
   - Tags: `type:app`, `scope:extension`, `platform:browser`
   - Files: 112
   - Notes: Strict platform separation, relaxed TypeScript checks

3. **idexx-sync** - Background service
   - Tags: `type:app`, `scope:server`, `platform:node`
   - Files: 11
   - Notes: Express + Playwright, Docker support

### Libraries (33) - Categorized

#### Core Domain Services (3)
1. **services-cases** - Case management (11 files, 1 test)
   - Tags: `type:service`, `scope:server`, `platform:node`
   - Notes: 2,082-line main file (large)

2. **services-discharge** - Discharge orchestration (16 files, 1 test)
   - Tags: `type:service`, `scope:server`, `platform:node`
   - Notes: 1,785-line orchestrator (large)

3. **services-shared** - Shared execution plan logic (11 files, 1 test)
   - Tags: `type:service`, `scope:shared`, `platform:neutral`

#### Data & Persistence (1)
4. **db** - Supabase clients + repositories (25 files, 1 test)
   - Tags: `type:data-access`, `scope:shared`, `platform:neutral`
   - Notes: Repository pattern, multiple client types

#### External Integrations (6)
5. **vapi** - VAPI voice calls (39 files, 2 tests)
   - Notes: Client, webhooks, tools, prompts, knowledge-base

6. **idexx** - IDEXX Neo transformations (9 files)
7. **qstash** - QStash scheduling (5 files, 1 test)
8. **resend** - Resend email client (4 files)
9. **retell** - DEPRECATED - Legacy integration (3 files)
10. **slack** - Slack integration (32 files, 1 test)

#### Shared Infrastructure (11)
11. **types** - Shared TypeScript types (11 files)
    - Notes: 3,043-line database.types.ts (auto-generated)

12. **validators** - Zod schemas (22 files, 6 tests)
    - Notes: 236+ tests, 95%+ coverage (EXCELLENT)

13. **utils** - Shared utilities (24 files, 4 tests)
14. **constants** - Shared constants (2 files)
15. **logger** - Structured logging (2 files)
16. **api** - API helpers (13 files, 1 test)
17. **auth** - Authentication utilities (5 files)
18. **env** - Environment validation (2 files)
19. **crypto** - AES encryption (2 files)
20. **clinics** - Clinic configuration (5 files)
21. **ai** - AI/LLM utilities (19 files, 1 test)

#### UI & Styling (3)
22. **ui** - Shared React components (62 files)
    - Notes: shadcn/ui based, extension variant support

23. **styles** - Global styles & Tailwind (0 TS files)
24. **hooks** - Shared React hooks (7 files)

#### Extension-Specific (3)
25. **extension-shared** - Shared extension code (32 files)
    - Tags: `scope:extension`, `platform:browser`

26. **extension-storage** - Chrome storage wrappers (11 files)
    - Tags: `scope:extension`, `platform:browser`

27. **extension-env** - Extension env validation (5 files)
    - Tags: `scope:extension`, `platform:browser`

#### Testing & Email (2)
28. **testing** - Test utilities, mocks, fixtures (13 files)
    - Tags: `type:testing`, `scope:shared`

29. **email** - Email template rendering (5 files)

---

## KEY ARCHITECTURAL PATTERNS

### Dual API Surface
- **tRPC**: Type-safe RPC (`apps/web/src/server/api/routers/*`)
  - Routers split: dashboard (6 files), cases (6 files)
- **Server Actions**: Form flows (`apps/web/src/server/actions/*`)
- **API Routes**: Webhooks (`apps/web/src/app/api/*`)

### Supabase Client Pattern
- Standard client (RLS): `createServerClient` / `createBrowserClient`
- Service client (bypasses RLS): `createServiceClient`
- Repository Pattern: `ICasesRepository`, `IUserRepository`, etc.

### Service Layer Pattern
Services split into focused libraries with DI:
- `CasesService` from `@odis-ai/services-cases`
- `DischargeOrchestrator` from `@odis-ai/services-discharge`
- Services accept repository interfaces for testing

### Import Patterns
```typescript
// Shared Libraries
import type { DashboardCase } from "@odis-ai/types";
import { dischargeSchema } from "@odis-ai/validators";
import { transformBackendCaseToDashboardCase } from "@odis-ai/utils";
import type { ICasesRepository } from "@odis-ai/db/interfaces";
import { CasesService } from "@odis-ai/services-cases";

// Legacy patterns (to be deprecated)
import { X } from "~/lib/utils"; // ❌ Deprecated
```

---

## ESLint MODULE BOUNDARIES

### Platform Constraints (Critical)
```javascript
{
  sourceTag: "platform:browser",
  onlyDependOnLibsWithTags: ["platform:browser", "platform:neutral"]
},
{
  sourceTag: "platform:neutral",
  onlyDependOnLibsWithTags: ["platform:neutral"]
}
// platform:node can depend on any platform
```

### Type Constraints (Architectural layers)
```javascript
// Apps can depend on anything
"type:app" → ["type:service", "type:integration", "type:data-access", "type:ui", "type:util", "type:config", "type:types", "type:testing"]

// Services → integrations, data-access, utils, config, types
"type:service" → ["type:service", "type:integration", "type:data-access", "type:util", "type:config", "type:types"]

// Integrations → data-access, utils, config, types
"type:integration" → ["type:integration", "type:data-access", "type:util", "type:config", "type:types"]

// Data-access → utils, config, types
"type:data-access" → ["type:data-access", "type:util", "type:config", "type:types"]

// UI → utils, types
"type:ui" → ["type:ui", "type:util", "type:types"]

// Utils → utils, config, types
"type:util" → ["type:util", "type:config", "type:types"]

// Config → config only (foundation)
"type:config" → ["type:config"]

// Types → types only (foundation)
"type:types" → ["type:types"]
```

### Scope Constraints (Domain boundaries)
```javascript
// Extension scope CANNOT access server libs (CRITICAL)
"scope:extension" → ["scope:extension", "scope:shared"]

// Server scope can use server and shared
"scope:server" → ["scope:server", "scope:shared"]

// Shared scope can only use shared
"scope:shared" → ["scope:shared"]
```

---

## KNOWN ISSUES (From MONOREPO_ANALYSIS_REPORT.md)

### Critical (🔴)
1. **Deprecated Retell Integration** - libs/retell/ (3 files) - needs removal
2. **Large Service Files** - services-cases (2,082 LOC), services-discharge (1,785 LOC)
3. **113 Direct `process.env` Accesses** - should use @odis-ai/env
4. **Auto-generated Database Types** - database.types.ts (3,043 lines)

### Major (🟡)
5. **Insufficient Test Coverage** - Only 22 test files for 7,164 source files
6. **Documentation Gaps** - Only 6 libs have READMEs out of 33
7. **151 TODO/FIXME Comments** - scattered throughout
8. **Large Component Files** - 8 files >700 LOC
9. **Chrome Extension Relaxed TypeScript** - strictNullChecks disabled
10. **Duplicate Path Aliases** - Both @odis-ai/* and ~/* exist

### Minor (🟢)
11. **Inconsistent Project Tags** - some libs missing proper type tags
12. **No Shared Vitest Config** - 12 separate vitest.config.ts files
13. **Mixed Config Extensions** - .js, .mjs, .ts inconsistency

---

## COMPLETED WORK (Must Preserve)

### Phase 1: Router Splitting ✅
- Split dashboard router (2,029 lines → 6 files)
- Split cases router (2,003 lines → 6 files)

### Phase 2: Services Split ✅
- Created services-cases, services-discharge, services-shared
- Implemented repository interfaces
- Added dependency injection support

### Phase 3: Type Consolidation ✅
- Created @odis-ai/types lib
- Consolidated types from web app
- 290+ tests preserved

---

## TOOLS & COMMANDS

### Nx Commands
```bash
# Generate dependency graph
nx graph --file=graph.json

# Show project details
nx show project <project-name>

# List all projects
nx show projects

# Run affected analysis
nx affected:graph

# Show dependencies
nx graph --focus=<project-name>
```

### Analysis Commands
```bash
# Count files by library
find libs/*/src -name "*.ts" -o -name "*.tsx" | wc -l

# Find circular dependencies (madge)
npx madge --circular --extensions ts,tsx libs/

# Analyze imports
grep -r "from '@odis-ai" libs/ | wc -l

# Count LOC per library
cloc libs/*/src
```

---

## SUCCESS CRITERIA (Phase 1)

### Agent 1: Dependency Analysis
- ✅ Circular dependency count verified (claim: 0)
- ✅ All import patterns documented
- ✅ Platform violations identified (if any)
- ✅ God libraries identified (>10 dependents)
- ✅ Dependency depth calculated
- ✅ graph.json generated

### Agent 2: Architecture Assessment
- ✅ All 33 libs categorized by Nx 4-type model
- ✅ Tag audit completed (type, scope, platform)
- ✅ Tag inconsistencies identified
- ✅ Module boundaries verified
- ✅ Library size violations flagged (>1500 LOC)
- ✅ Recommendations documented

### Agent 3: Impact Analysis
- ✅ Dependency fan-out matrix created
- ✅ High-impact libraries identified (top 10)
- ✅ Risk levels assessed (low/medium/high)
- ✅ Effort estimates provided (hours/days)
- ✅ Completed work verified
- ✅ Integration plan considerations

---

## CONSTRAINTS & GUIDELINES

### Must Preserve
- 290+ existing tests
- Completed router splitting
- Completed services split
- Repository interfaces
- Type consolidation work

### Must Maintain
- Backward compatibility
- Zero circular dependencies
- All tests passing
- Platform separation (browser/node/neutral)

### Must Not
- Break existing functionality
- Reduce test coverage
- Introduce circular dependencies
- Skip verification steps

### Analysis Approach
- Trust but verify: Audit docs claim 0 circular deps - verify this
- Risk tolerance: Moderate - balance stability with improvement
- Focus: Identify issues, quantify impact, estimate effort
- Output: Actionable recommendations with clear priorities

---

## DELIVERABLE LOCATIONS

All reports must be saved to:
`/Users/taylorallen/Development/odis-ai-web/docs/refactoring/`

**File names:**
1. `DEPENDENCY_ANALYSIS_REPORT.md` (Agent 1)
2. `ARCHITECTURE_ASSESSMENT_REPORT.md` (Agent 2)
3. `IMPACT_ANALYSIS_REPORT.md` (Agent 3)

---

## COORDINATION PROTOCOL

### Execution Mode
All 3 agents execute in **PARALLEL** (simultaneous spawn)

### Data Sharing
- Each agent works independently during Phase 1
- No inter-agent communication required during discovery
- All findings aggregated by coordinator at phase completion

### Quality Gates
After each agent completes:
1. Validate deliverable exists and is complete
2. Check for data quality issues
3. Verify all success criteria met
4. Flag any blocking issues to coordinator

### Next Phase Trigger
Phase 2 begins only after:
- All 3 Phase 1 agents complete
- All deliverables validated
- Coordinator synthesizes findings
- No critical blockers identified

---

## REFERENCE DOCUMENTATION

### Key Files
- `/Users/taylorallen/Development/odis-ai-web/nx.json` - Nx configuration
- `/Users/taylorallen/Development/odis-ai-web/tsconfig.base.json` - Path mappings
- `/Users/taylorallen/Development/odis-ai-web/eslint.config.js` - Module boundaries
- `/Users/taylorallen/Development/odis-ai-web/MONOREPO_ANALYSIS_REPORT.md` - Initial audit
- `/Users/taylorallen/Development/odis-ai-web/CLAUDE.md` - Project guide

### Workspace Structure
```
/Users/taylorallen/Development/odis-ai-web/
├── apps/
│   ├── web/                    # Main Next.js app
│   ├── chrome-extension/       # Browser extension
│   └── idexx-sync/            # Background service
├── libs/
│   ├── services-cases/        # Case service
│   ├── services-discharge/    # Discharge service
│   ├── services-shared/       # Shared service utilities
│   ├── db/                    # Data access + repositories
│   ├── types/                 # Shared types
│   ├── validators/            # Zod schemas
│   ├── utils/                 # Shared utilities
│   ├── vapi/                  # VAPI integration
│   ├── idexx/                 # IDEXX integration
│   ├── ui/                    # UI components
│   └── ... (24 more libs)
├── docs/
│   └── refactoring/           # Analysis outputs (YOU ARE HERE)
└── nx.json                    # Nx config
```

---

## QUESTIONS & CLARIFICATIONS

If any agent encounters ambiguity:

1. **Circular dependencies**: Use `nx graph` as source of truth
2. **Tag classification**: Follow ESLint config definitions
3. **Library sizes**: Count main implementation files, exclude tests
4. **Platform violations**: Check actual imports against tags
5. **Completed work**: Verify via git history + file structure

If clarification needed, document assumption and proceed. Flag for coordinator review.

---

**END BRIEFING - Phase 1 Agents: Begin Discovery**

**Agent 1:** Focus on dependency structure and circular deps
**Agent 2:** Focus on architecture compliance and tagging
**Agent 3:** Focus on impact analysis and refactoring effort

**Deadline:** Complete within 2-4 hours (wall time, parallel execution)

**Next Step:** Return findings to coordinator for Phase 2 initiation
