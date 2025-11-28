# Assignment A7: Enhanced Case Cards

> **Status:** 🔄 Ready for Assignment  
> **Priority:** High  
> **Estimated Time:** 4-5 hours  
> **Dependencies:** None  
> **Can Work Concurrently:** Yes

## 📋 Overview

Enhance case cards in both grid and list views to show more actionable information, including detailed completion status, timestamps, and quick actions menu.

## 🎯 Objectives

1. Enhance CaseListCard (grid view) with more information
2. Enhance CaseListItemCompact (list view) with more information
3. Add completion indicators with timestamps
4. Add quick actions dropdown menu
5. Improve visual hierarchy

## ✅ Acceptance Criteria

- [ ] Grid view cards show:
  - Patient name with species icon
  - Owner name
  - Status and source badges
  - Detailed completion indicators (SOAP, Discharge, Call, Email)
  - Timestamps for completed items
  - Quick actions menu
- [ ] List view items show:
  - All key info inline
  - Completion indicators as icons
  - Quick actions menu
- [ ] Both views are responsive
- [ ] Quick actions work correctly
- [ ] Follows design system

## 📁 Files to Modify

### Files to Modify

- `src/components/dashboard/case-list-card.tsx` (UPDATE - enhance)
- `src/components/dashboard/case-list-item-compact.tsx` (UPDATE - enhance)

### Optional: New Components

- `src/components/dashboard/completion-indicator.tsx` (CREATE - reusable)
- `src/components/dashboard/quick-actions-menu.tsx` (CREATE - reusable)

## 🔧 Implementation Steps

### Step 1: Create Completion Indicator Component

```typescript
// src/components/dashboard/completion-indicator.tsx
"use client";

import { CheckCircle2, Clock, AlertCircle, LucideIcon } from "lucide-react";
import { format } from "date-fns";

interface CompletionIndicatorProps {
  type: "soap" | "discharge" | "call" | "email";
  completed?: boolean;
  scheduled?: boolean;
  timestamp?: string;
  size?: "sm" | "md";
}

const TYPE_CONFIG = {
  soap: { label: "SOAP Note", icon: FileText },
  discharge: { label: "Discharge Summary", icon: FileCheck },
  call: { label: "Call", icon: Phone },
  email: { label: "Email", icon: Mail },
};

export function CompletionIndicator({
  type,
  completed,
  scheduled,
  timestamp,
  size = "md",
}: CompletionIndicatorProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-slate-700">{config.label}</span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="text-slate-700">{config.label} Scheduled</span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <span className="text-amber-700">Missing {config.label}</span>
    </div>
  );
}
```

### Step 2: Enhance CaseListCard

Add completion indicators and quick actions:

```typescript
// In case-list-card.tsx
import { CompletionIndicator } from "~/components/dashboard/completion-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// In card content:
<div className="space-y-2 mb-4">
  <CompletionIndicator
    type="soap"
    completed={!!caseData.soap_notes?.length}
    timestamp={caseData.soap_notes?.[0]?.created_at}
  />
  <CompletionIndicator
    type="discharge"
    completed={!!caseData.discharge_summaries?.length}
    timestamp={caseData.discharge_summaries?.[0]?.created_at}
  />
  {/* ... more indicators ... */}
</div>

{/* Quick Actions */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleGenerateSoap(caseData.id)}>
      Generate SOAP Note
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleGenerateDischarge(caseData.id)}>
      Generate Discharge Summary
    </DropdownMenuItem>
    {/* ... more actions ... */}
  </DropdownMenuContent>
</DropdownMenu>
```

### Step 3: Enhance CaseListItemCompact

Similar enhancements but more compact:

```typescript
// In case-list-item-compact.tsx
// Add inline completion icons and quick actions menu
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Cards display all information correctly
   - [ ] Completion indicators show correct states
   - [ ] Timestamps format correctly
   - [ ] Quick actions menu works
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Quick actions execute correctly
   - [ ] Navigation to case details works
   - [ ] Completion status reflects actual data
   - [ ] Handles missing data gracefully

## 📚 Related Documentation

- [Cases Tab Redesign](../02-TABS/cases-tab/redesign-plan.md)
- [Design System](../01-GENERAL/design-system.md)

## 🔗 Dependencies

- shadcn/ui DropdownMenu component
- date-fns for timestamp formatting
- Existing case data structure

## ⚠️ Notes

- Completion indicators should be reusable across both views
- Quick actions should be context-aware (disabled when not applicable)
- Consider lazy loading for large lists
- Ensure performance with many cards

---

**Ready for Assignment** ✅
