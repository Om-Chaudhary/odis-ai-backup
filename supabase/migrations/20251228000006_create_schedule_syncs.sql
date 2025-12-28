-- Create schedule_syncs table
-- Audit log for schedule sync operations
-- Tracks sync statistics, duration, and any errors

CREATE TABLE schedule_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Date range synced
  sync_start_date date NOT NULL,
  sync_end_date date NOT NULL,

  -- Status
  status text NOT NULL DEFAULT 'in_progress',  -- 'in_progress'|'completed'|'failed'

  -- Statistics
  slots_created int DEFAULT 0,
  slots_updated int DEFAULT 0,
  appointments_added int DEFAULT 0,
  appointments_updated int DEFAULT 0,
  appointments_removed int DEFAULT 0,
  conflicts_detected int DEFAULT 0,
  conflicts_resolved int DEFAULT 0,

  -- IDEXX config captured at sync time
  idexx_config jsonb,                     -- Snapshot of business hours, rooms, etc.

  -- Error handling
  error_message text,
  error_details jsonb,

  -- Timing
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms int,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_schedule_syncs_clinic
  ON schedule_syncs(clinic_id);

CREATE INDEX idx_schedule_syncs_clinic_date
  ON schedule_syncs(clinic_id, sync_start_date DESC);

CREATE INDEX idx_schedule_syncs_status
  ON schedule_syncs(status);

CREATE INDEX idx_schedule_syncs_completed
  ON schedule_syncs(clinic_id, completed_at DESC)
  WHERE status = 'completed';

-- Enable RLS
ALTER TABLE schedule_syncs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view syncs for their clinic"
  ON schedule_syncs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = schedule_syncs.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Service role can manage syncs"
  ON schedule_syncs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE schedule_syncs IS 'Audit log of schedule sync operations from IDEXX';
COMMENT ON COLUMN schedule_syncs.sync_start_date IS 'Start of date range that was synced';
COMMENT ON COLUMN schedule_syncs.sync_end_date IS 'End of date range that was synced';
COMMENT ON COLUMN schedule_syncs.idexx_config IS 'Snapshot of IDEXX schedule config at sync time';
COMMENT ON COLUMN schedule_syncs.duration_ms IS 'Total sync duration in milliseconds';
