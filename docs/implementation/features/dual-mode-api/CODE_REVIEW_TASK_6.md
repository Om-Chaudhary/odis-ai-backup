# Code Review: DischargeOrchestrator (Task 6)

**Date:** 2025-11-25  
**Reviewer:** Claude  
**File:** `src/lib/services/discharge-orchestrator.ts`  
**Lines Reviewed:** 810  
**Status:** ✅ **FIXES APPLIED** - All Critical and Important Issues Resolved

---

## Executive Summary

The DischargeOrchestrator implementation is well-structured and follows good architectural patterns, but contains **3 critical security and type safety issues** that must be addressed before production deployment. Additionally, there are 5 important issues and 5 suggestions for improvement.

**Priority:** 🔴 **High** - Critical security vulnerability (XSS) must be fixed immediately.

---

## Review Metrics

- **Lines of Code:** 810
- **Critical Issues:** 3
- **Important Issues:** 5
- **Suggestions:** 5
- **Estimated Fix Time:** 4-6 hours
- **Code Complexity:** Medium-High
- **Test Coverage:** 0% (needs unit tests)

---

## 🔴 Critical Issues (Must Fix)

### 1. XSS Vulnerability in Email Generation

**Severity:** 🔴 Critical  
**Location:** Lines 109-138 (`generateEmailContent` function)  
**Type:** Security Vulnerability

#### Problem

User-controlled data (`patientName`, `ownerName`, `dischargeSummary`) is directly interpolated into HTML without sanitization, creating an XSS attack vector.

```typescript
// ❌ VULNERABLE CODE
<p>Dear ${ownerName},</p>
<div class="content">
${dischargeSummary}
</div>
```

If malicious data like `<script>alert('XSS')</script>` is injected, it will execute in email clients that render HTML.

#### Impact

- **Security Risk:** High - XSS attacks could compromise user data
- **Compliance:** May violate security standards (OWASP Top 10)
- **User Trust:** Could damage reputation if exploited

#### Fix

