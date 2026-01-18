-- Create case_sync_audits table
-- Tracks PIMS sync operations with detailed statistics

CREATE TABLE case_sync_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Sync metadata
  sync_type text NOT NULL CHECK (sync_type IN ('inbound', 'cases', 'reconciliation')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  error_message text,

  -- Statistics
  appointments_found int NOT NULL DEFAULT 0,
  cases_created int NOT NULL DEFAULT 0,
  cases_updated int NOT NULL DEFAULT 0,
  cases_skipped int NOT NULL DEFAULT 0,
  cases_deleted int NOT NULL DEFAULT 0,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Validations
  CONSTRAINT case_sync_audits_valid_stats CHECK (
    appointments_found >= 0 AND
    cases_created >= 0 AND
    cases_updated >= 0 AND
    cases_skipped >= 0 AND
    cases_deleted >= 0
  )
);

-- Create indexes
CREATE INDEX idx_case_sync_audits_clinic_id
  ON case_sync_audits(clinic_id);

CREATE INDEX idx_case_sync_audits_sync_type
  ON case_sync_audits(sync_type);

CREATE INDEX idx_case_sync_audits_status
  ON case_sync_audits(status);

CREATE INDEX idx_case_sync_audits_created_at
  ON case_sync_audits(created_at DESC);

-- Enable RLS
ALTER TABLE case_sync_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view audit logs for their clinic"
  ON case_sync_audits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = case_sync_audits.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Service role can manage audit logs"
  ON case_sync_audits
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_case_sync_audits_updated_at
  BEFORE UPDATE ON case_sync_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE case_sync_audits IS 'Audit log for PIMS sync operations with detailed statistics';
COMMENT ON COLUMN case_sync_audits.sync_type IS 'Type of sync: inbound (appointments), cases (consultation enrichment), or reconciliation (7-day cleanup)';
COMMENT ON COLUMN case_sync_audits.status IS 'Sync status: in_progress, completed, or failed';
COMMENT ON COLUMN case_sync_audits.appointments_found IS 'Total appointments found in PIMS for date range';
COMMENT ON COLUMN case_sync_audits.cases_created IS 'Number of new cases created in database';
COMMENT ON COLUMN case_sync_audits.cases_updated IS 'Number of existing cases updated';
COMMENT ON COLUMN case_sync_audits.cases_skipped IS 'Number of appointments skipped (not finalized, already synced, etc.)';
COMMENT ON COLUMN case_sync_audits.cases_deleted IS 'Number of cases soft-deleted (reconciliation only)';
COMMENT ON COLUMN case_sync_audits.error_message IS 'Error message if sync failed';
