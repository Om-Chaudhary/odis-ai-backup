# Data Models & Backend Queries

Backend queries, TypeScript types, and data structures for dashboard optimization.

## Backend Changes

### Dashboard Router Updates

- [Dashboard Stats Queries](./dashboard-stats-queries.md) - New queries for actionable metrics

## Database Queries

### Cases Needing Attention

- [Cases Needing Discharge Summaries Query](./cases-needing-discharge-query.md)
- [Cases Needing SOAP Notes Query](./cases-needing-soap-query.md)
- [Completion Rate Queries](./completion-rate-queries.md)

## TypeScript Types

### New Types

- [Dashboard Stats Types](./dashboard-stats-types.md) - Type definitions for new metrics

## Data Flow

```
Database → Backend Queries → tRPC Router → Frontend Components
```

Refer to individual files for detailed query specifications and type definitions.
