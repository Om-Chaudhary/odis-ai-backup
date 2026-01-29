-- Migration: Create Weave credentials table
-- Stores encrypted Weave credentials for clinic integrations

CREATE TABLE IF NOT EXISTS weave_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  username_encrypted BYTEA NOT NULL,
  password_encrypted BYTEA NOT NULL,
  encryption_key_id TEXT NOT NULL DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_weave_credentials_user_id ON weave_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_weave_credentials_clinic_id ON weave_credentials(clinic_id);
CREATE INDEX IF NOT EXISTS idx_weave_credentials_active ON weave_credentials(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE weave_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own credentials
CREATE POLICY "Users can view their own weave credentials"
  ON weave_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weave credentials"
  ON weave_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weave credentials"
  ON weave_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weave credentials"
  ON weave_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for background jobs
CREATE POLICY "Service role has full access to weave credentials"
  ON weave_credentials FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE weave_credentials IS 'Stores encrypted Weave credentials for clinic integrations';
COMMENT ON COLUMN weave_credentials.username_encrypted IS 'AES-256-GCM encrypted Weave username';
COMMENT ON COLUMN weave_credentials.password_encrypted IS 'AES-256-GCM encrypted Weave password';
COMMENT ON COLUMN weave_credentials.encryption_key_id IS 'Identifier for the encryption key used';
