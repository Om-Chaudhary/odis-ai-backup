# Nx Best Practices & Improvements

> Purpose: Document Nx workspace conventions, identified improvements, and implementation guidelines for maintaining a scalable monorepo.

**Last Updated**: January 2026
**Status**: Domain-grouped architecture implemented

---

## Current State Assessment

### Compliance Summary

| Practice               | Status            | Notes                                        |
| ---------------------- | ----------------- | -------------------------------------------- |
| Library Tagging        | Compliant         | All libs properly tagged                     |
| Module Resolution      | Compliant         | `@odis-ai/*` namespace with domain grouping  |
| Circular Dependencies  | Compliant         | Zero circular deps detected                  |
| Platform Separation    | Compliant         | browser/node/neutral tags applied            |
| Domain Grouping        | Compliant         | shared/, data-access/, domain/, integrations/|
| Dependency Constraints | **Non-Compliant** | Missing `@nx/enforce-module-boundaries`      |

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
| `node`    | Many      | db, vapi, api, logger, qstash               |
| `browser` | Some      | ui, hooks                                   |
| `neutral` | Some      | types, validators, constants, util, crypto  |

---

## 2. Dependency Constraint Rules (RECOMMENDED)

### Problem

No enforcement of module boundaries. Browser libraries could accidentally import Node libraries.

### Solution

Add to root `eslint.config.js`:

```javascript
// Add @nx/enforce-module-boundaries rule
{
  rules: {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        enforceBuildableLibDependency: true,
        allow: [],
        depConstraints: [
          {
            sourceTag: "platform:browser",
            onlyDependOnLibsWithTags: [
              "platform:browser",
              "platform:neutral"
            ]
          },
          {
            sourceTag: "platform:node",
            onlyDependOnLibsWithTags: [
              "platform:node",
              "platform:neutral"
            ]
          },
          {
            sourceTag: "platform:neutral",
            onlyDependOnLibsWithTags: ["platform:neutral"]
          },
          {
            sourceTag: "type:lib",
            onlyDependOnLibsWithTags: ["type:lib"]
          },
          {
            sourceTag: "scope:ui",
            onlyDependOnLibsWithTags: ["scope:ui", "scope:shared"]
          }
        ]
      }
    ]
  }
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
libs/{domain}/{lib-name}/
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
└── README.md                   # Library documentation (optional)
```

### Domain Grouping

Libraries are organized by domain:

```
libs/
  shared/           # Cross-cutting concerns
    types/
    validators/
    util/
    ui/
    hooks/
    logger/
    ...

  data-access/      # Database layer
    db/
    supabase-client/
    repository-interfaces/
    repository-impl/
    api/
    entities/

  domain/           # Business logic
    cases/data-access/
    discharge/data-access/
    shared/util/
    clinics/util/
    auth/util/

  integrations/     # External services
    vapi/
    idexx/
    qstash/
    resend/
    slack/
    ai/
```

---

## 4. Library Size Guidelines

### Size Thresholds

| Size      | Lines     | Action                         |
| --------- | --------- | ------------------------------ |
| Small     | < 500     | Ideal for focused libs         |
| Medium    | 500-1500  | Acceptable for domain libs     |
| Large     | 1500-5000 | Review for split opportunities |
| Oversized | > 5000    | Split into sub-libraries       |

### Handling Large Libraries

Large integration libraries (like `vapi`) are acceptable when they:
- Have clear sub-module organization
- Export focused public APIs
- Maintain internal cohesion

---

## 5. Module Resolution

### Current Configuration

Path aliases defined in `tsconfig.base.json` use domain-grouped imports:

