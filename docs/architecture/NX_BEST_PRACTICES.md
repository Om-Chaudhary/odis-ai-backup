# Nx Best Practices & Improvements

> Purpose: Document Nx workspace conventions, identified improvements, and implementation guidelines for maintaining a scalable monorepo.

**Generated**: 2024-12-09
**Status**: Audit Complete - Improvements Identified

---

## Current State Assessment

### Compliance Summary

| Practice               | Status            | Notes                                   |
| ---------------------- | ----------------- | --------------------------------------- |
| Library Tagging        | Compliant         | All 24 libs properly tagged             |
| Module Resolution      | Compliant         | `@odis-ai/*` namespace configured       |
| Circular Dependencies  | Compliant         | Zero circular deps detected             |
| Platform Separation    | Compliant         | browser/node/neutral tags applied       |
| Dependency Constraints | **Non-Compliant** | Missing `@nx/enforce-module-boundaries` |
| Library Documentation  | **Non-Compliant** | Missing README.md in libs               |
| Test Colocation        | **Non-Compliant** | Tests not colocated with source         |

---

## 1. Tagging System

### Current Tags

All libraries use three tag dimensions:

```json
{
  "tags": ["type:lib", "scope:shared", "platform:node"]
}
```

**Tag Categories:**

| Dimension  | Values                            | Purpose                           |
| ---------- | --------------------------------- | --------------------------------- |
| `type`     | `lib`, `app`                      | Distinguishes apps from libraries |
| `scope`    | `shared`, `feature`, `data`, `ui` | Functional grouping               |
| `platform` | `browser`, `node`, `neutral`      | Runtime environment               |

### Platform Tag Distribution

| Platform  | Libraries | Examples                                    |
| --------- | --------- | ------------------------------------------- |
| `node`    | 15        | db, services, vapi, api, logger             |
| `browser` | 4         | ui, hooks, auth, api-client                 |
| `neutral` | 5         | types, validators, constants, utils, crypto |

---

## 2. Dependency Constraint Rules (MISSING)

### Problem

No enforcement of module boundaries. Browser libraries could accidentally import Node libraries.

### Solution

Add to root `.eslintrc.json`:

```json
{
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              {
                "sourceTag": "platform:browser",
                "onlyDependOnLibsWithTags": [
                  "platform:browser",
                  "platform:neutral"
                ]
              },
              {
                "sourceTag": "platform:node",
                "onlyDependOnLibsWithTags": [
                  "platform:node",
                  "platform:neutral"
                ]
              },
              {
                "sourceTag": "platform:neutral",
                "onlyDependOnLibsWithTags": ["platform:neutral"]
              },
              {
                "sourceTag": "type:lib",
                "onlyDependOnLibsWithTags": ["type:lib"]
              },
              {
                "sourceTag": "scope:ui",
                "onlyDependOnLibsWithTags": ["scope:ui", "scope:shared"]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### Expected Outcome

- Compile-time errors for boundary violations
- Clear dependency direction enforcement
- Prevention of browser/node mixing

---

## 3. Library Structure Standards

### Recommended Structure

```
libs/{lib-name}/
├── src/
│   ├── lib/                    # Main source code
│   │   ├── {feature}/          # Feature modules (if complex)
│   │   └── {file}.ts           # Implementation files
│   ├── __tests__/              # Colocated tests
│   │   └── {file}.test.ts
│   └── index.ts                # Public API exports
├── project.json                # Nx project configuration
├── tsconfig.json               # TypeScript config
├── tsconfig.lib.json           # Library-specific TS config
├── vitest.config.ts            # Test configuration
└── README.md                   # Library documentation
```

### Current vs. Recommended

| Library    | Current Structure | Recommended Changes         |
| ---------- | ----------------- | --------------------------- |
| services   | Flat files        | Split into subdirectories   |
| vapi       | Has subdirs       | Good structure              |
| db         | Has repositories/ | Good structure              |
| ui         | Has components    | Good structure              |
| validators | Flat files        | Consider grouping by domain |

---

## 4. Library Size Guidelines

### Size Thresholds

| Size      | Lines     | Action                         |
| --------- | --------- | ------------------------------ |
| Small     | < 500     | Ideal for focused libs         |
| Medium    | 500-1500  | Acceptable for domain libs     |
| Large     | 1500-5000 | Review for split opportunities |
| Oversized | > 5000    | Split into sub-libraries       |

### Current Large Libraries

| Library      | Lines | Recommendation                                |
| ------------ | ----- | --------------------------------------------- |
| vapi         | 9,971 | Acceptable (integration lib)                  |
| ui           | 7,136 | Acceptable (component lib)                    |
| **services** | 4,037 | **Split into cases/, discharge/, execution/** |
| db           | 1,685 | Acceptable                                    |

### Services Split Plan

```
libs/services/           →    libs/services/
├── cases-service.ts          ├── cases/
├── discharge-orchestrator.ts │   ├── src/
├── discharge-batch-processor │   │   ├── cases-service.ts
└── execution-plan.ts         │   │   └── index.ts
                              │   └── project.json
                              ├── discharge/
                              │   ├── src/
                              │   │   ├── orchestrator.ts
                              │   │   ├── batch-processor.ts
                              │   │   └── index.ts
                              │   └── project.json
                              └── shared/
                                  ├── src/
                                  │   ├── execution-plan.ts
                                  │   └── index.ts
                                  └── project.json
