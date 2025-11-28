# State Management Patterns

## URL State (nuqs)

For date filtering and navigation:

```typescript
import { useQueryState } from "nuqs";

const [dateRange, setDateRange] = useQueryState("dateRange");
const [startDate, setStartDate] = useQueryState("startDate");
const [endDate, setEndDate] = useQueryState("endDate");
```

## Component State (React)

For UI state like expand/collapse:

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

## Data Fetching (tRPC)

For server data:

```typescript
const { data, isLoading, error } = api.dashboard.getCaseStats.useQuery({
  startDate,
  endDate,
});
```

## Patterns

- Use URL state for shareable/filterable state
- Use component state for UI-only state
- Use tRPC for server data with automatic caching
