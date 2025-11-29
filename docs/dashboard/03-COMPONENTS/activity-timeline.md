# Activity Timeline - Component Documentation

> **Component:** `ActivityTimeline`  
> **Location:** `src/components/dashboard/activity-timeline.tsx`  
> **Used In:** Overview Tab  
> **Last Updated:** 2025-11-28

## 📊 Overview

Displays a chronological timeline of recent activity across all cases, including case creation, SOAP note generation, discharge summary creation, calls, and emails.

## 🎯 Purpose

Provides visibility into recent system activity, helping users track what's happened recently and stay informed about case updates.

## 📐 Component Structure

### Props

```typescript
interface ActivityTimelineProps {
  activities: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type:
    | "case_created"
    | "soap_created"
    | "discharge_created"
    | "call_completed"
    | "email_sent"
    | "status_changed";
  description: string;
  timestamp: string; // ISO date string
  caseId?: string; // Link to case if applicable
  patientName?: string;
}
```

## 🎨 Visual Design

### Current Implementation (Always Expanded)

```
┌─────────────────────────────────────┐
│ Recent Activity                     │
│ [Activity Icon]                     │
├─────────────────────────────────────┤
│                                     │
│ • Case created for Max               │
│   2 minutes ago                      │
│                                     │
│ • Discharge summary generated        │
│   15 minutes ago                     │
│                                     │
│ • SOAP note created                  │
│   1 hour ago                         │
│                                     │
│ • Call completed for Bailey         │
│   2 hours ago                        │
│                                     │
│ ... (10-15 items total)              │
│                                     │
│ Height: ~400-500px                   │
└─────────────────────────────────────┘
```

### Redesigned (Collapsible)

```
┌─────────────────────────────────────┐
│ Recent Activity                     │
│ [Activity Icon]                     │
├─────────────────────────────────────┤
│                                     │
│ • Case created for Max               │
│   2 minutes ago                      │
│                                     │
│ • Discharge summary generated        │
│   15 minutes ago                     │
│                                     │
│ • SOAP note created                  │
│   1 hour ago                         │
│                                     │
│ [Show More ▼] (5 more items)        │
│                                     │
│ Height: ~200-250px (collapsed)      │
└─────────────────────────────────────┘
```

**Expanded State:**

- Shows all items
- "Show Less" button
- Height: ~400-500px

## 🔧 Implementation Details

### Current Implementation

```typescript
export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          {activities.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Redesigned Implementation (Collapsible)

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_ITEMS_TO_SHOW = 5;

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const itemsToShow = isExpanded
    ? activities
    : activities.slice(0, INITIAL_ITEMS_TO_SHOW);

  const hasMore = activities.length > INITIAL_ITEMS_TO_SHOW;

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

### Activity Item Component

```typescript
// src/components/dashboard/activity-item.tsx
interface ActivityItemComponentProps {
  activity: ActivityItem;
  isLast: boolean;
}

export function ActivityItemComponent({
  activity,
  isLast,
}: ActivityItemComponentProps) {
  const icon = getActivityIcon(activity.type);
  const color = getActivityColor(activity.type);

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-8 h-full w-0.5 bg-slate-200" />
      )}

      <div className="flex gap-4 pb-4">
        {/* Icon */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color.bg} ${color.border}`}>
          <icon.component className={`h-5 w-5 ${color.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-sm text-slate-900">{activity.description}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </p>
          {activity.caseId && (
            <Link
              href={`/dashboard/cases/${activity.caseId}`}
              className="mt-1 text-xs text-[#31aba3] hover:underline"
            >
              View case →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 📊 Data Fetching

### Query

```typescript
const { data: activities } = api.dashboard.getRecentActivity.useQuery({
  startDate,
  endDate,
});
```

### Backend Response

```typescript
Array<ActivityItem>; // Typically 10-15 items
```

## 🎨 Visual Design

### Card Container

- Gradient background
- Border: `border-teal-200/40`
- Shadow: `shadow-lg shadow-teal-500/5`

### Activity Items

- Timeline line connecting items
- Icon in colored circle
- Description text
- Relative timestamp
- Link to case (if applicable)

### Icons by Type

- Case Created: FolderOpen (blue)
- SOAP Created: FileText (teal)
- Discharge Created: FileCheck (green)
- Call Completed: Phone (purple)
- Email Sent: Mail (amber)
- Status Changed: RefreshCw (slate)

## 📱 Responsive Behavior

### Desktop

- Full width
- All items visible (when expanded)
- Hover effects on links

### Tablet

- Full width
- Standard layout

### Mobile

- Full width
- Compact spacing
- Touch-friendly links

## 🔄 State Management

### Local State

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

### Default Behavior

- Collapsed by default (shows 5 items)
- User can expand to see all
- State persists during session (optional)

## ✅ Acceptance Criteria

### Current ✅

- [x] Displays activity items
- [x] Shows timestamps
- [x] Links to cases
- [x] Empty state handling
- [x] Responsive layout

### Redesign 🔄

- [ ] Collapsible by default
- [ ] Shows 5 items initially
- [ ] "Show More" / "Show Less" button
- [ ] Smooth animation
- [ ] Saves vertical space

## 📝 Related Documentation

- **Overview Tab:** `../../02-TABS/overview-tab/redesign-plan.md`
- **Activity Item Component:** `src/components/dashboard/activity-item.tsx`
- **Design System:** `../../01-GENERAL/design-system.md`

---

**Last Updated:** 2025-11-28  
**Status:** Documented, collapsible redesign in progress
