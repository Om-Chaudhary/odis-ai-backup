@plan.md @activity.md @AGENTS.md @CLAUDE.md

# Ralph Loop Context for ODIS AI

You are working in the ODIS AI monorepo, a veterinary technology platform built with Nx, Next.js 16, React 19, TypeScript, and Supabase.

## Critical Project Rules

1. **No Direct Git Operations**: GitButler handles all commits. NEVER run `git add` or `git commit` manually.
2. **Nx Commands**: Always use Nx for tasks (`nx dev web`, `nx test <project>`, etc.)
3. **Import Paths**: Use `@odis-ai/` namespace imports (see AGENTS.md for full list)
4. **Testing**: Run `nx affected -t lint,test` before marking tasks complete
5. **Architecture**: Reference AGENTS.md for workspace structure and patterns

## Iteration Workflow

1. **Read Activity Log**: Start by reading `activity.md` to understand what was recently accomplished.

2. **Select Next Task**: Open `plan.md` and choose the **single highest priority task** where `"passes": false`.

3. **Start Development Server** (if needed):
   - For web app: `nx dev web` (runs on http://localhost:3000)
   - For docs: `nx dev docs`
   - If port is taken, Nx will suggest an alternative

4. **Implement the Task**:
   - Follow patterns in AGENTS.md and CLAUDE.md
   - Use domain-grouped imports (`@odis-ai/shared/*`, `@odis-ai/domain/*`, etc.)
   - Prefer editing existing files over creating new ones
   - Default to Server Components; minimize `"use client"`

5. **Verify Implementation**:
   - Run quality checks: `nx lint <project>` and `nx test <project>`
   - Use Playwright MCP to:
     - Navigate to the local server URL (if applicable)
     - Take a screenshot and save as `screenshots/[task-name].png`
     - Check browser console for errors

6. **Update Activity Log**:
   - Append a dated entry to `activity.md` with:
     - What you changed
     - Which commands you ran
     - What you verified (test results, screenshot filename)
     - Any issues or blockers

7. **Mark Task Complete**:
   - Update the task in `plan.md`: change `"passes": false` to `"passes": true`
   - **ONLY** modify the `passes` field - do not remove or rewrite tasks

8. **GitButler Auto-Commit**:
   - GitButler will automatically commit your changes
   - Use conventional commits: `type(scope): description`
   - Use scopes from `.claude/CLAUDE.md`: (web), (vapi), (cases), (outbound), etc.

## Important Constraints

- **ONLY WORK ON A SINGLE TASK** per iteration
- Do NOT run `git init`, `git add`, or `git commit`
- Do NOT change git remotes or push
- Do NOT modify environment variables or secrets
- Do NOT install new dependencies without verification

## Completion Signal

When **ALL tasks** in `plan.md` have `"passes": true`, output exactly:

```
<promise>COMPLETE</promise>
```

## Project-Specific Notes

- **Repository Pattern**: Services use dependency injection with repository interfaces
- **Supabase Clients**: Use `createServerClient` for RLS, `createServiceClient` for admin/webhooks
- **tRPC**: Routers are in `apps/web/src/server/api/routers/`
- **Testing**: Vitest + Testing Library, 70% coverage target
- **MCP Tools**: You have access to `nx_workspace`, `nx_project_details`, `nx_docs` tools

---

**Current Focus**: Work on exactly ONE task from plan.md, verify it thoroughly, log your work, and mark it complete.
