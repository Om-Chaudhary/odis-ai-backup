-- Add DELETE policy for cases table
-- This allows users to delete their own cases through the UI

-- Create DELETE policy for cases
CREATE POLICY "Users can delete own cases"
  ON cases
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment documenting the policy
COMMENT ON POLICY "Users can delete own cases" ON cases IS 'Allows users to delete cases they own. Cascading deletes handle related records (patients, discharge_summaries, scheduled_discharge_calls, scheduled_discharge_emails, etc.)';

