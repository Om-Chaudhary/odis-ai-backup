-- Create clinic_api_keys table
-- Stores hashed API keys for external sync server authentication

CREATE TABLE clinic_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Key details
  name text NOT NULL,                    -- e.g., "IDEXX Sync Server", "Production Sync"
  key_hash text NOT NULL UNIQUE,         -- SHA-256 hash of the API key
  key_prefix text NOT NULL,              -- First 8 chars for identification (e.g., "odis_sk_")

  -- Permissions
  permissions text[] DEFAULT ARRAY['sync:inbound', 'sync:cases', 'sync:reconciliation'],

  -- Expiration and status
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Validations
  CONSTRAINT clinic_api_keys_valid_name CHECK (length(name) >= 3 AND length(name) <= 100),
  CONSTRAINT clinic_api_keys_valid_prefix CHECK (length(key_prefix) >= 8 AND length(key_prefix) <= 12),
  CONSTRAINT clinic_api_keys_valid_permissions CHECK (array_length(permissions, 1) > 0)
);

-- Create indexes
CREATE INDEX idx_clinic_api_keys_clinic_id
  ON clinic_api_keys(clinic_id);

CREATE INDEX idx_clinic_api_keys_key_hash
  ON clinic_api_keys(key_hash)
  WHERE is_active = true;

CREATE INDEX idx_clinic_api_keys_user_id
  ON clinic_api_keys(user_id);

-- Enable RLS
ALTER TABLE clinic_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view API keys for their clinic"
  ON clinic_api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_api_keys.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Practice owners can manage API keys for their clinic"
  ON clinic_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_api_keys.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'practice_owner')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_api_keys.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'practice_owner')
      )
    )
  );

CREATE POLICY "Service role can manage API keys"
  ON clinic_api_keys
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trigger_clinic_api_keys_updated_at
  BEFORE UPDATE ON clinic_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE clinic_api_keys IS 'API keys for external sync server authentication (X-API-Key header)';
COMMENT ON COLUMN clinic_api_keys.key_hash IS 'SHA-256 hash of the API key (never store plaintext)';
COMMENT ON COLUMN clinic_api_keys.key_prefix IS 'First 8-12 characters of key for identification (e.g., odis_sk_12345678)';
COMMENT ON COLUMN clinic_api_keys.permissions IS 'Allowed sync operations: sync:inbound, sync:cases, sync:reconciliation';
COMMENT ON COLUMN clinic_api_keys.last_used_at IS 'Last time this key was used for authentication';
