-- Add DELETE policies for inbound data tables
-- These allow users to delete records from their own clinic

-- DELETE policy for inbound_vapi_calls
CREATE POLICY "Users can delete inbound calls for their clinic"
  ON inbound_vapi_calls
  FOR DELETE
  USING (
    -- Users can delete calls for their clinic
    clinic_name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    OR
    -- Users can delete calls assigned to them
    user_id = auth.uid()
    OR
    -- Admins and practice owners can delete all calls for their clinic
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'practice_owner')
        AND clinic_name = inbound_vapi_calls.clinic_name
      )
    )
  );

-- DELETE policy for appointment_requests
CREATE POLICY "Users can delete appointment requests for their clinic"
  ON appointment_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointment_requests.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- DELETE policy for clinic_messages
CREATE POLICY "Users can delete messages for their clinic"
  ON clinic_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = clinic_messages.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    assigned_to_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

