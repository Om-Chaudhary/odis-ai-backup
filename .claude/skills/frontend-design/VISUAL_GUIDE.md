# Visual Design Guide - Inbound Call Detail

## Color Palette

### Primary: Teal (Medical/Clinical)
```
Teal-50:  #f0fdfa  ░░░░░░░░ (Light backgrounds)
Teal-500: #14b8a6  ████████ (AI avatars, primary actions)
Teal-600: #0d9488  ████████ (Gradients, hover states)
Teal-950: #042f2e  ████████ (Dark backgrounds)
```

### Accent: Amber (Warm/Human)
```
Amber-50:  #fffbeb  ░░░░░░░░ (Light backgrounds)
Amber-500: #f59e0b  ████████ (User avatars, enhanced badge)
Amber-600: #d97706  ████████ (Gradients, hover states)
```

### Neutral: Slate (Base)
```
Slate-50:  #f8fafc  ░░░░░░░░
Slate-100: #f1f5f9  ░░░░░░░░
Slate-200: #e2e8f0  ░░░░░░░░
Slate-400: #94a3b8  ████████
Slate-500: #64748b  ████████
Slate-600: #475569  ████████
Slate-700: #334155  ████████
Slate-800: #1e293b  ████████
Slate-900: #0f172a  ████████
```

## Typography Scale

### Headings
```
Tab Labels:       14px  font-medium  tracking-tight
Section Headings: 13px  font-semibold tracking-tight
Card Titles:      14px  font-semibold tracking-tight
```

### Body Text
```
Message Bubbles:  13px  font-regular  line-height: 1.5
Summary Text:     14px  font-regular  line-height: 1.6
Helper Text:      12px  font-regular  text-slate-500
Metadata:         12px  font-regular  tabular-nums
```

### Font Stack
```
Primary:  'IBM Plex Sans', system-ui, sans-serif
Monospace: 'IBM Plex Mono', ui-monospace, monospace
```

## Component Anatomy

### Tab Navigation
```
┌──────────────────────────────────────────┐
│  ┌────────┐  ┌────────┐                  │
│  │ 📞 Call │  │ 📝 Summary               │  ← TabsList (slate-100/60 bg)
│  └────────┘  └────────┘                  │     1px padding, gap-1
└──────────────────────────────────────────┘

Active Tab:
- bg-white (dark: slate-700)
- shadow-sm
- ring-1 ring-slate-200/60
- text-slate-900 (dark: slate-100)

Inactive Tab:
- No background
- text-slate-600 (dark: slate-400)
- hover:text-slate-900
```

### Message Bubble (AI)
```
┌──────────────────────────────────────┐
│  ◉ ┌────────────────────────────┐   │
│    │ Message text here...       │   │
│    │ Line 2...                  │   │
│    └────────────────────────────┘   │
└──────────────────────────────────────┘

◉ Avatar:
  - 32px circle
  - bg-gradient-to-br from-teal-500 to-teal-600
  - Bot icon (white, 16px, strokeWidth=2)
  - ring-2 ring-white/50
  - shadow-md shadow-teal-500/25

Bubble:
  - rounded-2xl rounded-tl-md (small top-left)
  - bg-teal-500/8 (light mode)
  - bg-teal-500/12 (dark mode)
  - hover:bg-teal-500/12 (light mode)
  - px-3.5 py-2.5
  - max-w-[80%]
```

### Message Bubble (User)
```
┌──────────────────────────────────────┐
│   ┌────────────────────────────┐ ◉  │
│   │ Message text here...       │    │
│   │ Line 2...                  │    │
│   └────────────────────────────┘    │
└──────────────────────────────────────┘

◉ Avatar:
  - 32px circle
  - bg-gradient-to-br from-amber-500 to-amber-600
  - User icon (white, 16px, strokeWidth=2)
  - ring-2 ring-white/50
  - shadow-md shadow-amber-500/25

Bubble:
  - rounded-2xl rounded-tr-md (small top-right)
  - bg-amber-500/8 (light mode)
  - bg-amber-500/12 (dark mode)
  - hover:bg-amber-500/12 (light mode)
  - px-3.5 py-2.5
  - max-w-[80%]
  - Aligned to right
```

