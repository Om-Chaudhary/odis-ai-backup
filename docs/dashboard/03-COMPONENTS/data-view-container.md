# Data View Container - Specification

## Overview

Shared container component for consistent data view pages (SOAP notes, discharge summaries, transcripts).

## Visual Design

```
┌─────────────────────────────────────────┐
│ ← Back to Cases    [Copy] [Print] [Export] │
├─────────────────────────────────────────┤
│                                         │
│ Title                                   │
│ Subtitle (optional)                     │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ [Data View Content]                     │
│                                         │
└─────────────────────────────────────────┘
```

## Component Props

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

## Layout Structure

### Header Section

- Back button (left side)
- Title and subtitle (center/left)
- Action buttons (right side)

### Content Section

- Full-width content area
- Proper padding and spacing
- Scrollable if needed

## Styling

- Match dashboard layout patterns
- Use existing container classes
- Consistent spacing with dashboard
- Print-friendly styles

## Responsive Behavior

- Desktop: Full width container
- Mobile: Full width, stacked actions if needed

## Integration

Used by:

- SOAP Note Viewer
- Discharge Summary Viewer
- Transcript Viewer
