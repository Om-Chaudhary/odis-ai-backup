---
paths:
  - "apps/web/src/components/dashboard/**"
  - "apps/web/src/app/dashboard/**"
---

# Dashboard Component Organization

## Feature Directory Structure

```
{feature}/
  hooks/          # React hooks (data fetching, mutations)
  utils/          # Utility functions
  table/          # Table components
  detail/         # Detail view components
  views/          # Top-level view components
  types.ts        # UI state types, filter types
  mock-data.ts    # Mock data (NOT "demo-data")
  index.ts        # Public API exports
  {feature}-client.tsx
```

## Rules

- Hooks always in `{feature}/hooks/`, never in `app/dashboard/*/_hooks/`
- Utils start flat at feature root; nest only when subfolder needs 5+ shared utils
- Feature-specific types stay local; domain types go to `@odis-ai/shared/types`
- Mock data files named `mock-data.ts`
- Every directory with 2+ exports needs `index.ts` with explicit exports

## React Patterns

- Default to Server Components. Mark with `"use client"` only when needed.
- Use ref pattern for polling stability to avoid unstable callback references:

```typescript
const dataRef = useRef(data);
useEffect(() => { dataRef.current = data; }, [data]);
const hasActive = useCallback(() => dataRef.current.some(x => x.active), []);
```
