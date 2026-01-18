#!/usr/bin/env node
/**
 * Test decryption of Alum Rock credentials
 * Run: node scripts/test-decrypt-credentials.cjs
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Manual .env.local loading
const envPath = path.resolve(__dirname, '../.env.local');
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath), '\n');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

// Decryption function (matches aes-encryption.ts)
function decrypt(encryptedData, keyId = 'default') {
  const envKey = keyId === 'default'
    ? process.env.IDEXX_ENCRYPTION_KEY
    : process.env[`IDEXX_ENCRYPTION_KEY_${keyId.toUpperCase()}`];

  if (!envKey) {
    throw new Error(`Encryption key not found for keyId: ${keyId}`);
  }

  console.log('Encryption key ID:', keyId);
  console.log('Encryption key found:', !!envKey);
  console.log('Encryption key length:', envKey ? envKey.length : 0);
  console.log('Encryption key first 8 chars:', envKey ? envKey.substring(0, 8) + '...' : 'N/A');

  // Convert to Buffer (matches parseByteaData in credential-manager.ts)
  let encryptedBuffer;
  if (Buffer.isBuffer(encryptedData)) {
    encryptedBuffer = encryptedData;
  } else if (encryptedData instanceof Uint8Array) {
    encryptedBuffer = Buffer.from(encryptedData);
  } else if (typeof encryptedData === 'string') {
    // Supabase returns bytea as hex string with \x prefix
    if (encryptedData.startsWith('\\x')) {
      encryptedBuffer = Buffer.from(encryptedData.slice(2), 'hex');
    } else {
      // Try plain hex
      encryptedBuffer = Buffer.from(encryptedData, 'hex');
    }
  } else {
    console.log('Encrypted data type:', typeof encryptedData);
    console.log('Encrypted data constructor:', encryptedData?.constructor?.name);
    console.log('Encrypted data sample:', JSON.stringify(encryptedData).substring(0, 100));
    throw new Error('Unknown encrypted data format');
  }

  console.log('Encrypted buffer length:', encryptedBuffer.length);
  console.log('');

  // Derive key using PBKDF2
  const salt = Buffer.from(keyId, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(envKey, salt, 100000, 32, 'sha256');

  // Extract IV (12 bytes), Auth Tag (16 bytes), Ciphertext
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

async function main() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!process.env.IDEXX_ENCRYPTION_KEY) {
    console.error('❌ Missing IDEXX_ENCRYPTION_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';

  console.log('🔍 Testing decryption of Alum Rock credentials\n');

  // Get credentials
  const { data: credential, error } = await supabase
    .from('idexx_credentials')
    .select('encryption_key_id, username_encrypted, password_encrypted, company_id_encrypted')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (error || !credential) {
    console.error('❌ Failed to fetch credentials:', error?.message);
    process.exit(1);
  }

  console.log('Credential encryption_key_id:', credential.encryption_key_id);
  console.log('Username encrypted bytes:', credential.username_encrypted?.length || 0);
  console.log('Password encrypted bytes:', credential.password_encrypted?.length || 0);
  console.log('Company ID encrypted bytes:', credential.company_id_encrypted?.length || 0);
  console.log('');

  // Try to decrypt
  try {
    const username = decrypt(credential.username_encrypted, credential.encryption_key_id);
    const password = decrypt(credential.password_encrypted, credential.encryption_key_id);
    const companyId = decrypt(credential.company_id_encrypted, credential.encryption_key_id);

    console.log('✅ Decryption successful!\n');
    console.log('Decrypted values:');
    console.log('  Username:', username);
    console.log('  Password:', '*'.repeat(password.length), `(${password.length} chars)`);
    console.log('  Company ID:', companyId);
    console.log('\n✅ The encryption key in your .env.local is correct!');
    console.log('   The pims-sync service should be able to decrypt these credentials.');
  } catch (err) {
    console.error('❌ Decryption failed:', err.message);
    console.error('\nThis means:');
    console.error('  1. The IDEXX_ENCRYPTION_KEY in .env.local is different from what was used to encrypt');
    console.error('  2. OR the pims-sync service is loading a different .env.local file');
    console.error('\nDebug info:');
    console.error('  .env.local path:', envPath);
    console.error('  IDEXX_ENCRYPTION_KEY present:', !!process.env.IDEXX_ENCRYPTION_KEY);
    console.error('  IDEXX_ENCRYPTION_KEY length:', process.env.IDEXX_ENCRYPTION_KEY?.length || 0);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
