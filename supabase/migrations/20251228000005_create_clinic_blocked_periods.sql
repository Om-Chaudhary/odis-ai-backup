-- Create clinic_blocked_periods table
-- Recurring blocked periods like lunch breaks, staff meetings
-- Used to exclude time slots from availability

CREATE TABLE clinic_blocked_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Block details
  name text NOT NULL,                       -- 'Lunch Break', 'Staff Meeting', etc.
  start_time time NOT NULL,
  end_time time NOT NULL,
  days_of_week int[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],  -- Which days this applies

  -- Control
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Validations
  CONSTRAINT clinic_blocked_periods_valid_times CHECK (start_time < end_time)
);

-- Indexes
CREATE INDEX idx_clinic_blocked_periods_clinic
  ON clinic_blocked_periods(clinic_id);

CREATE INDEX idx_clinic_blocked_periods_active
  ON clinic_blocked_periods(clinic_id, is_active)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE clinic_blocked_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view blocked periods for their clinic"
  ON clinic_blocked_periods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_blocked_periods.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Admins can manage blocked periods"
  ON clinic_blocked_periods
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

CREATE POLICY "Service role can manage blocked periods"
  ON clinic_blocked_periods
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_clinic_blocked_periods_updated_at
  BEFORE UPDATE ON clinic_blocked_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE clinic_blocked_periods IS 'Recurring blocked time periods (lunch breaks, meetings) excluded from scheduling';
COMMENT ON COLUMN clinic_blocked_periods.name IS 'Human-readable name like "Lunch Break" or "Staff Meeting"';
COMMENT ON COLUMN clinic_blocked_periods.days_of_week IS 'Days this block applies. 0=Sunday, 1=Monday, ..., 6=Saturday';
