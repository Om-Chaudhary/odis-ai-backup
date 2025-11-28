# Assignment A2: Cases Needing Attention Card

> **Status:** 🔄 Ready for Assignment  
> **Priority:** High  
> **Estimated Time:** 3-4 hours  
> **Dependencies:** A10 (Backend Metrics Queries)  
> **Can Work Concurrently:** After A10 complete

## 📋 Overview

Create a new `CasesNeedingAttentionCard` component that replaces the "Case Sources" card in the Overview tab. This card displays actionable metrics about cases missing discharge summaries and SOAP notes, with quick action buttons.

## 🎯 Objectives

1. Create Cases Needing Attention card component
2. Replace Case Sources card in Overview tab
3. Display cases needing discharge summaries
4. Display cases needing SOAP notes
5. Add action buttons to filter cases

## ✅ Acceptance Criteria

- [ ] Component created at `src/components/dashboard/cases-needing-attention-card.tsx`
- [ ] Card displays discharge summary metrics (this week + total)
- [ ] Card displays SOAP note metrics (this week + total)
- [ ] Progress bars show percentage incomplete
- [ ] Action buttons navigate to Cases tab with filters
- [ ] Amber/warning styling for visual priority
- [ ] Responsive on mobile/tablet/desktop
- [ ] Replaces Case Sources card in Overview tab
- [ ] Uses data from enhanced `getCaseStats` query

## 📁 Files to Create/Modify

### New Files

- `src/components/dashboard/cases-needing-attention-card.tsx` (CREATE)

### Files to Modify

- `src/components/dashboard/overview-tab.tsx` (UPDATE - replace SourceBreakdownCard)

## 🔧 Implementation Steps

### Step 1: Create Component

Create `src/components/dashboard/cases-needing-attention-card.tsx`:

```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface CasesNeedingAttentionCardProps {
  casesNeedingDischarge: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  casesNeedingSoap: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  totalCases: number;
}

export function CasesNeedingAttentionCard({
  casesNeedingDischarge,
  casesNeedingSoap,
  totalCases,
}: CasesNeedingAttentionCardProps) {
  const router = useRouter();

  const dischargePercentage = totalCases > 0
    ? Math.round((casesNeedingDischarge.total / totalCases) * 100)
    : 0;

  const soapPercentage = totalCases > 0
    ? Math.round((casesNeedingSoap.total / totalCases) * 100)
    : 0;

  const handleViewDischarges = () => {
    router.push("/dashboard?tab=cases&missingDischarge=true");
  };

  const handleViewSoap = () => {
    router.push("/dashboard?tab=cases&missingSoap=true");
  };

  return (
    <Card className="border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Cases Needing Attention
        </CardTitle>
        <CardDescription>Priority action items requiring attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Discharge Summaries Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Discharge Summaries</h4>
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {casesNeedingDischarge.thisWeek} this week
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {casesNeedingDischarge.total}
              </span>
              <span className="text-sm text-slate-600">total</span>
            </div>
            <Progress value={dischargePercentage} className="h-2" />
            <p className="text-xs text-slate-500">
              {dischargePercentage}% of cases missing discharge summaries
            </p>
          </div>
        </div>

        {/* SOAP Notes Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-900">SOAP Notes</h4>
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {casesNeedingSoap.thisWeek} this week
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {casesNeedingSoap.total}
              </span>
              <span className="text-sm text-slate-600">total</span>
            </div>
            <Progress value={soapPercentage} className="h-2" />
            <p className="text-xs text-slate-500">
              {soapPercentage}% of cases missing SOAP notes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={handleViewDischarges}
          >
            View Cases Missing Discharges
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={handleViewSoap}
          >
            View Cases Missing SOAP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Update Overview Tab

Replace `SourceBreakdownCard` with new component:

```typescript
// In overview-tab.tsx
import { CasesNeedingAttentionCard } from "~/components/dashboard/cases-needing-attention-card";

// In component render:
<CasesNeedingAttentionCard
  casesNeedingDischarge={stats?.casesNeedingDischarge ?? { total: 0, thisWeek: 0, thisMonth: 0 }}
  casesNeedingSoap={stats?.casesNeedingSoap ?? { total: 0, thisWeek: 0, thisMonth: 0 }}
  totalCases={stats?.total ?? 0}
/>
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Card renders with amber styling
   - [ ] Progress bars display correctly
   - [ ] Badges show correct counts
   - [ ] Buttons are properly styled
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Displays correct metrics from backend
   - [ ] Action buttons navigate correctly
   - [ ] URL parameters set correctly
   - [ ] Handles zero cases gracefully

3. **Integration Testing:**
   - [ ] Replaces Case Sources card
   - [ ] Works with date filter
   - [ ] Updates when data changes

## 📚 Related Documentation

- [Cases Needing Attention Card Spec](../03-COMPONENTS/cases-needing-attention-card.md)
- [Overview Tab Redesign](../02-TABS/overview-tab/redesign-plan.md)
- [Backend Metrics Assignment](./A10-backend-metrics-queries.md)

## 🔗 Dependencies

- **A10: Backend Metrics Queries** - Must be completed first to provide data
- shadcn/ui components (Card, Button, Badge, Progress)
- Next.js router for navigation

## ⚠️ Notes

- Component requires data from enhanced `getCaseStats` query
- Action buttons use URL query parameters to filter Cases tab
- Amber styling indicates urgency/attention needed
- Progress bars show visual percentage of incomplete cases

---

**Ready for Assignment** ✅ (After A10 complete)
