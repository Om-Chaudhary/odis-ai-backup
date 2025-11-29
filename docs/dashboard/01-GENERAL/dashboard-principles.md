# Dashboard Design Principles

> **Foundation:** Core principles guiding all dashboard design decisions

## 🎯 Core Principles

### 1. Actionable Metrics Over Raw Counts

**Principle:** Every metric should drive a decision or action.

✅ **Good:**

- "183 cases need discharge summaries this week"
- "Completion rate: 85% (↑ 5% from last week)"
- "12 cases pending review"

❌ **Avoid:**

- "Total Cases: 1,234" (without context)
- "Discharge Summaries: 487" (without actionable insight)
- "SOAP Notes: 892" (static count)

**Implementation:**

- Include trends (↑↓ indicators)
- Show gaps (what's missing)
- Highlight priorities (what needs attention)

### 2. Progressive Disclosure

**Principle:** Show the right amount of information at the right time.

**Hierarchy:**

1. **Above the Fold:** Critical metrics and actions
2. **Immediate Scroll:** Secondary metrics and summaries
3. **Below the Fold:** Details, history, and supporting data

**Patterns:**

- Collapsible sections for detailed views
- "Show More" for long lists
- Modal dialogs for deep dives
- Tabs for distinct content categories

### 3. Visual Hierarchy

**Principle:** Guide the eye to what matters most.

**Techniques:**

- **Size:** Larger = more important
- **Color:** Bright/teal = primary action, muted = secondary
- **Position:** Top-left = first read, bottom-right = last read
- **Contrast:** High contrast = attention required
- **White Space:** More space = more important

**Layout Grid:**

```
┌─────────────────────────────────────────┐
│ PRIMARY METRICS (Above Fold)            │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ KPI │ │ KPI │ │ KPI │ │ KPI │        │
│ └─────┘ └─────┘ └─────┘ └─────┘        │
│                                          │
│ ACTION ITEMS                             │
│ ┌─────────────────────────────────────┐ │
│ │ Cases Needing Attention             │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ TRENDS / CHARTS                          │
│ ┌─────────────────────────────────────┐ │
│ │ Weekly Activity Chart               │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ DETAILS (Below Fold)                     │
│ ┌──────────┐ ┌──────────────────────┐  │
│ │ Recent   │ │ Activity Timeline    │  │
│ │ Cases    │ │ (Condensed)          │  │
│ └──────────┘ └──────────────────────┘  │
└─────────────────────────────────────────┘
```

### 4. Consistency Across Tabs

**Principle:** Same patterns, same components, same behavior.

**Standardized:**

- Date filter placement and style
- Search bar placement and behavior
- Card styling and spacing
- Button styles and placements
- Loading states and skeletons
- Empty states and error messages

**Component Reuse:**

- Use shared components (don't reinvent)
- Follow established patterns
- Maintain visual consistency

### 5. Performance & Responsiveness

**Principle:** Fast, smooth, and responsive to user actions.

**Targets:**

- Initial load: < 2 seconds
- Interaction response: < 100ms
- Smooth animations: 60fps
- Progressive loading: Show content as available

**Techniques:**

- Optimistic updates
- Skeleton loading states
- Debounced search/filters
- Pagination for large lists
- Lazy loading for below-fold content

### 6. Workflow Optimization

**Principle:** Minimize clicks and maximize efficiency.

**Strategies:**

- **Single-click actions:** Replace dropdowns with button groups
- **Smart defaults:** Remember user preferences
- **Contextual actions:** Show relevant actions nearby
- **Keyboard shortcuts:** Power user efficiency
- **Bulk operations:** Handle multiple items at once

### 7. Clear Visual Feedback

**Principle:** Users should always know what's happening.

**Feedback Types:**

- **Loading:** Skeleton screens, spinners
- **Success:** Toast notifications, checkmarks
- **Errors:** Inline errors, toast warnings
- **Progress:** Progress bars, step indicators
- **Status:** Badges, icons, color coding

### 8. Accessibility First

**Principle:** Dashboard should work for everyone.

**Requirements:**

- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (ARIA labels)
- High contrast text (WCAG AA)
- Focus indicators visible
- Color not the only indicator

## 📐 Layout Principles

### Grid System

**Base Unit:** 4px (all spacing multiples of 4)

**Breakpoints:**

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Columns:**

- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

### Spacing Scale

```css
/* Spacing scale (Tailwind) */
0    = 0px
1    = 4px
2    = 8px
3    = 12px
4    = 16px
6    = 24px
8    = 32px
12   = 48px
16   = 64px
```

**Card Spacing:**

- Between cards: `gap-4` (16px)
- Card padding: `p-6` (24px)
- Card margins: `mb-6` (24px)

### Typography Scale

```
H1: 2xl (24px) - Page titles
H2: xl (20px) - Section titles
H3: lg (18px) - Card titles
Body: base (16px) - Content
Small: sm (14px) - Subtitles
XS: xs (12px) - Labels, timestamps
```

## 🎨 Color Usage

### Primary Actions

- **Teal (#31aba3):** Primary buttons, active states, links
- **Teal hover:** Darker shade (#2a9a92)

### Status Colors

- **Success (Green):** Completed tasks, positive trends
- **Warning (Amber):** Needs attention, pending items
- **Error (Red):** Failures, critical issues
- **Info (Blue):** Neutral information

### Neutral Colors

- **Slate-900:** Primary text
- **Slate-600:** Secondary text
- **Slate-400:** Tertiary text, disabled
- **Slate-100:** Borders, dividers
- **White:** Backgrounds, cards

## 🔄 Interaction Patterns

### Hover States

- Subtle scale (1.01x)
- Shadow increase
- Color transition (100ms)

### Click Actions

- Visual feedback (button press)
- Immediate response (< 50ms)
- Loading state if async

### Transitions

- **Fast:** 100ms (hover, active)
- **Standard:** 200ms (card transitions)
- **Slow:** 300ms (page transitions)

### Animations

- **Entrance:** Fade in + slide up
- **Exit:** Fade out + slide down
- **Stagger:** 50-100ms delays for lists

## 📱 Responsive Behavior

### Mobile (< 640px)

- Stack cards vertically
- Full-width filters
- Bottom sheet modals
- Simplified navigation

### Tablet (640px - 1024px)

- 2-column grids
- Collapsible sidebar
- Touch-friendly targets (44px min)

### Desktop (> 1024px)

- 3-4 column grids
- Sidebar always visible
- Hover states enabled
- Keyboard shortcuts

## ✅ Checklist for New Components

When creating a new dashboard component, ensure:

- [ ] Uses standardized spacing (4px multiples)
- [ ] Follows color palette
- [ ] Implements hover states
- [ ] Has loading state
- [ ] Has empty state
- [ ] Has error state
- [ ] Is keyboard accessible
- [ ] Is responsive (mobile/tablet/desktop)
- [ ] Uses consistent typography
- [ ] Matches existing card styling
- [ ] Includes smooth transitions

---

**Reference:** These principles guide all dashboard design decisions. When in doubt, prioritize clarity, consistency, and user efficiency.
