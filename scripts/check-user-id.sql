-- Check if user_id exists in idexx_credentials for Alum Rock
SELECT
  id,
  clinic_id,
  user_id,
  encryption_key_id,
  is_active,
  username_encrypted IS NOT NULL as has_username,
  password_encrypted IS NOT NULL as has_password,
  company_id_encrypted IS NOT NULL as has_company_id
FROM idexx_credentials
WHERE clinic_id = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';
