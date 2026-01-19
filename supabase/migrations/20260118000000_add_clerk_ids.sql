-- Migration: Add Clerk IDs to users and clinics tables
-- Description: Enables Clerk authentication integration alongside existing Supabase Auth
-- Date: 2026-01-18

-- Add clerk_user_id to users table
-- This allows a user to have both Supabase Auth (iOS app) and Clerk Auth (web app)
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Add clerk_org_id to clinics table
-- Maps Clerk Organizations to ODIS AI clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS clerk_org_id TEXT UNIQUE;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_clerk_org_id ON clinics(clerk_org_id);

-- Add comments for documentation
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user ID for web app authentication (hybrid auth with Supabase)';
COMMENT ON COLUMN clinics.clerk_org_id IS 'Clerk organization ID mapping for multi-tenant clinic management';
