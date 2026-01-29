# Deep Linking Implementation Guide

## Overview

Both the **Outbound** and **Inbound** dashboards now support deep linking, allowing external tools and extensions to generate shareable URLs that open specific cases or calls directly in the dashboard.

## URL Structure

### Outbound Dashboard

**Base URL:**

```
/dashboard/[clinicSlug]/outbound
```

**Query Parameters:**

- `caseId` (string, UUID): Direct case lookup - opens the case detail panel immediately
- `consultationId` (string): IDEXX Neo consultation/appointment ID - looks up the associated case
- `openPanel` (boolean): Auto-opens the detail panel when navigating via deep link (optional, used with `caseId`)
- `date` (string, YYYY-MM-DD): Filter by discharge date
- `view` (string): `"all"` | `"needs_attention"` - Dashboard view mode
- `page` (integer): Page number for pagination
- `size` (integer): Page size (items per page)
- `search` (string): Search term

**Example URLs:**

```
# Direct case link (preferred for extensions)
/dashboard/my-clinic/outbound?caseId=550e8400-e29b-41d4-a716-446655440000

# IDEXX Neo consultation link
/dashboard/my-clinic/outbound?consultationId=idexx-appt-12345

# Combined with date filter
/dashboard/my-clinic/outbound?caseId=550e8400-e29b-41d4-a716-446655440000&date=2026-01-28

# Search and select
/dashboard/my-clinic/outbound?search=fluffy&caseId=550e8400-e29b-41d4-a716-446655440000
```

### Inbound Dashboard

**Base URL:**

```
/dashboard/[clinicSlug]/inbound
```

**Query Parameters:**

- `callId` (string, UUID): Direct call lookup - opens the call detail panel immediately
- `outcome` (string): Filter by call outcome - `"all"` | `"appointment"` | `"emergency"` | `"callback"` | `"info"`
- `page` (integer): Page number for pagination
- `size` (integer): Page size (items per page)
- `search` (string): Search term

**Example URLs:**

```
# Direct call link
/dashboard/my-clinic/inbound?callId=660e8400-e29b-41d4-a716-446655440001

# Filter by outcome and select
/dashboard/my-clinic/inbound?outcome=appointment&callId=660e8400-e29b-41d4-a716-446655440001

# Search and select
/dashboard/my-clinic/inbound?search=555-1234&callId=660e8400-e29b-41d4-a716-446655440001
```

## Deep Linking Behavior

### URL Updates

**When clicking a table row:**

- The URL automatically updates with the `caseId` or `callId` parameter
- The detail panel opens
- The URL becomes shareable - anyone with access can paste it to open the same case/call

**When closing the detail panel:**

- The `caseId`/`callId` parameter is removed from the URL
- The URL returns to the table view state

### Deep Link Loading

When a URL with `caseId` or `callId` is loaded:

1. **Check current page data**: If the case/call is already loaded in the current table view, it's selected immediately
2. **API lookup**: If not in the current view, an API call fetches the case/call by ID
3. **Auto-navigation** (Outbound only): If the case is on a different date, the dashboard navigates to that date
4. **Auto-selection**: Once the data is available, the detail panel opens automatically
5. **Toast notification**: User sees a success toast confirming the case/call was opened
6. **Cleanup**: The `caseId`/`callId` parameter is removed from the URL after successful selection

### Error Handling

**Case/Call Not Found:**

- Shows error toast: "Case/Call not found"
- Clears the invalid `caseId`/`callId` parameter
- Returns to normal table view

**Access Denied:**

- If user doesn't have access to the clinic, the tRPC procedure returns a "NOT_FOUND" error
- Same error handling as "Not Found" case

## Extension Integration

### For OdisAI Extension (or any external tool)

#### Outbound Dashboard Integration

**Option 1: Direct Case ID (Recommended)**

