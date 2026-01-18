-- Add sync_schedules column to clinic_schedule_config
-- Per-clinic cron scheduling for automated sync operations

ALTER TABLE clinic_schedule_config
ADD COLUMN sync_schedules jsonb DEFAULT '[]'::jsonb;

-- Add validation constraint
ALTER TABLE clinic_schedule_config
ADD CONSTRAINT clinic_schedule_config_valid_sync_schedules
  CHECK (
    jsonb_typeof(sync_schedules) = 'array'
  );

-- Comment
COMMENT ON COLUMN clinic_schedule_config.sync_schedules IS
  'Array of sync schedules: [{"type": "inbound"|"cases"|"reconciliation", "cron": "0 6 * * *", "enabled": true}]';

-- Example sync schedules for reference:
-- [
--   {"type": "inbound", "cron": "0 6 * * *", "enabled": true},
--   {"type": "cases", "cron": "0 8,14,20 * * *", "enabled": true},
--   {"type": "reconciliation", "cron": "0 2 * * *", "enabled": true}
-- ]
