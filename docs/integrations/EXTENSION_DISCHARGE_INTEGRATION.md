# Extension Integration Guide: Discharge Email & Call Scheduling

## Overview

This guide explains how to integrate discharge email delivery and VAPI call scheduling from the browser extension's sync schedule page.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Extension: Sync Schedule Page                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Read Consultation│
                    │ Data from IDEXX  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Parse Notes &    │
                    │ Extract Data     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ POST /api/       │
                    │ normalize        │
                    │ (Entity Extract) │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │   EMAIL CHAIN         │   │   CALL CHAIN          │
    │   (Immediate)         │   │   (Scheduled)         │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ POST /api/generate/   │   │ POST /api/generate/   │
    │ discharge-summary     │   │ discharge-summary     │
    │ (for email content)   │   │ (generates + schedules│
    └───────────────────────┘   │ VAPI call)            │
                │                └───────────────────────┘
                ▼                           │
    ┌───────────────────────┐               │
    │ POST /api/generate/   │               │
    │ discharge-email       │               │
    │ (generate HTML)       │               │
    └───────────────────────┘               │
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ POST /api/send/       │   │ ✅ Done!              │
    │ discharge-email       │   │ VAPI call scheduled   │
    │ (schedule ~immediate) │   │                       │
    └───────────────────────┘   └───────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │ ✅ Done!              │
    │ Email scheduled       │
    └───────────────────────┘
```

---

## Prerequisites

### 1. Authentication Token

All API requests must include a Bearer token in the `Authorization` header:

```typescript
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${supabaseAccessToken}`,
};
```

**How to get the token:**

- Extension should obtain it from Supabase auth session
- Token must be for a user with `role: "admin"` in the `users` table

### 2. Required Data from IDEXX

From each consultation, you'll need:

- **Case ID** (if it exists in your system, otherwise create one)
- **Patient Information:**
  - Pet name
  - Species
  - Breed
  - Owner name
  - Date of birth
- **Appointment Details:**
  - Consultation notes/transcript
  - SOAP notes (if available)
  - Date of appointment
- **Contact Information:**
  - Owner email address
  - Owner phone number
  - Clinic name
  - Clinic phone
  - Emergency phone

---

## Step-by-Step Implementation

### Step 1: Normalize/Entity Extraction

**Endpoint:** `POST /api/normalize`

**Purpose:** Extract structured entities from clinical notes/transcripts.

**Request:**

```typescript
interface NormalizeRequest {
  text: string; // The clinical notes or transcript text
  caseId?: string; // Optional: existing case ID
  createCase?: boolean; // Set to true to create a new case
}
```

**Example:**

```typescript
const normalizeResponse = await fetch("https://odisai.net/api/normalize", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    text: consultationNotes,
    createCase: true, // Creates a new case if not exists
  }),
});

const normalizeData = await normalizeResponse.json();
```

**Response:**

```typescript
interface NormalizeResponse {
  success: boolean;
  data: {
    caseId: string; // Use this for subsequent API calls
    metadata: {
      entity_extraction: {
        patient_info?: {
          name?: string;
          species?: string;
          breed?: string;
          age?: string;
          weight?: string;
        };
        owner_info?: {
          name?: string;
          phone?: string;
          email?: string;
        };
        clinical_data?: {
          symptoms?: string[];
          diagnosis?: string;
          medications?: string[];
          treatment_plan?: string;
        };
        // ... other extracted entities
      };
    };
  };
}
```

**Error Handling:**

```typescript
if (!normalizeResponse.ok) {
  const error = await normalizeResponse.json();
  console.error("Normalization failed:", error);
  // Show error to user or skip this consultation
  return;
}
```

---

### Step 2A: Email Chain (Immediate Delivery)

#### 2A.1: Create Discharge Summary

**Endpoint:** `POST /api/generate/discharge-summary`

**Note:** This endpoint generates the summary AND schedules a VAPI call. For email-only, we still need the summary content.

**Request:**

