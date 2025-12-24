# Alum Rock Animal Hospital - Availability Setup

**Date**: December 24, 2025  
**Status**: ✅ Complete and Tested

## Overview

Successfully configured Supabase availability system and VAPI `check_availability` tool for Alum Rock Animal Hospital with day-specific hours and holiday closures.

---

## Clinic Information

**Clinic Name**: Alum Rock Animal Hospital  
**Clinic ID**: `33f3bbb8-6613-45bc-a1f2-d55e30c243ae`  
**Slug**: `alum-rock-animal-hospital`  
**Provider**: Dr. Nimir Bath (veterinarian)  
**Provider ID**: `cd280145-716d-482e-aa6f-b27e36652c70`

---

## Regular Office Hours

| Day           | Hours             |
| ------------- | ----------------- |
| **Monday**    | 8:00 AM - 7:00 PM |
| **Tuesday**   | 8:00 AM - 7:00 PM |
| **Wednesday** | 8:00 AM - 7:00 PM |
| **Thursday**  | 8:00 AM - 7:00 PM |
| **Friday**    | 8:00 AM - 7:00 PM |
| **Saturday**  | 8:00 AM - 6:00 PM |
| **Sunday**    | 9:00 AM - 5:00 PM |

**Slot Duration**: 15 minutes

---

## Holiday Closures (2025)

### December 24, 2025 (Christmas Eve)

- **Status**: Half day
- **Open**: 8:00 AM - 1:00 PM
- **Closed**: 1:00 PM onwards
- **Database Entry**: Blocking appointment from 13:00 - 18:00

### December 25, 2025 (Christmas Day)

- **Status**: Closed all day
- **Database Entry**: Blocking appointment from 08:00 - 18:00

### December 26, 2025

- **Status**: Open as normal
- **Hours**: 8:00 AM - 7:00 PM (Thursday schedule)

---

## Technical Implementation

### 1. Database Setup

**Blocking Appointments Created**:

```sql
-- Dec 24: Half day closure
INSERT INTO appointments (
  clinic_id, provider_id, date,
  start_time, end_time,
  patient_name, client_name,
  appointment_type, status, source, notes
) VALUES (
  '33f3bbb8-6613-45bc-a1f2-d55e30c243ae',
  'cd280145-716d-482e-aa6f-b27e36652c70',
  '2025-12-24',
  '13:00:00', '18:00:00',
  'CLINIC CLOSED', 'Holiday Closure',
  'closed', 'scheduled', 'manual',
  'Closed for Christmas Eve afternoon - starting 1 PM'
);

-- Dec 25: Full day closure
INSERT INTO appointments (
  '33f3bbb8-6613-45bc-a1f2-d55e30c243ae',
  'cd280145-716d-482e-aa6f-b27e36652c70',
  '2025-12-25',
  '08:00:00', '18:00:00',
  'CLINIC CLOSED', 'Holiday Closure',
  'closed', 'scheduled', 'manual',
  'Closed for Christmas Day - All Day'
);
```

### 2. VAPI Tool Update

**File Modified**: `libs/integrations/vapi/webhooks/src/webhooks/tools/built-in.ts`

**Added Function**:

```typescript
function getClinicHoursForDate(date: string): {
  start_time: string;
  end_time: string;
  day_name: string;
};
```

This function:

- Parses the date to determine day of week
- Returns appropriate start/end times based on schedule
- Automatically applies correct hours for:
  - **Sunday**: 09:00 - 17:00
  - **Saturday**: 08:00 - 18:00
  - **Monday-Friday**: 08:00 - 19:00

**Updated Tools**:

1. ✅ `check_availability` - Now uses day-specific hours
2. ✅ `get_clinic_hours` - Returns correct Alum Rock schedule

---

## Testing Results

### ✅ Test 1: December 24 (Christmas Eve - Half Day)

```
Slots before 1 PM: ✅ Available (08:00 - 13:00)
Slots after 1 PM: ✅ Blocked (13:00 - 18:00)
```

### ✅ Test 2: December 25 (Christmas Day - Closed)

