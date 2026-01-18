#!/usr/bin/env node
/**
 * Script to update Alum Rock's IDEXX company ID
 * Run: npx tsx scripts/update-alum-rock-company-id.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

// Simple encryption function (matching aes-encryption.ts)
function encrypt(plaintext, keyId = 'default') {
  const envKey = keyId === 'default'
    ? process.env.IDEXX_ENCRYPTION_KEY
    : process.env[`IDEXX_ENCRYPTION_KEY_${keyId.toUpperCase()}`];

  if (!envKey) {
    throw new Error(`Encryption key not found for keyId: ${keyId}`);
  }

  // Derive key using PBKDF2
  const salt = Buffer.from(keyId, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(envKey, salt, 100000, 32, 'sha256');

  // Generate random IV
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Format: IV (12 bytes) + Auth Tag (16 bytes) + Ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Alum Rock clinic_id
  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';
  const companyId = '9229';

  console.log('\n🔄 Updating Alum Rock Animal Hospital - IDEXX Company ID\n');

  // Get existing credential to check encryption_key_id
  const { data: credential, error: fetchError } = await supabase
    .from('idexx_credentials')
    .select('id, encryption_key_id')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (fetchError || !credential) {
    console.error('❌ Failed to fetch credentials:', fetchError?.message);
    process.exit(1);
  }

  console.log('Found credential record:', credential.id);
  console.log('Encryption Key ID:', credential.encryption_key_id);

  // Encrypt company ID
  try {
    const companyIdEncrypted = encrypt(companyId, credential.encryption_key_id);

    // Update the credential
    const { error: updateError } = await supabase
      .from('idexx_credentials')
      .update({
        company_id_encrypted: companyIdEncrypted,
        updated_at: new Date().toISOString()
      })
      .eq('id', credential.id);

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Successfully updated company ID to:', companyId);
    console.log('\nYou can verify with: npx tsx scripts/check-alum-rock-creds.mjs');
  } catch (err) {
    console.error('❌ Encryption error:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