```typescript
interface GenerateSummaryRequest {
  caseId: string; // From Step 1
  soapNoteId?: string; // Optional, will use latest
  templateId?: string; // Optional, uses default template
  ownerPhone: string; // For VAPI call (use dummy if not scheduling call yet)
  vapiScheduledFor: string; // ISO date string (far future for email-only)
  vapiVariables?: Record<string, any>; // Additional variables
}
```

**Wait, this is confusing because it also schedules a call. Let me revise the flow...**

Actually, for the email chain, we should use a different approach. Let me check if there's a better way...

Looking at the Edge Function, we can generate the summary without scheduling a call. Let me update this guide to be clearer.

---

## REVISED APPROACH

Since generating a summary automatically schedules a VAPI call, we need to separate concerns:

### Option 1: Email Only (No Call)

If you only want to send email without a call:

1. Normalize (Step 1)
2. Get discharge summary content directly from database or generate it separately
3. Generate email HTML
4. Schedule email

### Option 2: Call Only (No Email)

If you only want to schedule a call:

1. Normalize (Step 1)
2. Generate discharge summary (auto-schedules call)

### Option 3: Both Email AND Call (Your Use Case)

Since the summary generation includes the call scheduling, here's the proper flow:

1. **Normalize** - Get case ID and entity extraction
2. **Generate Discharge Summary** - This creates summary AND schedules the VAPI call
3. **Generate Email Content** - Uses the summary from step 2
4. **Send Email** - Schedule for immediate delivery

Let me rewrite this properly...

---

# CORRECTED FLOW

### Step 1: Normalize Clinical Data

**Endpoint:** `POST /api/normalize`

```typescript
const normalizeResponse = await fetch("https://odisai.net/api/normalize", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    text: consultationNotes,
    createCase: true,
  }),
});

const {
  data: { caseId },
} = await normalizeResponse.json();
```

---

### Step 2: Generate Discharge Summary + Schedule VAPI Call

**Endpoint:** `POST /api/generate/discharge-summary`

This endpoint:

- Calls Supabase Edge Function to generate the summary
- Stores the summary in the database
- **Automatically schedules the VAPI call** using your existing call scheduler

**Request:**

```typescript
const summaryResponse = await fetch(
  "https://odisai.net/api/generate/discharge-summary",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      caseId: caseId, // From Step 1
      ownerPhone: "+15551234567", // E.164 format
      vapiScheduledFor: "2025-11-15T18:00:00Z", // When to make the call
      vapiVariables: {
        // Optional: additional VAPI dynamic variables
        clinic_name: "Happy Paws Veterinary",
        clinic_phone: "+15559876543",
        emergency_phone: "+15559999999",
        vet_name: "Dr. Sarah Johnson",
      },
    }),
  },
);

const summaryData = await summaryResponse.json();
```

**Response:**

```typescript
interface GenerateSummaryResponse {
  success: boolean;
  data: {
    summaryId: string; // Discharge summary ID
    vapiCallId: string; // VAPI call ID (scheduled)
    content: string; // The generated summary text
    caseId: string;
    soapNoteId: string;
    vapiScheduledFor: string;
  };
}
```

---

### Step 3: Generate Email Content

**Endpoint:** `POST /api/generate/discharge-email`

Uses the summary generated in Step 2 to create HTML email content.

**Request:**

```typescript
const emailContentResponse = await fetch(
  "https://odisai.net/api/generate/discharge-email",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      caseId: caseId, // From Step 1
      dischargeSummaryId: summaryData.data.summaryId, // From Step 2 (optional)
    }),
  },
);

const emailContent = await emailContentResponse.json();
```

**Response:**

```typescript
interface GenerateEmailResponse {
  subject: string; // e.g., "Discharge Instructions for Max"
  html: string; // Full HTML email
  text: string; // Plain text version
  patientName: string;
  ownerName: string;
  dischargeSummaryId: string;
}
```

---

### Step 4: Schedule Email Delivery

**Endpoint:** `POST /api/send/discharge-email`

Schedule the email for **immediate delivery** (or near-immediate).

**Request:**

