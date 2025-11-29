# SOAP Note Viewer - Specification

## Overview

Beautiful, color-coded viewer for SOAP notes with expandable sections and rich formatting.

## Visual Design

```
┌─────────────────────────────────────────┐
│ SOAP Note #1        Created: Nov 26...  │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Subjective ──────────────────────┐  │
│ │ S [User icon]                     │  │
│ │                                   │  │
│ │ [Content with proper formatting,  │  │
│ │  line breaks, paragraphs]         │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌─ Objective ───────────────────────┐  │
│ │ O [Stethoscope icon]              │  │
│ │ [Content]                         │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌─ Assessment ──────────────────────┐  │
│ │ A [Clipboard icon]                │  │
│ │ [Content]                         │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌─ Plan ────────────────────────────┐  │
│ │ P [CheckCircle icon]              │  │
│ │ [Content]                         │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [Print] [Copy] [Export]                │
└─────────────────────────────────────────┘
```

## Component Props

```typescript
interface SOAPNoteViewerProps {
  notes: Array<{
    id: string;
    created_at: string;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    client_instructions?: string | null;
  }>;
  defaultExpanded?: boolean;
  showActions?: boolean;
}
```

## Section Colors

- **Subjective:** `bg-blue-50` border `border-blue-200`
- **Objective:** `bg-teal-50` border `border-teal-200`
- **Assessment:** `bg-purple-50` border `border-purple-200`
- **Plan:** `bg-emerald-50` border `border-emerald-200`

## Section Icons

- **Subjective:** User icon (from lucide-react)
- **Objective:** Stethoscope icon
- **Assessment:** Clipboard icon
- **Plan:** CheckCircle icon

## Features

1. Color-coded sections with soft backgrounds
2. Section headers with icons and letters (S-O-A-P)
3. Proper text formatting (preserve line breaks, paragraphs)
4. Expandable/collapsible sections per note
5. Action buttons (Print, Copy, Export)
6. Multiple notes support with numbering

## Text Formatting

- Preserve line breaks (`whitespace-pre-wrap`)
- Format paragraphs properly
- Maintain spacing and indentation
