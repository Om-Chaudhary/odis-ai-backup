-- Create clinic_schedule_config table
-- Per-clinic business hours and scheduling settings
-- Populated from IDEXX /schedule/getScheduleConfigs API

CREATE TABLE clinic_schedule_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Business hours (from IDEXX /schedule/getScheduleConfigs)
  open_time time NOT NULL DEFAULT '08:00',
  close_time time NOT NULL DEFAULT '18:00',
  days_of_week int[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],  -- 0=Sun, 1=Mon, ..., 6=Sat

  -- Slot configuration
  slot_duration_minutes int NOT NULL DEFAULT 15,

  -- Capacity (from IDEXX rooms count)
  default_capacity int NOT NULL DEFAULT 2,

  -- Sync settings
  sync_horizon_days int NOT NULL DEFAULT 14,        -- How far ahead to sync
  stale_threshold_minutes int NOT NULL DEFAULT 60,  -- Consider data stale after this

  -- Timezone
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',

  -- IDEXX config snapshot (raw data from last sync)
  idexx_config_snapshot jsonb,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One config per clinic
  CONSTRAINT clinic_schedule_config_unique UNIQUE(clinic_id),

  -- Validations
  CONSTRAINT clinic_schedule_config_valid_times CHECK (open_time < close_time),
  CONSTRAINT clinic_schedule_config_valid_slot CHECK (slot_duration_minutes > 0 AND slot_duration_minutes <= 120),
  CONSTRAINT clinic_schedule_config_valid_capacity CHECK (default_capacity > 0),
  CONSTRAINT clinic_schedule_config_valid_horizon CHECK (sync_horizon_days > 0 AND sync_horizon_days <= 60),
  CONSTRAINT clinic_schedule_config_valid_stale CHECK (stale_threshold_minutes > 0)
);

-- Enable RLS
ALTER TABLE clinic_schedule_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view config for their clinic"
  ON clinic_schedule_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_schedule_config.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Admins can manage config"
  ON clinic_schedule_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Service role can manage config"
  ON clinic_schedule_config
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_clinic_schedule_config_updated_at
  BEFORE UPDATE ON clinic_schedule_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE clinic_schedule_config IS 'Per-clinic scheduling configuration, populated from IDEXX /schedule/getScheduleConfigs';
COMMENT ON COLUMN clinic_schedule_config.days_of_week IS 'Days clinic is open. 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN clinic_schedule_config.default_capacity IS 'Max appointments per slot, derived from IDEXX rooms count';
COMMENT ON COLUMN clinic_schedule_config.sync_horizon_days IS 'How many days ahead to sync schedule data';
COMMENT ON COLUMN clinic_schedule_config.stale_threshold_minutes IS 'Minutes after which slot data is considered stale';
COMMENT ON COLUMN clinic_schedule_config.idexx_config_snapshot IS 'Raw JSON from last IDEXX /schedule/getScheduleConfigs response';