### Transcript Header
```
┌──────────────────────────────────────────────────────┐
│  ┌─┐  Call Transcript  20 messages                   │
│  │🗨│                                                  │  ← Left side
│  └─┘                                                  │
│                     [✨ Enhanced] [📋 Copy]           │  ← Right side
└──────────────────────────────────────────────────────┘

Icon Badge:
  - 28px square (7x7 grid)
  - rounded-lg
  - bg-gradient-to-br from-teal-500/15 to-teal-600/10
  - ring-1 ring-teal-500/20
  - MessageSquare icon (14px, teal-600)

Enhanced Button (when active):
  - bg-amber-500/10
  - text-amber-700
  - hover:bg-amber-500/20

Copy Button:
  - text-slate-500
  - hover:bg-slate-100
```

### Glassmorphic Background Pattern

#### Light Mode
```css
background: linear-gradient(
  to bottom right,
  rgba(248, 250, 252, 0.9),  /* slate-50/90 */
  rgba(255, 255, 255, 0.8),   /* white/80 */
  rgba(240, 253, 250, 0.4)    /* teal-50/40 */
);
border: 1px solid rgba(226, 232, 240, 0.6); /* slate-200/60 */
```

#### Dark Mode
```css
background: linear-gradient(
  to bottom right,
  rgba(15, 23, 42, 0.9),     /* slate-900/90 */
  rgba(30, 41, 59, 0.8),     /* slate-800/80 */
  rgba(4, 47, 46, 0.4)       /* teal-950/40 */
);
border: 1px solid rgba(51, 65, 85, 0.6); /* slate-700/60 */
```

## Spacing Scale

```
Component Gaps:       gap-3 (12px), gap-4 (16px)
Card Padding:         p-4 (16px), p-5 (20px)
Tab List Padding:     p-1 (4px)
Tab Trigger Padding:  px-4 py-2 (16px, 8px)
Message Spacing:      space-y-3 (12px between messages)
Section Spacing:      space-y-4 (16px between sections)
```

## Border Radius

```
Small elements:   rounded-lg (8px)
Medium elements:  rounded-xl (12px)
Large elements:   rounded-2xl (16px)
Avatars:          rounded-full
Tab triggers:     rounded-lg (8px)
Message bubbles:  rounded-2xl + rounded-tl-md or rounded-tr-md
```

## Shadows

```
Subtle lift:   shadow-sm
Cards:         shadow-md
Avatar glow:   shadow-md shadow-{color}-500/25
Active tab:    shadow-sm
```

## Animation Timing

```
Fast:          duration-150 (hover states, quick feedback)
Standard:      duration-200 (tab switches, button interactions)
Slow:          duration-300 (entrance animations, complex transitions)

Stagger:       0.02s per item (message reveals)
Max stagger:   0.4s (prevents long waits)
Entrance:      y: 8px (subtle upward movement)
```

## Icon Sizes

```
Tab icons:        16px (4x4 grid)
Avatar icons:     16px (4x4 grid)
Badge icons:      14px (3.5x3.5 grid)
Large icons:      40px (10x10 grid - empty states)
```

## Z-Index Layers

```
Base:             z-0
Background:       z-0 (absolute positioned)
Content:          z-10 (relative positioned)
Header/Toolbar:   z-10
Overlays:         z-20
Tooltips:         z-30
```

## Accessibility

### Color Contrast Ratios
```
Body text (slate-700):       ≥ 7:1 (AAA)
Secondary text (slate-500):  ≥ 4.5:1 (AA)
Interactive elements:        ≥ 4.5:1 (AA)
```

### Interactive States
```
Default:  Base colors
Hover:    Subtle background change, text darkens
Focus:    Ring outline (ring-2 ring-offset-2)
Active:   Distinct background + shadow + ring
Disabled: 50% opacity + cursor-not-allowed
```

### Keyboard Navigation
- All tabs are keyboard accessible
- Tab order follows visual order
- Focus indicators are visible
- Enter/Space activates buttons

## Responsive Breakpoints

```
Mobile:   < 640px
  - Full-width layout
  - Stacked controls

Tablet:   640px - 1024px
  - Comfortable spacing
  - Side-by-side where appropriate

Desktop:  > 1024px
  - Max-width containers
  - Generous spacing
  - Optimal line lengths
```

## Dark Mode Strategy

Every element has explicit dark mode styling:
- Background gradients shift darker
- Ring borders adjust opacity
- Text colors maintain contrast
- Shadows reduce opacity
- No automatic inversions
