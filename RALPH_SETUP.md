# Ralph Wiggum Setup for ODIS AI

Complete guide for running Ralph Wiggum autonomous agent loops in the ODIS AI monorepo.

⚫⚫⚫⚪⚪ Intermediate Difficulty | ⏱️ 10-15 Minutes Setup Time

---

## Table of Contents

- [What is Ralph Wiggum?](#what-is-ralph-wiggum)
- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [Creating Your Plan](#creating-your-plan)
- [Running Ralph](#running-ralph)
- [Monitoring Progress](#monitoring-progress)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## What is Ralph Wiggum?

Ralph Wiggum is an autonomous loop that runs Claude Code continuously with fresh context windows on each iteration. It's perfect for:

- Long-running implementation tasks
- Projects where you have a clear plan
- Tasks that benefit from iteration without manual intervention

**Not ideal for:**

- Exploratory work
- Quick one-off tasks
- Situations requiring frequent human input

---

## Quick Start

The ODIS AI repository comes pre-configured with Ralph Wiggum. Here's how to get started:

### 1. Prerequisites

Ensure you have:

- Claude Code installed and configured
- ODIS AI repository cloned
- A clear PRD or feature specification

### 2. Customize Your Plan

Edit `plan.md` with your specific tasks:

```bash
# Open plan.md and replace the example tasks with your own
code plan.md
```

Follow the JSON format:

```json
{
  "category": "feature|setup|testing|documentation",
  "description": "Clear description of the task",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "passes": false
}
```

### 3. Run Ralph

```bash
./ralph.sh 20
```

Replace `20` with your desired max iterations. Start with 10-20 for testing.

---

## File Structure

Ralph Wiggum uses these files in the ODIS AI repository:

```
odis-ai/
├── PROMPT.md              # Instructions for each Ralph iteration
├── plan.md                # Task list with pass/fail status
├── activity.md            # Progress log
├── ralph.sh               # Main loop script
├── screenshots/           # Browser screenshots from Playwright
├── .claude/
│   └── settings.json      # Sandbox configuration
└── .mcp.json             # MCP server configuration (includes Playwright)
```

### Key Files Explained

#### PROMPT.md

Contains instructions that Ralph reads on each iteration. Pre-configured with:

- ODIS AI architecture context (references AGENTS.md, CLAUDE.md)
- Nx workspace commands
- GitButler commit workflow
- Domain-grouped import patterns
- Quality check requirements

**Do not modify** unless you need to change how Ralph operates.

#### plan.md

Your task list in JSON format. Each task has:

- `category`: Type of task (setup, feature, testing, documentation)
- `description`: What needs to be done
- `steps`: Specific implementation steps
- `passes`: Boolean - false until task is complete

**Customize this** for each Ralph run with your specific tasks.

#### activity.md

Progress log that Ralph updates after each iteration with:

- What changed
- Commands run
- Verification results
- Screenshots taken
- Issues encountered

**Read this** to monitor Ralph's progress.

#### .claude/settings.json

Sandbox configuration with:

- Enabled permissions (npm registry, GitHub, Supabase, MCP tools)
- Denied operations (sudo, docker, git push, .env access)
- Ask prompts (pnpm install, nx migrate)
- Auto-allow bash when sandboxed

**Already configured** for ODIS AI - no changes needed.

#### .mcp.json

MCP server configuration including:

- **Playwright**: For headless browser testing (screenshots saved to `screenshots/`)
- **Supabase**: Database operations
- **Nx MCP**: Workspace exploration
- **Shadcn**: Component management
- **VAPI MCP**: Voice AI integration
- **GitHub**: Repository operations

**Already configured** with headless Playwright for Ralph.

---

## Creating Your Plan

### Step 1: Write a PRD (if needed)

Before creating your plan, ensure you have a clear PRD. If you need help, see:

- [PRD Creator Tutorial](https://www.youtube.com/watch?v=0seaP5YjXVM)
- [PRD Creator Instructions](https://github.com/JeredBlu/custom-instructions/blob/main/prd-creator-3-25.md)

### Step 2: Break Down Tasks

Structure your tasks following Anthropic's recommendations:

```json
[
  {
    "category": "setup",
    "description": "Set up new VAPI webhook handler infrastructure",
    "steps": [
      "Create webhook route in apps/web/src/app/api/webhooks/vapi/new-event/",
      "Add route.ts with proper error handling",
      "Verify webhook signature with VAPI_WEBHOOK_SECRET",
      "Test with mock payload"
    ],
    "passes": false
  },
  {
    "category": "feature",
    "description": "Implement webhook payload processing",
    "steps": [
      "Create Zod schema in libs/integrations/vapi/src/schemas/new-event.ts",
      "Add processor in libs/integrations/vapi/src/processors/",
      "Implement business logic following repository pattern",
      "Add unit tests with 70%+ coverage"
    ],
    "passes": false
  },
  {
    "category": "testing",
    "description": "Verify webhook end-to-end",
    "steps": [
      "Run nx lint integrations-vapi",
      "Run nx test integrations-vapi",
      "Start dev server with nx dev web",
      "Test webhook with VAPI test event",
      "Check activity.md for verification screenshots"
    ],
    "passes": false
  }
]
```

### Step 3: Add Acceptance Criteria

For each task, the `steps` array should include:

- **Implementation steps**: What to build
- **Quality checks**: Linting, testing, type checking
- **Verification**: Browser tests, API tests, screenshots

---

## Running Ralph

### Basic Usage

```bash
./ralph.sh <max_iterations>
```

**Examples:**

```bash
# Testing run (10 iterations)
./ralph.sh 10

# Standard run (20 iterations)
./ralph.sh 20

# Long-running task (50 iterations)
./ralph.sh 50
```

### What Happens During Each Iteration

1. **Context Reset**: Fresh context window starts
2. **Read Activity**: Ralph reads `activity.md` to understand progress
3. **Select Task**: Finds first task with `"passes": false`
4. **Implement**: Follows ODIS AI patterns from AGENTS.md/CLAUDE.md
5. **Quality Check**: Runs `nx lint` and `nx test`
6. **Verify**: Uses Playwright to screenshot results
7. **Log Progress**: Updates `activity.md` with details
8. **Mark Complete**: Changes `"passes": false` to `"passes": true`
9. **Auto-Commit**: GitButler automatically commits changes

### Completion Signal

Ralph exits when it finds this in `plan.md`:

```
<promise>COMPLETE</promise>
```

This happens when **all tasks** have `"passes": true`.

---

## Monitoring Progress

### Real-Time Monitoring

While Ralph runs, monitor in separate terminals:

```bash
# Watch activity log
tail -f activity.md

# Watch plan updates
watch -n 5 "cat plan.md | jq '.[] | select(.passes == false) | .description'"

# View screenshots as they're created
ls -lt screenshots/
```

### Checking Status

At any time:

```bash
# View current task
grep -A 5 '"passes": false' plan.md | head -10

# Count completed tasks
grep -c '"passes": true' plan.md

# View recent activity
tail -50 activity.md

# Check latest screenshot
ls -t screenshots/ | head -1
```

---

## Best Practices

### Before Running

1. **Create a thorough plan** - Ralph works best with clear, detailed tasks
2. **Set realistic iterations** - Start with 10-20 for testing
3. **Review sandbox settings** - Ensure permissions match your needs
4. **Commit existing work** - GitButler will auto-commit Ralph's changes

### During Execution

1. **Don't interrupt** - Let Ralph complete iterations
2. **Monitor activity.md** - Check progress without interfering
3. **Review screenshots** - Visual verification of work
4. **Watch for blockers** - Ralph will note issues in activity.md

### After Completion

1. **Review all changes** - Check git commits from GitButler
2. **Run quality checks** - `pnpm check` for full validation
3. **Test manually** - Verify Ralph's work meets requirements
4. **Update documentation** - Add notes to AGENTS.md if architecture changed

### Cost Management

1. **Always set max iterations** - Prevents runaway costs
2. **Start small** - Test with 10 iterations first
3. **Use Haiku for simple tasks** - Edit `ralph.sh` to use `--model haiku` flag
4. **Monitor token usage** - Check Claude Code dashboard

---

## Troubleshooting

### Common Issues

#### 1. Ralph Gets Stuck / Infinite Loop

**Symptoms**: Same task failing repeatedly

**Solutions**:

- Check `activity.md` for error patterns
- Review task steps in `plan.md` - may be too vague
- Reduce scope of failing task
- Add more specific acceptance criteria

#### 2. Context Window Fills Up

**Symptoms**: Ralph starts hallucinating, missing details

**Solution**: This shouldn't happen with the bash loop method (each iteration is fresh), but if it does:

- Check that `ralph.sh` is running correctly
- Verify `claude` CLI is being called properly
- Review PROMPT.md for excessive context

#### 3. Playwright Not Working

**Symptoms**: No screenshots, browser errors

**Solutions**:

```bash
# Verify Playwright is installed
npx @playwright/mcp@latest --version

# Check .mcp.json configuration
cat .mcp.json | jq '.mcpServers.playwright'

# Test Playwright manually
npx playwright test --headed
```

#### 4. GitButler Not Committing

**Symptoms**: Changes not appearing in GitButler

**Solutions**:

- Ensure GitButler is running
- Check GitButler settings for auto-commit
- Verify you're on the correct branch
- Review `.claude/CLAUDE.md` for commit scope guidelines

#### 5. Tests Failing

**Symptoms**: `nx test` commands fail

**Solutions**:

```bash
# Run affected tests to see failures
nx affected -t test

# Run specific project tests with details
nx test <project> --verbose

# Check test coverage
nx test <project> --coverage

# Clear cache and retry
nx reset
nx test <project>
```

#### 6. Import Path Errors

**Symptoms**: TypeScript errors about missing modules

**Solutions**:

- Verify `tsconfig.base.json` has correct paths
- Check imports use `@odis-ai/` namespace
- Run `pnpm install` to ensure dependencies are installed
- Review AGENTS.md for correct import patterns

#### 7. Port Already in Use

**Symptoms**: Dev server won't start

**Solution**: Ralph's PROMPT.md instructs it to try alternative ports. If persistent:

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port explicitly
nx dev web --port 3001
```

#### 8. Expensive Runs

**Prevention**:

- Always set reasonable max iterations (10-20 for testing)
- Use smaller, focused tasks
- Review plan.md before running
- Consider using Haiku model for simpler tasks

**If it happens**:

- Stop Ralph with Ctrl+C
- Review activity.md for unnecessary repeated work
- Refine plan.md to be more specific
- Reduce max iterations

---

## Advanced Configuration

### Using Different Models

Edit `ralph.sh` to use different Claude models:

```bash
# Use Haiku for faster, cheaper iterations (good for simple tasks)
result=$(claude -p "$(cat PROMPT.md)" --model haiku --output-format text 2>&1) || true

# Use Opus for complex reasoning (more expensive)
result=$(claude -p "$(cat PROMPT.md)" --model opus --output-format text 2>&1) || true

# Default: Sonnet (balanced)
result=$(claude -p "$(cat PROMPT.md)" --output-format text 2>&1) || true
```

### Custom Sandbox Permissions

Edit `.claude/settings.json` to adjust permissions:

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:your-api.com)", // Allow your API
      "mcp__custom-mcp__*" // Allow custom MCP server
    ],
    "deny": [
      "Bash(rm -rf*)", // Prevent dangerous commands
      "Read(/path/to/secrets)" // Protect sensitive files
    ],
    "ask": [
      "Bash(npm publish*)" // Require confirmation for publishing
    ]
  }
}
```

### Adding Custom MCP Servers

Edit `.mcp.json` to add servers:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["-y", "your-mcp-server@latest"]
    }
  }
}
```

---

## Integration with ODIS AI Workflow

### GitButler Workflow

Ralph is configured to work seamlessly with GitButler:

1. **No manual commits**: GitButler auto-commits after each iteration
2. **Conventional commits**: Uses scopes from `.claude/CLAUDE.md`
3. **Branch management**: Works on your current branch

**Commit Scopes for ODIS AI**:

- `(web)`: Next.js frontend changes
- `(vapi)`: VAPI integration changes
- `(cases)`: Case management features
- `(outbound)`: Discharge call features
- `(inbound)`: Inbound call handling
- `(db)`: Database changes
- `(ui)`: Shared component changes
- `(util)`: Utility function changes

### Nx Workspace Integration

Ralph uses Nx commands exclusively:

```bash
# Development
nx dev web                    # Start Next.js
nx dev docs                   # Start Docusaurus

# Quality checks
nx lint <project>             # Lint specific project
nx test <project>             # Test specific project
nx affected -t lint,test      # Run on affected projects

# Build
nx build web                  # Production build
```

### Testing Strategy

Ralph follows ODIS AI testing requirements:

- **Coverage target**: 70% lines/functions/branches
- **Test colocation**: `__tests__/` directories
- **Test framework**: Vitest + Testing Library
- **Quality gates**: Linting + testing before marking complete

---

## Useful Commands

### Ralph Control

```bash
# Start Ralph
./ralph.sh 20

# Stop Ralph (if running)
Ctrl+C

# Check Ralph script
cat ralph.sh

# Make Ralph executable (if needed)
chmod +x ralph.sh
```

### Monitoring

```bash
# Watch activity in real-time
tail -f activity.md

# Count completed tasks
jq '[.[] | select(.passes == true)] | length' plan.md

# View next task
jq '.[] | select(.passes == false) | .description' plan.md | head -1

# List screenshots
ls -lht screenshots/

# Check sandbox status
cat .claude/settings.json | jq '.sandbox'
```

### Quality Checks

```bash
# Run full quality check
pnpm check

# Lint all
pnpm lint:all

# Test all
pnpm test:all

# Type check all
pnpm typecheck:all

# View dependency graph
nx graph
```

---

## Resources

### ODIS AI Documentation

- `AGENTS.md` - Architecture and patterns
- `CLAUDE.md` - Claude Code specific guidelines
- `.claude/CLAUDE.md` - Commit conventions
- `docs/reference/NX_PROJECTS.md` - Nx workspace inventory

### External Resources

- [Ralph Wiggum Original](https://ghuntley.com/ralph/) - Geoffrey Huntley
- [Claude Code Docs](https://code.claude.com/docs) - Official documentation
- [Anthropic's Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Best practices
- [Claude Code Sandbox](https://code.claude.com/docs/en/sandboxing) - Sandbox configuration

---

## Example Ralph Run

Here's what a typical Ralph run looks like:

```bash
$ ./ralph.sh 10

🚀 Starting Ralph Wiggum loop for ODIS AI
Max iterations: 10
Screenshots will be saved to: screenshots/
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Iteration 1 of 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Claude reads plan.md and activity.md]
[Claude selects first task with "passes": false]
[Claude implements the task following ODIS AI patterns]
[Claude runs nx lint and nx test]
[Claude takes screenshot with Playwright]
[Claude updates activity.md]
[Claude marks task "passes": true in plan.md]
[GitButler auto-commits]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ End of iteration 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Continues for each iteration...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All tasks complete after 7 iterations!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Summary

Ralph Wiggum for ODIS AI is pre-configured and ready to use:

1. **Customize `plan.md`** with your tasks
2. **Run `./ralph.sh 20`** to start
3. **Monitor `activity.md`** for progress
4. **Review commits** in GitButler when done

The bash loop method gives you fresh context windows on each iteration, reducing hallucination and improving reliability for long-running tasks.

---

**Questions or Issues?**

If you encounter problems not covered in this guide:

1. Check `activity.md` for error details
2. Review the [troubleshooting section](#troubleshooting)
3. Consult AGENTS.md for ODIS AI patterns
4. Reference the [external resources](#resources)
