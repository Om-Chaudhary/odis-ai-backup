-- Migration: Add onboarding credential columns to users table
-- Description: Stores IDEXX Neo and Weave credentials for new user onboarding
-- Date: 2026-01-29
-- Note: These credentials are stored in plaintext as requested for onboarding flow

-- Add IDEXX Neo credential columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS idexx_username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS idexx_password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS idexx_company_id TEXT;

-- Add Weave credential columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weave_username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weave_password TEXT;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- Add comments for documentation
COMMENT ON COLUMN public.users.idexx_username IS 'IDEXX Neo username (plaintext) - collected during onboarding';
COMMENT ON COLUMN public.users.idexx_password IS 'IDEXX Neo password (plaintext) - collected during onboarding';
COMMENT ON COLUMN public.users.idexx_company_id IS 'IDEXX Neo company ID - collected during onboarding';
COMMENT ON COLUMN public.users.weave_username IS 'Weave username (plaintext) - collected during onboarding';
COMMENT ON COLUMN public.users.weave_password IS 'Weave password (plaintext) - collected during onboarding';
