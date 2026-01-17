# Ralph Wiggum Workflow for ODIS AI

Recommended workflow for using Ralph Wiggum effectively in the ODIS AI monorepo.

---

## Workflow Overview

```
1. Plan → 2. Archive Previous Work → 3. Create Plan → 4. Run Ralph → 5. Review → 6. Iterate
```

---

## Step-by-Step Workflow

### Step 1: Planning Phase (Before Ralph)

Before running Ralph, create a clear plan:

```bash
# 1. Create a feature branch (GitButler will track this)
# Work on your current branch, GitButler handles branching

# 2. Create or review your PRD/spec
# Save in docs/specs/ or as a GitHub issue
```

**Key Questions to Answer:**

- What feature/fix am I building?
- What are the acceptance criteria?
- Which Nx projects will be affected?
- Are there any dependencies or blockers?

### Step 2: Archive Previous Work

If you have a previous Ralph run, archive it:

```bash
# Archive completed plan with descriptive name
mv plan.md plans/completed/$(date +%Y-%m-%d)-feature-name.md

# Archive activity log
mv activity.md plans/completed/$(date +%Y-%m-%d)-feature-name-activity.md

# Archive screenshots if needed
mv screenshots screenshots-$(date +%Y-%m-%d)-feature-name

# Create fresh directories
mkdir screenshots
```

### Step 3: Create Your Plan

Start from the template:

```bash
# Copy template to plan.md
cp plan-template.md plan.md

# Edit with your tasks
code plan.md
```

**Structure Your Tasks by Category:**

```json
[
  {
    "category": "setup",
    "description": "Set up project structure for [feature]",
    "steps": [
      "Create necessary directories",
      "Add to tsconfig.base.json paths",
      "Create initial files"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Implement core [feature] functionality",
    "steps": [
      "Create domain service in libs/domain/[name]/",
      "Add repository interface",
      "Implement with proper DI",
      "Add Zod validators"
    ],
    "passes": false
  },
  {
    "category": "testing",
    "description": "Add tests with 70%+ coverage",
    "steps": [
      "Unit tests for service",
      "Repository tests with mocks",
      "Validator tests",
      "Run nx test [project] --coverage"
    ],
    "passes": false
  },
  {
    "category": "integration",
    "description": "Wire up to web app",
    "steps": [
      "Create tRPC router in apps/web/src/server/api/routers/",
      "Add UI components if needed",
      "Test end-to-end workflow"
    ],
    "passes": false
  },
  {
    "category": "documentation",
    "description": "Document new feature",
    "steps": [
      "Add JSDoc comments",
      "Update README if needed",
      "Add to API reference docs"
    ],
    "passes": false
  }
]
```

**Task Writing Tips:**

- **Be specific**: "Create CasesService in libs/domain/cases/data-access/" not "Add service"
- **Include verification**: "Run nx test cases --coverage" as a step
- **Reference patterns**: "Follow repository pattern from AGENTS.md"
- **Set expectations**: "Achieve 70%+ test coverage"

### Step 4: Initialize Activity Log

```bash
# Create fresh activity.md
cp activity-template.md activity.md

# Or manually create:
cat > activity.md << 'EOF'
# ODIS AI Development - Activity Log

## Current Status

**Last Updated:** $(date)
**Tasks Completed:** 0
**Current Task:** Awaiting first iteration
**Branch:** $(git branch --show-current)
**Feature:** [Your feature name]

---

## Session Log

<!-- Ralph will append entries here -->
EOF
```

### Step 5: Run Ralph (Start Small)

Start with a small test run:

```bash
# First run: 5 iterations to test
./ralph.sh 5

# If successful, run longer
./ralph.sh 20
```

**While Ralph Runs:**

Terminal 1 (Ralph):

```bash
./ralph.sh 20
```

Terminal 2 (Monitor):

```bash
# Watch activity
tail -f activity.md

# Or watch plan progress
watch -n 10 'grep -c "\"passes\": true" plan.md'
```

Terminal 3 (Dev Server - if needed):

```bash
# Keep dev server running for testing
nx dev web
```

