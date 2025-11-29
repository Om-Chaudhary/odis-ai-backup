# Empty States Pattern

> **Pattern:** Empty State Handling  
> **Purpose:** Consistent empty state design across dashboard components  
> **Last Updated:** 2025-11-28

## 📊 Overview

Empty states are displayed when there's no data to show. They should be helpful, actionable, and guide users on what to do next.

## 🎯 When to Use

- No data available (e.g., no cases found)
- Filtered results return empty
- Initial state before data loads
- Error recovery states

## 🎨 Visual Design

### Standard Empty State

```
┌─────────────────────────────────────┐
│                                     │
│         [Icon in Circle]            │
│                                     │
│         Title Text                  │
│                                     │
│    Descriptive message text         │
│    explaining the empty state       │
│                                     │
│    [Optional Action Button]         │
│                                     │
└─────────────────────────────────────┘
```

### Component Structure

```typescript
<div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
    <Icon className="h-6 w-6 text-slate-400" />
  </div>
  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
  <p className="mt-2 mb-4 max-w-sm text-sm text-slate-600">
    {description}
  </p>
  {action && (
    <Button onClick={action.onClick}>
      {action.label}
    </Button>
  )}
</div>
```

## 🔧 Implementation

### Basic Empty State Component

```typescript
// src/components/dashboard/empty-state.tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="animate-in fade-in-50 flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 mb-4 max-w-sm text-sm text-slate-600">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### Usage Examples

**No Cases Found:**

```typescript
<EmptyState
  icon={FileText}
  title="No cases found"
  description="There are no cases matching your criteria. Try adjusting your filters or check back later."
  action={{
    label: "Clear Filters",
    onClick: () => clearFilters(),
  }}
/>
```

**No Discharge Calls:**

```typescript
<EmptyState
  icon={Phone}
  title="No Calls Yet"
  description="Start a discharge call to see live transcripts, audio recording, and AI analysis here."
  action={{
    label: "Start First Call",
    onClick: () => handleTriggerCall(),
  }}
/>
```

**Filtered Results Empty:**

```typescript
<EmptyState
  icon={Search}
  title="No results match your filters"
  description="Try adjusting your search terms or filters to see more results."
  action={{
    label: "Clear All Filters",
    onClick: () => resetFilters(),
  }}
/>
```

## 🎨 Styling Guidelines

### Container

- Minimum height: `min-h-[400px]`
- Border: `border-dashed border-slate-200`
- Padding: `p-8`
- Centered content: `flex flex-col items-center justify-center`

### Icon

- Size: `h-12 w-12` (48px)
- Background: `bg-slate-100`
- Icon size: `h-6 w-6` (24px)
- Color: `text-slate-400`

### Typography

- Title: `text-lg font-semibold text-slate-900`
- Description: `text-sm text-slate-600 max-w-sm`
- Spacing: `mt-4` (title), `mt-2 mb-4` (description)

### Animation

- Fade in: `animate-in fade-in-50`
- Duration: 200ms

## 📱 Responsive Behavior

### Desktop

- Full width container
- Standard padding and spacing

### Tablet

- Full width container
- Standard padding

### Mobile

- Full width container
- Reduced padding: `p-6`
- Smaller icon: `h-10 w-10`

## ✅ Best Practices

1. **Be Helpful** - Explain why the state is empty
2. **Be Actionable** - Provide clear next steps
3. **Use Appropriate Icons** - Match icon to context
4. **Keep It Simple** - Don't overwhelm with information
5. **Provide Context** - Explain what the user can do

## 🔗 Related Patterns

- [Loading States](./loading-states.md) - Loading state patterns
- [Error Handling](./error-handling.md) - Error state patterns
- [Action Feedback](./action-feedback.md) - User action feedback

---

**Last Updated:** 2025-11-28
