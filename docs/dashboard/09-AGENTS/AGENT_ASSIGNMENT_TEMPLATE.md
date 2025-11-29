# Agent Assignment Checklist

> **Purpose:** Copy-paste checklist for tracking your assignment progress  
> **Usage:** Copy this checklist and fill in your assignment details

## 🎯 Assignment Details

- **Assignment:** A[X] - [Assignment Name]
- **Assignment Document:** `docs/dashboard/assignments/A[X]-[assignment-name].md`
- **Dependencies:** [List dependencies or "None"]
- **Estimated Time:** [X hours]
- **Priority:** [High/Medium/Low]

## 📋 Progress Checklist

### Before Starting

- [ ] Read the full assignment document: `docs/dashboard/assignments/A[X]-*.md`
- [ ] Checked dependencies in `IMPLEMENTATION_ASSIGNMENTS.md`
- [ ] Verified dependencies are complete (if any)
- [ ] Reviewed [Design System](./01-GENERAL/design-system.md)
- [ ] Reviewed [Dashboard Principles](./01-GENERAL/dashboard-principles.md)
- [ ] Created feature branch: `feat/assignment-A[X]-[description]`
- [ ] Updated assignment status in `IMPLEMENTATION_ASSIGNMENTS.md` to "🟡 In Progress"

### During Implementation

- [ ] Following code style from [CLAUDE.md](../../CLAUDE.md)
- [ ] Matching design system specifications exactly
- [ ] Using TypeScript strict mode
- [ ] Minimizing `"use client"` (prefer Server Components)
- [ ] Testing acceptance criteria as I implement
- [ ] Making frequent, descriptive commits

### Before Submitting

- [ ] All acceptance criteria met
- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Component renders correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible
- [ ] No console errors
- [ ] Tested with real data
- [ ] Updated assignment status in `IMPLEMENTATION_ASSIGNMENTS.md` to "✅ Complete"
- [ ] Created PR targeting `feat/dashboard-optimization-implementation`

## 🔗 Quick Links

- **Full Guide:** [AGENT_QUICK_START.md](./AGENT_QUICK_START.md)
- **All Assignments:** [IMPLEMENTATION_ASSIGNMENTS.md](./IMPLEMENTATION_ASSIGNMENTS.md)
- **Your Assignment:** `docs/dashboard/assignments/A[X]-*.md`

---

**Note:** For complete instructions, git commands, design system reference, and Cursor Agent Mode prompts, see [AGENT_QUICK_START.md](./AGENT_QUICK_START.md).
