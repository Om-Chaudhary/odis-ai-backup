# Agent Quick Start Guide

> **Purpose:** Quick reference for agents starting dashboard redesign assignments  
> **Last Updated:** 2025-11-28

## 🚀 Getting Started

1. **Read Your Assignment** - Open your assigned document in `docs/dashboard/assignments/`
2. **Check Dependencies** - Verify all dependencies are complete
3. **Review Related Docs** - Read linked documentation
4. **Start Implementation** - Follow the step-by-step guide

## 📋 Assignment Overview

See [IMPLEMENTATION_ASSIGNMENTS.md](./IMPLEMENTATION_ASSIGNMENTS.md) for complete list.

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

## ✅ Before Submitting

- [ ] All acceptance criteria met
- [ ] Code follows design system
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible
- [ ] No console errors
- [ ] Tested with real data
- [ ] Updated related documentation if needed

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

---

**Ready to start?** Pick your assignment and begin! 🚀
