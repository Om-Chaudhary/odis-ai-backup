-- Migration: Fix discharge template trigger timing
-- Date: 2026-01-15
-- Purpose: Change create_default_discharge_template_on_user_insert trigger from BEFORE to AFTER
--
-- Issue: The BEFORE INSERT trigger tries to create a temp_discharge_summary_templates record
-- before the user record is committed to the database, causing FK constraint violation.
--
-- Fix: Change trigger to AFTER INSERT so the user record exists when we create the template.

-- Drop the existing BEFORE INSERT trigger
DROP TRIGGER IF EXISTS create_default_discharge_template_on_user_insert ON public.users;

-- Recreate as AFTER INSERT trigger
CREATE TRIGGER create_default_discharge_template_on_user_insert
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_discharge_template_for_new_user();

-- Note: The function itself doesn't need to change, only the trigger timing.
-- The function will still work correctly as an AFTER INSERT trigger because it
-- uses NEW.id which is available in both BEFORE and AFTER triggers.
