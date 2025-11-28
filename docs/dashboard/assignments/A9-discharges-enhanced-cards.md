# Assignment A9: Discharges Tab Enhanced Case Cards

> **Status:** 🔄 Ready for Assignment  
> **Priority:** Medium  
> **Estimated Time:** 3-4 hours  
> **Dependencies:** None  
> **Can Work Concurrently:** Yes

## 📋 Overview

Enhance case cards in the Discharges tab to show detailed contact validation, discharge status indicators with timestamps, and improved action buttons.

## 🎯 Objectives

1. Add detailed contact indicators with validation
2. Add discharge status indicators with timestamps
3. Add last activity timestamp
4. Improve error display
5. Add "View Details" button

## ✅ Acceptance Criteria

- [ ] Contact indicators show validation status (✓ or ⚠️)
- [ ] Discharge status shows current state with timestamps
- [ ] Last activity timestamp displayed
- [ ] Error messages in colored callout boxes
- [ ] "View Details" button added
- [ ] All information clearly organized
- [ ] Responsive on mobile/tablet/desktop
- [ ] **Animations:** Staggered entry for card grid
- [ ] **Glassmorphism:** Standard card glassmorphism with `backdrop-blur-md`
- [ ] **Hover Effects:** Subtle scale (1.02x) and shadow increase
- [ ] **Status Indicators:** Smooth icon/color transitions
- [ ] **Button Transitions:** Smooth hover states

## 📁 Files to Create/Modify

### New Files (Optional)

- `src/components/dashboard/contact-indicator.tsx` (CREATE - reusable)
- `src/components/dashboard/discharge-status-indicator.tsx` (CREATE - reusable)

### Files to Modify

- `src/components/dashboard/case-card.tsx` (UPDATE - enhance)

## 🔧 Implementation Steps

### Step 1: Create Contact Indicator Component

```typescript
// src/components/dashboard/contact-indicator.tsx
"use client";

import { Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";

interface ContactIndicatorProps {
  type: "phone" | "email";
  value: string | undefined | null;
  isValid: boolean;
  testMode?: boolean;
}

export function ContactIndicator({
  type,
  value,
  isValid,
  testMode = false,
}: ContactIndicatorProps) {
  const Icon = type === "phone" ? Phone : Mail;

  if (!isValid) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <span className="text-amber-700">
          {type === "phone" ? "Phone" : "Email"} required
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <span className="text-slate-700">
        {type === "phone" ? "Phone" : "Email"}: {value}
      </span>
      {testMode && (
        <Badge variant="outline" className="text-xs">
          Test
        </Badge>
      )}
    </div>
  );
}
```

### Step 2: Create Discharge Status Indicator

```typescript
// src/components/dashboard/discharge-status-indicator.tsx
"use client";

import { Phone, Mail, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface DischargeStatusIndicatorProps {
  type: "call" | "email";
  calls?: Array<{ status?: string; scheduled_for?: string; ended_at?: string }>;
  emails?: Array<{ status?: string; scheduled_for?: string; sent_at?: string }>;
  testMode?: boolean;
}

export function DischargeStatusIndicator({
  type,
  calls,
  emails,
  testMode = false,
}: DischargeStatusIndicatorProps) {
  const items = type === "call" ? calls : emails;
  const Icon = type === "call" ? Phone : Mail;

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-slate-600">Not scheduled</span>
      </div>
    );
  }

  const latest = items[items.length - 1];
  const status = latest.status;

  if (status === "completed" || status === "sent") {
    const timestamp = type === "call" ? latest.ended_at : latest.sent_at;
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-slate-700">
          {type === "call" ? "Call" : "Email"} completed
        </span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  // ... handle other statuses (in_progress, scheduled, failed) ...
}
```

### Step 3: Enhance Case Card

Add new sections to case card:

```typescript
// In case-card.tsx
import { ContactIndicator } from "~/components/dashboard/contact-indicator";
import { DischargeStatusIndicator } from "~/components/dashboard/discharge-status-indicator";
import { formatDistanceToNow } from "date-fns";

// In card content:
{/* Contact Information */}
<div className="mb-4 space-y-2">
  <h4 className="text-xs font-medium text-slate-500 uppercase">Contact Information</h4>
  <ContactIndicator
    type="phone"
    value={effectivePhone}
    isValid={hasValidContact(effectivePhone)}
    testMode={testModeEnabled}
  />
  <ContactIndicator
    type="email"
    value={effectiveEmail}
    isValid={hasValidContact(effectiveEmail)}
    testMode={testModeEnabled}
  />
</div>

{/* Discharge Status */}
<div className="mb-4 space-y-2">
  <h4 className="text-xs font-medium text-slate-500 uppercase">Discharge Status</h4>
  <DischargeStatusIndicator
    type="call"
    calls={caseData.scheduled_discharge_calls}
    testMode={testModeEnabled}
  />
  <DischargeStatusIndicator
    type="email"
    emails={caseData.scheduled_discharge_emails}
    testMode={testModeEnabled}
  />
</div>

{/* Last Activity */}
{lastActivity && (
  <div className="mb-4 text-xs text-slate-500">
    Last activity: {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
  </div>
)}

{/* View Details Button */}
<Button variant="ghost" size="sm" asChild>
  <Link href={`/dashboard/cases/${caseData.id}`}>
    <Eye className="mr-2 h-4 w-4" />
    View Details
  </Link>
</Button>
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Contact indicators show correctly
   - [ ] Discharge status indicators show correctly
   - [ ] Timestamps format correctly
   - [ ] Error messages display properly
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Validation logic works correctly
   - [ ] Status reflects actual data
   - [ ] Navigation works
   - [ ] Handles missing data gracefully

## 🎨 Animation & Effects Requirements

**Glassmorphism:**

- Standard card glassmorphism: `backdrop-blur-md` with gradient background
- Hover: Enhanced opacity and shadow

**Animations:**

- Entry: Staggered with `animate-card-in` classes
- Hover: `hover:scale-[1.02]` with shadow increase
- Status indicators: Smooth icon/color transitions
- Buttons: `transition-smooth` with hover effects

**See:** [Animation and Effects Guidelines](../01-GENERAL/animation-and-effects.md)

## 📚 Related Documentation

- [Discharges Tab Redesign](../02-TABS/discharges-tab/redesign-plan.md)
- [Design System](../01-GENERAL/design-system.md)
- [Animation and Effects](../01-GENERAL/animation-and-effects.md)

## 🔗 Dependencies

- date-fns for timestamp formatting
- Existing case data structure
- Next.js Link component

## ⚠️ Notes

- Contact indicators should be reusable
- Status indicators should handle all possible states
- Consider test mode indicator for all test-related data
- Ensure performance with many cards

---

**Ready for Assignment** ✅
