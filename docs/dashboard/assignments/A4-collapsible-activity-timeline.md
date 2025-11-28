# Assignment A4: Collapsible Activity Timeline

> **Status:** 🔄 Ready for Assignment  
> **Priority:** Medium  
> **Estimated Time:** 2-3 hours  
> **Dependencies:** None  
> **Can Work Concurrently:** Yes

## 📋 Overview

Refactor the Activity Timeline component to be collapsible by default, showing 5 items initially with a "Show More" button to expand and show all items. This saves significant vertical space on the Overview tab.

## 🎯 Objectives

1. Make Activity Timeline collapsible
2. Show 5 items by default
3. Add "Show More" / "Show Less" button
4. Smooth expand/collapse animation
5. Save vertical space (~300-400px)

## ✅ Acceptance Criteria

- [ ] Timeline collapsed by default (shows 5 items)
- [ ] "Show More" button appears when more than 5 items
- [ ] "Show Less" button appears when expanded
- [ ] Smooth animation on expand/collapse
- [ ] All functionality preserved
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible

## 📁 Files to Modify

### Files to Modify

- `src/components/dashboard/activity-timeline.tsx` (UPDATE - add collapsible)

## 🔧 Implementation Steps

### Step 1: Add Collapsible State

```typescript
// In activity-timeline.tsx
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Button } from "~/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_ITEMS_TO_SHOW = 5;

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const itemsToShow = isExpanded
    ? activities
    : activities.slice(0, INITIAL_ITEMS_TO_SHOW);

  const hasMore = activities.length > INITIAL_ITEMS_TO_SHOW;

  // ... existing empty state handling ...

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {itemsToShow.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === itemsToShow.length - 1 && !hasMore}
            />
          ))}
        </div>

        {hasMore && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="mt-4 w-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show More ({activities.length - INITIAL_ITEMS_TO_SHOW} more items)
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0">
                {activities.slice(INITIAL_ITEMS_TO_SHOW).map((activity, index) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                    isLast={index === activities.slice(INITIAL_ITEMS_TO_SHOW).length - 1}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 2: Ensure Collapsible Component Available

Verify `Collapsible` component exists in shadcn/ui. If not, install it:

```bash
npx shadcn@latest add collapsible
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Timeline shows 5 items by default
   - [ ] "Show More" button appears when > 5 items
   - [ ] Smooth expand/collapse animation
   - [ ] Button text updates correctly
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Expand shows all items
   - [ ] Collapse returns to 5 items
   - [ ] Works with < 5 items (no button)
   - [ ] Works with exactly 5 items (no button)
   - [ ] Works with > 5 items (shows button)

3. **Accessibility Testing:**
   - [ ] Keyboard navigation works
   - [ ] Screen reader announces state
   - [ ] Focus management correct

## 📚 Related Documentation

- [Activity Timeline Component Docs](../03-COMPONENTS/activity-timeline.md)
- [Overview Tab Redesign](../02-TABS/overview-tab/redesign-plan.md)

## 🔗 Dependencies

- shadcn/ui Collapsible component
- Existing ActivityTimeline component
- ActivityItemComponent (already exists)

## ⚠️ Notes

- Default to collapsed state saves significant space
- Animation should be smooth (200ms)
- Button should clearly indicate how many more items
- Consider persisting expanded state in localStorage (optional enhancement)

---

**Ready for Assignment** ✅
