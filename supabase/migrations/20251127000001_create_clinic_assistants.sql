-- Create clinic_assistants table for mapping clinics to VAPI assistants
-- Allows multiple assistants per clinic (e.g., different departments)

CREATE TABLE IF NOT EXISTS clinic_assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  clinic_name text NOT NULL,
  assistant_id text NOT NULL,
  phone_number_id text,
  
  is_active boolean NOT NULL DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one active assistant per clinic (can have multiple inactive)
  UNIQUE(clinic_name, assistant_id)
);

-- Create indexes
CREATE INDEX idx_clinic_assistants_clinic_name ON clinic_assistants(clinic_name);
CREATE INDEX idx_clinic_assistants_assistant_id ON clinic_assistants(assistant_id);
CREATE INDEX idx_clinic_assistants_active ON clinic_assistants(clinic_name, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE clinic_assistants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view assistants for their clinic
CREATE POLICY "Users can view clinic assistants"
  ON clinic_assistants
  FOR SELECT
  USING (
    clinic_name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
      AND clinic_name = clinic_assistants.clinic_name
    )
  );

-- Admins and practice owners can manage assistants for their clinic
CREATE POLICY "Admins can manage clinic assistants"
  ON clinic_assistants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
      AND clinic_name = clinic_assistants.clinic_name
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
      AND clinic_name = clinic_assistants.clinic_name
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage clinic assistants"
  ON clinic_assistants
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_clinic_assistants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinic_assistants_updated_at
  BEFORE UPDATE ON clinic_assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_assistants_updated_at();

-- Add comments
COMMENT ON TABLE clinic_assistants IS 'Maps clinic names to VAPI assistant IDs and phone numbers. Allows multiple assistants per clinic.';
COMMENT ON COLUMN clinic_assistants.clinic_name IS 'Name of the clinic (matches users.clinic_name)';
COMMENT ON COLUMN clinic_assistants.assistant_id IS 'VAPI assistant ID assigned to this clinic';
COMMENT ON COLUMN clinic_assistants.phone_number_id IS 'VAPI phone number ID for inbound calls';
COMMENT ON COLUMN clinic_assistants.is_active IS 'Whether this assistant mapping is currently active';

