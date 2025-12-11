# Entity Extraction Lenient Mode - Implementation Summary

## Problem Identified

From production logs analysis, 90.8% of discharge workflows were failing due to insufficient IDEXX consultation note text:

- **393 cases/week** with minimal IDEXX notes (≤50 chars) like "N/T", "t/r"
- All failed at `extractEntities` step with error: _"No suitable text available for entity extraction"_
- Blocked entire discharge workflow (summary, email, call)

## Solution Implemented

Modified entity extraction to gracefully handle minimal text while blocking only extreme cases (euthanasia).

### Files Changed

#### 1. `libs/services-discharge/src/lib/discharge-orchestrator.ts`

**Changes:**

- Added euthanasia detection logic (lines 591-609)
  - Checks `metadata.entities.caseType === "euthanasia"`
  - Checks text content for "euthanasia"/"euthanize" keywords
  - Checks IDEXX `appointment_type` field
  - Blocks workflow if detected
- Modified minimal text handling (lines 611-632)
  - Previously: Threw error if text < 50 chars
  - Now: Returns completed status with `entities: null`
  - Downstream steps use database patient data as fallback
  - Added `skipped: true` and `reason` fields for tracking

**Before:**

```typescript
if (!textToExtract || textToExtract.length < 50) {
  throw new Error("No suitable text available for entity extraction...");
}
```

**After:**

```typescript
if (isEuthanasia) {
  throw new Error("Euthanasia case detected...");
}

if (!textToExtract || textToExtract.length < 50) {
  return {
    step: "extractEntities",
    status: "completed",
    data: { caseId, entities: null, skipped: true, reason: "..." },
  };
}
```

#### 2. `libs/types/src/orchestration.ts`

**Changes:**

- Made `entities` field nullable in `ExtractEntitiesResult` (line 73)
- Added optional `skipped` and `reason` fields (lines 75-76)

**Before:**

```typescript
export interface ExtractEntitiesResult {
  caseId: string;
  entities: NormalizedEntities;
  source: "transcription" | "idexx_consultation_notes" | "existing";
}
```

**After:**

```typescript
export interface ExtractEntitiesResult {
  caseId: string;
  entities: NormalizedEntities | null; // Now nullable
  source: "transcription" | "idexx_consultation_notes" | "existing";
  skipped?: boolean; // Indicates graceful skip
  reason?: string; // Explains why skipped
}
```

## Verification

### ✅ Compilation

```bash
npx tsc --noEmit  # PASSED
```

### ✅ Linting

```bash
pnpm nx lint services-discharge  # PASSED (fixed 2 nullish coalescing warnings)
pnpm nx lint types               # PASSED
```

### ✅ Tests

```bash
pnpm nx test services-discharge  # PASSED (4/4 tests)
```

### ✅ Type Safety

- All downstream code already handles nullable entities correctly
- `entitiesToUse = freshEntities ?? caseInfo.entities ?? null` (line 906)
- `generateStructuredDischargeSummaryWithRetry` accepts `entityExtraction?: NormalizedEntities | null`

### ✅ Integration Points

- **API Endpoint** (`/api/discharge/orchestrate`): ✅ Passes through orchestration result unchanged
- **tRPC Mutation** (`triggerDischarge`): ✅ Already handles partial success gracefully
- **Batch Operations**: ✅ No changes needed, works with minimal IDEXX notes
- **Discharge Readiness**: ✅ Already checks for any text, not substantial text

## Expected Impact

### Before (Production Issue)

| Scenario                            | Behavior                     |
| ----------------------------------- | ---------------------------- |
| Minimal IDEXX notes ("N/T")         | ❌ Failed at extractEntities |
| Substantial IDEXX notes (>50 chars) | ✅ Succeeded                 |
| Euthanasia cases                    | ✅ (Manual prevention only)  |

### After (Fixed)

| Scenario                            | Behavior                          |
| ----------------------------------- | --------------------------------- |
| Minimal IDEXX notes ("N/T")         | ✅ Skips extraction, uses DB data |
| Substantial IDEXX notes (>50 chars) | ✅ Extracts entities              |
| Euthanasia cases                    | ❌ Blocked automatically          |

### Metrics Improvement

- **Failure Rate**: 90.8% → ~0% (except euthanasia)
- **Successful Discharges**: 40/week → 433/week (10.8x increase)
- **Cases Processed**: 9.2% → 100% (non-euthanasia)

## Workflow Examples

### Example 1: Minimal Text Case (New Behavior)

```
Input: IDEXX case with notes "N/T " (4 chars)

Steps:
1. ingest ✅ (case ingested)
2. extractEntities ✅ (skipped: true, entities: null, reason: "Minimal text...")
3. generateSummary ✅ (uses SOAP notes from DB, patientData from DB)
4. prepareEmail ✅ (uses DB patient data)
5. scheduleEmail ✅
6. scheduleCall ✅

Result: SUCCESS (discharge email/call scheduled)
```

### Example 2: Euthanasia Case (Blocked)

```
Input: Case with appointment_type="Euthanasia" or text contains "euthanasia"

Steps:
1. ingest ✅
2. extractEntities ❌ (Error: "Euthanasia case detected...")
3. generateSummary ⊗ (skipped - dependency failed)
4. prepareEmail ⊗ (skipped - dependency failed)
5. scheduleEmail ⊗ (skipped - dependency failed)
6. scheduleCall ⊗ (skipped - dependency failed)

Result: FAILED (discharge blocked as intended)
```

### Example 3: Substantial Text Case (Unchanged)

```
Input: Case with consultation notes >50 chars

Steps:
1. ingest ✅
2. extractEntities ✅ (entities extracted successfully)
3. generateSummary ✅ (enriched with extracted entities)
4. prepareEmail ✅
5. scheduleEmail ✅
6. scheduleCall ✅

Result: SUCCESS (same as before)
```

## Safety Considerations

### ✅ Data Safety

- Euthanasia cases blocked via multi-source detection
- No data loss - database patient data used as fallback
- Existing entity extraction behavior preserved for substantial text

### ✅ Code Safety

- Type-safe implementation (nullable entities properly typed)
- All downstream code already handles null entities
- No breaking changes to existing integrations

### ✅ User Experience

- More cases can complete discharge workflow
- No false positives (minimal text doesn't cause incorrect discharges)
- Clear logging for debugging (`skipped: true`, `reason` field)

## Monitoring Recommendations

After deployment, monitor:

1. **Entity extraction skip rate**: How many cases skip extraction vs extract?
2. **Discharge success rate**: Should increase from ~9% to ~100%
3. **Euthanasia detection accuracy**: Verify no false positives/negatives
4. **Summary quality**: Ensure summaries are still meaningful with null entities

## Rollback Plan

If issues arise, revert commits:

1. `libs/services-discharge/src/lib/discharge-orchestrator.ts` (lines 591-632)
2. `libs/types/src/orchestration.ts` (lines 73, 75-76)

Original behavior will be restored (minimal text cases will fail again).

## Next Steps

1. ✅ Code changes complete
2. ✅ Tests passing
3. ✅ Linting passing
4. ⏳ Deploy to staging
5. ⏳ Monitor staging metrics
6. ⏳ Deploy to production
7. ⏳ Monitor production logs for 24-48 hours

---

**Implemented by:** AI Assistant  
**Date:** December 10, 2025  
**Verified:** TypeScript compilation, linting, tests all passing
