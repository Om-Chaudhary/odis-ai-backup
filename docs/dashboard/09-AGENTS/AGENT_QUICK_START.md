# Agent Quick Start Guide

> **Purpose:** Complete guide for agents starting dashboard redesign assignments  
> **Last Updated:** 2025-11-28

## 🚀 Getting Started

1. **Read Your Assignment** - Open your assigned document in `docs/dashboard/assignments/`
2. **Check Dependencies** - Verify all dependencies are complete in `IMPLEMENTATION_ASSIGNMENTS.md`
3. **Review Related Docs** - Read linked documentation
4. **Start Implementation** - Follow the step-by-step guide

## 📋 Quick Start Commands

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

## 📋 Assignment Overview

See [IMPLEMENTATION_ASSIGNMENTS.md](./IMPLEMENTATION_ASSIGNMENTS.md) for complete list.

**📊 Progress Tracking:** Update [AGENT_PROGRESS_TRACKER.md](./AGENT_PROGRESS_TRACKER.md) when starting/completing assignments.

### Foundation Tasks (Do First)

- **A10: Backend Metrics Queries** - Required for A2, A3
- **A1: Date Filter Button Group** - Required for A5

### Overview Tab Tasks

- **A2: Cases Needing Attention Card** (needs A10)
- **A3: Enhanced Stat Cards** (needs A10)
- **A4: Collapsible Activity Timeline** (no dependencies)

### Cases Tab Tasks

- **A5: Filter Button Groups** (needs A1)
- **A6: Quick Filters** (needs A5, A10)
- **A7: Enhanced Case Cards** (no dependencies)

### Discharges Tab Tasks

- **A8: Status Summary Bar** (no dependencies)
- **A9: Enhanced Discharges Cards** (no dependencies)

## 📚 Essential Documentation

- [Design System](./01-GENERAL/design-system.md) - Colors, spacing, typography
- [Dashboard Principles](./01-GENERAL/dashboard-principles.md) - Core design principles
- [Component Documentation](./03-COMPONENTS/) - Component specs
- [Pattern Documentation](./04-PATTERNS/) - Reusable patterns

## 🎨 Design System Quick Reference

### Colors

- **Primary Teal:** `#31aba3`
- **Success Green:** `#10b981`
- **Warning Amber:** `#f59e0b`
- **Error Red:** `#ef4444`

### Button Groups

```typescript
className = "inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1";
// Active button: bg-[#31aba3] text-white
// Inactive button: variant="ghost"
```

### Cards (with Glassmorphism)

```typescript
className =
  "rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10 transition-smooth";
```

## ✨ Animation & Effects

### Glassmorphism Cards

**Standard Card:**

```typescript
className =
  "rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10 transition-smooth";
```

**With Entry Animation:**

```typescript
className =
  "animate-card-in rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md ...";
```

### Smooth Transitions

```typescript
className = "transition-smooth"; // 200ms ease-in-out
className = "hover:scale-[1.02]"; // Subtle hover scale
className = "hover:shadow-xl"; // Shadow increase on hover
```

### Staggered Entry Animations

```typescript
// For card grids
className = "animate-card-in"; // First card
className = "animate-card-in-delay-1"; // +100ms
className = "animate-card-in-delay-2"; // +200ms
className = "animate-card-in-delay-3"; // +300ms
```

**See:** [Animation and Effects Guidelines](./01-GENERAL/animation-and-effects.md)

## 🔧 Common Patterns

### URL State Management

```typescript
import { useQueryState } from "nuqs";

const [value, setValue] = useQueryState("key", {
  defaultValue: "default",
});
```

### Date Calculations

```typescript
import { subDays, startOfDay, endOfDay, format } from "date-fns";

const startDate = startOfDay(subDays(new Date(), 7));
const endDate = endOfDay(new Date());
```

