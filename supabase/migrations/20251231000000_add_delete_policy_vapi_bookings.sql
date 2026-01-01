-- Add DELETE policy for vapi_bookings table
-- This allows users to delete appointment requests for their clinic

-- DELETE policy for vapi_bookings
CREATE POLICY "Users can delete bookings for their clinic"
  ON vapi_bookings
  FOR DELETE
  USING (
    -- Users can delete bookings for their clinic
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = vapi_bookings.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
    OR
    -- Admins and practice owners can delete all bookings
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

COMMENT ON POLICY "Users can delete bookings for their clinic" ON vapi_bookings IS 'Allows users to delete appointment requests/bookings for their clinic';

