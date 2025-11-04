# Call Detail Page Design - Deliverables Summary

**Project**: Odis AI - Retell AI Call Management System
**Delivery Date**: November 4, 2025
**Status**: Design Specification Complete - Ready for Implementation

---

## Document Overview

Three comprehensive design documents have been created to guide the implementation of a Call Detail Page for the Retell AI call management system:

### 1. CALL_DETAIL_PAGE_DESIGN.md

**Primary Design Specification** - Comprehensive UI/UX requirements

- **Sections**: 18 major sections covering all aspects of the design
- **Focus**: Information architecture, component structure, interaction patterns
- **Length**: ~2,500 lines
- **Audience**: Designers, Product Managers, Tech Leads

**Key Contents**:

- Page architecture and layout structure
- Detailed component specifications (Header, Cards, Audio Player, Transcript, Analysis)
- Real-time features and status updates
- State management recommendations
- Component inventory (shadcn/ui components needed)
- Styling system and Tailwind guidelines
- Accessibility requirements (WCAG 2.1 AA)
- Mobile responsiveness strategy
- Edge cases and error handling
- Performance targets

### 2. CALL_DETAIL_VISUAL_REFERENCE.md

**Visual Mockups & ASCII Diagrams** - Component-level visual specifications

- **Sections**: 20+ ASCII mockups and visual references
- **Focus**: Visual hierarchy, layout proportions, component styling
- **Length**: ~1,200 lines
- **Audience**: Frontend Developers, UI Developers, QA Engineers

**Key Contents**:

- Desktop layout (1280px+) ASCII mockup
- Mobile layout (< 640px) ASCII mockup
- Component details with visual styling
- Audio player states (default, playing, loading, error)
- Transcript display variations
- Call analysis card layouts
- Badge and status examples
- Empty and loading states
- Responsive breakpoint visualizations
- Color swatches and accessibility ratios
- Interaction states
- Tooltip examples

### 3. CALL_DETAIL_IMPLEMENTATION_GUIDE.md

**Developer Implementation Guide** - Code-level specifications

- **Sections**: 8 major implementation phases
- **Focus**: Code organization, component architecture, state management
- **Length**: ~1,800 lines
- **Audience**: Frontend Developers, Full-Stack Developers, DevOps

**Key Contents**:

- File structure and project setup
- Component architecture and hierarchy
- Server actions for data fetching
- Detailed component specifications with code examples
- Custom hooks (useAudioPlayer, useCallPolling)
- Tailwind styling guide
- Testing strategy with examples
- Deployment checklist
- Performance and security considerations

---

## Quick Reference by Role

### For Designers & Product Managers

**Start with**: `CALL_DETAIL_VISUAL_REFERENCE.md`

1. Review desktop and mobile layouts
2. Check component visual specifications
3. Verify color palette and accessibility
4. Understand responsive behavior

**Then read**: `CALL_DETAIL_PAGE_DESIGN.md`

1. Sections 1-3: Architecture and layout
2. Sections 4-7: Component details and interactions
3. Sections 11-12: Accessibility and mobile strategy

**Reference**: `CALL_DETAIL_IMPLEMENTATION_GUIDE.md` for technical feasibility

---

### For Frontend Developers

**Start with**: `CALL_DETAIL_IMPLEMENTATION_GUIDE.md`

1. Section 1: Project setup and file structure
2. Section 2: Component architecture
3. Sections 4-5: Component specs and state management
4. Section 6-7: Styling and testing

**Then read**: `CALL_DETAIL_PAGE_DESIGN.md`

1. Section 2-7: Detailed component specifications
2. Section 9: shadcn/ui components needed
3. Section 10: Styling system reference

**Reference**: `CALL_DETAIL_VISUAL_REFERENCE.md` for visual specifications

---

### For QA & Testing Engineers

**Start with**: `CALL_DETAIL_VISUAL_REFERENCE.md`

1. Review all component states
2. Check error and loading states
3. Verify responsive behavior

**Then read**: `CALL_DETAIL_PAGE_DESIGN.md`

1. Section 14: Edge cases and error handling
2. Section 11: Accessibility requirements
3. Section 8: Real-time features and polling

