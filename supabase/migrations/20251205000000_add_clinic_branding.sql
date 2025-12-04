-- Add clinic branding columns to clinics table
-- These columns enable per-clinic email customization

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#2563EB';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_header_text TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_footer_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clinics.primary_color IS 'Primary brand color in hex format (e.g., #2563EB) for email headers and accents';
COMMENT ON COLUMN clinics.logo_url IS 'URL to clinic logo image for email header';
COMMENT ON COLUMN clinics.email_header_text IS 'Custom header text for discharge emails';
COMMENT ON COLUMN clinics.email_footer_text IS 'Custom footer text for discharge emails';