### Step 6: Review Ralph's Work

After Ralph completes (or you stop it):

```bash
# 1. Check what was completed
grep '"passes": true' plan.md

# 2. Review activity log
less activity.md

# 3. Check commits in GitButler
# Open GitButler and review auto-commits

# 4. Run quality checks
pnpm check

# 5. View screenshots
ls -lh screenshots/

# 6. Test manually
nx dev web
# Test in browser at localhost:3000
```

**Review Checklist:**

- [ ] All completed tasks match acceptance criteria
- [ ] Tests are passing (`nx affected -t test`)
- [ ] No linting errors (`nx affected -t lint`)
- [ ] TypeScript compiles (`pnpm typecheck:all`)
- [ ] Manual testing confirms functionality
- [ ] Screenshots show expected behavior
- [ ] Commits are well-formatted (GitButler)

### Step 7: Handle Incomplete Work

If Ralph didn't complete all tasks:

**Option A: Continue Ralph**

```bash
# Ralph will pick up where it left off
./ralph.sh 10
```

**Option B: Complete Manually**

```bash
# Review remaining tasks in plan.md
# Complete them manually
# Update "passes": true when done
```

**Option C: Adjust Plan**

```bash
# If tasks need to be changed:
# 1. Update plan.md with better steps
# 2. Keep "passes": false
# 3. Run Ralph again
./ralph.sh 10
```

---

## Common Workflows

### Workflow A: New Feature Development

```bash
# 1. Create detailed plan
cp plan-template.md plan.md
# Edit plan.md with feature tasks

# 2. Run Ralph
./ralph.sh 20

# 3. Review and test
pnpm check
nx dev web

# 4. Archive when complete
mv plan.md plans/completed/$(date +%Y-%m-%d)-new-feature.md
mv activity.md plans/completed/$(date +%Y-%m-%d)-new-feature-activity.md
```

### Workflow B: Bug Fixes

```bash
# 1. Create focused plan
cat > plan.md << 'EOF'
[
  {
    "category": "investigation",
    "description": "Reproduce and identify root cause",
    "steps": [
      "Review error logs in activity.md",
      "Add debug logging",
      "Identify failing code path"
    ],
    "passes": false
  },
  {
    "category": "fix",
    "description": "Implement bug fix",
    "steps": [
      "Fix identified issue",
      "Add regression test",
      "Verify fix works"
    ],
    "passes": false
  }
]
EOF

# 2. Run Ralph
./ralph.sh 10

# 3. Verify fix
nx test [project]
```

### Workflow C: Refactoring

```bash
# 1. Plan refactoring steps
# Focus on: extract, move, rename, simplify

# 2. Run Ralph with small iterations
./ralph.sh 15

# 3. Verify no behavior changes
nx affected -t test
nx build web
```

### Workflow D: Testing/Documentation

```bash
# 1. Create testing-focused plan
# Category: "testing" for test additions
# Category: "documentation" for docs

# 2. Run Ralph
./ralph.sh 10

# 3. Verify coverage
nx test [project] --coverage
```

---

## File Management Strategy

### Directory Structure

```
odis-ai/
├── plan.md                    # Active plan (working file)
├── plan-template.md           # Reusable template
├── activity.md                # Active log (working file)
├── activity-template.md       # Reusable template
├── ralph.sh                   # Main script
├── PROMPT.md                  # Ralph instructions (don't change)
├── screenshots/               # Active screenshots
│
├── plans/                     # Archive
│   ├── completed/
│   │   ├── 2026-01-17-vapi-webhook.md
│   │   ├── 2026-01-17-vapi-webhook-activity.md
│   │   ├── 2026-01-18-case-import.md
│   │   └── ...
│   └── templates/
│       ├── feature-template.md
│       ├── bugfix-template.md
│       └── refactor-template.md
│
└── screenshots-archive/       # Old screenshots
    ├── 2026-01-17-vapi-webhook/
    └── ...
```

### Quick Commands

Create these aliases in `package.json` scripts or shell aliases:

```bash
# Add to package.json scripts:
{
  "scripts": {
    "ralph:new": "cp plan-template.md plan.md && cp activity-template.md activity.md",
    "ralph:archive": "mv plan.md plans/completed/$(date +%Y-%m-%d)-$1.md && mv activity.md plans/completed/$(date +%Y-%m-%d)-$1-activity.md",
    "ralph:run": "./ralph.sh",
    "ralph:test": "./ralph.sh 5",
    "ralph:status": "grep -c '\"passes\": true' plan.md && tail -20 activity.md"
  }
}
```

---

## Best Practices

### Do's ✅

1. **Start Small**: First run with 5-10 iterations to test
2. **Be Specific**: Detailed steps in plan.md lead to better results
3. **Archive Everything**: Keep history of what Ralph accomplished
4. **Review Commits**: Check GitButler after each run
5. **Monitor Progress**: Watch activity.md while Ralph runs
6. **Test Manually**: Always verify Ralph's work yourself
7. **Iterate**: Refine plan.md based on what works

### Don'ts ❌

1. **Don't Skip Planning**: Vague plans = poor results
2. **Don't Run Unlimited**: Always set max iterations
3. **Don't Ignore Errors**: Review activity.md for issues
4. **Don't Trust Blindly**: Verify Ralph's work
5. **Don't Modify PROMPT.md**: Unless you know what you're doing
6. **Don't Interrupt**: Let iterations complete
7. **Don't Forget to Archive**: You'll want the history later

### Cost Management

1. **Test runs**: 5-10 iterations
2. **Small features**: 15-20 iterations
3. **Large features**: 30-50 iterations (monitor costs!)
4. **Use Haiku**: For simple tasks, edit ralph.sh to use `--model haiku`

---

## Troubleshooting Workflow

### Ralph Gets Stuck

```bash
# 1. Stop Ralph
Ctrl+C

# 2. Check activity.md for last error
tail -50 activity.md

# 3. Review current task
grep -A 10 '"passes": false' plan.md | head -15

# 4. Options:
# A) Simplify the task steps
# B) Complete task manually and mark "passes": true
# C) Add more context to PROMPT.md (rare)

# 5. Resume
./ralph.sh 10
```

### Quality Issues

```bash
# After Ralph completes, if quality checks fail:

# 1. Run checks
pnpm check

# 2. If failures, create fix plan
cat > plan.md << 'EOF'
[
  {
    "category": "fix",
    "description": "Fix linting errors",
    "steps": ["Run nx lint --fix", "Fix remaining issues"],
    "passes": false
  },
  {
    "category": "fix",
    "description": "Fix failing tests",
    "steps": ["Identify failures", "Fix test issues", "Verify passing"],
    "passes": false
  }
]
EOF

# 3. Run Ralph to fix
./ralph.sh 5
```

---

## Integration with ODIS AI Development

### GitButler Integration

Ralph works seamlessly with GitButler:

1. **No manual commits**: GitButler auto-commits after each iteration
2. **Branch management**: Work on current branch, GitButler handles changes
3. **Commit review**: Review in GitButler UI after Ralph completes
4. **Virtual branches**: GitButler can split Ralph's work into logical branches

### Nx Workspace Integration

Ralph uses Nx properly:

```bash
# Ralph will run:
nx dev web                    # Start dev server
nx lint [project]             # Lint
nx test [project]             # Test
nx affected -t lint,test      # Affected projects
nx build web                  # Build
```

### Testing Strategy

Ralph follows ODIS AI testing requirements:

- **70% coverage minimum**: Specified in task steps
- **Vitest + Testing Library**: Automatic
- **Colocated tests**: In `__tests__/` directories
- **Mock patterns**: Uses `@odis-ai/shared/testing` utilities

---

## Example Full Workflow

Here's a complete example of building a new VAPI webhook handler:

````bash
# === PLANNING PHASE ===

# 1. Archive previous work
mv plan.md plans/completed/2026-01-17-previous-feature.md
mv activity.md plans/completed/2026-01-17-previous-feature-activity.md
mv screenshots screenshots-archive/2026-01-17-previous-feature/