### Component Structure

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function MyComponent({ ... }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

## ✅ Implementation Checklist

### Before Starting

- [ ] Read the full assignment document: `docs/dashboard/assignments/A[X]-*.md`
- [ ] Review related documentation:
  - [Design System](./01-GENERAL/design-system.md)
  - [Dashboard Principles](./01-GENERAL/dashboard-principles.md)
  - Related component/pattern docs if applicable
- [ ] Check [IMPLEMENTATION_ASSIGNMENTS.md](./IMPLEMENTATION_ASSIGNMENTS.md) for dependencies
- [ ] Verify dependencies are complete (if any)
- [ ] **Update [AGENT_PROGRESS_TRACKER.md](./AGENT_PROGRESS_TRACKER.md)** - Mark assignment as "🟡 In Progress" with your agent ID and branch name

### During Implementation

- [ ] Follow code style guidelines from [CLAUDE.md](../../CLAUDE.md)
- [ ] Match design system specifications exactly
- [ ] Use TypeScript strict mode
- [ ] Follow React Server Components pattern (minimize `"use client"`)
- [ ] Test acceptance criteria as you implement
- [ ] Make frequent, descriptive commits

### Before Submitting

- [ ] All acceptance criteria met
- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Component renders correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible
- [ ] No console errors
- [ ] Tested with real data
- [ ] **Updated [AGENT_PROGRESS_TRACKER.md](./AGENT_PROGRESS_TRACKER.md)** - Mark assignment as "✅ Complete" with PR link
- [ ] Create PR targeting `feat/dashboard-optimization-implementation`

## 🐛 Common Issues

### Styling Not Matching

- Check design system documentation
- Verify Tailwind classes are correct
- Use `cn()` utility for conditional classes

### URL State Not Working

- Verify `nuqs` is installed
- Check query parameter names match
- Ensure component is client-side (`"use client"`)

### Data Not Loading

- Check tRPC query is correct
- Verify backend endpoint exists
- Check network tab for errors

## 📞 Need Help?

1. Check assignment document for detailed steps
2. Review related documentation links
3. Check existing similar components for patterns
4. Review design system for styling guidance

## 🎯 Cursor Agent Mode Launch Prompt

Copy and paste this prompt into Cursor Agent Mode to start your assignment:

```
I need you to implement Assignment A[X]: [Assignment Name] from the dashboard optimization project.

## Context
- Repository: odis-ai-web
- Branch: feat/dashboard-optimization-implementation
- Assignment: docs/dashboard/assignments/A[X]-[assignment-name].md
- Design System: docs/dashboard/01-GENERAL/design-system.md
- Dashboard Principles: docs/dashboard/01-GENERAL/dashboard-principles.md

## Your Task
1. Read the full assignment document: docs/dashboard/assignments/A[X]-[assignment-name].md
2. Check dependencies in docs/dashboard/IMPLEMENTATION_ASSIGNMENTS.md
3. Create feature branch: feat/assignment-A[X]-[description]
4. Implement according to the assignment specifications
5. Follow all acceptance criteria
6. Update assignment status in IMPLEMENTATION_ASSIGNMENTS.md when starting/completing

## Requirements
- Follow TypeScript strict mode
- Use React Server Components pattern (minimize "use client")
- Match design system exactly (colors, spacing, animations)
- Ensure responsive design (mobile/tablet/desktop)
- Make keyboard accessible
- Follow code style from CLAUDE.md

## Deliverables
- Working implementation meeting all acceptance criteria
- PR targeting feat/dashboard-optimization-implementation
- Updated status in IMPLEMENTATION_ASSIGNMENTS.md

Start by reading the assignment document and checking dependencies.
```

**Replace `A[X]` and `[Assignment Name]` with your specific assignment number and name.**

## 📝 PR Description Template

When creating your PR, use this template:

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

- Assignment: docs/dashboard/assignments/A[X]-\*.md
- Dependencies: [List any dependencies if applicable]
```

---

**Ready to start?** Pick your assignment and begin! 🚀
