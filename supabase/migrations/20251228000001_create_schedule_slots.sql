-- Create schedule_slots table
-- Core availability data - the source of truth for appointment booking
-- Each row represents a 15-minute time slot with capacity (based on IDEXX rooms)

CREATE TABLE schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Slot time range
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,

  -- Capacity tracking
  capacity int NOT NULL DEFAULT 2,        -- From IDEXX rooms count
  booked_count int NOT NULL DEFAULT 0,    -- Current appointments in this slot

  -- Sync metadata
  last_synced_at timestamptz,
  sync_id uuid,                           -- References schedule_syncs(id)

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT schedule_slots_unique_slot UNIQUE(clinic_id, date, start_time),
  CONSTRAINT schedule_slots_valid_times CHECK (start_time < end_time),
  CONSTRAINT schedule_slots_valid_capacity CHECK (capacity > 0),
  CONSTRAINT schedule_slots_valid_booked CHECK (booked_count >= 0)
);

-- Performance indexes
CREATE INDEX idx_schedule_slots_clinic_date
  ON schedule_slots(clinic_id, date);

CREATE INDEX idx_schedule_slots_availability
  ON schedule_slots(clinic_id, date, start_time)
  WHERE booked_count < capacity;

CREATE INDEX idx_schedule_slots_sync
  ON schedule_slots(sync_id);

CREATE INDEX idx_schedule_slots_stale
  ON schedule_slots(clinic_id, last_synced_at);

-- Enable RLS
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view slots for their clinic"
  ON schedule_slots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_slots.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Service role can manage slots"
  ON schedule_slots
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_schedule_slots_updated_at
  BEFORE UPDATE ON schedule_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE schedule_slots IS 'Time slots for appointment booking. Each slot has a capacity (from IDEXX rooms) and tracks how many appointments are booked.';
COMMENT ON COLUMN schedule_slots.capacity IS 'Maximum appointments per slot, derived from IDEXX rooms count';
COMMENT ON COLUMN schedule_slots.booked_count IS 'Current number of appointments booked in this slot';
COMMENT ON COLUMN schedule_slots.last_synced_at IS 'When this slot was last synced from IDEXX';
