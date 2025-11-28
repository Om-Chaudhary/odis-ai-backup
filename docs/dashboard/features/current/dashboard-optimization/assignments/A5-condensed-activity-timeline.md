# Assignment A5: Condensed Activity Timeline

> **Status:** Ready for Assignment  
> **Difficulty:** Medium  
> **Dependencies:** None  
> **Estimated Time:** 2-3 days

## Overview

Make the Recent Activity timeline component condensed by default with expand/collapse functionality to save dashboard space.

## Current Implementation

**File:** `src/components/dashboard/activity-timeline.tsx`

**Current Behavior:**

- Always shows all activities (10-15 items)
- Takes significant vertical space (~400-500px)
- No collapse/expand functionality

## Target Implementation

### New Behavior

- **Default State:** Collapsed, shows 3-5 most recent items
- **Expanded State:** Shows all 10-15 items
- **Toggle:** "Show more" / "Show less" button
- **Animation:** Smooth expand/collapse transition

### Visual Design

**Collapsed View:**

```
┌─────────────────────────────────────────┐
│ Recent Activity        [Show more ▼]    │
├─────────────────────────────────────────┤
│                                         │
│ • Completed call for Benjamin (1d ago)  │
│ • Completed call for Benny (2d ago)     │
│ • Completed call for Purry (2d ago)     │
│                                         │
└─────────────────────────────────────────┘
```

**Expanded View:**

```
┌─────────────────────────────────────────┐
│ Recent Activity        [Show less ▲]    │
├─────────────────────────────────────────┤
│                                         │
│ [Full timeline with connecting line]    │
│ • Completed call for Benjamin (1d ago)  │
│ • Completed call for Benny (2d ago)     │
│ • Completed call for Purry (2d ago)     │
│ • Generated summary for... (2d ago)     │
│ ... (all items visible)                 │
│                                         │
└─────────────────────────────────────────┘
```

## Files to Modify

1. `src/components/dashboard/activity-timeline.tsx` - Add collapsible functionality
2. `src/components/dashboard/activity-item.tsx` - Create compact variant (optional)

## Implementation Details

### Use Collapsible Component

Use shadcn/ui `Collapsible` component:

```typescript
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
```

### Component Structure

```typescript
export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleActivities = isExpanded
    ? activities
    : activities.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? "Show less" : "Show more"}
                <ChevronDown className={cn(
                  "ml-1 h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>
      <CardContent>
        <CollapsibleContent>
          {/* Full timeline */}
        </CollapsibleContent>
        {/* Collapsed view */}
      </CardContent>
    </Card>
  );
}
```

### Collapsed View

- Show first 3-5 items
- Compact single-line format (icon + description + time)
- No vertical timeline line
- Minimal spacing (~150-200px height)

### Expanded View

- Show all items
- Full timeline with connecting line
- Standard spacing
- Takes ~400-500px height

### Compact Item Variant (Optional)

Create compact version of `ActivityItemComponent`:

```typescript
// Compact single-line format
<div className="flex items-center gap-2 py-1">
  <Icon className="h-4 w-4" />
  <span className="text-sm">{description}</span>
  <span className="text-xs text-slate-500">{time}</span>
</div>
```

## Styling

- Toggle button in card header (top right)
- Chevron icon rotates when expanded
- Smooth transition animation
- Match existing card styling

## Acceptance Criteria

- [ ] Default state is collapsed
- [ ] Shows 3-5 items when collapsed
- [ ] Expands to show all items
- [ ] Smooth animation transition
- [ ] Toggle button works correctly
- [ ] Chevron icon rotates
- [ ] Compact view displays properly
- [ ] Full view maintains timeline style

## Testing Checklist

- [ ] Component defaults to collapsed
- [ ] Shows correct number of items when collapsed
- [ ] Expands to show all items
- [ ] Collapses back correctly
- [ ] Animation is smooth
- [ ] Toggle button updates text/icon
- [ ] Works with empty activities array
- [ ] Works with < 5 activities

## Related Documentation

- [Activity Timeline Specification](../specifications/activity-timeline.md)
- [Implementation - State Management](../implementation/state-management.md)

---

**Ready to Start:** No dependencies, can begin immediately.