```typescript
// Calculate "immediate" delivery (e.g., 2 minutes from now)
const now = new Date();
const immediateDelivery = new Date(now.getTime() + 2 * 60 * 1000); // +2 minutes

const sendEmailResponse = await fetch(
  "https://odisai.net/api/send/discharge-email",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      caseId: caseId, // Optional reference
      recipientEmail: "owner@example.com",
      recipientName: emailContent.ownerName,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
      scheduledFor: immediateDelivery.toISOString(),
      metadata: {
        source: "idexx-sync",
        consultation_id: "idexx-12345",
      },
    }),
  },
);

const sendEmailData = await sendEmailResponse.json();
```

**Response:**

```typescript
interface SendEmailResponse {
  success: boolean;
  data: {
    emailId: string; // Scheduled email ID
    scheduledFor: string; // When it will be sent
    qstashMessageId: string; // QStash tracking ID
    recipientEmail: string;
    recipientName: string;
    subject: string;
  };
}
```

---

## Complete Implementation Example

```typescript
interface ConsultationData {
  notes: string;
  patientName: string;
  ownerEmail: string;
  ownerPhone: string;
  clinicName: string;
  clinicPhone: string;
  emergencyPhone: string;
  vetName: string;
}

async function processDischargeWorkflow(
  consultation: ConsultationData,
  token: string,
  callScheduledTime: Date, // When to schedule the VAPI call
) {
  const baseUrl = "https://odisai.net";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    // ========================================
    // STEP 1: Normalize/Entity Extraction
    // ========================================
    console.log("Step 1: Normalizing clinical data...");

    const normalizeResponse = await fetch(`${baseUrl}/api/normalize`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text: consultation.notes,
        createCase: true,
      }),
    });

    if (!normalizeResponse.ok) {
      throw new Error("Normalization failed");
    }

    const {
      data: { caseId },
    } = await normalizeResponse.json();
    console.log(`✓ Case created: ${caseId}`);

    // ========================================
    // STEP 2: Generate Summary + Schedule Call
    // ========================================
    console.log(
      "Step 2: Generating discharge summary and scheduling VAPI call...",
    );

    const summaryResponse = await fetch(
      `${baseUrl}/api/generate/discharge-summary`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          caseId,
          ownerPhone: consultation.ownerPhone,
          vapiScheduledFor: callScheduledTime.toISOString(),
          vapiVariables: {
            clinic_name: consultation.clinicName,
            clinic_phone: consultation.clinicPhone,
            emergency_phone: consultation.emergencyPhone,
            vet_name: consultation.vetName,
          },
        }),
      },
    );

    if (!summaryResponse.ok) {
      throw new Error("Summary generation failed");
    }

    const summaryData = await summaryResponse.json();
    console.log(`✓ Summary generated: ${summaryData.data.summaryId}`);
    console.log(`✓ VAPI call scheduled: ${summaryData.data.vapiCallId}`);

    // ========================================
    // STEP 3: Generate Email Content
    // ========================================
    console.log("Step 3: Generating email content...");

    const emailContentResponse = await fetch(
      `${baseUrl}/api/generate/discharge-email`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          caseId,
          dischargeSummaryId: summaryData.data.summaryId,
        }),
      },
    );

    if (!emailContentResponse.ok) {
      throw new Error("Email content generation failed");
    }

    const emailContent = await emailContentResponse.json();
    console.log(`✓ Email content generated`);

    // ========================================
    // STEP 4: Schedule Email (Immediate)
    // ========================================
    console.log("Step 4: Scheduling email for immediate delivery...");

    // Schedule for 2 minutes from now (effectively immediate)
    const immediateDelivery = new Date(Date.now() + 2 * 60 * 1000);

    const sendEmailResponse = await fetch(
      `${baseUrl}/api/send/discharge-email`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          caseId,
          recipientEmail: consultation.ownerEmail,
          recipientName: emailContent.ownerName,
          subject: emailContent.subject,
          htmlContent: emailContent.html,
          textContent: emailContent.text,
          scheduledFor: immediateDelivery.toISOString(),
          metadata: {
            source: "idexx-extension",
            patient_name: consultation.patientName,
          },
        }),
      },
    );

    if (!sendEmailResponse.ok) {
      throw new Error("Email scheduling failed");
    }

    const sendEmailData = await sendEmailResponse.json();
    console.log(`✓ Email scheduled: ${sendEmailData.data.emailId}`);

    // ========================================
    // SUCCESS - Return Results
    // ========================================
    return {
      success: true,
      caseId,
      discharge: {
        summaryId: summaryData.data.summaryId,
        emailId: sendEmailData.data.emailId,
        vapiCallId: summaryData.data.vapiCallId,
      },
      scheduledTimes: {
        email: sendEmailData.data.scheduledFor,
        call: summaryData.data.vapiScheduledFor,
      },
    };
  } catch (error) {
    console.error("Discharge workflow error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ========================================
// USAGE EXAMPLE
// ========================================
const result = await processDischargeWorkflow(
  {
    notes: "Patient presented with...", // IDEXX consultation notes
    patientName: "Max",
    ownerEmail: "john@example.com",
    ownerPhone: "+15551234567",
    clinicName: "Happy Paws Veterinary",
    clinicPhone: "+15559876543",
    emergencyPhone: "+15559999999",
    vetName: "Dr. Sarah Johnson",
  },
  supabaseToken,
  new Date("2025-11-15T18:00:00Z"), // Call scheduled for 6 PM
);

if (result.success) {
  console.log("✅ Discharge workflow completed successfully!");
  console.log(`Case ID: ${result.caseId}`);
  console.log(`Email scheduled for: ${result.scheduledTimes.email}`);
  console.log(`Call scheduled for: ${result.scheduledTimes.call}`);
} else {
  console.error("❌ Discharge workflow failed:", result.error);
}
```