```

---

## 5. Module Resolution

### Current Configuration

Path aliases defined in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@odis-ai/api": ["libs/api/src/index.ts"],
      "@odis-ai/api/*": ["libs/api/src/*"],
      "@odis-ai/db": ["libs/db/src/index.ts"],
      "@odis-ai/db/*": ["libs/db/src/*"],
      // ... 24 libraries total

      // Legacy aliases (backward compatibility)
      "~/lib/api": ["libs/api/src/index.ts"],
      "~/lib/api/*": ["libs/api/src/*"]
      // ... mirrors above
    }
  }
}
```

### Import Standards

```typescript
// ✅ Preferred: Namespace imports
import { createServerClient } from "@odis-ai/db";
import { CasesService } from "@odis-ai/services";

// ✅ Allowed: Subpath imports for specific modules
import { BaseRepository } from "@odis-ai/db/repositories";
import { vapiWebhookHandler } from "@odis-ai/vapi/webhooks";

// ❌ Avoid: Legacy aliases (deprecated)
import { createClient } from "~/lib/db";

// ❌ Never: Relative cross-library imports
import { something } from "../../../libs/db/src/client";
```

---

## 6. Nx Plugin Configuration

### Current Plugins

```json
// nx.json
{
  "plugins": [
    { "plugin": "@nx/eslint/plugin" },
    { "plugin": "@nx/next/plugin" },
    { "plugin": "@nx/vite/plugin" },
    { "plugin": "@nx/esbuild/plugin" }
  ]
}
```

### Target Inference

Plugins automatically infer targets:

| Plugin      | Inferred Targets                   |
| ----------- | ---------------------------------- |
| @nx/eslint  | `lint`                             |
| @nx/next    | `build`, `dev`, `start`, `preview` |
| @nx/vite    | `test`, `build` (when configured)  |
| @nx/esbuild | `build`                            |

### Cache Configuration

```json
// nx.json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": [],
    "production": [
      "default",
      "!{projectRoot}/**/*.test.ts",
      "!{projectRoot}/**/*.spec.ts"
    ]
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production"]
    }
  }
}
```

---

## 7. Library Documentation Requirements

### README Template

Each library should have a `README.md`:

````markdown
# @odis-ai/{lib-name}

> Brief description of the library's purpose

## Installation

This library is internal to the monorepo. Import via:

```typescript
import { ... } from "@odis-ai/{lib-name}";
```
````

## API

### Exports

- `functionName` - Brief description
- `ClassName` - Brief description

## Dependencies

- `@odis-ai/types` - Shared types
- `@odis-ai/utils` - Utility functions

## Platform

- **Runtime**: node | browser | neutral
- **Tags**: type:lib, scope:shared, platform:node

## Related

- [Architecture Docs](../../docs/architecture/CORE_LIBS.md)
- [Testing Guide](../../docs/testing/TESTING_STRATEGY.md)

````

---

## 8. Generator Templates

### Creating New Libraries

Use Nx generators with proper configuration:

```bash
# Create a new library
nx g @nx/js:lib my-lib \
  --directory=libs/my-lib \
  --importPath=@odis-ai/my-lib \
  --tags="type:lib,scope:shared,platform:node" \
  --unitTestRunner=vitest \
  --bundler=esbuild

# Create a React library (for browser)
nx g @nx/react:lib my-ui-lib \
  --directory=libs/my-ui-lib \
  --importPath=@odis-ai/my-ui-lib \
  --tags="type:lib,scope:ui,platform:browser" \
  --unitTestRunner=vitest
````

### Post-Generation Checklist

- [ ] Add README.md with library documentation
- [ ] Configure vitest.config.ts
- [ ] Add to tsconfig.base.json paths (if not auto-added)
- [ ] Update docs/reference/NX_PROJECTS.md via `pnpm docs:nx`
- [ ] Update docs/architecture/CORE_LIBS.md if core library

---

## 9. Dependency Graph Health

### Current Status

```
Total Libraries: 24
Total Apps: 2 (web, odis-ai root)
Circular Dependencies: 0
Max Dependency Depth: 4 (services → vapi → db → env)
```

### Dependency Tiers

```
Tier 0 (Foundation):
  env, constants, crypto, logger, styles

Tier 1 (Utilities):
  types, validators, utils, hooks

Tier 2 (Data):
  db, api, auth, api-client

Tier 3 (Domain):
  clinics, email, qstash, retell, resend, ai

Tier 4 (Integration):
  vapi, idexx

Tier 5 (Orchestration):
  services

Tier 6 (Application):
  web (app)
```

### Visualization

Run dependency graph:

```bash
nx graph
```

---

## 10. Implementation Priorities

### Phase 1: Immediate (This Sprint)

1. **Add dependency constraint rules**
   - Configure `@nx/enforce-module-boundaries`
   - Run lint to identify any violations
   - Fix violations before merging

2. **Add README.md to each library**
   - Start with core libs: db, vapi, services
   - Use template above

### Phase 2: Short-term (Next 2 Sprints)

3. **Split services library**
   - Create libs/services/cases
   - Create libs/services/discharge
   - Update imports across codebase

4. **Colocate tests with source**
   - Move tests to `__tests__/` in each lib
   - Update vitest configs

### Phase 3: Long-term

5. **Create library generators**
   - Custom workspace generator for consistent lib creation
   - Include README template

6. **Add graph diagnostics**
   - Configure @nx/graph-diagnostics
   - Add to CI pipeline

---

## Related Documentation

- [Core Libraries Overview](./CORE_LIBS.md)
- [Testability Patterns](./TESTABILITY_PATTERNS.md)
- [Refactoring Roadmap](../reference/REFACTORING_ROADMAP.md)
- [Nx Projects Inventory](../reference/NX_PROJECTS.md)
