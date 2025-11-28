# Overview Tab Testing

Complete testing guide for the Overview tab.

## Overview Tab Header

### Test Header Section

- Document:
  - Title "Overview" and subtitle text
  - Date filter button group positioning
  - Alignment between title and filters
  - Responsive layout (stacking on mobile)

## Stat Cards Grid

### Test Stat Cards Layout

**With sidebar EXPANDED:**

- Are all 4 cards the same height?
- Is grid spacing consistent?
- Do cards align properly?
- Are card borders and shadows consistent?
- Do hover effects work?
- Are icons properly sized and positioned?
- Are number tickers animating correctly?

**With sidebar COLLAPSED:**

- Do card heights change?
- Do cards maintain equal heights?
- Is grid layout preserved?
- Any visual inconsistencies compared to expanded state?

### Test Individual Stat Cards

**Card 1: "Total Cases"**

- Document:
  - Value display (NumberTicker animation)
  - Trend indicator (up arrow if thisWeek > 0)
  - Subtitle ("+X this week" or "No change this week")
  - Icon (FolderOpen) styling
  - Hover effect

**Card 2: "Missing Discharges"**

- Document:
  - Value display
  - Subtitle ("X total")
  - Icon (AlertCircle) styling
  - Variant styling (warning - amber colors)
  - Click action (should navigate to cases tab with filter)

**Card 3: "SOAP Coverage"**

- Document:
  - Percentage display with "%" suffix
  - Subtitle ("X cases need SOAP")
  - Icon (FileText) styling
  - Variant styling (success if >= 80%, warning otherwise)
  - Click action (should navigate to cases tab with filter)

**Card 4: "Communications"**

- Document:
  - Value display (calls + emails)
  - Subtitle with calls and emails breakdown
  - Icon (Phone) styling
  - NumberTicker animations in subtitle

## Weekly Activity Chart

### Test Chart Display

- Document:
  - Chart renders correctly
  - Y-axis labels (0, 4, 8, 12, 16)
  - X-axis labels (dates)
  - Bar colors (teal for cases, purple for calls)
  - Legend display and positioning
  - Responsive behavior
  - Chart height and width
  - Tooltip on hover (if implemented)

## Cases Needing Attention Card

### Test Card Display

- Document:
  - Card layout and styling
  - "Cases Needing Attention" title
  - Missing discharge count and list
  - Missing SOAP count and list
  - Link buttons to filtered views
  - Empty states
  - Responsive layout

## Recent Cases List

### Test Recent Cases

- Document:
  - Card title "Recent Cases"
  - "View All" button styling and position
  - Case list items (patient name, owner name, status badge, time)
  - Click action (navigates to case detail)
  - Empty state ("No cases yet")
  - Maximum items shown (should be 5)
  - Spacing between items

## Activity Timeline

### Test Timeline Component

- Document:
  - Timeline renders correctly
  - Collapsible functionality (if implemented)
  - Activity items display
  - Time stamps formatting
  - Icons for different activity types
  - Empty states