```typescript
// Generate deep link URL for a specific case
function generateOutboundDeepLink(clinicSlug: string, caseId: string): string {
  const baseUrl = `https://odisai.net/dashboard/${clinicSlug}/outbound`;
  const params = new URLSearchParams({
    caseId: caseId,
    openPanel: "true", // Optional: auto-open panel
  });
  return `${baseUrl}?${params.toString()}`;
}

// Example usage
const url = generateOutboundDeepLink(
  "my-clinic",
  "550e8400-e29b-41d4-a716-446655440000",
);
// Result: https://odisai.net/dashboard/my-clinic/outbound?caseId=550e8400-e29b-41d4-a716-446655440000&openPanel=true
```

**Option 2: IDEXX Consultation ID**

```typescript
// Generate deep link using IDEXX consultation/appointment ID
function generateIdexxDeepLink(
  clinicSlug: string,
  consultationId: string,
): string {
  const baseUrl = `https://odisai.net/dashboard/${clinicSlug}/outbound`;
  const params = new URLSearchParams({
    consultationId: consultationId,
  });
  return `${baseUrl}?${params.toString()}`;
}

// Example usage
const url = generateIdexxDeepLink("my-clinic", "idexx-appt-12345");
// Result: https://odisai.net/dashboard/my-clinic/outbound?consultationId=idexx-appt-12345
```

#### Inbound Dashboard Integration

```typescript
// Generate deep link URL for a specific inbound call
function generateInboundDeepLink(clinicSlug: string, callId: string): string {
  const baseUrl = `https://odisai.net/dashboard/${clinicSlug}/inbound`;
  const params = new URLSearchParams({
    callId: callId,
  });
  return `${baseUrl}?${params.toString()}`;
}

// Example usage
const url = generateInboundDeepLink(
  "my-clinic",
  "660e8400-e29b-41d4-a716-446655440001",
);
// Result: https://odisai.net/dashboard/my-clinic/inbound?callId=660e8400-e29b-41d4-a716-446655440001
```

### Opening Deep Links from Extension

```typescript
// Open in new tab
window.open(url, "_blank");

// Or navigate in current tab
window.location.href = url;

// Or create a clickable link
const link = document.createElement("a");
link.href = url;
link.target = "_blank";
link.textContent = "Open in ODIS Dashboard";
document.body.appendChild(link);
```

### Getting Case/Call IDs

**From tRPC API (if extension has API access):**

```typescript
// Outbound: Find case by consultation ID
const { data } = await trpc.outbound.findByConsultationId.query({
  consultationId: "idexx-appt-12345",
});
if (data?.found) {
  const caseId = data.caseId;
  const deepLink = generateOutboundDeepLink(clinicSlug, caseId);
}

// Outbound: Get case by ID
const { data } = await trpc.outbound.getCaseById.query({
  caseId: "550e8400-e29b-41d4-a716-446655440000",
});

// Inbound: Get call by ID
const { data } = await trpc.inbound.getCallById.query({
  callId: "660e8400-e29b-41d4-a716-446655440001",
});
```

**From Database (if extension has direct DB access):**

```sql
-- Outbound: Find case by IDEXX consultation ID
SELECT id, timestamp
FROM cases
WHERE clinic_id = 'clinic-uuid'
  AND (
    external_id = 'idexx-appt-12345'
    OR metadata->'idexx'->>'consultation_id' = 'appt-12345'
    OR metadata->'idexx'->>'appointment_id' = 'appt-12345'
  );

-- Inbound: Find call by phone number and timestamp
SELECT id
FROM inbound_vapi_calls
WHERE clinic_id = 'clinic-uuid'
  AND customer_phone = '+15551234567'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## API Endpoints

### Outbound

**Find by Consultation ID:**

```typescript
// Procedure: api.outbound.findByConsultationId
// Input: { consultationId: string }
// Returns: { found: boolean, caseId?: string, date?: string, page?: number }
```

**Get Case by ID:**

```typescript
// Procedure: api.outbound.getCaseById
// Input: { caseId: string }
// Returns: TransformedCase (full case data)
```

### Inbound

**Get Call by ID:**

