# Discharges Tab - Complete Redesign Plan

> **Tab:** Discharges (`/dashboard?tab=discharges`)  
> **Purpose:** Manage automated discharge calls and emails for today's cases  
> **Priority:** High - Core workflow functionality

## 🎯 Redesign Goals

1. **Enhance Day Navigation** - Better date selection and indication
2. **Improve Case Cards** - More actionable information
3. **Standardize Actions** - Consistent with other tabs
4. **Add Bulk Operations** - Handle multiple cases efficiently
5. **Better Status Indicators** - Clear discharge status at a glance

## 📊 Current State Analysis

### Current Layout

```
┌─────────────────────────────────────────┐
│ Discharge Management                     │
│ [Test Mode Badge]                       │
│ [Refresh] [Settings]                    │
├─────────────────────────────────────────┤
│ Search: [________________________]      │
├─────────────────────────────────────────┤
│ Day Navigation: [←] Nov 28, 2024 [→]    │
│ Showing 12 cases                        │
├─────────────────────────────────────────┤
│ Case Cards (Grid)                       │
│ ┌────┐ ┌────┐ ┌────┐                   │
│ │Card│ │Card│ │Card│                   │
│ └────┘ └────┘ └────┘                   │
└─────────────────────────────────────────┘
```

### Issues Identified

1. ⚠️ **Limited Date Navigation** - Only forward/backward, no date picker
2. ⚠️ **No Global Date Filter** - Doesn't respect dashboard date filter
3. ⚠️ **Test Mode Prominence** - Could be more obvious
4. ⚠️ **No Bulk Actions** - Must trigger discharges one by one
5. ⚠️ **Case Card Information** - Could show more discharge status

## 🎨 Redesigned Layout

### Enhanced Header

```
┌─────────────────────────────────────────┐
│ Discharge Management                     │
│ Manage automated follow-up calls and     │
│ emails for today's cases                 │
│                                          │
│ [Test Mode: ON ⚠️] [Refresh] [Settings]│
├─────────────────────────────────────────┤
│ Date Filter: [All Time] [Day] [3D] [30D]│
│ Today: Nov 28, 2024                     │
└─────────────────────────────────────────┘
```

### Enhanced Day Navigation

```
┌─────────────────────────────────────────┐
│ Date Navigation                          │
│ [← Previous Day] [📅 Today] [Next Day →]│
│                                          │
│ Or select: [Date Picker]                │
│ Showing 12 cases for Nov 28, 2024       │
└─────────────────────────────────────────┘
```

### Enhanced Case Cards

```
┌──────────────────────────┐
│ Max (Canine)             │
│ John Smith               │
│ ──────────────────────── │
│ Phone: ✓ Valid           │
│ Email: ✓ Valid           │
│                          │
│ Discharge Status:        │
│ 📞 Call: [Not Scheduled] │
│ 📧 Email: [Not Scheduled]│
│                          │
│ [Trigger Call]           │
│ [Trigger Email]          │
│ [Edit Patient Info]      │
└──────────────────────────┘
```

**Status Indicators:**

- ✅ Valid contact info
- ⚠️ Missing contact info
- ✅ Discharge scheduled
- ⏳ Discharge in progress
- ✅ Discharge completed
- ❌ Discharge failed

## 🧩 Component Changes

### 1. Enhanced Date Navigation

**Current:** Simple prev/next buttons  
**New:** Date picker + quick navigation

```typescript
<DayNavigation
  currentDate={currentDate}
  onDateChange={setCurrentDate}
  showDatePicker={true}
  quickOptions={["Today", "Yesterday", "This Week"]}
/>
```

**Features:**

- Calendar date picker
- "Jump to Today" button
- Quick date presets
- Better visual indication of current date

### 2. Integrated Date Filter

**Add:** Global date filter support

```typescript
// Respect dashboard date filter
const [globalStartDate] = useQueryState("startDate");
const [globalEndDate] = useQueryState("endDate");

// Merge with day navigation
const effectiveDateRange =
  globalStartDate && globalEndDate
    ? { start: globalStartDate, end: globalEndDate }
    : { start: dateString, end: dateString };
```

### 3. Enhanced Case Cards

**Show More Information:**

- Patient name + species
- Owner name
- Contact info validation (✓/⚠️)
- Discharge call status
- Discharge email status
- Last discharge attempt time
- Error messages (if failed)

**Action Buttons:**

- Primary: Trigger Call / Trigger Email
- Secondary: Edit Patient Info
- Tertiary: View Case Details

### 4. Bulk Actions (Future Enhancement)

**Select Multiple Cases:**

- Checkbox on each card
- Select all visible cases
- Bulk actions:
  - Trigger calls for all
  - Trigger emails for all
  - Export selected cases

### 5. Test Mode Indicator

**Enhanced Visibility:**

- Banner at top of page
- Badge in header
- Warning on action buttons
- Settings link prominent

### 6. Status Summary Bar

**Quick Overview:**

```
┌─────────────────────────────────────────┐
│ Summary: 12 cases | 8 ready | 2 pending │
│ 6 calls scheduled | 3 emails scheduled   │
└─────────────────────────────────────────┘
```

## 🔧 Files to Modify

### Components

1. **`src/components/dashboard/discharges-tab.tsx`**
   - Integrate date filter
   - Enhance day navigation
   - Add status summary bar
   - Improve test mode visibility

2. **`src/components/dashboard/case-card.tsx`** (ENHANCE)
   - Add discharge status indicators
   - Show contact info validation
   - Add last attempt timestamps
   - Improve error display

3. **`src/components/dashboard/day-pagination-controls.tsx`** (ENHANCE)
   - Add date picker
   - Add "Jump to Today" button
   - Add quick date presets
   - Better visual design

4. **`src/components/dashboard/status-summary-bar.tsx`** (NEW)
   - Show case statistics
   - Show discharge status summary
   - Quick filters

### Backend

5. **`src/server/api/routers/cases.ts`**
   - Enhance `listMyCasesToday` to support date ranges
   - Add bulk discharge operations (future)
   - Add status summary endpoint

## ✅ Acceptance Criteria

- [ ] Date filter integrated (button group)
- [ ] Enhanced day navigation with date picker
- [ ] Status summary bar added
- [ ] Case cards show discharge status clearly
- [ ] Contact info validation indicators
- [ ] Test mode more prominent
- [ ] Bulk actions available (if implemented)
- [ ] Responsive on all screen sizes
- [ ] Loading states implemented
- [ ] Error states handled gracefully

## 📐 Visual Priority

**Above the Fold:**

1. Header with test mode indicator
2. Date filter + day navigation
3. Status summary bar
4. First row of case cards

**Below the Fold:** 5. Remaining case cards 6. Pagination (if needed)

## 🎨 Design Specifications

**Status Indicators:**

- ✅ Green: Ready/Completed
- ⚠️ Amber: Needs Attention/Pending
- ❌ Red: Failed/Error
- ⏳ Blue: In Progress

**Case Cards:**

- Gradient background (standard)
- Status badges for discharge calls/emails
- Contact validation icons
- Clear action buttons
- Error messages in red callout boxes

**Date Navigation:**

- Button group style
- Date picker modal
- "Today" button prominent
- Current date highlighted

---

**Next Steps:** Enhance day navigation, integrate date filter, add status summary bar