---

## UI Recommendations

### Sync Schedule Page

Display a table with each consultation and action buttons:

```
┌─────────────────────────────────────────────────────────────────┐
│ IDEXX Consultations - Discharge Processing                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────┬─────────────┬───────────────┬──────────────────┐  │
│ │ Patient  │ Owner       │ Consultation  │ Actions          │  │
│ ├──────────┼─────────────┼───────────────┼──────────────────┤  │
│ │ Max      │ John Smith  │ 2025-11-14    │ [Process]        │  │
│ │ Bella    │ Jane Doe    │ 2025-11-14    │ [✓ Processed]    │  │
│ │ Charlie  │ Bob Johnson │ 2025-11-13    │ [Process]        │  │
│ └──────────┴─────────────┴───────────────┴──────────────────┘  │
│                                                                  │
│ Bulk Actions:                                                    │
│ [Process Selected] [Process All]                                │
│                                                                  │
│ Schedule Options:                                                │
│ Email: ○ Immediate  ○ Custom: [2025-11-15 14:00]               │
│ Call:  [2025-11-15 18:00]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Processing Flow UI

Show progress for each step:

```
Processing Discharge for Max...

✓ Step 1/4: Normalizing clinical data...
✓ Step 2/4: Generating discharge summary...
✓ Step 3/4: Creating email content...
⏳ Step 4/4: Scheduling email delivery...

Email will be sent at: 2025-11-14 14:02:00
VAPI call scheduled for: 2025-11-15 18:00:00
```

---

## Error Handling Checklist

### Network Errors

```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    // Log specific error
    console.error(`API Error (${response.status}):`, error);
    // Show user-friendly message
    showError(`Failed to ${stepName}: ${error.error}`);
    return;
  }
} catch (networkError) {
  console.error("Network error:", networkError);
  showError("Network connection failed. Please check your internet.");
}
```

### Validation Errors

```typescript
// Check required fields before API calls
if (!consultation.ownerEmail || !consultation.ownerPhone) {
  showWarning("Missing contact information. Skipping...");
  return;
}

