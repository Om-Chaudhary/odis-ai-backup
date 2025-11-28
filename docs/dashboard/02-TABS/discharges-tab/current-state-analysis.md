# Discharges Tab - Current State Analysis

> **Tab:** Discharges (`/dashboard?tab=discharges`)  
> **Last Updated:** 2025-11-28  
> **Purpose:** Comprehensive documentation of current Discharges tab implementation

## 📊 Current Implementation Overview

The Discharges tab manages automated discharge calls and emails for today's cases. It's focused on triggering follow-up communications for patients.

## 🎛️ Current Layout Structure

### Layout

```
┌─────────────────────────────────────────┐
│ Header: Discharge Management             │
│ [Test Mode Badge] [Refresh] [Settings]  │
│                                          │
│ Description: Manage automated follow-up  │
│ calls and emails for today's cases       │
├─────────────────────────────────────────┤
│ Search: [________________________]      │
│                                          │
├─────────────────────────────────────────┤
│ Date Navigation: [←] Today, Nov 28 [→]  │
│ Showing 0 cases                          │
├─────────────────────────────────────────┤
│ Content Area                             │
│ - Empty state (if no cases)              │
│ - Case cards grid (if cases exist)       │
└─────────────────────────────────────────┘
```

## 🎛️ Controls & Filters

### 1. Test Mode Badge

**Location:** Header, next to title  
**Component:** Badge with TestTube icon  
**Visibility:** Only shown when test mode is enabled  
**Styling:** Amber/orange with pulsing animation

**Display:**

```
[Test Mode Active ⚠️]
```

**Purpose:** Indicates that discharge calls/emails will use test contact information instead of actual patient contacts.

### 2. Refresh Button

**Location:** Header, top right  
**Component:** Button with RefreshCw icon  
**Action:** Refetches cases and settings data  
**State:** Shows spinner when loading

### 3. Settings Button

**Location:** Header, top right  
**Component:** Button with Settings icon  
**Action:** Navigates to `/dashboard/settings`  
**Purpose:** Configure discharge settings (clinic info, test mode, etc.)

### 4. Search Filter

**Location:** Below header  
**Component:** Input field with Search icon  
**Placeholder:** "Search patients or owners..."  
**Functionality:**

- Client-side filtering
- Searches patient name and owner name
- Real-time as you type
- Resets pagination on search

### 5. Date Navigation

**Location:** Below search  
**Component:** `DayPaginationControls`  
**Features:**

- Previous Day button (←)
- Current date display (e.g., "Today, Nov 28, 2024")
- Next Day button (→)
- Total cases count for selected date
- "Go to Today" link (when not viewing today)
- Keyboard shortcuts (← → T)

**Current Implementation:**

- Positioned prominently at top (after search)
- Larger buttons (h-10 w-10)
- Enhanced typography
- Proper alignment with other controls

**Date Format:**

- Display: "Today, Nov 28, 2024" or "Nov 28, 2024"
- API: YYYY-MM-DD format

## 📋 Case Cards

### Card Structure

Each case card displays:

1. **Patient Information:**
   - Patient name (e.g., "Max")
   - Species (e.g., "Canine")
   - Owner name (e.g., "John Smith")

2. **Contact Information:**
   - Phone number (with validation indicator)
   - Email address (with validation indicator)
   - Shows "No phone number" or "No email address" if missing

3. **Discharge Status:**
   - Call status (Not Scheduled, Scheduled, In Progress, Completed, Failed)
   - Email status (Not Scheduled, Scheduled, Sent, Failed)
   - Last attempt timestamp (if applicable)

4. **Actions:**
   - "Trigger Call" button
   - "Trigger Email" button
   - "Edit Patient Info" button (opens modal)

### Card States

**Loading State:**

- Shows spinner on action buttons
- Disables buttons during processing
- Prevents double-clicks

**Error State:**

- Shows error message in card
- Highlights missing contact info
- Provides guidance on fixing issues

**Success State:**

- Updates status indicators
- Shows completion timestamp
- Provides feedback via toast

## 🔄 Data Fetching

### Queries Used

1. **`api.cases.listMyCasesToday`**
   - Returns: Cases for selected date with pagination
   - Parameters:
     - `page`: Current page number
     - `pageSize`: Items per page (10)
     - `date`: Selected date (YYYY-MM-DD)
   - Includes: Patient info, discharge summaries, SOAP notes, scheduled calls/emails

2. **`api.cases.getDischargeSettings`**
   - Returns: User's discharge settings
   - Includes: Clinic info, vet info, test mode settings, test contact info

### Mutations Used

1. **`api.cases.triggerDischarge`**
   - Triggers discharge call or email
   - Parameters:
     - `caseId`: Case ID
     - `patientId`: Patient ID
     - `patientData`: Owner contact information
     - `dischargeType`: "call" | "email"
   - Returns: Success/warning messages

2. **`api.cases.updatePatientInfo`**
   - Updates patient/owner information
   - Parameters:
     - `patientId`: Patient ID
     - `name`, `species`, `breed`: Patient info
     - `ownerName`, `ownerEmail`, `ownerPhone`: Owner info

## 🎨 Visual Design

### Header

- Title: "Discharge Management"
- Description: Subtitle explaining purpose
- Badge: Test mode indicator (when enabled)
- Actions: Refresh and Settings buttons

### Search Bar

- Full width with icon on left
- Placeholder text
- Focus ring on interaction

### Date Navigation

- Prominent positioning
- Large, clickable buttons
- Clear date display
- Case count indicator

### Case Cards

- Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile
- Gradient card background
- Teal border
- Hover effects
- Status badges
- Action buttons

## ⚠️ Current Issues

1. ⚠️ **No Date Filter Integration** - Doesn't respect global date filter button group
2. ⚠️ **Limited Date Navigation** - Only forward/backward, no date picker
3. ⚠️ **No Bulk Actions** - Must trigger discharges one by one
4. ⚠️ **No Status Summary** - Can't see overview of discharge statuses
5. ⚠️ **Test Mode Visibility** - Could be more prominent
6. ⚠️ **No Quick Filters** - Can't filter by status (pending, completed, failed)

## ✅ Current Features Summary

### Implemented ✅

- [x] Date navigation (previous/next day)
- [x] Search by patient/owner name
- [x] Case cards with discharge status
- [x] Trigger call functionality
- [x] Trigger email functionality
- [x] Edit patient info modal
- [x] Test mode indicator
- [x] Loading states
- [x] Error handling
- [x] Empty state
- [x] Responsive layout

### Planned Enhancements 🔄

- [ ] Integrate global date filter button group
- [ ] Add date picker for quick date selection
- [ ] Add status summary bar
- [ ] Add bulk actions
- [ ] Add quick filters (by status)
- [ ] Enhance test mode visibility
- [ ] Add retry logic for failed discharges

## 📝 Related Documentation

- **Redesign Plan:** `redesign-plan.md`
- **Component Implementation:** `src/components/dashboard/discharges-tab.tsx`
- **Case Card Component:** `src/components/dashboard/case-card.tsx`
- **Day Pagination Component:** `src/components/dashboard/day-pagination-controls.tsx`
- **Date Filter Component:** `../../03-COMPONENTS/date-filter-button-group.md`

---

**Last Updated:** 2025-11-28  
**Status:** Current implementation documented, redesign in progress
