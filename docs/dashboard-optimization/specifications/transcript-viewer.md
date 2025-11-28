# Transcript Viewer - Specification

## Overview

Conversation-style transcript viewer with speaker identification, timestamps, and search functionality.

## Visual Design - Simple Transcript

```
┌─────────────────────────────────────────┐
│ Transcript            Case: Max         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Veterinarian ────────────────────┐  │
│ │ [Avatar: V]                       │  │
│ │ Hello, how can I help you today?  │  │
│ │ 10:30 AM                          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌─ Pet Owner ───────────────────────┐  │
│ │ [Avatar: O]                       │  │
│ │ My pet has been acting strange... │  │
│ │ 10:31 AM                          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [Search: __] [Export] [Copy]           │
└─────────────────────────────────────────┘
```

## Visual Design - Speaker Segments

```
┌─────────────────────────────────────────┐
│ Transcript with Speaker Segmentation    │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Veterinarian ────────────────────┐  │
│ │ [00:00] Hello, how can I help...  │  │
│ │ [00:15] Let me examine your pet...│  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌─ Pet Owner ───────────────────────┐  │
│ │ [00:30] She's been lethargic...   │  │
│ │ [00:45] Should I be worried?      │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Component Props

```typescript
interface TranscriptViewerProps {
  transcript: {
    id: string;
    created_at: string;
    transcript: string;
    speaker_segments?: Array<{
      start_time: number;
      end_time: number;
      speaker_id: string;
      text: string;
    }>;
  };
  showActions?: boolean;
  searchable?: boolean;
}
```

## Message Bubble Design

### Veterinarian/Doctor

- Background: `bg-teal-50`
- Border: `border-teal-200`
- Avatar: Teal background with "V" or icon
- Text: Slate-900

### Pet Owner/Client

- Background: `bg-slate-50`
- Border: `border-slate-200`
- Avatar: Slate background with "O" or icon
- Text: Slate-900

### Timestamps

- Muted text: `text-slate-500`
- Small font size
- Positioned at bottom right of message

## Features

1. Conversation-style bubbles
2. Speaker identification with avatars
3. Timestamps for each message
4. Search with highlights
5. Export to text/PDF
6. Copy functionality
7. Support for speaker segments (if available)

## Search Functionality

- Search input in header/action bar
- Highlight matching text in messages
- Scroll to first match
- Next/Previous match navigation (optional)
