# ODIS AI Development Plan

## Overview

This is a template plan for running Ralph Wiggum on ODIS AI projects. Replace this overview with a brief description of what you're building.

**Reference:** Link to your PRD, spec doc, or feature description here.

---

## Task List

```json
[
  {
    "category": "setup",
    "description": "Example: Initialize project structure and dependencies",
    "steps": [
      "Create necessary directories (apps, libs, etc.)",
      "Set up Nx project configuration",
      "Install required dependencies with pnpm",
      "Verify workspace builds successfully with nx build"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Example: Implement new VAPI webhook handler",
    "steps": [
      "Create webhook route in apps/web/src/app/api/webhooks/vapi/",
      "Add Zod schema in libs/integrations/vapi/src/schemas/",
      "Implement handler logic following existing patterns",
      "Add unit tests with 70%+ coverage",
      "Test webhook locally with VAPI test payload"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Example: Add new domain service",
    "steps": [
      "Create service in libs/domain/[name]/data-access/",
      "Define repository interface in libs/data-access/repository-interfaces/",
      "Implement repository in libs/data-access/repository-impl/",
      "Add comprehensive tests",
      "Update tsconfig.base.json paths if needed"
    ],
    "passes": false
  },
  {
    "category": "testing",
    "description": "Example: Verify all components work end-to-end",
    "steps": [
      "Run nx affected -t lint,test",
      "Start dev server with nx dev web",
      "Test in browser at localhost:3000",
      "Check browser console for errors",
      "Verify no TypeScript errors with nx typecheck web"
    ],
    "passes": false
  },
  {
    "category": "documentation",
    "description": "Example: Update project documentation",
    "steps": [
      "Document new features in relevant README files",
      "Update API reference if adding new routes",
      "Add JSDoc comments to exported functions",
      "Update AGENTS.md if changing architecture"
    ],
    "passes": false
  }
]
```

---

## Agent Instructions

1. Read `activity.md` first to understand current state
2. Find next task with `"passes": false`
3. Complete all steps for that task following ODIS AI patterns:
   - Use `@odis-ai/` namespace imports
   - Follow repository pattern for data access
   - Use Nx commands for all operations
   - Maintain 70%+ test coverage
4. Run quality checks: `nx lint <project>` and `nx test <project>`
5. Verify in browser if applicable (use Playwright MCP)
6. Update task to `"passes": true`
7. Log completion in `activity.md`
8. Repeat until all tasks pass

**Important:** Only modify the `passes` field. Do not remove or rewrite tasks.

---

## Completion Criteria

All tasks marked with `"passes": true` and:

- All tests passing (`nx affected -t test`)
- No linting errors (`nx affected -t lint`)
- No TypeScript errors (`pnpm typecheck:all`)
- Application runs without console errors

---

## Notes

<!-- Add any project-specific notes, constraints, or context here -->