```typescript
import { escape } from "html-escaper"; // npm install html-escaper

function generateEmailContent(
  dischargeSummary: string,
  patientName: string,
  ownerName: string,
  species?: string | null,
  breed?: string | null,
): { subject: string; html: string; text: string } {
  // Escape all user inputs
  const safePatientName = escape(patientName);
  const safeOwnerName = escape(ownerName);
  const safeDischargeSummary = escape(dischargeSummary);
  const safeBreed = breed ? escape(breed) : "";
  const safeSpecies = species ? escape(species) : "";

  const subject = `Discharge Instructions for ${safePatientName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... styles ... -->
</head>
<body>
  <div class="container">
    <p>Dear ${safeOwnerName},</p>
    <div class="content">
${safeDischargeSummary}
    </div>
    <!-- ... rest using safe variables ... -->
  </div>
</body>
</html>
`;

  const text = htmlToPlainText(html);
  return { subject, html, text };
}
```

#### Verification

- Add unit tests with XSS payloads
- Verify HTML output is properly escaped
- Test with special characters (`, <, >, &, ")

---

### 2. Use of `any` Type in Result Building

**Severity:** 🔴 Critical  
**Location:** Lines 774-778 (`buildResult` method)  
**Type:** Type Safety Issue

#### Problem

Type safety is lost by using `as any`, which can lead to runtime errors if data structures change.

```typescript
// ❌ CURRENT CODE
ingestion: this.results.get("ingest")?.data as any,
summary: this.results.get("generateSummary")?.data as any,
email: this.results.get("prepareEmail")?.data as any,
```

#### Impact

- **Type Safety:** Lost compile-time type checking
- **Maintainability:** Changes to result types won't be caught
- **Runtime Errors:** Potential crashes if data structure changes

#### Fix

```typescript
import type {
    IngestResult,
    SummaryResult,
    EmailResult,
    EmailScheduleResult,
    CallResult,
} from "~/types/orchestration";

private buildResult(startTime: number): OrchestrationResult {
    const completedSteps: StepName[] = [];
    const skippedSteps: StepName[] = [];
    const failedSteps: StepName[] = [];
    const stepTimings: Record<string, number> = {};

    for (const [step, result] of this.results.entries()) {
        stepTimings[step] = result.duration;
        if (result.status === "completed") {
            completedSteps.push(step);
        } else if (result.status === "skipped") {
            skippedSteps.push(step);
        } else if (result.status === "failed") {
            failedSteps.push(step);
        }
    }

    // Type-safe result extraction
    const getTypedResult = <T>(step: StepName): T | undefined => {
        const result = this.results.get(step);
        return result?.data as T | undefined;
    };

    return {
        success: failedSteps.length === 0,
        data: {
            completedSteps,
            skippedSteps,
            failedSteps,
            ingestion: getTypedResult<IngestResult>("ingest"),
            summary: getTypedResult<SummaryResult>("generateSummary"),
            email: getTypedResult<EmailResult>("prepareEmail"),
            emailSchedule: getTypedResult<EmailScheduleResult>("scheduleEmail"),
            call: getTypedResult<CallResult>("scheduleCall"),
        },
        metadata: {
            totalProcessingTime: Date.now() - startTime,
            stepTimings,
            errors: failedSteps.map((step) => ({
                step,
                error: this.results.get(step)?.error ?? "Unknown error",
            })),
        },
    };
}
```

#### Verification

- Run `pnpm typecheck` to ensure no type errors
- Verify all result types match their definitions
- Test with different step combinations

---

### 3. Missing Error Handling for Database Rollback Failure

**Severity:** 🔴 Critical  
**Location:** Lines 637-641 (`executeEmailScheduling` method)  
**Type:** Error Handling Issue

#### Problem

If the database rollback fails after QStash scheduling fails, orphaned records remain in the database with no error logging or alerting.

```typescript
// ❌ CURRENT CODE
} catch (qstashError) {
    // Rollback database insert
    await this.supabase
        .from("scheduled_discharge_emails")
        .delete()
        .eq("id", scheduledEmail.id);
    // No error handling if delete fails!
    throw new Error(/* ... */);
}
```

#### Impact

- **Data Integrity:** Orphaned records in database
- **Debugging:** No visibility into rollback failures
- **Operations:** Manual cleanup required

#### Fix

```typescript
} catch (qstashError) {
    // Rollback database insert with proper error handling
    try {
        const { error: deleteError } = await this.supabase
            .from("scheduled_discharge_emails")
            .delete()
            .eq("id", scheduledEmail.id);

        if (deleteError) {
            console.error("[ORCHESTRATOR] Failed to rollback scheduled email:", {
                emailId: scheduledEmail.id,
                userId: this.user.id,
                error: deleteError,
                qstashError: qstashError instanceof Error
                    ? qstashError.message
                    : String(qstashError),
            });

            // TODO: Send alert to monitoring system (e.g., Sentry, PagerDuty)
            // await sendAlert({
            //     severity: "high",
            //     message: "Failed to rollback scheduled email after QStash failure",
            //     data: { emailId: scheduledEmail.id, error: deleteError },
            // });
        }
    } catch (rollbackError) {
        console.error("[ORCHESTRATOR] Critical: Rollback operation failed", {
            emailId: scheduledEmail.id,
            userId: this.user.id,
            error: rollbackError instanceof Error
                ? rollbackError.message
                : String(rollbackError),
        });

        // Critical: Alert operations team immediately
        // await sendCriticalAlert({ /* ... */ });
    }

    throw new Error(
        `Failed to schedule email delivery: ${
            qstashError instanceof Error
                ? qstashError.message
                : String(qstashError)
        }`,
    );
}
```

#### Verification

- Test rollback failure scenarios
- Verify error logging works correctly
- Ensure monitoring alerts are configured

---

## 🟠 Important Issues (Should Fix)

### 4. Duplicate Database Query Logic

**Severity:** 🟠 Important  
**Location:** Lines 503-515 and 518-530 (`executeEmailPreparation` method)  
**Type:** Code Duplication

#### Problem

The same database query logic for fetching discharge summary is duplicated in two places, violating DRY principle.

#### Impact

- **Maintainability:** Changes must be made in multiple places
- **Bug Risk:** Inconsistencies between duplicate code paths
- **Code Size:** Unnecessary code bloat

#### Fix

```typescript
/**
 * Get discharge summary content for a case
 * Tries to get from step results first, then falls back to database
 */