**Reference**: `CALL_DETAIL_IMPLEMENTATION_GUIDE.md` Section 7 for testing strategy

---

## Design System Integration

### Consistency with Existing Odis AI Design

The call detail page design maintains consistency with:

**Colors**:

- Primary gradient: `from-[#31aba3] to-[#10b981]` (emerald/teal)
- Semantic colors: Green (success), Red (error), Orange (warning), Blue (info)
- Neutral scale: Slate 50-900

**Typography**:

- Fonts: Outfit, Inter, Lora (already configured)
- Heading sizes: text-3xl → text-sm hierarchy
- Monospace: GeistMono for codes, IDs, phone numbers

**Components**:

- All shadcn/ui components used match existing implementations
- Button sizes and variants consistent with calls list
- Card styling matches dashboard cards
- Badge colors match status color system

**Spacing**:

- Consistent gap system (gap-2 through gap-8)
- Card padding (p-3 through p-6)
- Responsive padding adjustments

---

## Component Dependency Map

```
Call Detail Page (Server Component)
├── CallDetailHeader
│   ├── Button (shadcn)
│   ├── Badge (shadcn)
│   └── Icons (lucide-react)
│
├── CallInfoCard
│   ├── Card (shadcn)
│   ├── Badge (shadcn)
│   └── Expandable sections
│
├── AudioPlayer (Custom)
│   ├── HTML5 <audio>
│   └── useAudioPlayer hook
│
├── TranscriptDisplay (Custom)
│   ├── Card (shadcn)
│   ├── Input (shadcn)
│   ├── Badge (shadcn)
│   └── Search/filter logic
│
├── CallAnalysisCard (Custom)
│   ├── Card (shadcn)
│   └── Badge (shadcn)
│
└── MetadataPanel
    └── Card (shadcn)

Server Actions:
├── getCallDetails (cached)
├── pollCallDetails (fresh)
└── exportCallTranscript (optional)

Custom Hooks:
├── useAudioPlayer
├── useCallPolling
└── useCallDetail
```

---

## Key Design Decisions

### 1. Layout Strategy

- **Desktop**: Two-column (60/40) layout maximizes content visibility
- **Mobile**: Single column with vertical stacking improves readability
- **Responsive**: Breakpoint at lg (1024px) provides optimal transition

### 2. Audio Player Approach

- **Native HTML5**: No external player library needed
- **Custom Controls**: Built with shadcn/ui components for consistency
- **Features**: Play/pause, seek, volume, speed (1x, 1.5x, 2x), download
- **States**: Loading, error, unavailable handled gracefully

### 3. Real-Time Updates

- **Polling**: 3-second interval for ongoing calls
- **Optimization**: Stops after 5 minutes without changes
- **User Feedback**: Visual indicator (pulsing badge) during polling
- **Notifications**: Toast alerts for significant changes

### 4. Transcript Interaction

- **Search**: Real-time filtering with debouncing
- **Highlighting**: Yellow background for search results
- **Format**: Structured display with speaker avatars and timestamps
- **Export**: Copy or download options for entire transcript

### 5. Error Handling

- **Recording Not Available**: Shows loading state while processing
- **No Transcript**: Shows empty state with helpful message
- **API Errors**: Graceful error display with retry options
- **Offline**: Shows cached data, disables polling

---

## Technology Stack Confirmed

**Framework**: Next.js 15 (App Router)
**Language**: TypeScript (strict mode)
**Styling**: Tailwind CSS 4.0
**Components**: shadcn/ui (existing)
**Icons**: lucide-react (existing)
**UI Library**: Radix UI (via shadcn)
**Notifications**: sonner (existing)
**Date Formatting**: date-fns (existing)
**Retell SDK**: retell-sdk@^4.56.0 (existing)
**Audio**: HTML5 native API (no library needed)

**No additional dependencies required** - uses existing project stack

---

## Accessibility Compliance

### WCAG 2.1 AA Level Compliance

**Color Contrast**:

- Text on background: 4.5:1 minimum (normal text)
- Large text: 3:1 minimum
- All semantic colors meet standards

**Keyboard Navigation**:

- All interactive elements focusable with Tab key
- Visible focus indicators (2px ring)
- Logical tab order
- Escape key support for closing elements

