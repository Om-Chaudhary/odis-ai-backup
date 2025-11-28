# Assignment A10: Backend Metrics Queries

> **Status:** 🔄 Ready for Assignment  
> **Priority:** High  
> **Estimated Time:** 3-4 hours  
> **Dependencies:** None  
> **Can Work Concurrently:** Yes (should be done first)

## 📋 Overview

Enhance the `getCaseStats` query in the dashboard router to include new metrics for cases needing discharge summaries, cases needing SOAP notes, coverage percentages, and completion rates. This data powers the enhanced stat cards and Cases Needing Attention card.

## 🎯 Objectives

1. Enhance `getCaseStats` query with new metrics
2. Add cases needing discharge calculation
3. Add cases needing SOAP calculation
4. Add coverage percentage calculations
5. Add completion rate calculations
6. Update TypeScript types

## ✅ Acceptance Criteria

- [ ] `getCaseStats` returns new fields:
  - `casesNeedingDischarge` (total, thisWeek, thisMonth)
  - `casesNeedingSoap` (total, thisWeek, thisMonth)
  - `soapCoverage` (percentage, totalCases, casesWithSoap, casesNeedingSoap)
  - `dischargeCoverage` (percentage, totalCases, casesWithDischarge, casesNeedingDischarge)
  - `completionRate` (overall, thisWeek, thisMonth)
- [ ] Calculations are accurate
- [ ] Queries are performant
- [ ] TypeScript types updated
- [ ] Handles edge cases (zero cases, etc.)

## 📁 Files to Modify

### Files to Modify

- `src/server/api/routers/dashboard.ts` (UPDATE - enhance getCaseStats)
- `src/types/dashboard.ts` (UPDATE - add new types)

## 🔧 Implementation Steps

### Step 1: Update TypeScript Types

```typescript
// In src/types/dashboard.ts
export interface DashboardStats {
  // Existing fields
  total: number;
  thisWeek: number;
  soapNotes: number;
  dischargeSummaries: number;
  callsCompleted: number;
  emailsSent: number;
  bySource: Record<string, number>;

  // New fields
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
  soapCoverage: {
    percentage: number;
    totalCases: number;
    casesWithSoap: number;
    casesNeedingSoap: number;
  };
  dischargeCoverage: {
    percentage: number;
    totalCases: number;
    casesWithDischarge: number;
    casesNeedingDischarge: number;
  };
  completionRate: {
    overall: {
      completed: number;
      total: number;
      percentage: number;
    };
    thisWeek: {
      completed: number;
      created: number;
      percentage: number;
    };
    thisMonth: {
      completed: number;
      created: number;
      percentage: number;
    };
  };
}
```

### Step 2: Enhance getCaseStats Query

```typescript
// In src/server/api/routers/dashboard.ts
getCaseStats: protectedProcedure
  .input(
    z.object({
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const startDate = input.startDate ? new Date(input.startDate) : undefined;
    const endDate = input.endDate ? new Date(input.endDate) : undefined;

    // ... existing queries for total, soapNotes, etc. ...

    // Get cases needing discharge summaries
    let casesNeedingDischargeQuery = ctx.supabase
      .from("cases")
      .select("id, created_at", { count: "exact" })
      .eq("user_id", userId)
      .not("id", "in",
        ctx.supabase
          .from("discharge_summaries")
          .select("case_id")
      );

    if (startDate) {
      casesNeedingDischargeQuery = casesNeedingDischargeQuery.gte(
        "created_at",
        startDate.toISOString(),
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      casesNeedingDischargeQuery = casesNeedingDischargeQuery.lte(
        "created_at",
        end.toISOString(),
      );
    }

    const { count: totalNeedingDischarge } = await casesNeedingDischargeQuery;

    // Get cases needing discharge this week
    const weekStart = startOfWeek(new Date());
    const { count: thisWeekNeedingDischarge } = await ctx.supabase
      .from("cases")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString())
      .not("id", "in",
        ctx.supabase
          .from("discharge_summaries")
          .select("case_id")
      );

    // Similar queries for SOAP notes
    // ... (see redesign plan for full implementation)

    // Calculate coverage percentages
    const totalCases = total ?? 0;
    const casesWithSoap = totalCases - (totalNeedingSoap ?? 0);
    const soapCoveragePercentage =
      totalCases > 0 ? Math.round((casesWithSoap / totalCases) * 100) : 0;

    const casesWithDischarge = totalCases - (totalNeedingDischarge ?? 0);
    const dischargeCoveragePercentage =
      totalCases > 0
        ? Math.round((casesWithDischarge / totalCases) * 100)
        : 0;

    // Calculate completion rate
    const completedCases = cases?.filter((c) => c.status === "completed").length ?? 0;
    const completionRateOverall =
      totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

    return {
      // ... existing fields ...
      casesNeedingDischarge: {
        total: totalNeedingDischarge ?? 0,
        thisWeek: thisWeekNeedingDischarge ?? 0,
        thisMonth: 0, // Calculate if needed
      },
      casesNeedingSoap: {
        total: totalNeedingSoap ?? 0,
        thisWeek: thisWeekNeedingSoap ?? 0,
        thisMonth: 0, // Calculate if needed
      },
      soapCoverage: {
        percentage: soapCoveragePercentage,
        totalCases,
        casesWithSoap,
        casesNeedingSoap: totalNeedingSoap ?? 0,
      },
      dischargeCoverage: {
        percentage: dischargeCoveragePercentage,
        totalCases,
        casesWithDischarge,
        casesNeedingDischarge: totalNeedingDischarge ?? 0,
      },
      completionRate: {
        overall: {
          completed: completedCases,
          total: totalCases,
          percentage: completionRateOverall,
        },
        // Calculate thisWeek and thisMonth if needed
      },
    };
  }),
```

### Step 3: Optimize Queries

Consider using a single query with joins instead of multiple queries:

```typescript
// More efficient approach using LEFT JOIN
const { data: casesWithStatus } = await ctx.supabase
  .from("cases")
  .select(
    `
    id,
    status,
    created_at,
    discharge_summaries(id),
    soap_notes(id)
  `,
  )
  .eq("user_id", userId);
```

## 🧪 Testing Requirements

1. **Unit Testing:**
   - [ ] Calculations are correct
   - [ ] Handles zero cases
   - [ ] Handles date ranges correctly
   - [ ] Handles missing data gracefully

2. **Integration Testing:**
   - [ ] Query returns expected structure
   - [ ] Works with date filters
   - [ ] Performance is acceptable (< 500ms)
   - [ ] Works with large datasets

3. **Data Validation:**
   - [ ] Percentages are 0-100
   - [ ] Counts are non-negative
   - [ ] Totals match sum of parts

## 📚 Related Documentation

- [Overview Tab Redesign](../02-TABS/overview-tab/redesign-plan.md) - See "Backend Changes Required" section
- [Data Models](../features/current/dashboard-optimization/data-models/) - Query specifications

## 🔗 Dependencies

- Supabase client
- date-fns for date calculations
- Existing dashboard router structure

## ⚠️ Notes

- Use efficient queries (consider LEFT JOINs)
- Cache results if possible
- Handle edge cases (zero cases, missing relations)
- Ensure queries respect date filters
- Consider adding indexes if performance is slow

---

**Ready for Assignment** ✅ (Should be done first)