# 2. Create new plan
cp plan-template.md plan.md

# 3. Edit plan.md with specific tasks
cat > plan.md << 'EOF'
# VAPI End-of-Call Webhook Handler

## Overview
Implement new VAPI webhook handler for end-of-call reports with structured data extraction.

**Reference:** GitHub Issue #147

---

## Task List

```json
[
  {
    "category": "setup",
    "description": "Create webhook route structure",
    "steps": [
      "Create apps/web/src/app/api/webhooks/vapi/end-of-call-v2/route.ts",
      "Add webhook verification using VAPI_WEBHOOK_SECRET",
      "Set up proper error handling and logging",
      "Test with mock payload"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Add Zod schema for payload validation",
    "steps": [
      "Create libs/integrations/vapi/src/schemas/end-of-call-v2.ts",
      "Define complete payload schema",
      "Add tests in __tests__/end-of-call-v2.test.ts",
      "Achieve 70%+ coverage"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Implement processor logic",
    "steps": [
      "Create libs/integrations/vapi/src/processors/end-of-call-v2.ts",
      "Extract structured data from analysis",
      "Save to database using CasesRepository",
      "Add comprehensive tests"
    ],
    "passes": false
  },
  {
    "category": "testing",
    "description": "End-to-end verification",
    "steps": [
      "Run nx lint integrations-vapi",
      "Run nx test integrations-vapi --coverage",
      "Test webhook with VAPI test payload",
      "Verify data in Supabase",
      "Take screenshot of successful test"
    ],
    "passes": false
  },
  {
    "category": "documentation",
    "description": "Document webhook handler",
    "steps": [
      "Add JSDoc comments to all exported functions",
      "Update libs/integrations/vapi/README.md",
      "Add example payload to docs"
    ],
    "passes": false
  }
]
````

EOF

# 4. Create fresh activity log

cat > activity.md << 'EOF'

# VAPI End-of-Call Webhook - Activity Log

## Current Status

**Last Updated:** 2026-01-17
**Tasks Completed:** 0
**Current Task:** Awaiting first iteration
**Branch:** vapi-end-of-call-v2
**Feature:** End-of-Call Report Webhook Handler v2

---

## Session Log

EOF

# === EXECUTION PHASE ===

# 5. Test run (5 iterations)

./ralph.sh 5

# 6. Monitor in another terminal

tail -f activity.md

# 7. If test run looks good, continue

./ralph.sh 20

# === REVIEW PHASE ===

# 8. Check completion

grep '"passes": true' plan.md

# 9. Run quality checks

pnpm check
nx test integrations-vapi --coverage

# 10. Manual testing

nx dev web

# Test webhook at localhost:3000/api/webhooks/vapi/end-of-call-v2

# 11. Review commits in GitButler

# Verify commit messages follow (vapi): convention

# === COMPLETION PHASE ===

# 12. Archive work

mv plan.md plans/completed/2026-01-17-vapi-end-of-call-v2.md
mv activity.md plans/completed/2026-01-17-vapi-end-of-call-v2-activity.md
mv screenshots screenshots-archive/2026-01-17-vapi-end-of-call-v2/

# 13. Create fresh workspace for next task

mkdir screenshots

````

---

## Summary

**Best Workflow for ODIS AI + Ralph:**

1. ✅ **Archive previous work** (plan.md, activity.md, screenshots)
2. ✅ **Create specific plan** from template with detailed steps
3. ✅ **Test run** with 5 iterations first
4. ✅ **Monitor progress** in separate terminal
5. ✅ **Full run** with 15-20 iterations
6. ✅ **Review everything** (code, tests, commits)
7. ✅ **Archive when complete** for historical reference

**Key Success Factors:**
- Specific, actionable task steps
- Proper archiving for history
- Quality review after Ralph runs
- Integration with GitButler workflow
- Following ODIS AI architectural patterns

---

Ready to start? Run:

```bash
# Create your first plan
cp plan-template.md plan.md
code plan.md

# Test Ralph
./ralph.sh 5
````
