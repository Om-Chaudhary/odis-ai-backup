# Schedule Builder Component

User-friendly schedule configuration replacing raw cron expression inputs.

## Installation

The schedule builder requires the `cron-parser` dependency. Install it by running:

```bash
pnpm install
```

This will install `cron-parser` and `@types/cron-parser` which were added to `package.json`.

## Usage

```tsx
import { ScheduleBuilder } from "./schedule-builder";

function MyComponent() {
  const [cron, setCron] = useState("0 9 * * 1-5");

  return (
    <ScheduleBuilder
      value={cron}
      onChange={setCron}
      enabled={true}
      timezone="America/Los_Angeles"
      label="Sync Schedule"
      description="Configure when syncs should run"
    />
  );
}
```

## Features

### Simple Mode (Default)
- Visual day-of-week selector
- Time picker with 15-minute intervals
- Multiple times per day
- Quick preset buttons (Weekdays, Weekend, All, Clear)
- Live preview of next 3 sync times

### Advanced Mode
- Raw cron expression input
- Real-time validation
- Format help and examples

### Presets
- **Business Hours**: 9 AM, 2 PM, 5 PM on weekdays (`0 9,14,17 * * 1-5`)
- **Every 4 Hours**: 8 AM, 12 PM, 4 PM daily (`0 8,12,16 * * *`)
- **Once Daily**: 9 AM every day (`0 9 * * *`)
- **Twice Daily**: 9 AM and 5 PM daily (`0 9,17 * * *`)

## Architecture

### Components
- `schedule-builder.tsx` - Main orchestrator
- `simple-schedule-picker.tsx` - Visual day/time UI
- `advanced-schedule-input.tsx` - Raw cron input
- `schedule-preview.tsx` - Next run times display
- `schedule-mode-toggle.tsx` - Simple ↔ Advanced switcher
- `schedule-presets.tsx` - Quick templates

### Utilities
- `cron-builder.ts` - Convert UI state → cron
- `cron-parser.ts` - Parse cron → UI state
- `schedule-validator.ts` - Validate schedules

### Hooks
- `use-cron-converter.ts` - Conversion between formats
- `use-schedule-preview.ts` - Calculate next occurrences
- `use-schedule-builder.ts` - Main state management

## Supported Cron Patterns

### Simple Mode (Auto-parsed)
- ✅ Multiple hours: `0 8,12,17 * * *`
- ✅ Specific days: `0 9 * * 1-5`
- ✅ Daily: `0 9 * * *`
- ✅ Weekdays: `0 9,14 * * 1-5`

### Advanced Mode (Manual entry)
- Complex day-of-month patterns
- Month-specific schedules
- Non-zero minute values
- Step values and ranges

## Testing

### Manual Testing Checklist
1. Navigate to Admin → Sync Schedule
2. Click "Configure" on a clinic
3. Test Simple Mode:
   - [ ] Select/deselect days
   - [ ] Add/remove times
   - [ ] Verify preview updates
   - [ ] Test quick buttons (Weekdays, Weekend, All, Clear)
   - [ ] Apply presets
4. Test Advanced Mode:
   - [ ] Switch to Advanced mode
   - [ ] Enter valid cron
   - [ ] Enter invalid cron (verify error)
   - [ ] Switch back to Simple (verify parsing)
5. Save and reload:
   - [ ] Save schedule
   - [ ] Reload page
   - [ ] Verify schedule displays correctly

### Unit Testing
Run component tests:
```bash
nx test web --testPathPattern=schedule-builder
```

## Troubleshooting

### Module 'cron-parser' not found
Run `pnpm install` to install dependencies.

### Preview shows wrong times
Verify the `timezone` prop matches the clinic's timezone setting.

### Complex cron not parsing in Simple Mode
This is expected behavior. Use Advanced Mode for complex patterns.

## Future Enhancements
- Per-day custom times (different times for Mon vs Tue)
- Visual calendar picker for specific dates
- Holiday exclusions
- Conflict detection (warn if schedules overlap)
- Bulk edit across multiple clinics
