-- Create schedule sync and appointment booking database schema
-- Supports multiple clinics with different PIMS systems (IDEXX Neo, Avimark)
-- Designed to work alongside existing users.clinic_name text field

-- ============================================================================
-- CLINICS TABLE
-- ============================================================================
-- Central clinic registry that maps to users.clinic_name
-- This allows gradual migration from text-based clinic_name to UUID-based clinic_id
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- Matches users.clinic_name
  email text,
  phone text,
  address text,
  pims_type text NOT NULL DEFAULT 'idexx_neo', -- 'idexx_neo' | 'avimark' | 'other'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for name lookups (matching users.clinic_name)
CREATE INDEX idx_clinics_name ON clinics(name);
CREATE INDEX idx_clinics_pims_type ON clinics(pims_type);
CREATE INDEX idx_clinics_active ON clinics(is_active) WHERE is_active = true;

-- ============================================================================
-- PROVIDERS TABLE
-- ============================================================================
-- Veterinarians and staff members linked to clinics
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  neo_provider_id text NOT NULL, -- IDEXX Neo provider ID (or equivalent for other PIMS)
  name text NOT NULL,
  role text NOT NULL DEFAULT 'veterinarian', -- 'veterinarian' | 'vet_tech' | 'receptionist' | 'other'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, neo_provider_id)
);

-- Indexes for providers
CREATE INDEX idx_providers_clinic_id ON providers(clinic_id);
CREATE INDEX idx_providers_neo_provider_id ON providers(neo_provider_id);
CREATE INDEX idx_providers_active ON providers(clinic_id, is_active) WHERE is_active = true;

-- ============================================================================
-- SCHEDULE_SYNCS TABLE
-- ============================================================================
-- Audit log of sync operations from PIMS systems
-- Drop existing table if it has wrong schema (empty table, safe to drop)
DROP POLICY IF EXISTS "Users can view their own syncs" ON schedule_syncs;
DROP POLICY IF EXISTS "Users can insert their own syncs" ON schedule_syncs;
DROP POLICY IF EXISTS "Users can update their own syncs" ON schedule_syncs;
DROP TABLE IF EXISTS schedule_syncs;

CREATE TABLE schedule_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  sync_date date NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'failed'
  appointment_count int,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional sync metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, sync_date)
);

-- Indexes for schedule syncs
CREATE INDEX idx_schedule_syncs_clinic_id ON schedule_syncs(clinic_id);
CREATE INDEX idx_schedule_syncs_sync_date ON schedule_syncs(sync_date);
CREATE INDEX idx_schedule_syncs_status ON schedule_syncs(status);
CREATE INDEX idx_schedule_syncs_clinic_date ON schedule_syncs(clinic_id, sync_date DESC);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================
-- Core appointment data from PIMS systems (Neo, Avimark, etc.)
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  sync_id uuid REFERENCES schedule_syncs(id) ON DELETE SET NULL,
  neo_appointment_id text, -- PIMS-specific appointment ID
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  patient_name text,
  client_name text,
  client_phone text,
  appointment_type text,
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  source text NOT NULL DEFAULT 'neo', -- 'neo' | 'avimark' | 'vapi' | 'manual'
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional appointment metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, neo_appointment_id)
);

