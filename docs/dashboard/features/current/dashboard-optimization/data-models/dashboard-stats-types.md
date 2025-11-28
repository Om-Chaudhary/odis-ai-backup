# Dashboard Stats TypeScript Types

## Location

**File:** `src/server/api/routers/dashboard.ts` or `src/types/dashboard.ts`

## Type Definitions

```typescript
export interface CasesNeedingCounts {
  total: number;
  thisWeek: number;
  thisMonth: number;
}

export interface CompletionRatePeriod {
  completed: number;
  created: number;
  percentage: number;
}

export interface CompletionRate {
  thisWeek: CompletionRatePeriod;
  thisMonth: CompletionRatePeriod;
  overall: CompletionRatePeriod;
}

export interface DashboardCaseStats {
  // Existing fields
  total: number;
  thisWeek: number;
  byStatus: {
    draft: number;
    ongoing: number;
    completed: number;
    reviewed: number;
  };
  bySource: Record<string, number>;
  soapNotes: number;
  dischargeSummaries: number;
  callsCompleted: number;
  emailsSent: number;

  // New fields
  casesNeedingDischarge: CasesNeedingCounts;
  casesNeedingSoap: CasesNeedingCounts;
  completionRate: CompletionRate;
}
```

## Usage in Router

```typescript
export const dashboardRouter = createTRPCRouter({
  getCaseStats: protectedProcedure
    .input(/* ... */)
    .query(async ({ ctx, input }): Promise<DashboardCaseStats> => {
      // Implementation
      return {
        // ... all fields
      };
    }),
});
```

## Usage in Components

```typescript
const { data: stats } = api.dashboard.getCaseStats.useQuery({
  startDate,
  endDate,
});

// Access new fields
const dischargeNeeded = stats?.casesNeedingDischarge.total;
const soapNeeded = stats?.casesNeedingSoap.total;
const completionRate = stats?.completionRate.thisWeek.percentage;
```
