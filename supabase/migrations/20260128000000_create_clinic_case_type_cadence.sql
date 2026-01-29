-- Migration: Create clinic_case_type_cadence table
-- Maps case types to scheduling delay settings per clinic

CREATE TABLE IF NOT EXISTS clinic_case_type_cadence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  case_type TEXT NOT NULL,  -- 'wellness_exam', 'surgery', 'sick_visit', 'euthanasia', etc.
  auto_schedule_call BOOLEAN DEFAULT true,
  auto_schedule_email BOOLEAN DEFAULT true,
  call_delay_days INTEGER DEFAULT 1,
  email_delay_days INTEGER DEFAULT 1,
  preferred_call_time TIME DEFAULT '10:00:00',
  preferred_email_time TIME DEFAULT '09:00:00',
  never_auto_schedule BOOLEAN DEFAULT false,  -- e.g., euthanasia cases
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, case_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clinic_case_type_cadence_clinic_id
  ON clinic_case_type_cadence(clinic_id);

CREATE INDEX IF NOT EXISTS idx_clinic_case_type_cadence_case_type
  ON clinic_case_type_cadence(case_type);

-- Enable RLS
ALTER TABLE clinic_case_type_cadence ENABLE ROW LEVEL SECURITY;

-- RLS policies using hybrid auth pattern
CREATE POLICY "Users can view cadence for their clinic" ON clinic_case_type_cadence
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT uca.clinic_id FROM user_clinic_access uca
      WHERE uca.user_id = COALESCE(
        (SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'),
        auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert cadence for their clinic" ON clinic_case_type_cadence
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT uca.clinic_id FROM user_clinic_access uca
      WHERE uca.user_id = COALESCE(
        (SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'),
        auth.uid()
      )
      AND uca.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update cadence for their clinic" ON clinic_case_type_cadence
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT uca.clinic_id FROM user_clinic_access uca
      WHERE uca.user_id = COALESCE(
        (SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'),
        auth.uid()
      )
      AND uca.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete cadence for their clinic" ON clinic_case_type_cadence
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT uca.clinic_id FROM user_clinic_access uca
      WHERE uca.user_id = COALESCE(
        (SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'),
        auth.uid()
      )
      AND uca.role IN ('owner', 'admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_clinic_case_type_cadence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinic_case_type_cadence_updated_at
  BEFORE UPDATE ON clinic_case_type_cadence
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_case_type_cadence_updated_at();

-- Add comment for documentation
COMMENT ON TABLE clinic_case_type_cadence IS 'Stores per-clinic scheduling delay settings for different case types';
COMMENT ON COLUMN clinic_case_type_cadence.case_type IS 'Standardized case type: euthanasia, surgery, wellness_exam, sick_visit, dental, emergency, vaccination, follow_up, general';
COMMENT ON COLUMN clinic_case_type_cadence.never_auto_schedule IS 'If true, cases of this type will never be auto-scheduled (e.g., euthanasia)';
