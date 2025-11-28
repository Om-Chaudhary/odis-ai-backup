# Assignment A7: Discharge Summary Viewer

> **Status:** Ready for Assignment  
> **Difficulty:** Hard  
> **Dependencies:** None  
> **Estimated Time:** 3-4 days

## Overview

Create a beautiful, document-style viewer for discharge summaries with proper formatting, highlighted medications, warning callouts, and structured sections.

## Files to Create

1. `src/components/dashboard/discharge-summary-viewer.tsx` - Main component
2. `src/lib/utils/discharge-parser.ts` - Content parsing utilities (optional)

## Component Specifications

See: [../specifications/discharge-summary-viewer.md](../specifications/discharge-summary-viewer.md)

## Key Features

1. **Document-Style Layout:**
   - Professional medical document appearance
   - Structured sections with headers
   - Clean typography

2. **Content Highlighting:**
   - Medications in badge/pills
   - Warning signs in colored callout boxes
   - Instructions in formatted lists

3. **Functionality:**
   - Search within document
   - Copy full text
   - Print formatted document
   - Export to PDF (optional)

4. **Content Parsing:**
   - Parse structured content
   - Extract medications
   - Extract warning signs
   - Format instructions as lists

## Visual Design

See: [../specifications/discharge-summary-viewer.md](../specifications/discharge-summary-viewer.md)

## Acceptance Criteria

- [ ] Content renders with proper formatting
- [ ] Medications are highlighted
- [ ] Warning signs in callout boxes
- [ ] Instructions formatted as lists
- [ ] Search functionality works
- [ ] Action buttons function
- [ ] Print styles work
- [ ] Responsive on mobile
- [ ] Handles various content formats

## Testing Checklist

- [ ] Document displays correctly
- [ ] Medications are extracted and highlighted
- [ ] Warnings are in callout boxes
- [ ] Instructions are formatted
- [ ] Search highlights terms
- [ ] Copy works correctly
- [ ] Print styles work
- [ ] Mobile responsive
- [ ] Handles empty content
- [ ] Handles malformed content gracefully

## Related Documentation

- [Discharge Summary Viewer Specification](../specifications/discharge-summary-viewer.md)
- [Medical Record Examples](../design-system/medical-record-examples.md)
- [Data View Patterns](../design-system/data-view-patterns.md)

---

**Ready to Start:** No dependencies, can begin immediately.
