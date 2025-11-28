# Quick Start Guide for Sub-Agents

> **For:** Developers implementing dashboard optimization tasks  
> **Purpose:** Get started quickly with your assignment

## Step 1: Choose Your Assignment

Review available assignments:

- [Assignments Index](assignments/README.md)

**Recommended starting points (no dependencies):**

- A1: Date Filter Button Group (Easy)
- A2: Backend Metrics Queries (Medium)
- A5: Condensed Activity Timeline (Medium)
- A9: Data View Container (Easy) - Can be used by A6, A7, A8

## Step 2: Read Your Assignment Document

Each assignment includes:

- Complete overview
- Files to create/modify
- Implementation details
- Acceptance criteria
- Testing checklist

## Step 3: Review Related Documentation

### For Each Assignment, Check:

1. **Specification:** Read the detailed specification document
   - Located in `specifications/`
   - Contains visual designs, props, styling

2. **Design System:** Review relevant design guidelines
   - Colors, patterns, layouts
   - Located in `design-system/`

3. **Implementation:** Review development guidelines
   - Code style, patterns, state management
   - Located in `implementation/`

## Step 4: Review Existing Code

Before implementing:

- Read existing similar components
- Understand current patterns
- Check related files mentioned in assignment

## Step 5: Implement

Follow:

- Implementation guidelines
- Code style guidelines
- Design system specifications

## Step 6: Test

Use the testing checklist in your assignment document:

- Unit tests if applicable
- Manual testing
- Responsive testing
- Accessibility testing

## Step 7: Update Status

Once complete, update assignment status in:

- `assignments/README.md` - Change status to "Complete"

## Common Patterns

### Component Structure

```typescript
"use client";

import { ... } from "...";

interface ComponentProps { ... }

export function Component({ ... }: ComponentProps) {
  // Implementation
  return (...);
}
```

### Styling

- Use Tailwind CSS
- Match dashboard color scheme (teal #31aba3)
- Use existing UI components from `src/components/ui/`

### State Management

- URL state: `useQueryState` from nuqs
- Component state: `useState`
- Server data: tRPC queries

---

**Need Help?** Review the [Complete Index](INDEX.md) or related documentation.
