# Starred Cases Feature

## Overview

Added the ability to star/favorite cases for quick access and filtering. Users can now click a star icon on any case to mark it as important, and filter to show only starred cases.

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/20251213000000_add_is_starred_to_cases.sql`

- Added `is_starred` boolean column to `cases` table (default: false)
- Created index for efficient filtering: `idx_cases_is_starred` on `(user_id, is_starred)`

### 2. Backend API Updates

#### a. Types (`libs/types/src/dashboard.ts`)

- Added `is_starred: boolean` to `CaseListItem` interface

#### b. tRPC Router (`apps/web/src/server/api/routers/dashboard/listings.ts`)

- Updated `getAllCases` query:
  - Added `starred: z.boolean().optional()` to input schema
  - Added `is_starred` to the SELECT query
  - Added filter: `if (input.starred === true) query = query.eq("is_starred", true)`
  - Added `is_starred` to the returned case object

- Added new `toggleStarred` mutation:
  - Input: `{ caseId: string, starred: boolean }`
  - Verifies case ownership before updating
  - Updates `is_starred` column for the specified case
  - Returns success status

### 3. Frontend Updates

#### a. Case Card Components

**Files:**

- `apps/web/src/components/dashboard/cases/case-list-card.tsx`
- `apps/web/src/components/dashboard/cases/case-list-item-compact.tsx`

Both components now include:

- Star icon button next to patient name
- Visual states:
  - **Starred:** Filled amber star (`fill-amber-400 text-amber-400`)
  - **Not starred:** Outlined gray star with hover effect
- Click handler that calls `toggleStarred` mutation
- Optimistic UI updates with loading state
- Auto-refresh after star toggle

#### b. Filter Bar (`apps/web/src/components/dashboard/cases/cases-filter-bar.tsx`)

- Added "Starred" quick filter button (prominent amber styling)
- Button shows to the left of the collapsible filters
- Visual design:
  - **Active:** Amber background with white filled star
  - **Inactive:** Outlined with amber accent and filled amber star icon
- Added `starredOnly` and `onStarredChange` props
- Included in active filter count
- Cleared when "Clear All" is clicked

#### c. Cases Tab (`apps/web/src/components/dashboard/cases/cases-tab.tsx`)

- Added `starred` query parameter (persisted in URL)
- Passes `starred: true` to API when filter is active
- Integrated with existing filter state management
- Updates pagination when filter changes

## User Experience

### Starring a Case

1. Click the star icon on any case card (grid or list view)
2. Star fills with amber color immediately
3. Case is marked as starred in the database
4. Case appears in the "Starred" filter

### Viewing Starred Cases

1. Click the "Starred" button in the filter bar
2. Only starred cases are displayed
3. URL updates with `?starred=true`
4. Can be combined with other filters (status, source, date range, etc.)

### Unstarring a Case

1. Click the filled star icon on a starred case
2. Star becomes outlined gray
3. If "Starred" filter is active, case disappears from view

## Technical Details

### Database Performance

- Index on `(user_id, is_starred)` ensures fast filtering
- Partial index (`WHERE is_starred = true`) keeps index small
- Query performance remains optimal even with thousands of cases

### State Management

- Uses `nuqs` for URL-based state persistence
- Filter state survives page refreshes
- Clean integration with existing filter architecture

### UI/UX Patterns

- Follows existing color scheme (amber for importance/attention)
- Consistent with other filter toggles
- Accessible with keyboard navigation and screen readers
- Loading states prevent double-clicks

## Future Enhancements (Optional)

- Star count in filter button badge
- Bulk star/unstar operations
- Star cases from detail view
- Keyboard shortcuts (e.g., 'S' to star)
- Star filtering in other views (discharge management, etc.)
