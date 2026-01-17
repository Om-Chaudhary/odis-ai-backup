# Ralph Wiggum for ODIS AI

**TL;DR**: Autonomous coding agent that runs Claude Code in a loop to complete tasks from a structured plan.

---

## Quick Start

```bash
# 1. Create a new plan
./ralph-new.sh my-feature-name

# 2. Edit plan.md with your tasks
code plan.md

# 3. Run Ralph (start small)
./ralph.sh 5

# 4. Check progress
./ralph-status.sh

# 5. Run full loop
./ralph.sh 20
```

---

## Files Overview

| File                | Purpose               | Edit?                  |
| ------------------- | --------------------- | ---------------------- |
| `RALPH_SETUP.md`    | Complete setup guide  | ❌ Read only           |
| `RALPH_WORKFLOW.md` | Recommended workflows | ❌ Read only           |
| `PROMPT.md`         | Ralph's instructions  | ❌ Don't modify        |
| `plan.md`           | Active task list      | ✅ Customize per run   |
| `activity.md`       | Progress log          | ⚠️ Ralph writes here   |
| `ralph.sh`          | Main loop script      | ⚠️ Advanced users only |
| `ralph-new.sh`      | Start new plan helper | ✅ Use this!           |
| `ralph-status.sh`   | Check progress helper | ✅ Use this!           |

---

## Available Commands

### Main Commands

```bash
# Start new Ralph run (archives previous work)
./ralph-new.sh <feature-name>

# Run Ralph loop
./ralph.sh <iterations>        # e.g., ./ralph.sh 20

# Check current status
./ralph-status.sh
```

### Common Workflows

```bash
# Test run (5 iterations)
./ralph-new.sh test-feature
./ralph.sh 5

# Standard feature (20 iterations)
./ralph-new.sh new-feature
./ralph.sh 20

# Continue existing run
./ralph.sh 10

# Monitor progress (in another terminal)
tail -f activity.md
watch -n 10 './ralph-status.sh'
```

---

## How It Works

### Each Iteration

1. **Fresh Context**: New Claude Code instance
2. **Read Context**: Loads `plan.md` and `activity.md`
3. **Select Task**: Finds first `"passes": false`
4. **Implement**: Follows ODIS AI patterns from `AGENTS.md`
5. **Quality Check**: Runs `nx lint` and `nx test`
6. **Verify**: Uses Playwright to screenshot results
7. **Log**: Updates `activity.md`
8. **Mark Complete**: Sets `"passes": true`
9. **Commit**: GitButler auto-commits

### Completion

Ralph stops when it finds `<promise>COMPLETE</promise>` in output (all tasks have `"passes": true`).

---

## Plan Structure

Edit `plan.md` with tasks in this format:

```json
[
  {
    "category": "setup|feature|testing|documentation",
    "description": "Clear description of what to do",
    "steps": [
      "Specific step 1",
      "Specific step 2 with verification",
      "Run nx test <project> --coverage"
    ],
    "passes": false
  }
]
```

**Categories:**

- `setup` - Infrastructure, directories, configuration
- `feature` - Implementation work
- `testing` - Tests, quality checks
- `integration` - Wiring components together
- `documentation` - Docs, comments, README

---

## Best Practices

### ✅ Do This

- **Start small**: Test with 5-10 iterations first
- **Be specific**: Detailed steps = better results
- **Use ralph-new.sh**: Properly archives previous work
- **Monitor progress**: Watch `activity.md` while running
- **Review commits**: Check GitButler after completion
- **Verify manually**: Always test Ralph's work yourself

### ❌ Avoid This

- **Vague tasks**: "Fix bugs" → "Fix type error in CasesService:142"
- **Unlimited runs**: Always set max iterations
- **No archiving**: Use `ralph-new.sh` between runs
- **Blind trust**: Always review Ralph's code
- **Large iterations**: Start small, scale up if working

---

## File Locations

```
odis-ai/
├── README-RALPH.md           # This file
├── RALPH_SETUP.md            # Complete setup guide
├── RALPH_WORKFLOW.md         # Detailed workflows
│
├── PROMPT.md                 # Ralph's instructions (don't edit)
├── plan.md                   # Active plan (edit this)
├── plan-template.md          # Reusable template
├── activity.md               # Active log (Ralph writes)
├── activity-template.md      # Reusable template
│
├── ralph.sh                  # Main loop script
├── ralph-new.sh              # Helper: start new plan
├── ralph-status.sh           # Helper: check progress
│
├── screenshots/              # Active screenshots (ignored by git)
├── screenshots-archive/      # Old screenshots (ignored by git)
│
└── plans/
    ├── completed/            # Archived plans & activities
    └── templates/            # Custom plan templates
```

---

## Integration with ODIS AI

Ralph is pre-configured for ODIS AI:

### GitButler Integration

- No manual `git commit` needed
- Uses conventional commits: `type(scope): description`
- Scopes: `(web)`, `(vapi)`, `(cases)`, `(outbound)`, etc.

