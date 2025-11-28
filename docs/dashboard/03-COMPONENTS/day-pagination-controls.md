# Day Pagination Controls - Component Documentation

> **Component:** `DayPaginationControls`  
> **Location:** `src/components/dashboard/day-pagination-controls.tsx`  
> **Used In:** Discharges Tab  
> **Last Updated:** 2025-11-28

## 📊 Overview

Navigation component for moving between days to view cases for specific dates. Provides previous/next day navigation with current date display and case count.

## 🎯 Purpose

Allows users to navigate through dates to view discharge cases for different days, with clear indication of the selected date and number of cases available.

## 📐 Component Structure

### Props

```typescript
interface DayPaginationControlsProps {
  currentDate: Date; // Currently selected date
  onDateChange: (date: Date) => void; // Callback when date changes
  totalItems: number; // Total cases for current date
  isLoading?: boolean; // Loading state
}
```

## 🎨 Visual Design

### Current Implementation (2024-11-28)

```
┌─────────────────────────────────────────┐
│ [←] 📅 Today, Nov 28, 2024 (12 cases) [→]│
│                                          │
│ [Go to Today] (when not viewing today)  │
└─────────────────────────────────────────┘
```

**Layout:**

- Previous Day button (←) on left
- Current date display in center
- Next Day button (→) on right
- Case count displayed
- "Go to Today" link (when not viewing today)

**Styling:**

- Large buttons: `h-10 w-10`
- Enhanced typography: `text-sm sm:text-base`
- Rounded borders: `rounded-lg`
- Proper spacing and alignment

### Enhanced Design (Future)

```
┌─────────────────────────────────────────┐
│ [← Previous] [📅 Today] [Next →]       │
│                                          │
│ Or select: [Date Picker 📅]             │
│ Showing 12 cases for Nov 28, 2024       │
└─────────────────────────────────────────┘
```

## 🔧 Implementation Details

### Current Implementation

```typescript
export function DayPaginationControls({
  currentDate,
  onDateChange,
  totalItems,
  isLoading = false,
}: DayPaginationControlsProps) {
  const isToday = isToday(currentDate);
  const dateString = format(currentDate, "MMMM d, yyyy");
  const displayDate = isToday ? `Today, ${dateString}` : dateString;

  const handlePrevious = () => {
    const previous = subDays(currentDate, 1);
    onDateChange(previous);
  };

  const handleNext = () => {
    const next = addDays(currentDate, 1);
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous Day Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={isLoading}
        className="h-10 w-10 rounded-lg"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Date Display */}
      <div className="flex flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium sm:text-base">
            {displayDate}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {isLoading ? "Loading..." : `${totalItems} case${totalItems !== 1 ? "s" : ""}`}
        </span>
        {!isToday && (
          <Button
            variant="link"
            size="sm"
            onClick={handleToday}
            className="h-auto p-0 text-xs text-[#31aba3] hover:text-[#2a9a92]"
          >
            Go to Today
          </Button>
        )}
      </div>

      {/* Next Day Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={isLoading}
        className="h-10 w-10 rounded-lg"
        aria-label="Next day"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
```

### Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "t" || e.key === "T") {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleToday();
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [currentDate]);
```

**Shortcuts:**

- `←` (Left Arrow): Previous day
- `→` (Right Arrow): Next day
- `Ctrl/Cmd + T`: Go to Today

## 🎨 Visual Design

### Container

- Flex layout: `flex items-center justify-between`
- Gap: `gap-4` (16px)
- Responsive spacing

### Buttons

- Size: `h-10 w-10` (40px × 40px)
- Variant: `outline`
- Border radius: `rounded-lg`
- Icons: ChevronLeft, ChevronRight (h-5 w-5)

### Date Display

- Center-aligned
- Calendar icon
- Date text: `text-sm sm:text-base`
- Case count: `text-xs text-slate-500`
- "Go to Today" link: Teal color, small text

## 📱 Responsive Behavior

### Desktop

- Full width layout
- All elements visible
- Hover states on buttons

### Tablet

- Full width layout
- Standard spacing

### Mobile

- Full width layout
- Compact spacing
- Touch-friendly buttons (40px × 40px)

## 🔄 State Management

### Date State

- Managed by parent component
- Format: JavaScript `Date` object
- Passed via props

### Callbacks

- `onDateChange`: Called when date changes
- Parent component updates state and refetches data

## ✅ Features

### Implemented ✅

- [x] Previous/Next day navigation
- [x] Current date display
- [x] Case count display
- [x] "Go to Today" link
- [x] Keyboard shortcuts
- [x] Loading state
- [x] Responsive design
- [x] Enhanced styling (2024-11-28)

### Planned Enhancements 🔄

- [ ] Date picker modal
- [ ] Quick date presets (Today, Yesterday, This Week)
- [ ] Enhanced visual indication of current date
- [ ] Integration with global date filter

## 📝 Related Documentation

- **Discharges Tab:** `../../02-TABS/discharges-tab/redesign-plan.md`
- **Component Implementation:** `src/components/dashboard/day-pagination-controls.tsx`
- **Design System:** `../../01-GENERAL/design-system.md`

---

**Last Updated:** 2025-11-28  
**Status:** Enhanced styling completed, date picker enhancement planned
