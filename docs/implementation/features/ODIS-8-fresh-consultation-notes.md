# ODIS-8: Fresh Consultation Notes at Discharge Time

## Problem Statement

The consultation notes data was becoming stale during the discharge process because the system relied on cached data from the last calendar sync rather than fetching fresh data at discharge time. This could result in outdated or missing clinical information being used in discharge summaries.

## Solution

The fix ensures that fresh consultation notes are used during discharge summary generation by properly extracting and using SOAP notes that are already being fetched from the database.

### Key Discovery

Through investigation, we found that:

1. The extension **was** already fetching fresh consultation notes from IDEXX
2. The notes **were** being saved to the `soap_notes` table
3. The notes **were** being fetched by `getCaseWithEntities()`
4. **BUT** the notes were not being used - the orchestrator was passing `soapContent: null` to the summary generator

## Implementation Details

### File Modified

- `/src/lib/services/discharge-orchestrator.ts`

### Changes Made

In the `executeSummaryGeneration()` method, we added logic to:

1. **Extract SOAP content** from the fetched case data
2. **Check for staleness** (>24 hours old)
3. **Use priority order** for content extraction:
   - First priority: `client_instructions` (most relevant for discharge)
   - Second priority: Combined SOAP sections (subjective, objective, assessment, plan)
4. **Add comprehensive logging** for monitoring and debugging
5. **Graceful fallback** to entity extraction if no SOAP notes are available

### Code Flow

```typescript
// Before (Line 566)
const summaryContent = await generateDischargeSummaryWithRetry({
  soapContent: null, // Always null - not using available SOAP notes!
  entityExtraction: caseInfo.entities ?? null,
  // ...
});

// After
// Extract SOAP content from case data
let soapContent: string | null = null;
if (caseInfo.soapNotes && caseInfo.soapNotes.length > 0) {
  const latestSoapNote = caseInfo.soapNotes[0];

  // Check staleness
  const isStale = /* check if >24 hours old */;

  // Use client_instructions or combined SOAP sections
  soapContent = latestSoapNote.client_instructions || combinedSections;
}

const summaryContent = await generateDischargeSummaryWithRetry({
  soapContent, // Now includes fresh SOAP notes!
  entityExtraction: caseInfo.entities ?? null,
  // ...
});
```

## Data Flow

```
Extension (IDEXX Page)
    ↓ Fetches fresh consultation notes
POST /api/discharge/orchestrate
    ↓ Ingests data & creates SOAP note
DischargeOrchestrator.orchestrate()
    ↓
executeSummaryGeneration()
    ↓ Fetches case with SOAP notes
    ↓ **NEW: Extracts SOAP content**
generateDischargeSummary()
    ↓ Uses fresh SOAP content
Discharge Summary with Fresh Data
```

## Monitoring & Logging

The implementation includes comprehensive logging to track:

- When SOAP notes are found/missing
- Which SOAP fields are being used (client_instructions vs combined sections)
- Staleness detection (logs warning if >24 hours old)
- Content length for debugging
- Fallback to entity extraction when no SOAP notes exist

### Log Examples

```javascript
// Using fresh client instructions
[ORCHESTRATOR] Using SOAP client_instructions for summary {
  caseId: "123",
  soapNoteId: "456",
  contentLength: 1500,
  isStale: false
}

// Warning for stale notes
[ORCHESTRATOR] SOAP notes may be stale {
  caseId: "123",
  soapNoteId: "456",
  createdAt: "2025-11-27T10:00:00Z",
  ageHours: 36
}

// Fallback when no SOAP notes
[ORCHESTRATOR] No SOAP notes found for case {
  caseId: "123",
  fallbackToEntities: true
}
```

## Testing Checklist

- [x] TypeScript compilation passes
- [x] Linting passes
- [x] Build succeeds
- [ ] Manual testing with IDEXX discharge flow
- [ ] Verify fresh notes appear in generated summary
- [ ] Test fallback behavior with missing SOAP notes
- [ ] Monitor logs in production for any edge cases

## Future Enhancements

While this fix addresses the immediate issue, potential future improvements include:

1. **Manual Refresh Button**: Add UI to manually trigger consultation notes refresh
2. **Automatic Staleness Alerts**: Notify users when notes are >X days old
3. **Background Sync**: Periodically refresh notes for scheduled discharges
4. **Audit Trail**: Track when and why notes were refreshed

## References

- JIRA Ticket: [ODIS-8](https://odisai.atlassian.net/browse/ODIS-8)
- Related Files:
  - `/src/lib/services/discharge-orchestrator.ts`
  - `/src/lib/services/cases-service.ts`
  - `/src/lib/ai/generate-discharge.ts`
  - Extension: `/pages/content-ui/src/matches/idexx/services/discharge/discharge-scheduler.ts`
