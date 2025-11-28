# Agent Assignment Instructions

> **Copy this entire file for each agent assignment**

## 🚀 Quick Start Commands

```bash
# 1. Checkout the implementation branch
git fetch origin
git checkout feat/dashboard-optimization-implementation
git pull origin feat/dashboard-optimization-implementation

# 2. Create your feature branch
git checkout -b feat/assignment-A[X]-[description]

# Example:
# git checkout -b feat/assignment-A1-date-filter-button-group
# git checkout -b feat/assignment-A10-backend-metrics-queries

# 3. Start working on your assignment
# Read the full assignment document in docs/dashboard/assignments/A[X]-*.md
```

## 📋 Assignment Checklist

### Before Starting

- [ ] Read the full assignment document: `docs/dashboard/assignments/A[X]-*.md`
- [ ] Review related documentation:
  - [Design System](../01-GENERAL/design-system.md)
  - [Dashboard Principles](../01-GENERAL/dashboard-principles.md)
  - Related component/pattern docs if applicable
- [ ] Check [IMPLEMENTATION_ASSIGNMENTS.md](../IMPLEMENTATION_ASSIGNMENTS.md) for dependencies
- [ ] Verify dependencies are complete (if any)
- [ ] Update assignment status in `IMPLEMENTATION_ASSIGNMENTS.md` to "🟡 In Progress"

### During Implementation

- [ ] Follow code style guidelines from [CLAUDE.md](../../../CLAUDE.md)
- [ ] Match design system specifications exactly
- [ ] Use TypeScript strict mode
- [ ] Follow React Server Components pattern (minimize `"use client"`)
- [ ] Test acceptance criteria as you implement
- [ ] Make frequent, descriptive commits

### After Completion

- [ ] All acceptance criteria met
- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Component renders correctly
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Keyboard accessible
- [ ] Updated assignment status in `IMPLEMENTATION_ASSIGNMENTS.md` to "✅ Complete"
- [ ] Create PR targeting `feat/dashboard-optimization-implementation`

## 📝 PR Description Template

```markdown
# Assignment A[X]: [Assignment Name]

## Overview

[Brief description of what was implemented]

## Changes Made

- [List of key changes]

## Files Modified/Created

- `path/to/file1.tsx` - [description]
- `path/to/file2.ts` - [description]

## Testing

- [ ] All acceptance criteria met
- [ ] Tested on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] No console errors

## Related

- Assignment: [A[X]-assignment-name.md](../assignments/A[X]-assignment-name.md)
- Dependencies: [List any dependencies if applicable]
```

## 🔗 Essential Links

- **Your Assignment:** `docs/dashboard/assignments/A[X]-*.md`
- **Agent Quick Start:** `docs/dashboard/AGENT_QUICK_START.md`
- **All Assignments:** `docs/dashboard/IMPLEMENTATION_ASSIGNMENTS.md`
- **Design System:** `docs/dashboard/01-GENERAL/design-system.md`
- **Dashboard Principles:** `docs/dashboard/01-GENERAL/dashboard-principles.md`

## ⚠️ Important Notes

1. **Dependencies:** Check if your assignment has dependencies. Don't start until dependencies are complete.
2. **Branch Naming:** Use format `feat/assignment-A[X]-[description]`
3. **PR Target:** Always target `feat/dashboard-optimization-implementation`
4. **Status Updates:** Update `IMPLEMENTATION_ASSIGNMENTS.md` when starting/completing
5. **Design System:** Follow the design system exactly - colors, spacing, animations
6. **Code Style:** Follow project conventions in CLAUDE.md

## 🎯 Assignment-Specific Notes

**Replace this section with assignment-specific information:**

- **Assignment:** A[X] - [Name]
- **Dependencies:** [List dependencies or "None"]
- **Estimated Time:** [X hours]
- **Priority:** [High/Medium/Low]

---

**Ready to start?** Follow the commands above and begin implementation! 🚀
