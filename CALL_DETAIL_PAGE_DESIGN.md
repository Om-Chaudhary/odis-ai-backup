# Call Detail Page UI - Design Specification

**Project**: Odis AI - Retell AI Call Management System
**Technology Stack**: Next.js 15, TypeScript, Tailwind CSS 4.0, shadcn/ui
**Theme**: Emerald/Teal (from-[#31aba3] to-[#10b981])
**Created**: 2025-11-04

---

## Executive Summary

This design specification provides comprehensive guidelines for implementing a Call Detail Page for the Retell AI call management system. The page displays comprehensive call information including audio playback, transcripts, analysis, and metadata in an accessible, responsive interface consistent with the existing Odis AI design system.

---

## 1. Page Architecture & Layout Structure

### 1.1 Overall Layout Grid

```
┌─────────────────────────────────────────────────────────┐
│  HEADER SECTION                                         │
│  - Back button | Status Badge | Phone | Timestamp      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MAIN CONTENT (2-column layout on desktop)             │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │  LEFT COLUMN         │  │  RIGHT COLUMN            │ │
│  │  (60% width)         │  │  (40% width)             │ │
│  │                      │  │                          │ │
│  │  - Call Info Card    │  │  - Audio Player          │ │
│  │  - Audio Player      │  │  - Analysis Section      │ │
│  │  - Transcript        │  │  - Metadata             │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  FOOTER SECTION (Optional)                              │
│  - Last Updated | Refresh Status | Export Options      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Responsive Breakpoints

- **Mobile (< 640px)**: Single column, stacked sections
- **Tablet (640px - 1024px)**: Single column with wider cards
- **Desktop (> 1024px)**: Two-column layout with fixed proportions
- **Large screens (> 1440px)**: Wider max-width container with expanded spacing

### 1.3 Content Hierarchy

1. **Critical Information** (Header): Call status, phone number, timestamp
2. **Primary Information** (Main cards): Duration, transcript, audio playback
3. **Secondary Information** (Analysis): Sentiment, summary, success metrics
4. **Tertiary Information** (Metadata): Variables, costs, latency metrics

---

## 2. Header Section Design

### 2.1 Header Component Structure

**Layout**: Flex row with three distinct areas

- **Left Area**: Back button + Call identifier
- **Center Area**: Status badge + Phone number
- **Right Area**: Timestamp + Refresh indicator

### 2.2 Back Button

**Component**: Custom back button with icon from lucide-react

```
Icon: ArrowLeft (16px)
States:
  - Default: text-slate-600, hover:text-emerald-600
  - Pressed: scale-95 transition
  - Loading: opacity-50
Accessibility: aria-label="Return to calls list"
Tooltip: "Back to Calls"
```

### 2.3 Status Badge

**Component**: shadcn/ui Badge with custom styling

```
Mapping:
  registered    -> bg-blue-500/10 text-blue-700 border-blue-500/20
  not_connected -> bg-orange-500/10 text-orange-700 border-orange-500/20
  ongoing       -> bg-emerald-500/10 text-emerald-700 border-emerald-500/20
  ended         -> bg-green-500/10 text-green-700 border-green-500/20
  error         -> bg-red-500/10 text-red-700 border-red-500/20

Variant: outline
Size: md (default)
Icon: Optional phone icon before text
Animation:
  - Pulse if ongoing
  - Static otherwise
```

### 2.4 Phone Number Display

**Format**: E.164 to readable (e.g., "+1 (415) 777-4444")

```
Typography:
  - Font: GeistMono (monospace for consistency with calls list)
  - Size: text-lg font-semibold
  - Color: text-slate-900

Label: "Call with" or "Phone Number"
Copy Action: Click to copy phone number
  - Icon: Copy (16px)
  - Feedback: Toast "Copied to clipboard"
  - Animation: Brief visual feedback on button
```

### 2.5 Call Timestamp

**Display**: Human-readable format with relative time

```
Primary: "Nov 4, 2025 at 2:30 PM"
Secondary: "2 hours ago" (relative time)
Tooltip: Full ISO timestamp for detail

Icon: Calendar (16px) before timestamp
Color: text-slate-600
Size: text-sm
```

### 2.6 Refresh/Status Indicator

**Location**: Right side of header

```
Display When Ongoing:
  - Icon: RefreshCw (16px)
  - Animation: Rotating while call is active
  - Text: "Live" with pulsing green dot
  - Auto-refresh every 3 seconds

Display When Ended:
  - Icon: Check (16px, green)
  - Text: "Completed" or status
  - No animation

Display When Pending:
  - Icon: Clock (16px)
  - Text: "Awaiting recording"
  - Subtle pulse animation
```

---

## 3. Call Information Card

### 3.1 Card Component Structure

**Component**: shadcn/ui Card with emerald/teal theme accent

```
Container:
  - border-slate-200/60
  - bg-white/90
  - shadow-xl
  - backdrop-blur-md
  - overflow-hidden

Header:
  - bg-gradient-to-r from-emerald-50/80 to-teal-50/50
  - border-b border-slate-200/60
  - padding: p-4
```

### 3.2 Information Grid

**Layout**: 2x2 grid on desktop, 1 column on mobile

**Row 1: Duration & Agent**

```
Duration:
  - Label: "Call Duration"
  - Icon: Clock (16px, emerald-600)
  - Value: "2 minutes 34 seconds" (formatted)
  - Format: MM:SS
  - Color: text-slate-900 font-semibold

Agent ID:
  - Label: "Agent"
  - Icon: Bot (16px, emerald-600)
  - Value: Agent ID (e.g., "agent_abc123")
  - Action: Click to copy
  - Color: text-slate-600
```

**Row 2: Direction & From/To**

```
Call Direction:
  - Label: "Direction"
  - Icon: PhoneIncoming or PhoneOutgoing (16px)
  - Value: "Inbound" or "Outbound"
  - Badge styling based on direction

From/To Numbers:
  - Label: "From" / "To"
  - Icon: Phone (16px)
  - Value: Formatted phone number
  - Copy action on click
```

### 3.3 Call Variables Section

**Display**: Collapsible accordion-style section

```
Header:
  - Title: "Call Variables"
  - Count: "(5 variables)"
  - Icon: ChevronDown (expandable)

Content (when expanded):
  - List format or grid (max 2 columns)
  - Each variable:
    * Key: font-medium text-slate-700
    * Value: font-mono text-slate-600
    * Action: Copy value button
    * Separator: border-b or spacing

Empty State:
  - Icon: Info (16px)
  - Text: "No variables for this call"
  - Color: text-slate-500

Styling:
  - bg-slate-50/50
  - border border-slate-200/50
  - rounded-lg
  - p-3
  - gap-3 (between items)
```

### 3.4 Metadata Section

**Display**: Collapsible section below variables

```
Content:
  - Call ID: Full Retell call ID (copiable)
  - Disconnect Reason: Reason if applicable
  - Cost: Total call cost in cents (if available)
  - Created At: Full timestamp
  - Updated At: Full timestamp

Layout: 2 columns on desktop, 1 on mobile
Styling: Same as Call Variables section
Font Size: text-xs to text-sm
```

---

## 4. Audio Playback Section

### 4.1 Audio Player Component Architecture

**Component Type**: Custom component combining:

- HTML5 `<audio>` element (hidden)
- Custom control UI using shadcn/ui + Tailwind
- State management via React hooks

### 4.2 Player Container

```
Container:
  - bg-gradient-to-br from-emerald-50 to-teal-50/30
  - border border-emerald-200/50
  - rounded-xl (rounded-[12px])
  - p-4 or p-6
  - shadow-md
  - Card wrapper

Layout: Flex column with consistent spacing (gap-4)
```

### 4.3 Player Controls Layout

**Row 1: Play/Pause + Progress Bar**

```
Play Button:
  - Shape: Circular (h-12 w-12)
  - Icon: Play (24px) or Pause (24px)
  - Color: bg-gradient-to-r from-[#31aba3] to-[#10b981]
  - Hover: scale-110 transition-transform
  - Active State: Different shade or icon
  - Disabled: opacity-50, cursor-not-allowed
  - Aria Label: "Play recording" or "Pause recording"

Progress Bar:
  - Type: Horizontal slider using range input or custom
  - Container: flex-1 (takes remaining space)
  - Height: h-1.5
  - Background: bg-slate-300/50
  - Progress: bg-gradient-to-r from-[#31aba3] to-[#10b981]
  - Thumb: w-4 h-4 rounded-full bg-white shadow-lg
  - Cursor: cursor-pointer
  - Hover: scale-y-150 transition-transform
  - Aria Label: "Seek to time"

Layout: flex items-center gap-4
Stretch: progress bar takes flex-1
```

**Row 2: Time Display + Controls**

```
Left Side (Time Display):
  Current Time / Total Duration
  - Format: "0:45 / 3:20"
  - Font: font-mono text-sm text-slate-600
  - Tooltip: "Elapsed time / Total duration"

Right Side (Controls):
  Volume Control:
    - Icon: Volume2 (20px)
    - Control: Small horizontal slider
    - Width: w-20
    - Range: 0-100%
    - Default: 100%
    - Tooltip: "Volume"

  Playback Speed:
    - Icon: Zap (20px)
    - Type: Dropdown button (Menu component)
    - Options: 1x, 1.5x, 2x
    - Active: bold font weight
    - Tooltip: "Playback speed"

  Download Button:
    - Icon: Download (20px)
    - Text: "Download" (visible on desktop)
    - Button variant: outline or ghost
    - Disabled if no recording URL
    - Loading state: Spinner animation
    - Tooltip: "Download recording"

  More Actions (if needed):
    - Icon: MoreVertical (20px)
    - Type: Dropdown menu
    - Actions: Share, Analyze, Delete

Layout: flex items-center justify-between gap-2
Responsive: Hide labels on mobile, show only icons
```

### 4.4 Loading & Error States

**Loading State (Recording in Progress)**

```
Display:
  - Center the play button area
  - Replace play icon with Loader2 (spinning)
  - Disable all controls (opacity-50)
  - Message below: "Recording in progress... Check back shortly"
  - Icon: Loader2 (24px, emerald-600, animate-spin)

Styling:
  - bg-emerald-50/50
  - border border-emerald-200
  - min-h-[200px]
  - flex flex-col items-center justify-center gap-3
```

**Not Available State**

```
Display:
  - Disabled play button (opacity-50, cursor-not-allowed)
  - Message: "Recording not yet available"
  - Secondary text: "Check back in a few moments"
  - Icon: AlertCircle (24px, orange-500)

Styling:
  - bg-orange-50/50
  - border border-orange-200
  - All controls disabled (opacity-50)
```

**Error State**

```
Display:
  - Error icon: AlertTriangle (24px, red-500)
  - Message: "Unable to load recording"
  - Secondary text: Error details or "Please try again"
  - Retry Button: "Try Again"

Styling:
  - bg-red-50/50
  - border border-red-200
  - Text color: text-red-700
```

### 4.5 Audio Element & Streaming

**Implementation Notes**:

```typescript
// HTML Structure
<div className="audio-player-container">
  <audio
    ref={audioRef}
    src={recordingUrl}
    preload="metadata"
    crossOrigin="anonymous"
  />
  {/* Custom UI controls */}
</div>

// Event Handling
- audioRef.ontimeupdate -> Update current time display
- audioRef.onloadedmetadata -> Get duration
- audioRef.onplaying -> Update button state to pause icon
- audioRef.onpause -> Update button state to play icon
- audioRef.onended -> Reset to start, show completion state
- audioRef.onerror -> Show error state with retry

// State Management (via useState hooks)
- isPlaying: boolean
- currentTime: number (in seconds)
- duration: number (in seconds)
- volume: number (0-100)
- playbackSpeed: 1 | 1.5 | 2
- isLoading: boolean
- error: string | null
```

### 4.6 Responsive Behavior

```
Mobile (< 640px):
  - Full width player
  - Single column layout for all controls
  - Hide labels, show only icons
  - Larger touch targets (h-12 buttons)
  - Stacked volume/speed/download controls

Tablet (640px - 1024px):
  - Two-row layout
  - Icon buttons with labels
  - Horizontal spacing for secondary controls

Desktop (> 1024px):
  - Full two-row layout as specified
  - Visible labels on all buttons
  - Compact spacing
```

---

## 5. Transcript Section

### 5.1 Transcript Container

**Component Structure**: Card with embedded content

```
Container:
  - border-slate-200/60
  - bg-white/90
  - shadow-xl
  - backdrop-blur-md

Header:
  - bg-gradient-to-r from-emerald-50/80 to-teal-50/50
  - border-b border-slate-200/60
  - Title: "Call Transcript"
  - Message count: "(8 messages)"
  - Icon: MessageSquare (20px, emerald-600)

Content Area:
  - max-h-[500px] on desktop (scrollable)
  - Full height on mobile
  - overflow-y-auto with custom scrollbar
```

### 5.2 Transcript Interaction Bar

**Location**: Above transcript content, below header

```
Layout: flex items-center justify-between gap-3
Padding: p-3, border-b border-slate-200/40

Left Side (Search):
  - Icon: Search (16px)
  - Input field: placeholder="Search transcript..."
  - Debounce: 300ms
  - Case insensitive
  - Highlight matches with yellow background
  - Clear button (X icon)

Right Side (Actions):
  - Copy Button: Icon + Text "Copy"
    * Copies entire transcript as text
    * Feedback: Toast "Copied to clipboard"
    * Tooltip: "Copy full transcript"

  - Download Button: Icon + Text "Download"
    * Format options: TXT, PDF, JSON
    * Dropdown menu for format selection
    * Tooltip: "Download transcript"

  - Filter Button (optional): Icon + Dropdown
    * Filter by speaker: All / User / Agent
    * Tooltip: "Filter messages"
```

### 5.3 Transcript Message Display

**Message Container Structure**:

```
Each Message Item:
  - Flex row with vertical alignment
  - Gap: gap-3
  - Padding: px-4 py-3
  - Border: border-b border-slate-200/40 (last item: no border)
  - Hover: bg-slate-50/50 (light interaction feedback)
  - Transition: transition-colors duration-200
```

**Speaker Avatar/Indicator**:

```
Agent Messages (role: 'agent'):
  - Background: bg-emerald-100
  - Icon: Bot (20px, emerald-700)
  - Border: border-l-4 border-emerald-500
  - Label: "Agent" (text-emerald-700, text-xs font-semibold)

User Messages (role: 'user'):
  - Background: bg-slate-100
  - Icon: User (20px, slate-700)
  - Border: border-l-4 border-slate-500
  - Label: "User" (text-slate-700, text-xs font-semibold)

Styling:
  - Square container: h-8 w-8
  - rounded-md
  - flex items-center justify-center
  - Shadow: shadow-sm
```

**Message Content**:

```
Text:
  - Font: Inter (body copy font)
  - Size: text-sm
  - Line height: leading-relaxed
  - Color: text-slate-800
  - Word break: break-words
  - Max width: Flex to container

Timestamp:
  - Position: Right side or below message
  - Format: "12:34 PM" or "0m 45s" (call-relative)
  - Font: text-xs text-slate-500 font-mono
  - Icon: Clock (12px)

Layout Structure:
  Container (flex column gap-1):
    Row 1 (flex items-center gap-2):
      - Speaker indicator
      - Label ("Agent" / "User")
      - Timestamp
    Row 2:
      - Message text (with speaker avatar margin)
```

### 5.4 Empty State

```
Display When No Transcript:
  - Icon: MessageSquare (24px, text-slate-300)
  - Title: "No transcript available"
  - Description: "Transcript will appear once call is complete"
  - Centered in container
  - Min height: min-h-[300px]

Container:
  - bg-slate-50/50
  - border border-dashed border-slate-300
  - rounded-lg
  - flex flex-col items-center justify-center
  - gap-3
```

### 5.5 Transcript Highlighting & Search

**Search Implementation**:

```
When user types search term:
  1. Filter messages containing term (case-insensitive)
  2. Highlight matching text with background color
  3. Scroll to first match
  4. Show results count: "3 of 5 matches"
  5. Show next/previous match buttons

Highlight Styling:
  - bg-yellow-200
  - text-yellow-900
  - rounded-sm
  - px-1

Accessibility:
  - aria-label on search input
  - aria-live region for result count
  - Keyboard: Enter = next match, Shift+Enter = previous
```

---

## 6. Call Analysis Section

### 6.1 Analysis Container

**Component**: shadcn/ui Card with analysis-specific styling

```
Container:
  - bg-gradient-to-br from-emerald-50 to-teal-50/30
  - border border-emerald-200/50
  - rounded-xl
  - p-4 or p-6
  - shadow-md

Header:
  - Icon: TrendingUp (20px, emerald-600)
  - Title: "Call Analysis"
  - Secondary: Optional timestamp of analysis
```

### 6.2 Analysis Metrics

**Layout**: Grid-based for metrics display

```
Grid:
  - 2 columns on desktop
  - 1 column on mobile
  - gap-4

Each Metric Card:
  - bg-white/70
  - border border-slate-200/40
  - rounded-lg
  - p-3
  - hover:bg-white transition
```

### 6.3 Summary Section

**Display**: Text block with formatting

```
Label: "Summary"
Icon: FileText (16px, emerald-600)
Content:
  - Font: text-sm
  - Color: text-slate-700
  - Line height: leading-relaxed
  - Max height: max-h-[200px]
  - Overflow: overflow-y-auto

Container:
  - bg-white/50
  - border border-emerald-200/30
  - rounded-lg
  - p-3
  - italic or regular text

No Summary State:
  - Text: "No summary available"
  - Color: text-slate-500
  - Style: italic
```

### 6.4 Sentiment Indicator

**Display**: Visual sentiment badge + explanation

```
Container: flex items-center gap-3

Badge:
  - Shape: Rounded pill/badge
  - Size: lg
  - Sentiment Mapping:
    * Positive -> bg-green-500/10 text-green-700 border-green-500/20
    * Negative -> bg-red-500/10 text-red-700 border-red-500/20
    * Neutral -> bg-slate-500/10 text-slate-700 border-slate-500/20
    * Unknown -> bg-gray-500/10 text-gray-700 border-gray-500/20

  Icon + Text:
    * Include sentiment icon (SmilePlus for positive, etc.)
    * Text: "Positive sentiment"

Label: "User Sentiment"
Font: text-sm font-medium

Confidence (optional):
  - Percentage: "92% confidence"
  - Small gray text below
  - Tooltip: "AI confidence level"
```

### 6.5 Success Indicator

**Display**: Boolean status with visual feedback

```
Container:
  - flex items-center gap-2

Label: "Call Status"
Badge:
  - Success (true): bg-green-500/10 text-green-700 border-green-500/20
    * Icon: CheckCircle (20px, green-600)
    * Text: "Successful"

  - Failed (false): bg-red-500/10 text-red-700 border-red-500/20
    * Icon: XCircle (20px, red-600)
    * Text: "Not successful"

  - Unknown: bg-slate-500/10 text-slate-700 border-slate-500/20
    * Icon: HelpCircle (20px, slate-600)
    * Text: "Unknown"

Tooltip: "Indicates if call met success criteria"
```

### 6.6 Voicemail Detection

**Display**: Boolean indicator (if present)

```
Label: "Voicemail Detected"
Container: flex items-center gap-2

Icon:
  - Yes: Mailbox (20px, orange-600)
  - No: CheckCircle (20px, green-600)

Badge:
  - Yes: bg-orange-500/10 text-orange-700 border-orange-500/20
    * Text: "Yes - Voicemail left"
  - No: bg-green-500/10 text-green-700 border-green-500/20
    * Text: "No voicemail"

Display: Only if available in data
Hidden if not present
```

### 6.7 Custom Analysis Data

**Display**: If present in API response

```
Container: Expandable section
Header: "Custom Metrics" or "Analysis Details"
Icon: Settings (16px)

Content:
  - Dynamic key-value pairs
  - Format flexibly based on data type
  - Each item:
    * Key: font-medium text-slate-700
    * Value: font-mono text-slate-600
    * Separator or spacing

No Data State: Hidden section
```

### 6.8 Empty Analysis State

```
Display When No Analysis Available:
  - Icon: TrendingUp (24px, text-slate-300)
  - Title: "Analysis not available"
  - Description: "Detailed analysis will appear once call is fully processed"
  - Minimal styling, muted colors
```

---

## 7. Status Updates & Real-Time Features

### 7.1 Live Status Indicator

**Location**: Header (top right) or floating badge

```
Polling Status:
  - Icon: RefreshCw (16px)
  - Animation: Rotating (using animation-spin) when active
  - Text: "Live" or "Updating..."
  - Color: text-emerald-600
  - Pulse: Subtle pulse animation on background

Polling Behavior:
  - Interval: 3 seconds for ongoing calls
  - Stop when: call_status changes to 'ended' or 'error'
  - Indicator disappears when complete

Accessibility:
  - aria-live="polite"
  - aria-label="Call status is being updated"
```

### 7.2 Last Updated Timestamp

**Location**: Footer or bottom of main card

```
Display:
  - Format: "Last updated 2 minutes ago"
  - Relative time using date-fns
  - Updates automatically during polling

Font: text-xs text-slate-500
Icon: Clock (12px)
Position: Flex row with gap-1

Update Frequency:
  - Change every 30 seconds if within 5 minutes
  - Change every minute if older than 5 minutes
  - Stop updating after call ends
```

### 7.3 Auto-Refresh Implementation

**Technical Approach**:

```typescript
// Using React hooks
- useEffect with cleanup
- setInterval for polling
- useCallback for memoized update function
- Consider using TanStack Query (react-query) for caching

Polling Logic:
1. Check if call status is "ongoing"
2. If ongoing: Poll every 3 seconds
3. If ended/error: Stop polling, show final state
4. Display loading indicator during fetch
5. Handle errors gracefully (retry with exponential backoff)

// Optimization:
- Don't refetch entire page, only call details
- Use conditional polling (stop after 5 minutes if not updated)
- Respect API rate limits
- Clear interval on component unmount
```

### 7.4 Status Change Notifications

**Implementation**: Using sonner toast library (already in project)

```
Toast Triggers:
  1. Call status changes
     - Message: "Call status changed to {status}"
     - Icon: CheckCircle or AlertCircle

  2. Recording becomes available
     - Message: "Recording is now available"
     - Icon: Music (20px)
     - Action: "Play" button (optional)

  3. Analysis complete
     - Message: "Analysis is complete"
     - Icon: TrendingUp

  4. Polling error
     - Message: "Failed to update call status"
     - Icon: AlertTriangle
     - Action: "Retry" button

Styling:
  - Success: bg-green-500, text-white
  - Error: bg-red-500, text-white
  - Info: bg-blue-500, text-white
  - Duration: 5 seconds auto-dismiss
```

---

## 8. State Management Recommendations

### 8.1 Data Structure

```typescript
// Call Detail Type
interface CallDetail {
  // Core
  call_id: string;
  call_type: "web_call" | "phone_call";
  call_status: CallStatus;
  direction: "inbound" | "outbound";

  // Timestamps
  start_timestamp: number;
  end_timestamp?: number;
  created_at: string;

  // Contact
  from_number: string;
  to_number: string;
  phone_number_pretty?: string;

  // Agent
  agent_id: string;
  agent_name: string;
  agent_version: number;

  // Duration
  duration_ms?: number;

  // Transcript
  transcript?: string;
  transcript_object?: TranscriptUtterance[];

  // Audio
  recording_url?: string;
  recording_multi_channel_url?: string;

  // Analysis
  call_analysis?: {
    summary?: string;
    user_sentiment?: "Positive" | "Negative" | "Neutral" | "Unknown";
    call_successful?: boolean;
    in_voicemail?: boolean;
    custom_analysis_data?: Record<string, any>;
  };

  // Cost & Metrics
  call_cost?: {
    combined?: number;
  };
  latency?: {
    e2e?: LatencyMetrics;
    llm?: LatencyMetrics;
    tts?: LatencyMetrics;
  };

  // Custom Data
  metadata?: Record<string, any>;
  call_variables?: Record<string, string>;
  collected_dynamic_variables?: Record<string, string>;
  disconnection_reason?: string;
}

interface TranscriptUtterance {
  role: "agent" | "user";
  content: string;
  timestamp?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

interface LatencyMetrics {
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  max?: number;
  min?: number;
}
```

### 8.2 Component State (Page-Level)

```typescript
interface PageState {
  // Data
  call: CallDetail | null;

  // Loading States
  isLoading: boolean;
  isPolling: boolean;
  isRefreshing: boolean;

  // Error Handling
  error: string | null;
  fetchError: string | null;

  // UI States
  activeTab?: "transcript" | "analysis";
  searchQuery: string;
  filteredTranscript: TranscriptUtterance[];

  // Audio Player
  audioLoaded: boolean;
  audioError: string | null;

  // Polling
  shouldPoll: boolean;
  lastPolledAt: Date;
}
```

### 8.3 Hooks Usage

```typescript
// Data Fetching
- useCallback for getCallDetails function
- useEffect for initial load and polling setup
- useEffect for cleanup (clear intervals)

// Component State
- useState for all UI state variables
- useRef for audio element reference
- useRef for polling interval ID

// Context (if needed across component tree)
- Consider CallDetailContext if many child components need data
- Provide call data, loading states, and action functions

// Server Actions (from Retell SDK)
- Call server action to getCallDetails
- Call server action for polling
- Error boundary for error handling
```

### 8.4 State Updates During Polling

```typescript
// Polling Algorithm
1. Start polling if call_status === 'ongoing'
2. Every 3 seconds:
   a. Call getCallDetails server action
   b. Compare with previous state
   c. Update only changed fields
   d. Show toast if significant changes (recording available, etc.)
3. Stop polling when:
   - call_status === 'ended'
   - call_status === 'error'
   - 5 minutes have passed without status change
   - User navigates away

// Optimization
- Memoize expensive computations (transcript search, etc.)
- Use useCallback for event handlers
- Prevent unnecessary re-renders with React.memo for children
```

---

## 9. Component Inventory & shadcn/ui Usage

### 9.1 Required shadcn/ui Components

| Component              | Purpose                             | Customization                   |
| ---------------------- | ----------------------------------- | ------------------------------- |
| **Badge**              | Status badges, sentiment, variables | Color variants, outline variant |
| **Button**             | Back, play, download, copy buttons  | Icon buttons, size variants     |
| **Card**               | Main containers for sections        | Gradient backgrounds, borders   |
| **Dialog** (optional)  | Confirm actions, view details       | Modal for metadata details      |
| **Input**              | Search transcript                   | Custom styling, debouncing      |
| **Select** (optional)  | Playback speed dropdown             | Custom trigger styling          |
| **Tabs** (optional)    | Switch between sections             | If horizontal tabs needed       |
| **Toast**              | Notifications (via sonner)          | Success/error styling           |
| **Tooltip** (optional) | Hover info, explanations            | TailwindCSS implementation      |

### 9.2 Custom Components Needed

```
AudioPlayer.tsx:
  - Custom component wrapping HTML5 audio
  - Manages play/pause, seek, volume, speed
  - Contains player UI

TranscriptDisplay.tsx:
  - Handles transcript rendering
  - Search/filter functionality
  - Message highlighting

CallAnalysisCard.tsx:
  - Displays summary, sentiment, success metrics
  - Conditional rendering based on data
  - Custom metric cards

CallInfoCard.tsx:
  - Shows duration, agent, direction, variables
  - Expandable sections
  - Copy actions

CallDetailHeader.tsx:
  - Back button, status, phone, timestamp
  - Refresh indicator
  - Navigation logic
```

### 9.3 Lucide Icons Used

```
Navigation:
  - ArrowLeft (back button)
  - Phone, PhoneIncoming, PhoneOutgoing
  - Calendar, Clock

Indicators:
  - Check, CheckCircle, XCircle
  - AlertCircle, AlertTriangle
  - HelpCircle
  - Loader2 (spinner)
  - RefreshCw (polling)

Actions:
  - Play, Pause, Copy, Download
  - MoreVertical (menu)
  - Volume2, Zap (volume/speed)
  - Search, X (clear)

Content:
  - MessageSquare (transcript)
  - Bot, User
  - FileText (summary)
  - TrendingUp (analysis)
  - Mailbox (voicemail)
  - Music (audio)

UI Elements:
  - ChevronDown (expandable)
  - Info
  - Settings
  - SmilePlus/SmileMinus (sentiment)
```

---

## 10. Styling System & Tailwind Classes

### 10.1 Color Palette Reference

```
Brand Colors (Emerald/Teal):
  - Primary: from-[#31aba3] to-[#10b981]
  - Light: emerald-50, emerald-100, teal-50
  - Dark: emerald-600, emerald-700

Semantic Colors:
  - Success: green-500, green-600
  - Error: red-500, red-600
  - Warning: orange-500, orange-600
  - Info: blue-500, blue-600
  - Neutral: slate-400, slate-500, slate-600

Backgrounds:
  - Card bg: bg-white/90 (with 90% opacity)
  - Hover: bg-emerald-50/30 or similar with transparency
  - Disabled: opacity-50
  - Backdrop: backdrop-blur-md for glass effect

Borders:
  - Primary: border-slate-200/60 (60% opacity)
  - Secondary: border-slate-200/40
  - Accent: border-emerald-200/50 or border-emerald-500
```

### 10.2 Typography System

```
Headings:
  - h1: text-3xl font-bold tracking-tight
  - h2: text-2xl font-bold
  - h3: text-xl font-semibold
  - h4: text-lg font-semibold

Body Text:
  - Base: text-sm or text-base
  - Emphasized: font-semibold
  - Secondary: text-slate-600 (muted)
  - Code: font-mono (for phone numbers, IDs)

Labels:
  - text-xs font-medium text-slate-700
  - Uppercase: uppercase tracking-wider

Line Heights:
  - Body: leading-relaxed (1.625)
  - Tight: leading-tight (1.25)
  - Normal: leading-normal (1.5)
```

### 10.3 Spacing System

```
Gaps:
  - Sections: gap-6 or gap-8
  - Cards: gap-4
  - Elements: gap-2 or gap-3
  - Tight: gap-1

Padding:
  - Cards: p-4 or p-6
  - Sections: p-3 to p-6
  - Header: p-4 with border-bottom
  - Compact: p-2 or p-3

Margins:
  - Between sections: mb-6 or mb-8
  - Within sections: mb-3 or mb-4
  - Component level: mx-auto, my-auto
```

### 10.4 Shadow & Elevation System

```
Shadows:
  - Cards: shadow-xl
  - Hover states: hover:shadow-2xl
  - Subtle: shadow-md or shadow-sm
  - Glowing: shadow-[0_0_30px_rgba(49,171,163,0.3)]

Borders & Outlines:
  - Card border: border-slate-200/60
  - Focus ring: focus:ring-2 focus:ring-emerald-500
  - Accent: border-l-4 border-emerald-500
```

### 10.5 Animation Classes

```
Transitions:
  - Standard: transition-all duration-200
  - Slower: duration-300 or duration-500
  - Transforms: transition-transform
  - Colors: transition-colors

Animations:
  - Spin: animate-spin (for loading)
  - Pulse: animate-pulse (for live indicator)
  - Bounce: animate-bounce (attention)
  - Gradient move: animate-gradient-move (custom)
  - Float: animate-float-slow (custom from layout)

Hover Effects:
  - Scale: hover:scale-105
  - Background: hover:bg-emerald-50
  - Shadow: hover:shadow-2xl
  - Duration: transition-all duration-200
```

### 10.6 Responsive Classes

```
Mobile First:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

Examples:
  - Hidden on mobile: hidden sm:block
  - Grid layout: grid-cols-1 md:grid-cols-2
  - Padding: p-3 md:p-4 lg:p-6
  - Flex direction: flex-col md:flex-row
```

---

## 11. Accessibility Requirements (WCAG 2.1 AA)

### 11.1 Keyboard Navigation

```
Focusable Elements:
  - Back button
  - Copy buttons
  - Play/pause button
  - Volume slider
  - Speed dropdown
  - Download button
  - Search input
  - All interactive elements

Focus Indicators:
  - Visible ring: focus:ring-2 focus:ring-emerald-500
  - Outline: focus:outline-none (use ring instead)
  - Min size: 2px ring with at least 3px offset

Tab Order:
  - Logical flow: Header -> Audio Player -> Transcript -> Analysis
  - Within sections: Top to bottom, left to right
  - Use tabIndex only if needed

Keyboard Support:
  - Enter: Activate buttons, play/pause
  - Space: Play/pause, toggle sections
  - Arrow keys: Volume (left/right), Speed selection
  - Escape: Close dropdowns, close search
  - Ctrl+F: Browser find (works with transcript)
```

### 11.2 Screen Reader Support

```
ARIA Labels:
  - aria-label for icon-only buttons
  - aria-describedby for complex elements
  - aria-live="polite" for status updates
  - aria-label on audio element
  - aria-label on progress bar
  - aria-label on search input

ARIA Attributes:
  - aria-current="page" for current section
  - aria-expanded="true/false" for accordions
  - aria-selected="true/false" for tabs
  - aria-disabled="true" for disabled elements
  - aria-label="Polite" for toast notifications

Semantic HTML:
  - Use <button> for buttons (not <div>)
  - Use <header>, <main>, <section> tags
  - Use <h1>, <h2> for headings (proper hierarchy)
  - Use <time> for timestamps
  - Use <time datetime="ISO"> for machine-readable dates
  - Form elements with proper <label>
```

### 11.3 Color Contrast

```
Standards (WCAG AA):
  - Normal text: 4.5:1 ratio minimum
  - Large text (18px+): 3:1 ratio minimum

Specific Elements:
  - Text on badge: Ensure 4.5:1 contrast
  - Text on button: Ensure 4.5:1 contrast
  - Icon colors: Ensure 4.5:1 contrast with background

Testing:
  - Use Chrome DevTools contrast checker
  - Check all status states
  - Check light/dark backgrounds
  - Never rely on color alone for information
```

### 11.4 Touch Targets

```
Minimum Size: 48x48px (mobile)
  - Play button: h-12 w-12
  - Copy buttons: h-10 w-10 or larger
  - Icon buttons: At least 44x44px
  - Sliders: At least 44px height

Spacing:
  - Minimum 8px between interactive elements
  - Use gap-2 or gap-3 in layouts
  - Avoid overlap of touch targets

Example:
  - Button: h-10 w-10 (40px, use p-2 with h-6 w-6 icon)
  - Touch: min-h-[48px] min-w-[48px]
```

### 11.5 Motion & Animation

```
Respect Prefers Reduced Motion:
  - CSS: @media (prefers-reduced-motion: reduce)
  - Disable animations if user prefers
  - Keep interactions functional without motion

Safe Animations:
  - Duration: 200-300ms standard
  - Avoid flashing: No more than 3x per second
  - Easing: Use ease-in-out, ease-out

Guidance:
  - Always provide alternative visual feedback
  - Don't auto-play audio
  - Provide pause controls for any animation
```

### 11.6 Form Inputs

```
Search Input:
  - Clear label or aria-label
  - Visible focus indicator
  - Clearable with X button
  - Required: aria-required if needed

Volume/Speed Sliders:
  - Proper <input type="range"> semantics
  - aria-label describing the control
  - aria-valuenow, aria-valuemin, aria-valuemax
  - Keyboard support: arrow keys to adjust

Best Practices:
  - Always have associated label
  - Error messages linked with aria-describedby
  - Use semantic form elements
```

---

## 12. Mobile Responsiveness Strategy

### 12.1 Layout Adjustments

```
Mobile (< 640px):
  - Single column layout
  - Full-width cards with padding
  - Stacked sections (Audio -> Transcript -> Analysis)
  - Hidden labels on buttons (icons only)
  - Larger touch targets
  - Collapsed expandable sections by default

Tablet (640px - 1024px):
  - Single column with wider cards
  - Same section order as mobile
  - Visible labels on buttons
  - Moderate spacing

Desktop (> 1024px):
  - Two-column layout (60/40 split)
  - All features visible
  - Optimal spacing and typography
  - Expanded sections by default
```

### 12.2 Touch Interaction

```
Hover Effects (Desktop Only):
  - Use @media (hover: hover) to detect
  - Show tooltips on hover
  - Only enable hover effects on devices that support it

Touch Feedback (Mobile):
  - Active states: background color change
  - Pressed states: scale-95 transition
  - No hover effects

Scrolling:
  - Vertical scroll for transcript
  - Horizontal scroll for tables (if needed)
  - Smooth scrolling: scroll-smooth
```

### 12.3 Image & Media Optimization

```
Audio Element:
  - preload="metadata" (load duration without audio)
  - Responsive sizing (100% width in container)
  - Adaptive bitrate if multiple formats available

Phone Number Formatting:
  - Responsive: Shows simplified on mobile
  - Example: +1 (415) 777-4444 on desktop
  - Example: +14157774444 on mobile

Icons:
  - Size: h-4 w-4 to h-6 w-6 depending on context
  - Mobile: h-5 w-5 for buttons
  - Desktop: h-4 w-4 for labels
```

### 12.4 Viewport & Device Testing

```
Devices to Test:
  - iPhone SE (375px) - smallest
  - iPhone 14 (390px) - common
  - iPad (768px) - tablet
  - iPad Pro (1024px) - large tablet
  - Desktop 1280px - common desktop
  - Desktop 1920px - large desktop
  - 4K 2560px - ultra-wide

Browser Testing:
  - Chrome/Edge (Chromium)
  - Safari (iOS, macOS)
  - Firefox
  - Samsung Internet (Android)

Performance:
  - Lighthouse mobile score target: 90+
  - Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
```

---

## 13. Implementation Guidance

### 13.1 File Structure

```
src/
├── app/
│   └── dashboard/
│       └── calls/
│           ├── [callId]/
│           │   └── page.tsx          # Main call detail page
│           └── page.tsx              # Calls list (existing)
│
├── components/
│   ├── call-detail/
│   │   ├── CallDetailHeader.tsx      # Header section
│   │   ├── CallInfoCard.tsx          # Call info section
│   │   ├── AudioPlayer.tsx           # Audio player component
│   │   ├── TranscriptDisplay.tsx     # Transcript section
│   │   ├── CallAnalysisCard.tsx      # Analysis section
│   │   └── StatusIndicator.tsx       # Live status indicator
│   │
│   └── ui/
│       └── (existing shadcn components)
│
├── server/
│   └── actions/
│       └── retell.ts                 # Server actions for Retell API
│
├── lib/
│   ├── formatting.ts                 # Format helpers
│   ├── audio.ts                      # Audio utilities
│   └── call-polling.ts               # Polling logic
│
└── types/
    └── call.ts                       # TypeScript types
```

### 13.2 Development Phases

```
Phase 1: Structure & Layout
  - Create page layout skeleton
  - Implement Header component
  - Create Card containers
  - Implement responsive grid
  - Add mock data for development

Phase 2: Core Components
  - Implement AudioPlayer
  - Implement TranscriptDisplay
  - Implement CallInfoCard
  - Add copy/download functionality
  - Style all components

Phase 3: Analysis & Real-time
  - Implement CallAnalysisCard
  - Add polling logic
  - Implement status updates
  - Add toast notifications
  - Implement search/filter

Phase 4: Polish & Testing
  - Accessibility audit (a11y)
  - Mobile responsiveness testing
  - Performance optimization
  - Error handling & edge cases
  - User testing & iteration
```

### 13.3 Testing Strategy

```
Unit Tests:
  - Format helpers (duration, phone, date)
  - State calculations
  - Event handlers

Component Tests:
  - AudioPlayer controls
  - Transcript search
  - Status updates
  - Error states

Integration Tests:
  - Full page flow
  - Data polling
  - Navigation between pages
  - Server action calls

E2E Tests (optional):
  - User workflows
  - Audio playback
  - Navigation
  - Mobile responsiveness
```

### 13.4 Performance Optimization

```
Code Splitting:
  - Lazy load AudioPlayer if needed
  - Consider lazy-loading heavy components

Image/Media:
  - Audio: Stream from URL (don't download fully)
  - Preload metadata only initially

State Management:
  - Use useCallback for expensive functions
  - Memoize components with React.memo
  - Use useRef for DOM references

Rendering:
  - Virtualize long transcript lists (if needed)
  - Debounce search input (300ms)
  - Throttle scroll events

API Calls:
  - Cache call details when possible
  - Revalidate on navigation
  - Stop polling when component unmounts
```

---

## 14. Edge Cases & Error Handling

### 14.1 Offline Handling

```
Display:
  - Show cached data if available
  - Display "Offline" banner
  - Disable refresh/reload buttons
  - Hide polling indicator

Recovery:
  - Show "Retry" button
  - Attempt reconnection periodically
  - Show when back online (toast)
```

### 14.2 Missing Data

```
No Recording URL:
  - "Recording not available" state
  - Loading state: "Recording in progress"
  - Error state: "Recording failed"

No Transcript:
  - Empty state: "Transcript will appear once call is complete"
  - Show transcript loading state while polling

No Analysis:
  - Empty state: "Analysis not available"
  - Show analysis loading state
```

### 14.3 API Errors

```
Timeout:
  - Message: "Request took too long"
  - Offer retry option
  - Stop polling temporarily

Rate Limit (429):
  - Message: "Too many requests"
  - Back off: 30s, 60s, 120s exponential
  - Inform user

Invalid Call ID:
  - Message: "Call not found"
  - Link back to calls list
  - Show 404-style messaging

Authentication Error:
  - Message: "Unable to load call details"
  - Suggest logging in again
  - Redirect to login if needed
```

### 14.4 Audio Errors

```
CORS Issues:
  - Check audio src has proper crossOrigin
  - Handle error gracefully
  - Provide download as fallback

Format Unsupported:
  - Show "Browser doesn't support this audio format"
  - Offer download option
  - Try alternative format if available

Network Issues:
  - Show "Failed to load audio"
  - Retry button
  - Check connection message
```

---

## 15. Accessibility Checklist

- [ ] All buttons have aria-labels
- [ ] Status indicators use aria-live regions
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation fully functional
- [ ] Form inputs have associated labels
- [ ] Semantic HTML used throughout
- [ ] Images/icons have alt text or aria-labels
- [ ] Motion respects prefers-reduced-motion
- [ ] Touch targets at least 44x44px
- [ ] Page tested with screen reader (NVDA, JAWS)
- [ ] Mobile navigation accessible
- [ ] Transcript search accessible
- [ ] Modals/dialogs properly marked
- [ ] Links have sufficient context

---

## 16. Design System Integration Notes

### 16.1 Consistent with Existing Design

```
Colors:
  - Use existing emerald/teal gradient
  - Match badge colors from calls list
  - Match button styling

Typography:
  - Use Outfit, Inter, Lora fonts (already defined)
  - Match heading sizes from existing pages
  - Use same line heights

Spacing:
  - Match spacing system from calls list
  - Use same gap values
  - Consistent padding on cards

Components:
  - Use same shadcn/ui variants
  - Match button sizes
  - Use existing icons from lucide-react
```

### 16.2 Dark Mode (Future Consideration)

```
If dark mode added:
  - Adjust bg colors: white/90 -> slate-900/90
  - Adjust text colors: slate-900 -> white
  - Adjust borders: lighter borders in dark
  - Keep accent colors consistent
  - Test contrast ratios in dark mode
  - Use CSS variables for easy theming
```

---

## 17. Performance Targets

- Initial page load: < 2 seconds
- Audio player ready: < 500ms
- Transcript render: < 300ms
- Search results: < 100ms (debounced)
- Polling interval: 3 seconds (optimized for UX)
- API response time: < 1 second

---

## 18. Future Enhancements

1. **Audio Visualization**: Waveform display for audio playback
2. **Transcript Sync**: Click timestamps to seek audio position
3. **Speaker Identification**: Automatic speaker label in transcript
4. **Call Recording Export**: Multiple format options (MP3, WAV, MP4)
5. **Call Comparison**: Side-by-side comparison of multiple calls
6. **Advanced Analytics**: Charts, graphs of call metrics
7. **Integrations**: Share transcript with other tools
8. **AI-Generated Insights**: Automatic action items, follow-ups
9. **Feedback Loop**: Rate call quality, analysis accuracy
10. **Full-Text Search**: Search across all calls, transcripts

---

## Summary

This comprehensive design specification provides:

1. **Clear component structure** for all page sections
2. **Detailed UI patterns** for common elements
3. **Accessibility guidelines** meeting WCAG 2.1 AA
4. **Responsive design** strategy for all device sizes
5. **State management** recommendations
6. **Implementation guidance** and file structure
7. **Performance** optimization strategies
8. **Error handling** for edge cases
9. **Brand alignment** with existing design system
10. **Testing** and quality assurance checkpoints

The design prioritizes:

- **User Experience**: Clear information hierarchy, smooth interactions
- **Accessibility**: Full keyboard navigation, screen reader support
- **Performance**: Optimized polling, lazy loading, efficient rendering
- **Responsiveness**: Mobile-first approach, all device support
- **Consistency**: Brand alignment, predictable patterns
- **Robustness**: Error handling, edge case management

All recommendations follow Next.js 15, TypeScript, and Tailwind CSS best practices while maintaining consistency with the existing Odis AI design system.