```json
{
  "compilerOptions": {
    "paths": {
      // Shared
      "@odis-ai/shared/types": ["libs/shared/types/src/index.ts"],
      "@odis-ai/shared/validators": ["libs/shared/validators/src/index.ts"],
      "@odis-ai/shared/util": ["libs/shared/util/src/index.ts"],
      "@odis-ai/shared/ui": ["libs/shared/ui/src/index.ts"],
      // ...

      // Data Access
      "@odis-ai/data-access/db": ["libs/data-access/db/src/index.ts"],
      "@odis-ai/data-access/repository-interfaces": ["libs/data-access/repository-interfaces/src/index.ts"],
      // ...

      // Domain
      "@odis-ai/domain/cases": ["libs/domain/cases/data-access/src/index.ts"],
      "@odis-ai/domain/discharge": ["libs/domain/discharge/data-access/src/index.ts"],
      // ...

      // Integrations
      "@odis-ai/integrations/vapi": ["libs/integrations/vapi/src/index.ts"],
      "@odis-ai/integrations/qstash": ["libs/integrations/qstash/src/index.ts"],
      // ...
    }
  }
}
```

### Import Standards

```typescript
// ✅ Preferred: Domain-grouped imports
import { createServerClient } from "@odis-ai/data-access/db";
import { CasesService } from "@odis-ai/domain/cases";
import { createPhoneCall } from "@odis-ai/integrations/vapi";
import type { Database } from "@odis-ai/shared/types";
import { Button } from "@odis-ai/shared/ui";

// ✅ Allowed: Subpath imports for specific modules
import { vapiWebhookHandler } from "@odis-ai/integrations/vapi/webhooks";

// ❌ Never: Relative cross-library imports
import { something } from "../../../libs/data-access/db/src/client";
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
      "inputs": ["default", "{workspaceRoot}/eslint.config.js"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production"]
    }
  }
}
```

---

## 7. Generator Templates

### Creating New Libraries

Use Nx generators with proper configuration:

```bash
# Create a new shared library
nx g @nx/js:lib my-lib \
  --directory=libs/shared/my-lib \
  --importPath=@odis-ai/shared/my-lib \
  --tags="type:lib,scope:shared,platform:node" \
  --unitTestRunner=vitest \
  --bundler=esbuild

# Create a React library (for browser)
nx g @nx/react:lib my-ui-lib \
  --directory=libs/shared/my-ui-lib \
  --importPath=@odis-ai/shared/my-ui-lib \
  --tags="type:lib,scope:ui,platform:browser" \
  --unitTestRunner=vitest

# Create an integration library
nx g @nx/js:lib my-integration \
  --directory=libs/integrations/my-integration \
  --importPath=@odis-ai/integrations/my-integration \
  --tags="type:lib,scope:feature,platform:node" \
  --unitTestRunner=vitest
```

### Post-Generation Checklist

- [ ] Configure vitest.config.ts
- [ ] Add to tsconfig.base.json paths (if not auto-added)
- [ ] Update docs/reference/NX_PROJECTS.md via `pnpm docs:nx`
- [ ] Update docs/architecture/CORE_LIBS.md if core library

---

## 8. Dependency Graph Health

### Current Status

```
Apps: 3 (web, docs, idexx-sync)
Libraries: ~25 (domain-grouped)
Circular Dependencies: 0
```

### Dependency Tiers

```
Tier 0 (Foundation):     env, constants, crypto, logger, styles
Tier 1 (Utilities):      types, validators, util, hooks
Tier 2 (Data):           db, api, supabase-client, repository-*
Tier 3 (Domain):         clinics, email, auth
Tier 4 (Integration):    vapi, idexx, qstash, resend, slack, ai
Tier 5 (Orchestration):  domain/cases, domain/discharge
Tier 6 (Application):    apps/web, apps/docs, apps/idexx-sync
```

### Visualization

Run dependency graph:

```bash
nx graph
```

---

## 9. Implementation Priorities

### Immediate

1. **Add dependency constraint rules**
   - Configure `@nx/enforce-module-boundaries`
   - Run lint to identify any violations
   - Fix violations before merging

### Short-term

2. **Maintain colocated tests**
   - Keep tests in `__tests__/` directories within each lib
   - Update vitest configs as needed

3. **Document new libraries**
   - Add to CORE_LIBS.md when adding significant libraries
   - Regenerate NX_PROJECTS.md with `pnpm docs:nx`

---

## Related Documentation

- [Core Libraries Overview](./CORE_LIBS.md)
- [Testing Strategy](../testing/TESTING_STRATEGY.md)
- [Nx Projects Inventory](../reference/NX_PROJECTS.md)
- [AGENTS.md](../../AGENTS.md) - AI assistant guide
