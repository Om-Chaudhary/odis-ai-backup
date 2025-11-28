# Cases Needing SOAP Notes Query

## SQL Query

```sql
SELECT
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM soap_notes
      WHERE soap_notes.case_id = cases.id
    )
  ) as total,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM soap_notes
      WHERE soap_notes.case_id = cases.id
    )
    AND cases.created_at >= DATE_TRUNC('week', CURRENT_DATE)
  ) as this_week,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM soap_notes
      WHERE soap_notes.case_id = cases.id
    )
    AND cases.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as this_month
FROM cases
WHERE cases.user_id = $1
  AND ($2::date IS NULL OR cases.created_at >= $2)
  AND ($3::date IS NULL OR cases.created_at <= $3);
```

## Supabase Query (tRPC Context)

Similar to cases needing discharge, but check for SOAP notes:

```typescript
const { data: allCases } = await ctx.supabase
  .from("cases")
  .select(
    `
    id,
    created_at,
    soap_notes!left(id)
  `,
  )
  .eq("user_id", userId);

const casesWithoutSoap = allCases?.filter(
  (c) => !c.soap_notes || c.soap_notes.length === 0,
);
```

## Performance Considerations

- Index on `soap_notes.case_id`
- User_id filtering uses index
- Date filtering uses `created_at` index