private async getDischargeSummary(caseId: string): Promise<string> {
    // Try to get from results first (from generateSummary step)
    const summaryResult = this.results.get("generateSummary");
    if (summaryResult?.data && typeof summaryResult.data === "object") {
        const data = summaryResult.data as { content?: string };
        if (data.content) {
            return data.content;
        }
    }

    // Fallback to database
    const { data: summaries, error } = await this.supabase
        .from("discharge_summaries")
        .select("content")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error || !summaries?.content) {
        throw new Error(
            `Discharge summary not found: ${error?.message ?? "Unknown error"}`
        );
    }

    return summaries.content;
}

// Then use in executeEmailPreparation:
private async executeEmailPreparation(startTime: number): Promise<StepResult> {
    // ... existing code ...

    // Get discharge summary (simplified)
    const dischargeSummary = await this.getDischargeSummary(caseId);

    // Generate email content
    const emailContent = generateEmailContent(
        dischargeSummary,
        patientName,
        ownerName,
        species,
        breed,
    );

    // ... rest of method ...
}
```

---

### 5. Missing Input Validation for Email Recipient

**Severity:** 🟠 Important  
**Location:** Line 581 (`executeEmailScheduling` method)  
**Type:** Input Validation

#### Problem

Email addresses are not validated before being stored, which could lead to delivery failures and poor user experience.

#### Fix

```typescript
import { isValidEmail } from "~/lib/resend/client";
// OR use zod validation:
import { z } from "zod";

const recipientEmail = options.recipientEmail;
if (!recipientEmail) {
  throw new Error("Recipient email is required");
}

// Validate email format
if (!isValidEmail(recipientEmail)) {
  throw new Error(`Invalid email address format: ${recipientEmail}`);
}

// OR with zod:
const emailSchema = z.string().email();
try {
  emailSchema.parse(recipientEmail);
} catch (error) {
  throw new Error(`Invalid email address format: ${recipientEmail}`);
}
```

---

### 6. Potential Race Condition in Parallel Execution

**Severity:** 🟠 Important  
**Location:** Lines 265-276 (`executeParallel` method)  
**Type:** Concurrency Issue

#### Problem

When `stopOnError` is enabled, a batch might partially complete before stopping, leading to inconsistent state.

#### Fix

```typescript
// Stop if stopOnError is enabled and any step failed
if (this.request.options?.stopOnError) {
  const hasFailures = batchResults.some(
    (result) =>
      result.status === "rejected" ||
      (result.status === "fulfilled" && result.value.status === "failed"),
  );
  if (hasFailures) {
    // Mark remaining steps in batch as cancelled
    batch.forEach((step) => {
      if (!this.results.has(step)) {
        this.results.set(step, {
          step,
          status: "skipped",
          duration: 0,
          error: "Cancelled due to previous step failure",
        });
      }
    });
    break;
  }
}
```

---

### 7. Missing Transaction for Email Scheduling

**Severity:** 🟠 Important  
**Location:** Lines 603-658 (`executeEmailScheduling` method)  
**Type:** Data Consistency

#### Problem

If QStash message ID update fails, the email is scheduled but not properly tracked, leading to inconsistent state.

#### Fix

```typescript
// Update with QStash message ID - handle failure gracefully
const { error: updateError } = await this.supabase
  .from("scheduled_discharge_emails")
  .update({
    qstash_message_id: qstashMessageId,
  })
  .eq("id", scheduledEmail.id);

if (updateError) {
  // Log but don't fail - email is scheduled, just missing tracking
  console.error("[ORCHESTRATOR] Failed to update QStash message ID:", {
    emailId: scheduledEmail.id,
    qstashMessageId,
    error: updateError,
    userId: this.user.id,
  });

  // Consider: Queue a background job to retry this update
  // await queueRetryUpdate({ emailId: scheduledEmail.id, qstashMessageId });
}

