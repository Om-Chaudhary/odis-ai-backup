# Discharge Summary Viewer - Specification

## Overview

Document-style viewer for discharge summaries with structured sections, highlighted medications, and formatted instructions.

## Visual Design

```
┌─────────────────────────────────────────┐
│ Discharge Summary    Created: Nov 26... │
├─────────────────────────────────────────┤
│                                         │
│ Patient: Max                            │
│ Owner: John Smith                       │
│ Date: November 26, 2025                 │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ ## Diagnosis                            │
│ Ear infection, right ear                │
│                                         │
│ ## Medications                          │
│ ┌──────────────┐ ┌──────────────┐     │
│ │ Amoxicillin  │ │ 500mg 2x/day │     │
│ └──────────────┘ └──────────────┘     │
│                                         │
│ ## Instructions                         │
│ 1. Give medication with food            │
│ 2. Complete full course                 │
│ 3. Monitor for improvement              │
│                                         │
│ ⚠️ Warning Signs                        │
│ ┌────────────────────────────────────┐ │
│ │ If pet shows signs of distress,    │ │
│ │ contact clinic immediately         │ │
│ └────────────────────────────────────┘ │
│                                         │
│ [Copy] [Print] [Export] [Search: __]   │
└─────────────────────────────────────────┘
```

## Component Props

```typescript
interface DischargeSummaryViewerProps {
  summary: {
    id: string;
    created_at: string;
    content: string;
    case_id?: string;
  };
  showActions?: boolean;
  searchable?: boolean;
}
```

## Content Structure

- Patient/Owner information
- Diagnosis section
- Medications (highlighted as badges/pills)
- Instructions (numbered/bulleted lists)
- Warning signs (colored callout boxes)
- Follow-up information
- Contact information

## Content Parsing

Parse discharge summary content to extract:

- Medications (for badge highlighting)
- Warning signs (for callout boxes)
- Instructions (for list formatting)
- Sections (for headers)

## Styling

- Clean white background
- Professional document typography
- Teal accents for highlights
- Proper spacing and hierarchy
- Print-friendly styles

## Features

1. Structured sections with headers
2. Highlighted medications in badges
3. Warning signs in colored callout boxes
4. Formatted instruction lists
5. Search functionality
6. Copy/Print/Export actions
