-- Create pims_session_cache table for PIMS session caching
-- Reduces IDEXX logins from ~20+/day to 2-3/day per clinic

CREATE TABLE pims_session_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  session_cookies TEXT NOT NULL,  -- Encrypted JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT unique_clinic_session UNIQUE (clinic_id)
);

-- Index for cleanup queries
CREATE INDEX idx_pims_session_cache_expires ON pims_session_cache(expires_at);

-- Index for clinic lookups
CREATE INDEX idx_pims_session_cache_clinic ON pims_session_cache(clinic_id);

-- Add comment for documentation
COMMENT ON TABLE pims_session_cache IS 'Caches PIMS session cookies to reduce authentication frequency. Sessions are encrypted at rest.';
COMMENT ON COLUMN pims_session_cache.session_cookies IS 'AES-256-GCM encrypted JSON of browser cookies';
COMMENT ON COLUMN pims_session_cache.last_used_at IS 'Updated on each successful session use. Sessions expire after 20 min idle.';
COMMENT ON COLUMN pims_session_cache.expires_at IS 'Absolute session expiration (8 hours from creation).';