return {
  step: "scheduleEmail",
  status: "completed",
  duration: Date.now() - startTime,
  data: {
    emailId: scheduledEmail.id,
    scheduledFor: scheduledEmail.scheduled_for,
    qstashMessageId,
  },
};
```

---

### 8. Hardcoded Step Order Violates DRY

**Severity:** 🟠 Important  
**Location:** Lines 201-207 and ExecutionPlan (lines 150-156)  
**Type:** Code Duplication

#### Problem

Step order is hardcoded in multiple places, making it difficult to maintain consistency.

#### Fix

```typescript
// Create shared constant
const STEP_ORDER: readonly StepName[] = [
    "ingest",
    "generateSummary",
    "prepareEmail",
    "scheduleEmail",
    "scheduleCall",
] as const;

// Export from execution-plan.ts
export const STEP_ORDER: readonly StepName[] = [
    "ingest",
    "generateSummary",
    "prepareEmail",
    "scheduleEmail",
    "scheduleCall",
] as const;

// Use in DischargeOrchestrator
import { STEP_ORDER } from "./execution-plan";

private async executeSequential(): Promise<void> {
    for (const step of STEP_ORDER) {
        // ... existing code ...
    }
}
```

---

## 🟡 Suggestions (Consider)

### 9. Extract Patient Data Normalization

**Location:** Lines 400-402, 485-487, 593-597  
**Impact:** Code duplication

```typescript
private normalizePatient(
    patient: PatientRow | PatientRow[] | null
): PatientRow | null {
    return Array.isArray(patient)
        ? patient[0] ?? null
        : patient ?? null;
}
```

---

### 10. Add Structured Logging

**Impact:** Better debugging and monitoring

```typescript
private logStepStart(step: StepName): void {
    console.log("[ORCHESTRATOR] Starting step", {
        step,
        userId: this.user.id,
        caseId: this.getCaseId(),
        timestamp: new Date().toISOString(),
    });
}

