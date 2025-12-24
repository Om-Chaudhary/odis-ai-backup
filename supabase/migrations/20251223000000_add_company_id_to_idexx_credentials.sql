-- Add company_id_encrypted column to idexx_credentials table
-- IDEXX Neo requires a Company ID in addition to username/password for authentication

ALTER TABLE idexx_credentials
ADD COLUMN IF NOT EXISTS company_id_encrypted bytea;

COMMENT ON COLUMN idexx_credentials.company_id_encrypted IS 'Encrypted IDEXX company ID (required for login authentication)';

