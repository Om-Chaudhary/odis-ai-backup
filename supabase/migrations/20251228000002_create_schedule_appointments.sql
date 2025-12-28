-- Create schedule_appointments table
-- Individual appointments synced from IDEXX Neo
-- Links to schedule_slots for capacity tracking

CREATE TABLE schedule_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES schedule_slots(id) ON DELETE SET NULL,

  -- IDEXX appointment data
  neo_appointment_id text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  patient_name text,
  client_name text,
  client_phone text,
  provider_name text,
  room_id text,
  appointment_type text,
  status text NOT NULL,                   -- 'scheduled'|'finalized'|'no_show'|'cancelled'|'in_progress'

  -- Sync tracking
  sync_hash text,                         -- SHA256 hash for change detection
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,                 -- Soft delete if removed from IDEXX

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for neo_appointment_id (only for non-deleted)
CREATE UNIQUE INDEX schedule_appointments_neo_unique
  ON schedule_appointments(clinic_id, neo_appointment_id)
  WHERE deleted_at IS NULL;

-- Performance indexes
CREATE INDEX idx_schedule_appointments_clinic_date
  ON schedule_appointments(clinic_id, date);

CREATE INDEX idx_schedule_appointments_slot
  ON schedule_appointments(slot_id);

CREATE INDEX idx_schedule_appointments_status
  ON schedule_appointments(status)
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE INDEX idx_schedule_appointments_sync
  ON schedule_appointments(clinic_id, last_synced_at);

CREATE INDEX idx_schedule_appointments_active
  ON schedule_appointments(clinic_id, date, start_time)
  WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'no_show');

-- Enable RLS
ALTER TABLE schedule_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view appointments for their clinic"
  ON schedule_appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Service role can manage appointments"
  ON schedule_appointments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_schedule_appointments_updated_at
  BEFORE UPDATE ON schedule_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE schedule_appointments IS 'Appointments synced from IDEXX Neo. Each appointment links to a schedule_slot for capacity tracking.';
COMMENT ON COLUMN schedule_appointments.neo_appointment_id IS 'Unique appointment ID from IDEXX Neo';
COMMENT ON COLUMN schedule_appointments.sync_hash IS 'SHA256 hash of appointment data for detecting changes during sync';
COMMENT ON COLUMN schedule_appointments.deleted_at IS 'Soft delete timestamp when appointment is removed from IDEXX';
