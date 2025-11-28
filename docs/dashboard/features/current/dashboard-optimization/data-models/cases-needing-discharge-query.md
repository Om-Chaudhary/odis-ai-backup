# Cases Needing Discharge Summaries Query

## SQL Query

```sql
SELECT
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM discharge_summaries
      WHERE discharge_summaries.case_id = cases.id
    )
  ) as total,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM discharge_summaries
      WHERE discharge_summaries.case_id = cases.id
    )
    AND cases.created_at >= DATE_TRUNC('week', CURRENT_DATE)
  ) as this_week,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM discharge_summaries
      WHERE discharge_summaries.case_id = cases.id
    )
    AND cases.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as this_month
FROM cases
WHERE cases.user_id = $1
  AND ($2::date IS NULL OR cases.created_at >= $2)
  AND ($3::date IS NULL OR cases.created_at <= $3);
```

## Supabase Query (tRPC Context)

```typescript
// Get all cases for user
const { data: allCases } = await ctx.supabase
  .from("cases")
  .select("id, created_at")
  .eq("user_id", userId);

// Filter cases that don't have discharge summaries
const casesWithoutDischarge = allCases?.filter((c) => {
  // Check if case has discharge summary
  // Can use separate query or join
});

// Calculate counts
const total = casesWithoutDischarge?.length ?? 0;
const thisWeek =
  casesWithoutDischarge?.filter((c) => new Date(c.created_at) >= oneWeekAgo)
    .length ?? 0;
const thisMonth =
  casesWithoutDischarge?.filter((c) => new Date(c.created_at) >= oneMonthAgo)
    .length ?? 0;
```

## Alternative: Direct Query with Join

```typescript
// More efficient: Single query with LEFT JOIN
const { data: casesData } = await ctx.supabase
  .from("cases")
  .select(
    `
    id,
    created_at,
    discharge_summaries!left(id)
  `,
  )
  .eq("user_id", userId);

// Filter where discharge_summaries.id IS NULL
const casesWithoutDischarge = casesData?.filter(
  (c) => !c.discharge_summaries || c.discharge_summaries.length === 0,
);
```

## Performance Considerations

- Consider adding index on `discharge_summaries.case_id`
- Filter by user_id first (uses index)
- Date filtering should use indexes on `created_at`