-- Indexes for appointments (critical for availability queries)
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, date);
CREATE INDEX idx_appointments_availability ON appointments(clinic_id, date, start_time, status) WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_sync_id ON appointments(sync_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_source ON appointments(source);

-- ============================================================================
-- APPOINTMENT_REQUESTS TABLE
-- ============================================================================
-- VAPI-booked appointments pending clinic confirmation
CREATE TABLE IF NOT EXISTS appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  requested_date date NOT NULL,
  requested_start_time time NOT NULL,
  requested_end_time time NOT NULL,
  patient_name text NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  reason text, -- Reason for appointment request
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled' | 'rejected'
  vapi_call_id text, -- Reference to VAPI call that created this request
  confirmed_appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL, -- If confirmed, link to actual appointment
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional request metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for appointment requests
CREATE INDEX idx_appointment_requests_clinic_id ON appointment_requests(clinic_id);
CREATE INDEX idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX idx_appointment_requests_requested_date ON appointment_requests(requested_date);
CREATE INDEX idx_appointment_requests_vapi_call_id ON appointment_requests(vapi_call_id);
CREATE INDEX idx_appointment_requests_clinic_status ON appointment_requests(clinic_id, status) WHERE status = 'pending';

-- ============================================================================
-- CLINIC_MESSAGES TABLE
-- ============================================================================
-- Messages left by callers (voicemail, leave-a-message functionality)
CREATE TABLE IF NOT EXISTS clinic_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  caller_name text,
  caller_phone text NOT NULL,
  message_content text NOT NULL,
  message_type text NOT NULL DEFAULT 'voicemail', -- 'voicemail' | 'callback_request' | 'general'
  status text NOT NULL DEFAULT 'new', -- 'new' | 'read' | 'archived' | 'deleted'
  vapi_call_id text, -- Reference to VAPI call if applicable
  priority text DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'
  assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL, -- User assigned to handle message
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional message metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Indexes for clinic messages
CREATE INDEX idx_clinic_messages_clinic_id ON clinic_messages(clinic_id);
CREATE INDEX idx_clinic_messages_status ON clinic_messages(status);
CREATE INDEX idx_clinic_messages_clinic_status ON clinic_messages(clinic_id, status) WHERE status IN ('new', 'read');
CREATE INDEX idx_clinic_messages_created_at ON clinic_messages(created_at DESC);
CREATE INDEX idx_clinic_messages_assigned_to ON clinic_messages(assigned_to_user_id);
CREATE INDEX idx_clinic_messages_vapi_call_id ON clinic_messages(vapi_call_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLINICS RLS POLICIES
-- ============================================================================
-- Users can view clinics that match their clinic_name
CREATE POLICY "Users can view their clinic"
  ON clinics
  FOR SELECT
  USING (
    name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Admins and practice owners can manage clinics
CREATE POLICY "Admins can manage clinics"
  ON clinics
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

-- Service role can do everything
CREATE POLICY "Service role can manage clinics"
  ON clinics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- PROVIDERS RLS POLICIES
-- ============================================================================
-- Users can view providers for their clinic
CREATE POLICY "Users can view providers for their clinic"
  ON providers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = providers.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Admins and practice owners can manage providers
CREATE POLICY "Admins can manage providers"
  ON providers
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

-- Service role can do everything
CREATE POLICY "Service role can manage providers"
  ON providers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SCHEDULE_SYNCS RLS POLICIES
-- ============================================================================
-- Users can view schedule syncs for their clinic
CREATE POLICY "Users can view schedule syncs for their clinic"
  ON schedule_syncs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_syncs.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Admins and practice owners can manage schedule syncs
CREATE POLICY "Admins can manage schedule syncs"
  ON schedule_syncs
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

-- Service role can do everything
CREATE POLICY "Service role can manage schedule syncs"
  ON schedule_syncs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- APPOINTMENTS RLS POLICIES
-- ============================================================================
-- Users can view appointments for their clinic
CREATE POLICY "Users can view appointments for their clinic"
  ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can insert appointments for their clinic
CREATE POLICY "Users can create appointments for their clinic"
  ON appointments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can update appointments for their clinic
CREATE POLICY "Users can update appointments for their clinic"
  ON appointments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can delete appointments for their clinic
CREATE POLICY "Users can delete appointments for their clinic"
  ON appointments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage appointments"
  ON appointments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- APPOINTMENT_REQUESTS RLS POLICIES
-- ============================================================================
-- Users can view appointment requests for their clinic
CREATE POLICY "Users can view appointment requests for their clinic"
  ON appointment_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointment_requests.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can create appointment requests for their clinic (VAPI can create)
CREATE POLICY "Users can create appointment requests for their clinic"
  ON appointment_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointment_requests.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can update appointment requests for their clinic
CREATE POLICY "Users can update appointment requests for their clinic"
  ON appointment_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointment_requests.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Service role can do everything (for VAPI webhook handlers)
CREATE POLICY "Service role can manage appointment requests"
  ON appointment_requests
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- CLINIC_MESSAGES RLS POLICIES
-- ============================================================================
-- Users can view messages for their clinic
CREATE POLICY "Users can view messages for their clinic"
  ON clinic_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    assigned_to_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can create messages for their clinic
CREATE POLICY "Users can create messages for their clinic"
  ON clinic_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Users can update messages for their clinic or assigned to them
CREATE POLICY "Users can update messages for their clinic"
  ON clinic_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    assigned_to_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Service role can do everything (for VAPI webhook handlers)
CREATE POLICY "Service role can manage clinic messages"
  ON clinic_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER trigger_update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_schedule_syncs_updated_at
  BEFORE UPDATE ON schedule_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_requests_updated_at
  BEFORE UPDATE ON appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_clinic_messages_updated_at
  BEFORE UPDATE ON clinic_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE AND COLUMN COMMENTS
-- ============================================================================

-- Clinics table
COMMENT ON TABLE clinics IS 'Central clinic registry supporting multiple PIMS systems (IDEXX Neo, Avimark). Maps to users.clinic_name for backward compatibility.';
COMMENT ON COLUMN clinics.name IS 'Clinic name (must match users.clinic_name for RLS to work)';
COMMENT ON COLUMN clinics.pims_type IS 'PIMS system type: idexx_neo, avimark, or other';

-- Providers table
COMMENT ON TABLE providers IS 'Veterinarians and staff members linked to clinics. Stores PIMS-specific provider IDs.';
COMMENT ON COLUMN providers.neo_provider_id IS 'Provider ID from PIMS system (IDEXX Neo provider ID or equivalent for other PIMS)';
COMMENT ON COLUMN providers.role IS 'Provider role: veterinarian, vet_tech, receptionist, or other';

-- Schedule syncs table
COMMENT ON TABLE schedule_syncs IS 'Audit log of schedule synchronization operations from PIMS systems';
COMMENT ON COLUMN schedule_syncs.sync_date IS 'Date for which appointments were synced';
COMMENT ON COLUMN schedule_syncs.status IS 'Sync status: pending, in_progress, completed, or failed';

-- Appointments table
COMMENT ON TABLE appointments IS 'Core appointment data synced from PIMS systems or created via VAPI';
COMMENT ON COLUMN appointments.neo_appointment_id IS 'Appointment ID from PIMS system (IDEXX Neo appointment ID or equivalent)';
COMMENT ON COLUMN appointments.source IS 'Appointment source: neo (IDEXX Neo), avimark, vapi, or manual';
COMMENT ON COLUMN appointments.status IS 'Appointment status: scheduled, confirmed, cancelled, completed, or no_show';

-- Appointment requests table
COMMENT ON TABLE appointment_requests IS 'VAPI-booked appointments pending clinic confirmation';
COMMENT ON COLUMN appointment_requests.status IS 'Request status: pending, confirmed, cancelled, or rejected';
COMMENT ON COLUMN appointment_requests.vapi_call_id IS 'VAPI call ID that created this appointment request';
COMMENT ON COLUMN appointment_requests.confirmed_appointment_id IS 'Link to appointments table if request was confirmed';

-- Clinic messages table
COMMENT ON TABLE clinic_messages IS 'Messages left by callers (voicemail, callback requests, etc.)';
COMMENT ON COLUMN clinic_messages.message_type IS 'Message type: voicemail, callback_request, or general';
COMMENT ON COLUMN clinic_messages.status IS 'Message status: new, read, archived, or deleted';
COMMENT ON COLUMN clinic_messages.assigned_to_user_id IS 'User assigned to handle this message';
