-- Migration: Add progress tracking fields to case_sync_audits
-- Description: Enables real-time progress updates for sync operations

-- Add progress tracking columns
ALTER TABLE case_sync_audits
  ADD COLUMN IF NOT EXISTS total_items integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_items integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_percentage smallint DEFAULT 0 
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ADD COLUMN IF NOT EXISTS last_progress_update timestamptz;

-- Index for efficient progress queries on active syncs
CREATE INDEX IF NOT EXISTS idx_case_sync_audits_progress 
  ON case_sync_audits(status, last_progress_update) 
  WHERE status = 'in_progress';

-- Add comments for documentation
COMMENT ON COLUMN case_sync_audits.total_items IS 
  'Total number of items to process (known after initial fetch)';
COMMENT ON COLUMN case_sync_audits.processed_items IS 
  'Number of items processed so far';
COMMENT ON COLUMN case_sync_audits.progress_percentage IS 
  'Calculated progress percentage (0-100)';
COMMENT ON COLUMN case_sync_audits.last_progress_update IS 
  'Timestamp of the last progress update';
