-- Create vapi_bookings table
-- VAPI-created appointment requests with hold mechanism
-- Supports auto-rescheduling when conflicts detected

CREATE TABLE vapi_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES schedule_slots(id) ON DELETE SET NULL,

  -- Booking details
  date date NOT NULL,
  start_time time NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  patient_name text NOT NULL,
  species text,
  breed text,
  reason text,
  is_new_client boolean DEFAULT false,

  -- Status tracking
  status text NOT NULL DEFAULT 'pending',   -- 'pending'|'confirmed'|'rescheduled'|'cancelled'
  confirmation_number text UNIQUE,
  vapi_call_id text,

  -- Hold mechanism (5-min reservation during VAPI call)
  hold_expires_at timestamptz,

  -- Staleness tracking (when was data fresh at booking time)
  booked_at_sync_id uuid,
  sync_freshness_at_booking timestamptz,

  -- Conflict handling
  has_conflict boolean NOT NULL DEFAULT false,
  original_date date,                        -- If rescheduled, original date
  original_time time,                        -- If rescheduled, original time
  rescheduled_at timestamptz,
  rescheduled_reason text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_vapi_bookings_clinic
  ON vapi_bookings(clinic_id);

CREATE INDEX idx_vapi_bookings_clinic_date
  ON vapi_bookings(clinic_id, date);

CREATE INDEX idx_vapi_bookings_status
  ON vapi_bookings(status);

CREATE INDEX idx_vapi_bookings_pending
  ON vapi_bookings(clinic_id, date, start_time)
  WHERE status = 'pending';

CREATE INDEX idx_vapi_bookings_hold
  ON vapi_bookings(clinic_id, date, start_time, hold_expires_at)
  WHERE status = 'pending' AND hold_expires_at > now();

CREATE INDEX idx_vapi_bookings_conflicts
  ON vapi_bookings(clinic_id, has_conflict)
  WHERE has_conflict = true;

CREATE INDEX idx_vapi_bookings_vapi_call
  ON vapi_bookings(vapi_call_id);

-- Enable RLS
ALTER TABLE vapi_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view bookings for their clinic"
  ON vapi_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = vapi_bookings.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Users can update bookings for their clinic"
  ON vapi_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = vapi_bookings.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Service role can manage bookings"
  ON vapi_bookings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_vapi_bookings_updated_at
  BEFORE UPDATE ON vapi_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE vapi_bookings IS 'Appointment requests created by VAPI AI calls. Includes hold mechanism and auto-reschedule support.';
COMMENT ON COLUMN vapi_bookings.hold_expires_at IS '5-minute hold during VAPI call to prevent double booking';
COMMENT ON COLUMN vapi_bookings.confirmation_number IS 'Unique confirmation number given to caller (e.g., ODIS-A1B2C3D4)';
COMMENT ON COLUMN vapi_bookings.has_conflict IS 'True if a conflict was detected during sync and booking was rescheduled';
COMMENT ON COLUMN vapi_bookings.original_date IS 'Original requested date before rescheduling';
COMMENT ON COLUMN vapi_bookings.original_time IS 'Original requested time before rescheduling';
