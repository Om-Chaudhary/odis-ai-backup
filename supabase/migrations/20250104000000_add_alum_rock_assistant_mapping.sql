-- Add VAPI assistant mapping for Alum Rock Appointment Agent
-- This links the assistant ID from the inbound squad to the Alum Rock clinic

-- First, get the Alum Rock clinic ID
DO $$
DECLARE
  alum_rock_clinic_id UUID;
BEGIN
  -- Find Alum Rock clinic (adjust the name match if needed)
  SELECT id INTO alum_rock_clinic_id
  FROM clinics
  WHERE name ILIKE '%alum%rock%'
  LIMIT 1;

  IF alum_rock_clinic_id IS NOT NULL THEN
    -- Insert the appointment agent mapping
    INSERT INTO vapi_assistant_mappings (
      assistant_id,
      assistant_name,
      assistant_type,
      clinic_id,
      environment,
      is_active
    ) VALUES (
      '800dbaf5-7913-4e74-800f-c1614bc11fad',  -- Appointment Agent ID from squad
      'afterhours-inbound-appointment-agent',
      'appointment',
      alum_rock_clinic_id,
      'production',
      true
    )
    ON CONFLICT (assistant_id)
    DO UPDATE SET
      clinic_id = EXCLUDED.clinic_id,
      is_active = true,
      updated_at = NOW();

    RAISE NOTICE 'Added assistant mapping for Alum Rock clinic (%)' clinic_id;
  ELSE
    RAISE WARNING 'Alum Rock clinic not found - please create it first or adjust the clinic name search';
  END IF;
END $$;
