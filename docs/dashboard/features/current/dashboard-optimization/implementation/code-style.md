# Code Style Guidelines

## General Principles

- Follow existing codebase patterns
- Use TypeScript with strict types
- Use functional components
- Prefer named exports

## Component Patterns

### File Structure

```typescript
// Imports
import { ... } from "...";

// Types/Interfaces
interface ComponentProps { ... }

// Component
export function Component({ ... }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
  return (...);
}
```

## Styling

- Use Tailwind CSS classes
- Match dashboard color scheme (teal #31aba3)
- Use existing UI components from `src/components/ui/`
- Consistent spacing using Tailwind spacing scale

## State Management

- Use `nuqs` for URL state
- Use React hooks for component state
- Use tRPC queries for data fetching

## Error Handling

- Handle loading states
- Handle error states
- Provide user-friendly error messages
