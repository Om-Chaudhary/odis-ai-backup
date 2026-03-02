-- Update VAPI IDs to new chaudharyom17@gmail.com account (migrated 2026-03-01)
-- Run against Supabase production database

-- Alum Rock Animal Hospital
UPDATE clinics SET
  outbound_assistant_id = '92634ca6-a31c-4656-962e-9ca45cbb0ffb',
  outbound_phone_number_id = '61d4ec26-6223-4371-919a-7df7ddb01d07',
  inbound_assistant_id = '93ca7c97-e1c2-4434-85aa-d3e7d5d3ec8f',
  inbound_phone_number_id = '61d4ec26-6223-4371-919a-7df7ddb01d07'
WHERE name = 'Alum Rock Animal Hospital';

-- Masson Veterinary Hospital
-- No outbound assistant in new account — leave outbound_assistant_id NULL
UPDATE clinics SET
  inbound_assistant_id = '70dc8983-0cab-417e-979e-2f0c9ff3bd3e',
  inbound_phone_number_id = 'f274a808-f757-455a-93d2-7767fc0d9041'
WHERE name ILIKE '%Masson%';

-- Verify updates
SELECT name, outbound_assistant_id, outbound_phone_number_id, inbound_assistant_id, inbound_phone_number_id
FROM clinics
WHERE name IN ('Alum Rock Animal Hospital')
   OR name ILIKE '%Masson%';
