# Dashboard Design System

_Based on Odis AI Landing Page_

## Color Palette

### Primary Brand Color: Odis Teal

- **Main**: `#31aba3` - Primary brand color
  - Usage: Primary buttons, active states, brand accents, icons
  - CSS: `bg-[#31aba3]`, `text-[#31aba3]`, `border-[#31aba3]`
- **Teal Variants**:
  - **Light Background**: `bg-[#31aba3]/10` - Badge backgrounds, icon containers, subtle highlights
  - **Hover State**: `hover:bg-[#31aba3]/5` - Interactive element hovers
  - **Border**: `border-[#31aba3]/20` - Subtle borders for special elements
  - **Ring**: `ring-[#31aba3]/20` - Focus rings

### Neutral Colors (Zinc/Slate)

The landing page uses a mix of zinc and slate. We'll standardize on slate for the dashboard:

- **Text Colors**:
  - **Primary**: `text-slate-900` - Headings, important content
  - **Secondary**: `text-slate-700` - Body text, labels
  - **Tertiary**: `text-slate-600` - Secondary labels, descriptions
  - **Muted**: `text-slate-500` - Timestamps, metadata
  - **Subtle**: `text-slate-400` - Placeholders, disabled text
- **Border Colors**:
  - **Default**: `border-slate-200` - Standard borders
  - **Light**: `border-slate-100` - Card borders, subtle dividers
  - **Subtle**: `border-slate-200/50` - Very subtle dividers
- **Background Colors**:
  - **White**: `bg-white` - Card backgrounds
  - **Subtle**: `bg-slate-50` - Page backgrounds, hover states
  - **Light**: `bg-slate-100` - Badge backgrounds, disabled states
  - **Divider**: `bg-slate-200/50` - Horizontal rules

### Status Colors

- **Draft**: `bg-slate-100 text-slate-700`
- **Ongoing**: `bg-blue-100 text-blue-700`
- **Completed**: `bg-emerald-100 text-emerald-700`
- **Reviewed**: `bg-purple-100 text-purple-700`

### Source Colors

- **Manual**: `bg-slate-100 text-slate-700`
- **IDEXX Neo**: `bg-blue-100 text-blue-700`
- **Cornerstone**: `bg-purple-100 text-purple-700`
- **ezyVet**: `bg-green-100 text-green-700`
- **AVImark**: `bg-orange-100 text-orange-700`

## Typography

_Font Family: Inter (via Tailwind)_

### Headings

- **Page Title (H1)**:
  - Desktop: `text-3xl font-bold tracking-tight text-slate-900`
  - Mobile: `text-2xl font-bold tracking-tight text-slate-900`
  - Usage: Dashboard page titles
- **Section Title (H2)**:
  - `text-2xl font-bold tracking-tight text-slate-900`
  - Usage: Major section headings
- **Card Title (H3)**:
  - `text-lg font-semibold text-slate-900`
  - Usage: Card headers, sub-section titles
- **Small Heading**:
  - `text-base font-semibold text-slate-900`
  - Usage: List item titles

### Body Text

- **Large**: `text-lg text-slate-700` - Subtitles, important descriptions
- **Base**: `text-base text-slate-700` - Standard body text
- **Small**: `text-sm text-slate-600` - Secondary text, labels
- **Extra Small**: `text-xs text-slate-500` - Metadata, timestamps

### Font Weights

- **Bold**: `font-bold` (700) - Page titles only
- **Semibold**: `font-semibold` (600) - Section headings, card titles
- **Medium**: `font-medium` (500) - Badges, buttons, labels
- **Normal**: `font-normal` (400) - Body text

## Spacing System

### Container Spacing

- **Page Wrapper**: `space-y-6`
- **Section Gap**: `gap-6` (between major sections)
- **Card Gap**: `gap-4` (between cards in grid)
- **Element Gap**: `gap-2` or `gap-3` (between related elements)

### Card Padding

- **Standard Card**: `p-6`
- **Compact Card**: `p-4` or `p-5`
- **List Item**: `p-3`

### Layout Grids

- **Stats Cards**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
- **2-Column**: `grid gap-6 lg:grid-cols-2`
- **3-Column**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`

## Components

### Cards

Standard card styling matching landing page aesthetics:

```tsx
// Standard Card
className =
  "rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md";

// Stats Card (with icon)
className = "rounded-xl border border-slate-100 bg-white p-6 shadow-sm";

// List Item Card
className =
  "rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50";
```

### Buttons

Following landing page button styles:

```tsx
// Primary Button (Brand color)
<Button className="bg-[#31aba3] hover:bg-[#2a9a92] text-white">
  Action
</Button>

// Secondary Button
<Button variant="outline" className="border-slate-200 hover:bg-slate-50">
  Action
</Button>

// Ghost Button
<Button variant="ghost" className="hover:bg-slate-50 hover:text-slate-900">
  Action