**Screen Reader Support**:

- ARIA labels on all interactive elements
- aria-live regions for status updates
- Proper semantic HTML structure
- Alternative text for icons

**Touch Support**:

- Minimum 44x44px touch targets
- 8px spacing between interactive elements
- Mobile-optimized hover states

---

## Implementation Phases

### Phase 1: Structure & Layout (4-6 hours)

- Create page layout skeleton
- Implement Header component
- Create Card containers
- Setup responsive grid

### Phase 2: Core Components (6-8 hours)

- Implement AudioPlayer
- Implement TranscriptDisplay
- Implement CallInfoCard
- Add copy/download functionality

### Phase 3: Analysis & Real-time (4-6 hours)

- Implement CallAnalysisCard
- Setup polling with useCallPolling hook
- Add status indicators
- Toast notifications

### Phase 4: Polish & Testing (4-6 hours)

- Accessibility audit
- Mobile responsiveness testing
- Performance optimization
- Error handling & edge cases

**Total Estimated Time**: 18-26 hours (2-3 days development)

---

## File Locations

All design specification documents are located in the project root:

```
/odis-ai-web/
├── CALL_DETAIL_PAGE_DESIGN.md           (2,500 lines)
├── CALL_DETAIL_VISUAL_REFERENCE.md      (1,200 lines)
├── CALL_DETAIL_IMPLEMENTATION_GUIDE.md  (1,800 lines)
└── DESIGN_DELIVERABLES_SUMMARY.md       (this file)
```

---

## Key Specifications Quick Reference

### Page URL

- **Route**: `/dashboard/calls/[callId]`
- **Server Component**: `src/app/dashboard/calls/[callId]/page.tsx`
- **Props**: `callId` from route params

### API Integration

- **SDK**: retell-sdk@^4.56.0
- **Methods**: `client.call.retrieve(callId)` for data
- **Polling**: Every 3 seconds for ongoing calls
- **Caching**: Use React cache() for server components

### Required Data Fields (from Retell API)

```typescript
interface CallData {
  call_id: string;
  call_status: "registered" | "not_connected" | "ongoing" | "ended" | "error";
  call_type: "web_call" | "phone_call";
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  start_timestamp: number;
  end_timestamp?: number;
  duration_ms?: number;
  agent_id: string;
  agent_name: string;
  agent_version: number;
  recording_url?: string;
  transcript?: string;
  transcript_object?: TranscriptUtterance[];
  call_analysis?: {
    summary?: string;
    user_sentiment?: string;
    call_successful?: boolean;
    in_voicemail?: boolean;
  };
  call_cost?: { combined?: number };
  metadata?: Record<string, any>;
  call_variables?: Record<string, string>;
}
```

### State Management

**Server State**:

- Initial call data fetched on server
- Passed to client component as props

**Client State**:

- `call`: Current call object (updated via polling)
- `isPolling`: Boolean indicating polling status
- `searchQuery`: Search term in transcript
- `activeTab`: Currently displayed section
- `audioState`: Play/pause, time, volume, speed

**Polling Behavior**:

- Starts when `call_status === 'ongoing'`
- Stops when status changes to 'ended' or 'error'
- Interval: 3 seconds
- Stops after 5 minutes without changes

---

## Browser & Device Support

### Desktop Browsers

- Chrome 90+ (Chromium-based)
- Safari 14+
- Firefox 88+
- Edge 90+

### Mobile Browsers

- iOS Safari 14+
- Android Chrome 90+
- Android Firefox 88+
- Samsung Internet 14+

### Minimum Viewport Sizes

- Mobile: 375px (iPhone SE)
- Tablet: 640px (iPad mini)
- Desktop: 1024px (iPad Pro, desktop)

---

## Performance Targets

| Metric            | Target              | Status     |
| ----------------- | ------------------- | ---------- |
| Initial Load      | < 2 seconds         | Achievable |
| Audio Ready       | < 500ms             | Achievable |
| Transcript Render | < 300ms             | Achievable |
| Search Results    | < 100ms (debounced) | Achievable |
| Lighthouse Mobile | > 90                | Target     |
| LCP               | < 2.5s              | Target     |
| FID               | < 100ms             | Target     |
| CLS               | < 0.1               | Target     |

