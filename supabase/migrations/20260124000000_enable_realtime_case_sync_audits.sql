-- Enable Realtime for case_sync_audits table
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events on case_sync_audits

-- Add case_sync_audits to the supabase_realtime publication
-- The publication may already exist, so we use DO block to handle that
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add the table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE case_sync_audits;

-- Enable replica identity FULL to include old row values in UPDATE events
-- This allows us to detect status transitions (e.g., in_progress -> completed)
ALTER TABLE case_sync_audits REPLICA IDENTITY FULL;

-- Add comment for documentation
COMMENT ON TABLE case_sync_audits IS 'Realtime enabled: Clients can subscribe to postgres_changes on this table';