</Button>

// Small Button
<Button size="sm" className="h-9 px-3">
  Action
</Button>
```

### Badges

Consistent badge styling across all statuses:

```tsx
// Standard Badge (no border)
<Badge className="rounded-md border-0 bg-{color}-100 font-medium text-{color}-700">
  Label
</Badge>

// Outlined Badge (for special cases)
<Badge
  variant="outline"
  className="rounded-md border-{color}-200/50 bg-{color}-50 font-medium text-{color}-700"
>
  Label
</Badge>

// Brand Badge
<Badge className="rounded-full border-0 bg-[#31aba3]/10 font-semibold text-[#31aba3]">
  Label
</Badge>
```

### Inputs & Search

```tsx
// Search Input with Icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  <Input
    className="h-10 rounded-lg border-slate-200 pl-9 focus:border-[#31aba3] focus:ring-[#31aba3]/20"
    placeholder="Search..."
  />
</div>

// Standard Input
<Input className="h-10 rounded-lg border-slate-200 focus:border-[#31aba3] focus:ring-[#31aba3]/20" />
```

### Icons

Icon sizing and coloring standards:

- **Extra Small**: `h-3 w-3` - Inline with text
- **Small**: `h-4 w-4` - Standard UI icons
- **Medium**: `h-5 w-5` - Buttons, larger UI elements
- **Large**: `h-6 w-6` - Stats cards, feature icons

**Colors**:

- **Brand**: `text-[#31aba3]` - Primary actions, active states
- **Neutral Dark**: `text-slate-600` - Standard icons
- **Neutral Light**: `text-slate-400` - Subtle icons, placeholders
- **Status**: Use corresponding status color (e.g., `text-emerald-600` for success)

## Page Structure

### Standard Dashboard Page

```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        Title
      </h2>
      <p className="text-sm text-slate-600">Description</p>
    </div>
    <Button>Action</Button>
  </div>

  {/* Filters (if applicable) */}
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    {/* Search, filters, etc */}
  </div>

  {/* Content */}
  {/* Content goes here */}
</div>
```

## Consistency Rules

### Color Usage

1. **Always use slate for neutral colors** (not gray, not zinc)
2. **Brand color (`#31aba3`) ONLY for**:
   - Primary action buttons
   - Active/selected states
   - Icon backgrounds in brand badges
   - Focus rings
   - Links in specific contexts
3. **Never use brand color for**: Regular text, borders (except focus states), backgrounds (except /10 opacity)

### Component Styling

4. **Card borders**: Always `border-slate-100`
5. **Card shadows**: Always `shadow-sm`, `hover:shadow-md` for interactive cards
6. **Card backgrounds**: Always `bg-white`
7. **Rounded corners**:
   - `rounded-xl` for cards and containers
   - `rounded-lg` for inputs, smaller cards
   - `rounded-md` for badges
   - `rounded-full` for avatars, brand badges

### Typography

8. **Font weights**:
   - `font-bold` (700) - Page titles ONLY
   - `font-semibold` (600) - Section headings, card titles
   - `font-medium` (500) - Badges, button text, form labels
   - `font-normal` (400) - Body text, descriptions

### Interactivity

9. **Transitions**:
   - `transition-colors` for background/text changes
   - `transition-shadow` for shadow changes
   - `transition-all` only when multiple properties change
10. **Hover states**:
    - Cards: `hover:shadow-md` or `hover:bg-slate-50`
    - Buttons: Color darkening
    - Links: `hover:text-[#31aba3]`

### Spacing

11. **Consistent gaps**:
    - Page sections: `space-y-6`
    - Card grids: `gap-4` or `gap-6`
    - Form elements: `gap-3` or `gap-4`
    - Inline elements: `gap-2`
12. **Padding**:
    - Standard cards: `p-6`
    - Compact cards: `p-4` or `p-5`
    - List items: `p-3`

## Common Patterns

### Section Header with Action

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
      Section Title
    </h2>
    <p className="text-sm text-slate-600">Optional description text</p>
  </div>
  <Button className="bg-[#31aba3] hover:bg-[#2a9a92]">
    <Plus className="mr-2 h-4 w-4" />
    Action
  </Button>
</div>
```

### Empty State

```tsx
<div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
  <Icon className="mx-auto h-12 w-12 text-slate-400" />
  <h3 className="mt-4 text-lg font-semibold text-slate-900">No items found</h3>
  <p className="mt-2 text-sm text-slate-600">
    Description of why it's empty or what to do next
  </p>
  <Button className="mt-4">Take Action</Button>
</div>
```

### Loading Skeleton

```tsx
<div className="h-32 animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
```

### Status Indicator

```tsx
<div className="flex items-center gap-2">
  <div className="h-2 w-2 rounded-full bg-emerald-500" />
  <span className="text-sm text-slate-600">Active</span>
</div>
```