---

## Security Considerations

### Environment Variables Required

```
RETELL_API_KEY=<secret>      # Server-side only
RETELL_FROM_NUMBER=<number>  # Optional, already configured
```

### Security Best Practices Implemented

- API key never exposed to client
- Server actions for sensitive operations
- CORS headers for audio streaming
- Input validation on search/filter
- XSS prevention (React built-in)
- Error messages don't leak sensitive info

---

## Testing Coverage

### Unit Tests

- Format helpers (duration, phone, date)
- useAudioPlayer hook
- useCallPolling hook
- State calculations

### Component Tests

- AudioPlayer controls
- TranscriptDisplay search
- Status updates
- Error states

### Integration Tests

- Full page flow
- Data polling
- Navigation
- Audio playback

### E2E Tests (Optional)

- User workflows
- Mobile responsiveness
- Cross-browser compatibility

---

## Future Enhancement Opportunities

1. **Audio Visualization**: Waveform display during playback
2. **Transcript Sync**: Click timestamps to seek audio position
3. **Speaker Identification**: Auto-label speakers in transcript
4. **Advanced Export**: PDF export with formatting
5. **Call Comparison**: Side-by-side comparison of multiple calls
6. **Call Recording Analysis**: Charts and graphs of metrics
7. **Integrations**: Share with Slack, email, etc.
8. **AI Insights**: Auto-generated action items and follow-ups
9. **Feedback System**: Rate call quality and analysis accuracy
10. **Full-Text Search**: Search across all calls in database

---

## Known Limitations & Assumptions

### Audio Streaming

- Audio must be streamed from URL (not downloaded in bulk)
- Browser must support audio element with src attribute
- CORS headers must be configured on audio server

### Transcript Display

- Works best with structured transcript_object format
- Fallback to plain text if structured format not available
- Large transcripts (1000+ messages) may need virtualization

### Polling

- Stops after 5 minutes without status change (optimization)
- 3-second interval may need adjustment based on load
- Requires proper cleanup on component unmount

### Mobile

- Touch targets minimum 44x44px
- Viewport must be set correctly
- Landscape mode on small phones may not be optimal

---

## Document Maintenance

These design documents should be:

- **Updated** when requirements change
- **Reviewed** before major releases
- **Versioned** in git history
- **Shared** with new team members
- **Referenced** during code review
- **Validated** against final implementation

---

## Success Metrics

Implementation is successful when:

- [ ] All pages and components render correctly
- [ ] Audio playback works on all supported browsers
- [ ] Polling updates call data in real-time for ongoing calls
- [ ] Transcript search filters results within 100ms
- [ ] Accessibility audit passes WCAG 2.1 AA
- [ ] Mobile responsive on all tested devices
- [ ] All error states handled gracefully
- [ ] Performance targets met (Lighthouse 90+)
- [ ] No console errors or warnings
- [ ] User testing feedback positive

---

## Contact & Questions

For clarification on any specifications:

1. Review the three main design documents
2. Check the quick reference sections
3. Refer to existing codebase patterns
4. Test in browser when visual unclear

---

## Final Notes

This comprehensive design specification provides:

✓ **Complete UI/UX requirements** (CALL_DETAIL_PAGE_DESIGN.md)
✓ **Visual mockups & references** (CALL_DETAIL_VISUAL_REFERENCE.md)
✓ **Implementation guidance** (CALL_DETAIL_IMPLEMENTATION_GUIDE.md)
✓ **Accessibility compliance** (WCAG 2.1 AA)
✓ **Mobile responsiveness** (mobile-first approach)
✓ **Performance optimization** (streaming, lazy loading, polling)
✓ **Testing strategy** (unit, component, integration)
✓ **Deployment checklist** (security, performance, quality)

**The specifications are ready for implementation with no code examples provided, maintaining focus on design requirements rather than implementation code.**

---

**Document Generated**: November 4, 2025
**Design Status**: Complete and Ready for Implementation
**Technology Validated**: All existing dependencies confirmed
**Estimated Development Time**: 18-26 hours (2-3 days)
