# Assignment A9: Data View Container

> **Status:** Ready for Assignment  
> **Difficulty:** Easy  
> **Dependencies:** None (but used by A6, A7, A8)  
> **Estimated Time:** 1-2 days

## Overview

Create a shared container component for consistent data view pages (SOAP notes, discharge summaries, transcripts).

## Files to Create

1. `src/components/dashboard/data-view-container.tsx` - Container component

## Component Specifications

### Props Interface

```typescript
interface DataViewContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: {
    label: string;
    href: string;
  };
}
```

### Visual Design

```
┌─────────────────────────────────────────┐
│ ← Back to Cases    [Action Buttons]     │
├─────────────────────────────────────────┤
│                                         │
│ Title                                   │
│ Subtitle                                │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ [Data View Content]                     │
│                                         │
└─────────────────────────────────────────┘
```

## Key Features

1. **Consistent Header:**
   - Title and subtitle
   - Back navigation button
   - Action buttons (copy, print, export, etc.)

2. **Layout:**
   - Consistent spacing
   - Responsive design
   - Print-friendly

3. **Reusable:**
   - Can wrap any data viewer
   - Flexible action button area
   - Customizable back button

## Implementation Details

### Component Structure

```typescript
export function DataViewContainer({
  title,
  subtitle,
  children,
  actions,
  backButton,
}: DataViewContainerProps) {
  return (
    <div className="container mx-auto py-6">
      {/* Back button and actions */}
      {/* Header with title/subtitle */}
      {/* Content area */}
      {children}
    </div>
  );
}
```

### Styling

- Match dashboard layout patterns
- Use existing container classes
- Consistent spacing with dashboard

## Integration

Used by:

- SOAP Note Viewer (A6)
- Discharge Summary Viewer (A7)
- Transcript Viewer (A8)

## Acceptance Criteria

- [ ] Consistent header displays correctly
- [ ] Back button navigates correctly
- [ ] Action buttons area is flexible
- [ ] Content area displays children
- [ ] Responsive on mobile
- [ ] Print-friendly styles
- [ ] Matches dashboard design system

## Testing Checklist

- [ ] Container renders correctly
- [ ] Back button works
- [ ] Actions area accepts custom buttons
- [ ] Children render correctly
- [ ] Responsive layout works
- [ ] Print styles work

## Related Documentation

- [Data View Container Specification](../specifications/data-view-container.md)
- [Layout Guidelines](../design-system/layout-guidelines.md)

---

**Ready to Start:** No dependencies. Can be created first and used by A6, A7, A8.