### Nx Workspace

- Uses `nx` commands exclusively
- Runs `nx affected -t lint,test` before completion
- Follows ODIS AI architecture from `AGENTS.md`

### Testing

- 70% coverage target
- Vitest + Testing Library
- Tests in `__tests__/` directories

### Imports

- Uses `@odis-ai/` namespace
- Domain-grouped imports from `AGENTS.md`
- Repository pattern with DI

---

## Monitoring

### Real-Time Monitoring

Terminal 1 (Ralph):

```bash
./ralph.sh 20
```

Terminal 2 (Activity):

```bash
tail -f activity.md
```

Terminal 3 (Status):

```bash
watch -n 10 './ralph-status.sh'
```

### Quick Checks

```bash
# How many tasks done?
./ralph-status.sh

# What's the current task?
grep -A 2 '"passes": false' plan.md | head -5

# View recent work
tail -20 activity.md

# Check screenshots
ls -lht screenshots/ | head -10

# Quality check
pnpm check
```

---

## Troubleshooting

### Ralph gets stuck on same task

```bash
# Stop Ralph
Ctrl+C

# Check error in activity
tail -50 activity.md

# Simplify the task in plan.md
code plan.md

# Try again
./ralph.sh 5
```

### Tests failing

```bash
# Run affected tests
nx affected -t test --verbose

# Fix manually or create fix plan
./ralph-new.sh fix-tests
# Edit plan.md with specific fixes
./ralph.sh 10
```

### Want to change approach mid-run

```bash
# Stop Ralph
Ctrl+C

# Edit remaining tasks in plan.md
code plan.md

# Continue
./ralph.sh 10
```

---

## Cost Management

### Iteration Guidelines

- **Testing**: 5-10 iterations (~$1-2)
- **Small feature**: 15-20 iterations (~$3-5)
- **Large feature**: 30-50 iterations (~$8-15)

### Cost Saving Tips

1. **Start small**: Test with 5 iterations
2. **Be specific**: Better plans = fewer iterations
3. **Use Haiku**: Edit `ralph.sh` for simple tasks:
   ```bash
   result=$(claude -p "$(cat PROMPT.md)" --model haiku --output-format text 2>&1) || true
   ```
4. **Monitor**: Use `ralph-status.sh` to check progress

---

## Example Session

Complete example: Building a new VAPI webhook handler

```bash
# === Setup ===
./ralph-new.sh vapi-end-of-call-v2

# Edit plan.md
cat > plan.md << 'EOF'
[
  {
    "category": "setup",
    "description": "Create webhook route structure",
    "steps": [
      "Create apps/web/src/app/api/webhooks/vapi/end-of-call-v2/route.ts",
      "Add webhook verification",
      "Set up error handling"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Add Zod schema and validation",
    "steps": [
      "Create libs/integrations/vapi/src/schemas/end-of-call-v2.ts",
      "Add comprehensive tests",
      "Achieve 70%+ coverage"
    ],
    "passes": false
  },
  {
    "category": "testing",
    "description": "End-to-end verification",
    "steps": [
      "Run nx lint integrations-vapi",
      "Run nx test integrations-vapi --coverage",
      "Test with VAPI payload",
      "Screenshot successful test"
    ],
    "passes": false
  }
]
EOF

# === Execute ===
# Test run
./ralph.sh 5

# Check progress
./ralph-status.sh

# Full run
./ralph.sh 15

# === Review ===
pnpm check
./ralph-status.sh

# View screenshots
ls -lh screenshots/

# Check commits in GitButler
# ...

# === Done ===
# Work is archived automatically when you run ralph-new.sh next time
```

---

## Documentation

- **`RALPH_SETUP.md`** - Complete setup guide with troubleshooting
- **`RALPH_WORKFLOW.md`** - Detailed workflows for different scenarios
- **This file** - Quick reference

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ Ralph Wiggum Quick Reference                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Start New:   ./ralph-new.sh <name>                         │
│  Run:         ./ralph.sh <iterations>                       │
│  Status:      ./ralph-status.sh                             │
│  Monitor:     tail -f activity.md                           │
│                                                             │
│  Edit Plan:   code plan.md                                  │
│  Check:       pnpm check                                    │
│                                                             │
│  Stop:        Ctrl+C                                        │
│  Continue:    ./ralph.sh 10                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Task Format:                                                │
│                                                             │
│  {                                                          │
│    "category": "feature",                                   │
│    "description": "What to build",                          │
│    "steps": ["Step 1", "Step 2"],                           │
│    "passes": false                                          │
│  }                                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Completion Signal: <promise>COMPLETE</promise>              │
└─────────────────────────────────────────────────────────────┘
```

---

**Ready to start?**

```bash
./ralph-new.sh my-first-feature
code plan.md
./ralph.sh 5
```

For detailed documentation, see:

- `RALPH_SETUP.md` - Complete setup guide
- `RALPH_WORKFLOW.md` - Recommended workflows