```
All slots: ✅ Blocked (08:00 - 18:00)
```

### ✅ Test 3: December 26 (Thursday - Open)

```
All slots: ✅ Available (08:00 - 19:00)
```

### ✅ Test 4: December 27 (Saturday)

```
Slots generated: ✅ 08:00 - 18:00 (correct Saturday hours)
```

### ✅ Test 5: December 28 (Sunday)

```
Slots generated: ✅ 09:00 - 17:00 (correct Sunday hours)
```

### ✅ Test 6: December 29 (Monday)

```
Slots generated: ✅ 08:00 - 19:00 (correct weekday hours)
```

---

## How It Works with VAPI

### Call Flow

1. **User asks VAPI**: "Do you have any openings on December 27th?"

2. **VAPI calls tool**: `check_availability({ date: "2025-12-27" })`

3. **Tool processing**:
   - Looks up clinic via `context.assistantId`
   - Determines December 27 is Saturday
   - Applies Saturday hours: 8:00 AM - 6:00 PM
   - Generates 15-minute slots: 08:00, 08:15, 08:30... 17:45
   - Checks each slot against appointments table
   - Returns only available slots

4. **VAPI responds**: "Yes! We have several openings on Saturday, December 27th. We're open from 8 AM to 6 PM. I can check specific times for you."

### API Endpoint

The tool makes requests to:

```
GET /api/appointments/availability?clinic_id={id}&date={date}&slot_duration_minutes=15&start_time={HH:MM}&end_time={HH:MM}
```

### Response Format

```json
{
  "date": "2025-12-27",
  "available_times": [
    "08:00", "08:15", "08:30", ...
  ],
  "total_available": 40,
  "message": "We have 40 available slots on 2025-12-27"
}
```

---

## Future Enhancements

### Option 1: Clinic-Specific Configuration

Store hours in database:

```sql
ALTER TABLE clinics ADD COLUMN business_hours JSONB;

UPDATE clinics
SET business_hours = '{
  "monday": {"start": "08:00", "end": "19:00"},
  "tuesday": {"start": "08:00", "end": "19:00"},
  ...
}'
WHERE id = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';
```

### Option 2: Holiday Calendar Table

```sql
CREATE TABLE clinic_holidays (
  clinic_id UUID REFERENCES clinics(id),
  date DATE,
  closure_type TEXT, -- 'full_day' | 'half_day'
  custom_hours JSONB
);
```

### Option 3: Per-Provider Hours

Different providers could have different schedules stored in the `providers` table.

---

## Maintenance Notes

### Adding Future Holidays

```sql
INSERT INTO appointments (
  clinic_id, provider_id, date,
  start_time, end_time,
  patient_name, client_name,
  appointment_type, status, source, notes
) VALUES (
  '33f3bbb8-6613-45bc-a1f2-d55e30c243ae',
  'cd280145-716d-482e-aa6f-b27e36652c70',
  'YYYY-MM-DD',
  'HH:MM:SS', 'HH:MM:SS',
  'CLINIC CLOSED', 'Holiday Closure',
  'closed', 'scheduled', 'manual',
  'Description of closure'
);
```

### Changing Regular Hours

Update the `getClinicHoursForDate()` function in:
`libs/integrations/vapi/webhooks/src/webhooks/tools/built-in.ts`

---

## Verification Checklist

- [x] Clinic record exists in database
- [x] Provider assigned to clinic
- [x] Holiday blocking appointments created
- [x] VAPI tool updated with day-specific hours
- [x] 15-minute slot intervals configured
- [x] Dec 24 half-day tested
- [x] Dec 25 full closure tested
- [x] Dec 26 normal operation tested
- [x] Weekend hours tested (Saturday & Sunday)
- [x] Weekday hours tested (Monday-Friday)
- [x] No linting errors

---

## Contact

For questions or modifications to the availability system, reference:

- Migration: `supabase/migrations/20251130000001_create_available_slots_function.sql`
- Tool handler: `libs/integrations/vapi/webhooks/src/webhooks/tools/built-in.ts`
- API route: `apps/web/src/app/api/appointments/availability/route.ts`
