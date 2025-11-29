# Loading States Pattern

> **Pattern:** Loading State Handling  
> **Purpose:** Consistent loading indicators across dashboard components  
> **Last Updated:** 2025-11-28

## 📊 Overview

Loading states provide feedback that data is being fetched or an action is in progress. They should be clear, non-intrusive, and maintain layout stability.

## 🎯 When to Use

- Data fetching (queries)
- Form submissions
- File uploads
- Long-running operations
- Button actions

## 🎨 Visual Design Patterns

### 1. Skeleton Loaders

**Best for:** List/grid content loading

```
┌─────────────────────────────────────┐
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ ▓▓▓ │ │ ▓▓▓ │ │ ▓▓▓ │            │
│ │ ▓▓▓ │ │ ▓▓▓ │ │ ▓▓▓ │            │
│ └─────┘ └─────┘ └─────┘            │
│                                     │
│ [Animated pulse effect]             │
└─────────────────────────────────────┘
```

**Implementation:**

```typescript
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {[1, 2, 3, 4, 5, 6].map((i) => (
    <div
      key={i}
      className="h-[300px] animate-pulse rounded-xl border bg-slate-100"
    />
  ))}
</div>
```

### 2. Spinner Loaders

**Best for:** Button actions, inline loading

```
┌─────────────────────────────────────┐
│ [Button with Spinner]               │
│ [Loader2 Icon Spinning]             │
└─────────────────────────────────────┘
```

**Implementation:**

```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

### 3. Full Page Loaders

**Best for:** Initial page loads, major data fetches

```
┌─────────────────────────────────────┐
│                                     │
│         [Spinner]                   │
│                                     │
│      Loading...                     │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**

```typescript
<div className="flex min-h-[400px] items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-[#31aba3]" />
  <span className="ml-2 text-slate-600">Loading...</span>
</div>
```

### 4. Progress Indicators

**Best for:** File uploads, long operations with known progress

```
┌─────────────────────────────────────┐
│ Uploading...                        │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 50%              │
└─────────────────────────────────────┘
```

## 🔧 Implementation Examples

### Skeleton Card Loader

```typescript
function SkeletonCard() {
  return (
    <div className="h-[300px] animate-pulse rounded-xl border border-slate-200 bg-slate-50">
      <div className="h-4 w-3/4 bg-slate-200 rounded mt-4 mx-4" />
      <div className="h-4 w-1/2 bg-slate-200 rounded mt-2 mx-4" />
      <div className="h-32 bg-slate-200 rounded mt-4 mx-4" />
    </div>
  );
}

// Usage
{isLoading ? (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
  </div>
) : (
  <CaseCards cases={cases} />
)}
```

### Button Loading State

```typescript
<Button
  onClick={handleAction}
  disabled={isLoading}
  className="w-full"
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <Phone className="mr-2 h-4 w-4" />
      Trigger Call
    </>
  )}
</Button>
```

### Inline Loading Indicator

```typescript
{isLoading && (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-[#31aba3]" />
    <span className="ml-2 text-sm text-slate-600">Loading cases...</span>
  </div>
)}
```

### Table Row Loading

```typescript
<tr>
  <td colSpan={columns.length}>
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-5 w-5 animate-spin text-[#31aba3]" />
      <span className="ml-2 text-sm text-slate-600">Loading...</span>
    </div>
  </td>
</tr>
```

## 🎨 Styling Guidelines

### Spinner

- Size: `h-4 w-4` (small), `h-6 w-6` (medium), `h-8 w-8` (large)
- Animation: `animate-spin`
- Color: `text-[#31aba3]` (primary) or `text-slate-400` (muted)

### Skeleton

- Background: `bg-slate-100` or `bg-slate-50`
- Animation: `animate-pulse`
- Border: `border border-slate-200`
- Rounded: `rounded-xl` or `rounded-lg`

### Loading Text

- Size: `text-sm`
- Color: `text-slate-600`
- Spacing: `ml-2` (when next to spinner)

## ⚡ Performance Considerations

1. **Debounce Loading States** - Don't show spinner for < 200ms
2. **Optimistic Updates** - Update UI immediately, sync later
3. **Skeleton Placeholders** - Maintain layout during loading
4. **Progressive Loading** - Load critical content first

## 📱 Responsive Behavior

### Desktop

- Full skeleton cards
- Standard spinner sizes

### Tablet

- Full skeleton cards
- Standard spinner sizes

### Mobile

- Compact skeleton cards
- Smaller spinners: `h-4 w-4`

## ✅ Best Practices

1. **Show Immediately** - Display loading state within 100ms
2. **Maintain Layout** - Use skeleton loaders to prevent layout shift
3. **Be Specific** - Show what's loading ("Loading cases..." vs "Loading...")
4. **Disable Actions** - Disable buttons during loading
5. **Handle Errors** - Show error state if loading fails

## 🔗 Related Patterns

- [Empty States](./empty-states.md) - Empty state patterns
- [Error Handling](./error-handling.md) - Error state patterns
- [Action Feedback](./action-feedback.md) - User action feedback

---

**Last Updated:** 2025-11-28
