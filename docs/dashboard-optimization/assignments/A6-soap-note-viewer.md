# Assignment A6: SOAP Note Viewer

> **Status:** Ready for Assignment  
> **Difficulty:** Hard  
> **Dependencies:** None  
> **Estimated Time:** 3-4 days

## Overview

Create a beautiful, modern viewer for SOAP notes that transforms plain text into visually appealing, well-formatted medical records with color-coded sections.

## Files to Create

1. `src/components/dashboard/soap-note-viewer.tsx` - Main component
2. `src/components/dashboard/soap-note-section.tsx` - Individual section component (optional)

## Component Specifications

See: [../specifications/soap-note-viewer.md](../specifications/soap-note-viewer.md)

## Key Features

1. **Color-Coded Sections:**
   - Subjective: Blue background
   - Objective: Teal background
   - Assessment: Purple background
   - Plan: Emerald background

2. **Rich Formatting:**
   - Preserve line breaks and paragraphs
   - Section headers with icons
   - Proper typography and spacing

3. **Expandable Sections:**
   - Default: Latest note expanded
   - Older notes: Collapsed by default
   - Smooth expand/collapse

4. **Action Buttons:**
   - Print
   - Copy
   - Export

## Visual Design

See: [../specifications/soap-note-viewer.md](../specifications/soap-note-viewer.md)

## Acceptance Criteria

- [ ] All sections render correctly
- [ ] Color coding applies properly
- [ ] Text formatting preserves line breaks
- [ ] Expand/collapse works per section
- [ ] Action buttons function
- [ ] Print styles work
- [ ] Responsive on mobile
- [ ] Handles multiple notes
- [ ] Handles missing sections gracefully

## Testing Checklist

- [ ] Single note displays correctly
- [ ] Multiple notes display correctly
- [ ] All section colors are correct
- [ ] Icons display properly
- [ ] Expand/collapse works
- [ ] Print functionality works
- [ ] Copy functionality works
- [ ] Mobile responsive
- [ ] Handles empty sections
- [ ] Handles missing data

## Related Documentation

- [SOAP Note Viewer Specification](../specifications/soap-note-viewer.md)
- [Design System - Color Palette](../design-system/color-palette.md)
- [Data View Patterns](../design-system/data-view-patterns.md)

---

**Ready to Start:** No dependencies, can begin immediately.
