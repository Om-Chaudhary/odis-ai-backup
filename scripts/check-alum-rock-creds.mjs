#!/usr/bin/env node
/**
 * Quick script to check decrypted credentials for Alum Rock
 * Run: npx tsx scripts/check-alum-rock-creds.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

// Simple decryption function (matching aes-encryption.ts)
function decrypt(encryptedBuffer, keyId = 'default') {
  const envKey = keyId === 'default'
    ? process.env.IDEXX_ENCRYPTION_KEY
    : process.env[`IDEXX_ENCRYPTION_KEY_${keyId.toUpperCase()}`];

  if (!envKey) {
    throw new Error(`Encryption key not found for keyId: ${keyId}`);
  }

  // Derive key using PBKDF2
  const salt = Buffer.from(keyId, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(envKey, salt, 100000, 32, 'sha256');

  // Parse encrypted data: IV (12 bytes) + Auth Tag (16 bytes) + Ciphertext
  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

function parseByteaData(data) {
  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (typeof data === 'string') {
    if (data.startsWith('\\x')) {
      return Buffer.from(data.slice(2), 'hex');
    }
    return Buffer.from(data, 'hex');
  }
  throw new Error(`Unexpected bytea data type: ${typeof data}`);
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Alum Rock clinic_id from the database
  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';

  const { data: credential, error } = await supabase
    .from('idexx_credentials')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (error || !credential) {
    console.error('Failed to fetch credentials:', error?.message);
    process.exit(1);
  }

  console.log('\nAlum Rock Animal Hospital - IDEXX Credentials\n');
  console.log('Encryption Key ID:', credential.encryption_key_id);

  try {
    const usernameBuffer = parseByteaData(credential.username_encrypted);
    const passwordBuffer = parseByteaData(credential.password_encrypted);
    const companyIdBuffer = parseByteaData(credential.company_id_encrypted);

    const username = decrypt(usernameBuffer, credential.encryption_key_id);
    const password = decrypt(passwordBuffer, credential.encryption_key_id);
    const companyId = decrypt(companyIdBuffer, credential.encryption_key_id);

    console.log('Username:', username);
    console.log('Company ID:', companyId);
    console.log('Password:', `[${password.length} chars]`);
  } catch (err) {
    console.error('Decryption error:', err.message);
  }

  process.exit(0);
}

main();
