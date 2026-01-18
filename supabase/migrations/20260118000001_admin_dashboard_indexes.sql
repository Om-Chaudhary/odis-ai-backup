-- Admin Dashboard Performance Indexes
-- Migration: 20260118000001_admin_dashboard_indexes
-- Description: Add indexes to support efficient admin dashboard queries
-- No schema changes - only performance optimizations

-- Case sync audits - for sync history and status monitoring
CREATE INDEX IF NOT EXISTS idx_case_sync_audits_clinic_started
  ON case_sync_audits(clinic_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_sync_audits_status
  ON case_sync_audits(status)
  WHERE status = 'running';

-- Users - for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role);

-- User clinic access - for access management
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user
  ON user_clinic_access(user_id);

CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic
  ON user_clinic_access(clinic_id);

-- Clinics - for active/inactive filtering
CREATE INDEX IF NOT EXISTS idx_clinics_is_active
  ON clinics(is_active);
