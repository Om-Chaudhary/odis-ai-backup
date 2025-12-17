# IDEXX Neo Schedule Scraper

Automatically extract and sync IDEXX Neo schedule appointments to your Supabase cases table.

## Features

- 🔍 **Intelligent DOM Extraction** - Automatically detects and extracts appointment data from IDEXX Neo schedule pages
- 🔄 **One-Click Sync** - Floating button appears on schedule pages for easy syncing
- 📦 **JSONB Storage** - Flexible metadata storage for all IDEXX-specific data
- 🚫 **Deduplication** - Uses `external_id` to prevent duplicate imports
- ✅ **Type-Safe** - Full TypeScript support with defined interfaces
- 🎯 **Minimal Schema** - Only 4 new columns added to cases table

## Setup

### 1. Run Database Migration

Run the migration file to add the required columns to your `cases` table:

```bash
# Using Supabase CLI
supabase migration new add_idexx_schedule_sync
# Copy contents from: supabase/migrations/20250128000000_add_idexx_schedule_sync.sql

# Or run directly in Supabase SQL Editor
# Paste the contents of the migration file
```

### 2. Build and Load Extension

```bash
pnpm build
# Load extension in Chrome from dist/ folder
```

### 3. Navigate to IDEXX Neo Schedule

1. Log into IDEXX Neo
2. Navigate to the Schedule view
3. Look for the "Sync Schedule" button in the bottom-right corner

## Usage

### Syncing Appointments

1. **Automatic Detection**: The sync button appears automatically when you're on a schedule page
2. **Click "Sync Schedule"**: Button extracts all visible appointments
3. **View Results**: Success notification shows how many appointments were synced
4. **Check Supabase**: View synced appointments in your cases table

### Accessing Synced Data

```typescript
import { getSyncedAppointments } from './utils/schedule-sync';

// Get all synced appointments
const appointments = await getSyncedAppointments();

// Each appointment is a Case with:
// - source: 'idexx_neo'
// - external_id: 'idexx-appt-{appointment_id}'
// - scheduled_at: ISO timestamp
// - metadata.idexx: { patient_name, client_name, provider_name, ... }
```

### Querying in Supabase

```sql
-- Get all IDEXX appointments
SELECT * FROM cases
WHERE source = 'idexx_neo'
ORDER BY scheduled_at DESC;

-- Get appointments with patient info
SELECT
  id,
  scheduled_at,
  metadata->'idexx'->>'patient_name' as patient,
  metadata->'idexx'->>'client_name' as client,
  metadata->'idexx'->>'provider_name' as provider
FROM cases
WHERE source = 'idexx_neo';

-- Search by patient name
SELECT * FROM cases
WHERE metadata @> '{"idexx": {"patient_name": "Fluffy"}}'::jsonb;

-- Get appointments by provider
SELECT * FROM cases
WHERE metadata->'idexx'->>'provider_name' = 'Dr. Smith'
ORDER BY scheduled_at;

-- Get appointments by status
SELECT * FROM cases
WHERE metadata->'idexx'->>'appointment_status' = 'Scheduled';
```

## Architecture

### File Structure

```
matches/idexx/
├── components/
│   ├── SyncScheduleButton.tsx     # Floating sync button UI
│   ├── TemplateButton.tsx         # CKEditor toolbar button
│   └── TemplateDropdown.tsx       # SOAP template picker
├── utils/
│   ├── schedule-extractor.ts      # DOM scraping logic
│   ├── schedule-sync.ts           # Supabase sync functions
│   ├── soap-note-fetcher.ts       # Fetch last SOAP note
│   └── template-inserter.ts       # Insert templates into editor
└── App.tsx                        # Main integration component
```

### Data Flow

```
IDEXX Neo Schedule Page
        ↓
  [DOM Extraction]
        ↓
  ScheduleAppointment[]
        ↓
   [Sync to Supabase]
        ↓
   cases table
   (with metadata JSONB)
```

### Extracted Data

Each appointment includes:

```typescript
interface ScheduleAppointment {
  id: string;
  startTime: Date | null;
  duration: number | null;
  patient: {
    name: string | null;
    id: string | null;
    species: string | null;
    breed: string | null;
  };
  client: {
    name: string | null;
    id: string | null;
    phone: string | null;
    email: string | null;
  };
  provider: {
    name: string | null;
    id: string | null;
  };
  type: string | null;
  status: string | null;
  notes: string | null;
  reason: string | null;
}
```

### Database Schema

```sql
-- New columns in cases table
source TEXT DEFAULT 'manual'              -- 'idexx_neo', 'manual', etc.
external_id TEXT UNIQUE                   -- 'idexx-appt-{appointment_id}'
scheduled_at TIMESTAMP WITH TIME ZONE     -- Appointment time
metadata JSONB DEFAULT '{}'               -- All IDEXX data
```

## Customization

### Adjusting DOM Selectors

If IDEXX Neo updates their UI, you may need to update the selectors in `schedule-extractor.ts`:

```typescript
// Look for these patterns in the DOM
const appointmentElements = document.querySelectorAll(
  '.appointment-card',          // Add your selector
  '.appointment-row',            // Add your selector
  '[data-qa*="appointment"]',   // Add your selector
);
```

### Adding Custom Metadata

Extend the metadata structure in `schedule-sync.ts`:

```typescript
metadata: {
  idexx: {
    // ... existing fields
    custom_field: 'your_value',
    custom_data: { ... },
  },
  // Add other integrations
  my_integration: { ... },
}
```

## Troubleshooting

### No Appointments Extracted

1. **Check Console**: Open DevTools and look for `[ODIS]` log messages
2. **Inspect DOM**: Check if appointment elements exist on the page
3. **Update Selectors**: IDEXX Neo may have changed their HTML structure

### Sync Fails

1. **Check Authentication**: Ensure you're signed into the extension
2. **Check Network**: Open Network tab and look for failed requests to Supabase
3. **Check RLS Policies**: Ensure your Supabase RLS policies allow inserts

### Duplicate Appointments

- The `external_id` field should prevent duplicates
- Check if the ID extraction is working correctly
- Each appointment should have a unique `idexx-appt-{id}` external_id

## Development

### Testing Extraction Locally

```typescript
import { scheduleExtractor } from './utils/schedule-extractor';

// Extract appointments without syncing
const appointments = await scheduleExtractor.extractScheduleData();
console.log('Extracted:', appointments);
```

### Testing Sync Locally

```typescript
import { syncScheduleToSupabase } from './utils/schedule-sync';

const appointments = [/* your test data */];
const result = await syncScheduleToSupabase(appointments);
console.log('Sync result:', result);
```

## Future Enhancements

- [ ] Automatic periodic syncing
- [ ] Conflict resolution UI
- [ ] Batch sync with date range picker
- [ ] Export to CSV
- [ ] Integration with other PIMS systems
- [ ] Sync status indicator
- [ ] Selective sync (choose which appointments)

## Support

If you encounter issues:

1. Check browser console for `[ODIS]` error messages
2. Verify the migration was run successfully
3. Check Supabase logs for database errors
4. Inspect the IDEXX Neo page DOM structure