```typescript
// Procedure: api.inbound.getCallById
// Input: { callId: string }
// Returns: InboundCall (full call data from inbound_vapi_calls table)
```

## Implementation Details

### Files Modified

**Outbound Dashboard:**

- `/apps/web/src/components/dashboard/outbound/outbound-dashboard.tsx`
  - Added `caseId` to `handleSelectCase` callback
  - Clear `caseId` and `openPanel` params in `handleClosePanel`
  - Existing deep link handling for `consultationId` and `caseId` preserved

**Inbound Dashboard:**

- `/apps/web/src/components/dashboard/inbound/inbound-client.tsx`
  - Added `callId` query param support
  - Added `handleSelectCall` URL update
  - Added `handleClosePanel` URL cleanup
  - Added deep link effect to auto-select calls from URL

**New API Procedures:**

- `/apps/web/src/server/api/routers/inbound/procedures/get-call-by-id.ts`
  - New tRPC procedure for inbound call lookup by ID
  - Role-based access control (users only see their clinic's calls)

**Router Updates:**

- `/apps/web/src/server/api/routers/inbound/router.ts`
  - Added `getCallById` procedure export

## Testing Deep Links

### Manual Testing

1. **Outbound - Direct Case ID:**
   - Navigate to outbound dashboard
   - Click any case row
   - Copy the URL (should contain `?caseId=...`)
   - Open in a new tab/window
   - Verify the case detail panel opens automatically

2. **Outbound - IDEXX Consultation ID:**
   - Find a case with an IDEXX consultation ID
   - Construct URL: `/dashboard/[clinic]/outbound?consultationId=idexx-appt-12345`
   - Navigate to URL
   - Verify dashboard navigates to correct date and opens the case

3. **Inbound - Direct Call ID:**
   - Navigate to inbound dashboard
   - Click any call row
   - Copy the URL (should contain `?callId=...`)
   - Open in a new tab/window
   - Verify the call detail panel opens automatically

### From Extension

```typescript
// Test script for extension
const testDeepLinks = {
  outbound: {
    caseId: generateOutboundDeepLink(
      "test-clinic",
      "550e8400-e29b-41d4-a716-446655440000",
    ),
    consultationId: generateIdexxDeepLink("test-clinic", "idexx-appt-12345"),
  },
  inbound: {
    callId: generateInboundDeepLink(
      "test-clinic",
      "660e8400-e29b-41d4-a716-446655440001",
    ),
  },
};

// Open each link
Object.entries(testDeepLinks.outbound).forEach(([type, url]) => {
  console.log(`Testing outbound ${type}:`, url);
  window.open(url, "_blank");
});

Object.entries(testDeepLinks.inbound).forEach(([type, url]) => {
  console.log(`Testing inbound ${type}:`, url);
  window.open(url, "_blank");
});
```

## Troubleshooting

### Deep Link Not Working

1. **Check URL format**: Ensure `caseId`/`callId` is a valid UUID
2. **Verify clinic access**: User must have access to the specified clinic
3. **Check browser console**: Look for tRPC errors or React errors
4. **Verify data exists**: Ensure the case/call exists in the database

### Case/Call Opens But Wrong Data

1. **Clear browser cache**: Stale data may be cached
2. **Check filters**: URL may have conflicting filter parameters
3. **Verify timestamps**: For outbound, ensure the date filter matches the case's discharge date

### Performance Issues

1. **Avoid repeated deep links**: The dashboard tracks handled deep links to prevent infinite loops
2. **Use direct case ID**: Faster than consultation ID lookup (requires extra query)
3. **Minimize URL params**: Only include necessary parameters

## Future Enhancements

- [ ] Add support for multiple case/call selection via comma-separated IDs
- [ ] Add `highlight` param to visually highlight the opened case/call
- [ ] Add `autoclose` param to auto-close panel after a timeout
- [ ] Support for state restoration (scroll position, expanded sections)
- [ ] Analytics tracking for deep link usage
