-- Add outbound full sync schedule for Alum Rock Animal Hospital
-- Runs nightly at 11 PM Pacific (after business hours)
-- Uses 1 day backward + 1 day forward for daily catch-up

-- First, get current sync_schedules for Alum Rock
-- Then append the outbound sync entry

-- Get Alum Rock's clinic ID
-- SELECT id FROM clinics WHERE name = 'Alum Rock Animal Hospital';

-- Update the sync_schedules JSONB array to include outbound cases sync
-- The scheduler supports 'inbound', 'cases', and 'reconciliation' types
-- For outbound, we use 'cases' type which runs CaseSyncService (InboundSyncService pulls appointments,
-- CaseSyncService enriches with SOAP/AI)

-- Check if config exists, if so update, otherwise insert
DO $$
DECLARE
  v_clinic_id uuid;
  v_config_exists boolean;
  v_existing_schedules jsonb;
BEGIN
  -- Get clinic ID
  SELECT id INTO v_clinic_id FROM clinics WHERE name = 'Alum Rock Animal Hospital';

  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Alum Rock Animal Hospital not found';
  END IF;

  -- Check if config exists
  SELECT EXISTS(
    SELECT 1 FROM clinic_schedule_config WHERE clinic_id = v_clinic_id
  ) INTO v_config_exists;

  IF v_config_exists THEN
    -- Get existing schedules
    SELECT sync_schedules INTO v_existing_schedules
    FROM clinic_schedule_config WHERE clinic_id = v_clinic_id;

    -- Check if 'cases' schedule already exists
    IF v_existing_schedules IS NOT NULL AND
       EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_schedules) AS s WHERE s->>'type' = 'cases') THEN
      RAISE NOTICE 'Cases sync schedule already exists for Alum Rock, skipping';
    ELSE
      -- Append new schedules: inbound (appointments pull) + cases (enrich) + reconciliation
      UPDATE clinic_schedule_config
      SET sync_schedules = COALESCE(v_existing_schedules, '[]'::jsonb) ||
        '[
          {"type": "inbound", "cron": "0 23 * * *", "enabled": true},
          {"type": "cases", "cron": "5 23 * * *", "enabled": true},
          {"type": "reconciliation", "cron": "30 23 * * *", "enabled": true}
        ]'::jsonb,
        updated_at = now()
      WHERE clinic_id = v_clinic_id;

      RAISE NOTICE 'Added nightly outbound sync schedules for Alum Rock';
    END IF;
  ELSE
    -- Create new config
    INSERT INTO clinic_schedule_config (
      clinic_id,
      sync_schedules,
      timezone,
      open_time,
      close_time,
      days_of_week,
      slot_duration_minutes,
      default_capacity,
      sync_horizon_days,
      stale_threshold_minutes
    ) VALUES (
      v_clinic_id,
      '[
        {"type": "inbound", "cron": "0 23 * * *", "enabled": true},
        {"type": "cases", "cron": "5 23 * * *", "enabled": true},
        {"type": "reconciliation", "cron": "30 23 * * *", "enabled": true}
      ]'::jsonb,
      'America/Los_Angeles',
      '08:00',
      '18:00',
      ARRAY[1,2,3,4,5],
      15,
      1,
      14,
      60
    );

    RAISE NOTICE 'Created clinic_schedule_config with nightly sync for Alum Rock';
  END IF;
END $$;

-- Verify
SELECT csc.clinic_id, c.name, csc.sync_schedules, csc.timezone
FROM clinic_schedule_config csc
JOIN clinics c ON c.id = csc.clinic_id
WHERE c.name = 'Alum Rock Animal Hospital';