private logStepComplete(step: StepName, duration: number, status: string): void {
    console.log("[ORCHESTRATOR] Step completed", {
        step,
        duration,
        status,
        userId: this.user.id,
        timestamp: new Date().toISOString(),
    });
}
```

---

### 11. Extract Email Template

**Impact:** Better maintainability and testability

Move HTML template to separate file or use template engine:

```typescript
// src/lib/templates/discharge-email.ts
export function renderDischargeEmailTemplate(params: {
  patientName: string;
  dischargeSummary: string;
  breed?: string;
  species?: string;
}): string {
  // Template logic here
}
```

---

### 12. Add Timeout for Long-Running Operations

**Impact:** Prevent hanging operations

```typescript
private async executeStepWithTimeout(
    step: StepName,
    timeoutMs: number = 300000 // 5 minutes default
): Promise<StepResult> {
    return Promise.race([
        this.executeStep(step),
        new Promise<StepResult>((_, reject) =>
            setTimeout(
                () => reject(new Error(`Step ${step} timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
}
```

---

### 13. Improve Type Safety for Step Options

**Impact:** Better type safety and maintainability

```typescript
// Create helper functions with proper type guards
import { z } from "zod";

const IngestStepOptionsSchema = z.object({
    autoSchedule: z.boolean().optional(),
    inputType: z.string().optional(),
});

private getIngestStepOptions(
    stepConfig: StepConfig | undefined
): IngestPayload["options"] {
    if (!stepConfig?.options || typeof stepConfig.options !== "object") {
        return undefined;
    }

    const result = IngestStepOptionsSchema.safeParse(stepConfig.options);
    if (!result.success) {
        console.warn("[ORCHESTRATOR] Invalid ingest step options:", result.error);
        return undefined;
    }

    return result.data;
}
```

---

## ✅ Good Practices Identified

### Strengths

1. ✅ **Clear Separation of Concerns** - Each step handler is isolated and focused
2. ✅ **Comprehensive Error Handling** - Try-catch blocks around risky operations
3. ✅ **Good TypeScript Usage** - Strong type definitions (except `any` usage)
4. ✅ **Excellent Documentation** - JSDoc comments for public methods
5. ✅ **Result Aggregation** - Comprehensive metadata collection
6. ✅ **Parallel Execution Support** - Efficient batch processing
7. ✅ **Dependency Management** - Proper step dependency resolution
8. ✅ **Skip Handling** - Gracefully handles disabled steps
9. ✅ **Rollback Logic** - Attempts to clean up on failure
10. ✅ **Duration Tracking** - Useful for performance monitoring

### Patterns to Replicate

- Using `ExecutionPlan` for dependency management
- Separating step handlers into individual methods
- Using discriminated unions for request input types
- Comprehensive result building with metadata

---

## Testing Recommendations

### Unit Tests Needed

1. **Step Handler Tests**
   - Test each step handler independently
   - Mock dependencies (CasesService, Supabase, QStash)
   - Test success and failure scenarios

2. **Error Handling Tests**
   - Database failures
   - QStash failures
   - Rollback failures
   - Network timeouts

3. **Parallel Execution Tests**
   - Test batch execution
   - Test `stopOnError` behavior
   - Test dependency resolution

4. **Edge Cases**
   - Missing data scenarios
   - Partial failures
   - Skipped steps
   - Existing case input

### Integration Tests Needed

1. **Full Workflow Tests**
   - End-to-end orchestration
   - Multiple step combinations
   - Real database interactions (test environment)

2. **Performance Tests**
   - Large batches
   - Timeout scenarios
   - Concurrent requests

### Security Tests Needed

1. **XSS Prevention Tests**
   - Test with XSS payloads
   - Verify HTML escaping
   - Test special characters

2. **Input Validation Tests**
   - Invalid email addresses
   - Malformed data
   - SQL injection attempts

---

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)

1. ✅ Fix XSS vulnerability (#1)
2. ✅ Fix type safety issues (#2)
3. ✅ Improve error handling (#3)

**Estimated Time:** 2-3 hours

### Phase 2: Important Fixes (This Sprint)

4. ✅ Deduplicate code (#4, #8)
5. ✅ Add input validation (#5)
6. ✅ Fix race conditions (#6)
7. ✅ Improve transaction handling (#7)

**Estimated Time:** 2-3 hours

### Phase 3: Enhancements (Next Sprint)

8. ✅ Extract helper methods (#9)
9. ✅ Add logging (#10)
10. ✅ Extract templates (#11)
11. ✅ Add timeouts (#12)
12. ✅ Improve type safety (#13)

**Estimated Time:** 3-4 hours

---

## Fixes Applied

**Date:** 2025-11-25  
**Status:** ✅ **All Critical and Important Issues Fixed**

### Fixed Issues

1. ✅ **XSS Vulnerability** - Added `html-escaper` library and escaped all user inputs in email generation
2. ✅ **Type Safety** - Replaced `any` types with proper type definitions (`IngestResult`, `SummaryResult`, etc.)
3. ✅ **Error Handling** - Added comprehensive error handling for database rollback failures
4. ✅ **Code Duplication** - Extracted `getDischargeSummary()` helper method
5. ✅ **Input Validation** - Added email validation using `isValidEmail()` function
6. ✅ **Race Condition** - Fixed parallel execution to mark cancelled steps when `stopOnError` is enabled
7. ✅ **Transaction Handling** - Improved QStash message ID update error handling
8. ✅ **DRY Violation** - Extracted `STEP_ORDER` constant and `normalizePatient()` helper

### Dependencies Added

- `html-escaper@^3.0.3` - For XSS protection
- `@types/html-escaper@^3.0.4` - TypeScript types

### Code Changes Summary

- **Security:** All user inputs now properly escaped in HTML generation
- **Type Safety:** Removed all `any` types, using proper type definitions
- **Error Handling:** Added try-catch blocks for rollback operations with logging
- **Code Quality:** Extracted helper methods to reduce duplication
- **Validation:** Added email format validation before scheduling

## Sign-Off

**Reviewer:** Claude  
**Date:** 2025-11-25  
**Status:** ✅ **Fixes Applied - Ready for Testing**

**Next Steps:**

1. ✅ All critical issues fixed
2. ⏳ Add unit tests (recommended)
3. ⏳ Integration testing before production deployment
4. ⏳ Monitor error logs for rollback failures

---

## Related Documentation

- [Task 6 Implementation Guide](./tasks/TASK_6_DISCHARGE_ORCHESTRATOR.md)
- [Execution Plan Review](./PHASE_2_CODE_REVIEW.md)
- [Orchestration Types](../types/orchestration.ts)