// Validate phone number format (E.164)
if (!consultation.ownerPhone.match(/^\+[1-9]\d{1,14}$/)) {
  showError("Invalid phone number format. Must be E.164 (e.g., +15551234567)");
  return;
}
```

### Partial Success Handling

```typescript
// If email fails but call succeeds, inform user
if (!emailResult.success && callResult.success) {
  showWarning(
    "VAPI call scheduled successfully, but email failed. " +
      "You may need to send email manually.",
  );
}
```

---

## Testing Checklist

### Pre-Production Testing

- [ ] Test with valid consultation data
- [ ] Test with missing optional fields
- [ ] Test with invalid email format
- [ ] Test with invalid phone number format
- [ ] Test with past scheduling dates (should fail)
- [ ] Test with network disconnection
- [ ] Test with invalid auth token
- [ ] Test with non-admin user (should fail)
- [ ] Test bulk processing (multiple consultations)
- [ ] Verify QStash webhooks are triggered
- [ ] Verify emails are delivered via Resend
- [ ] Verify VAPI calls are executed at scheduled time

### Production Monitoring

- [ ] Log all API requests/responses
- [ ] Track success/failure rates
- [ ] Monitor QStash message queue
- [ ] Check Resend delivery status
- [ ] Monitor VAPI call completion rates
- [ ] Set up error alerting

---

## Rate Limiting & Best Practices

### Batch Processing

```typescript
// Process consultations in batches to avoid rate limits
async function processBatch(consultations: ConsultationData[], batchSize = 5) {
  for (let i = 0; i < consultations.length; i += batchSize) {
    const batch = consultations.slice(i, i + batchSize);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map((c) => processDischargeWorkflow(c, token, callTime)),
    );

    // Small delay between batches
    if (i + batchSize < consultations.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000),
      );
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## API Endpoints Summary

| Endpoint                          | Method | Purpose                               | Auth Required |
| --------------------------------- | ------ | ------------------------------------- | ------------- |
| `/api/normalize`                  | POST   | Extract entities from clinical text   | Yes (Admin)   |
| `/api/generate/discharge-summary` | POST   | Generate summary + schedule VAPI call | Yes (Admin)   |
| `/api/generate/discharge-email`   | POST   | Generate email HTML from summary      | Yes (Admin)   |
| `/api/send/discharge-email`       | POST   | Schedule email delivery via QStash    | Yes (Admin)   |

---

## Support & Debugging

### Debug Mode

Enable detailed logging:

```typescript
const DEBUG = true;

function debugLog(step: string, data: any) {
  if (DEBUG) {
    console.log(`[DISCHARGE] ${step}:`, JSON.stringify(data, null, 2));
  }
}

// Use in workflow:
debugLog("Normalize Response", normalizeData);
debugLog("Summary Response", summaryData);
```

### Common Issues

**Issue:** "Unauthorized: Admin access required"

- **Solution:** Verify user has `role: "admin"` in database

**Issue:** "Case not found"

- **Solution:** Ensure normalization step succeeded and returned a valid `caseId`

**Issue:** "Scheduled time must be in the future"

- **Solution:** Add buffer time (e.g., +2 minutes) to current timestamp

**Issue:** "Invalid phone number format"

- **Solution:** Ensure phone numbers are in E.164 format: `+[country][number]`

**Issue:** QStash webhook never fires

- **Solution:** Check `NEXT_PUBLIC_SITE_URL` is set correctly in environment

---

## Timeline

Typical workflow completion times:

- **Normalization:** 2-5 seconds
- **Summary Generation:** 10-30 seconds (AI processing)
- **Email Content Generation:** 1-2 seconds
- **Email Scheduling:** < 1 second
- **Total:** ~15-40 seconds per consultation

**Actual Delivery:**

- **Email:** 2-5 minutes after scheduling (QStash delay + Resend delivery)
- **VAPI Call:** At scheduled time (accurate to within 1 minute)

---

## Questions or Issues?

Contact the backend team or refer to:

- Main codebase: `/src/app/api/`
- CLAUDE.md for architecture details
- Supabase schema: `database.types.ts`
