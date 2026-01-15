-- Add Del Valle Pet Hospital assistant mappings (inbound + outbound)
-- Migration: 20260115000000_add_del_valle_assistant_mapping

DO $$
DECLARE
  del_valle_clinic_id UUID := 'cf9d40fc-8bd3-415a-b4ab-57d99870e139';
  del_valle_inbound_id TEXT := '361f19e5-f710-4e5d-a48d-6eb64942dcb9';
  del_valle_outbound_id TEXT := '735ef4b4-981b-4b91-bed8-5841e79892ae';
BEGIN
  -- Add inbound assistant mapping
  INSERT INTO vapi_assistant_mappings (
    assistant_id,
    assistant_name,
    assistant_type,
    clinic_id,
    environment,
    is_active
  ) VALUES (
    del_valle_inbound_id,
    'del-valle-inbound-assistant',
    'inbound',
    del_valle_clinic_id,
    'production',
    true
  )
  ON CONFLICT (assistant_id)
  DO UPDATE SET
    clinic_id = EXCLUDED.clinic_id,
    assistant_name = EXCLUDED.assistant_name,
    assistant_type = EXCLUDED.assistant_type,
    environment = EXCLUDED.environment,
    is_active = true,
    updated_at = NOW();

  -- Add outbound assistant mapping
  INSERT INTO vapi_assistant_mappings (
    assistant_id,
    assistant_name,
    assistant_type,
    clinic_id,
    environment,
    is_active
  ) VALUES (
    del_valle_outbound_id,
    'del-valle-outbound-assistant',
    'outbound',
    del_valle_clinic_id,
    'production',
    true
  )
  ON CONFLICT (assistant_id)
  DO UPDATE SET
    clinic_id = EXCLUDED.clinic_id,
    assistant_name = EXCLUDED.assistant_name,
    assistant_type = EXCLUDED.assistant_type,
    environment = EXCLUDED.environment,
    is_active = true,
    updated_at = NOW();

  -- Update clinics table (legacy fallback)
  UPDATE clinics
  SET
    inbound_assistant_id = del_valle_inbound_id,
    updated_at = NOW()
  WHERE id = del_valle_clinic_id;

  RAISE NOTICE 'Added Del Valle inbound assistant mapping: % -> %', del_valle_inbound_id, del_valle_clinic_id;
  RAISE NOTICE 'Added Del Valle outbound assistant mapping: % -> %', del_valle_outbound_id, del_valle_clinic_id;
END $$;
