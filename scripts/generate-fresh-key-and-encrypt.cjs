#!/usr/bin/env node
/**
 * Generate a fresh encryption key and re-encrypt Alum Rock credentials
 * Run: node scripts/generate-fresh-key-and-encrypt.cjs <username> <password> <companyId>
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Parse command line args
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Usage: node scripts/generate-fresh-key-and-encrypt.cjs <username> <password> <companyId>');
  console.error('Example: node scripts/generate-fresh-key-and-encrypt.cjs "myuser" "mypass" "9229"');
  process.exit(1);
}

const [username, password, companyId] = args;

console.log('🔐 Generating fresh encryption key and encrypting credentials\n');

// Generate a fresh 44-character base64 key
const freshKey = crypto.randomBytes(32).toString('base64');

console.log('Generated new IDEXX_ENCRYPTION_KEY:');
console.log(freshKey);
console.log('\n⚠️  SAVE THIS KEY! Add it to your .env.local:');
console.log(`IDEXX_ENCRYPTION_KEY="${freshKey}"`);
console.log('');

// Encryption function
function encrypt(plaintext, encryptionKey, keyId = 'default') {
  // Derive key using PBKDF2
  const salt = Buffer.from(keyId, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');

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
  // Load env for Supabase credentials only
  const envPath = path.resolve(__dirname, '../.env.local');
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

  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';
  const userId = 'c51bffe0-0f84-4560-8354-2fa65d646f28';

  console.log('🔄 Encrypting credentials with new key...\n');

  const usernameEncrypted = encrypt(username, freshKey, 'default');
  const passwordEncrypted = encrypt(password, freshKey, 'default');
  const companyIdEncrypted = encrypt(companyId, freshKey, 'default');

  console.log('Encrypted data sizes:');
  console.log('  Username:', usernameEncrypted.length, 'bytes');
  console.log('  Password:', passwordEncrypted.length, 'bytes');
  console.log('  Company ID:', companyIdEncrypted.length, 'bytes');
  console.log('');

  console.log('🔄 Updating database...');

  // Supabase JS client requires hex encoding with \x prefix for bytea columns
  const toHexString = (buffer) => '\\x' + buffer.toString('hex');

  const { error: updateError } = await supabase
    .from('idexx_credentials')
    .update({
      user_id: userId,
      username_encrypted: toHexString(usernameEncrypted),
      password_encrypted: toHexString(passwordEncrypted),
      company_id_encrypted: toHexString(companyIdEncrypted),
      encryption_key_id: 'default',
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('clinic_id', clinicId);

  if (updateError) {
    console.error('❌ Update failed:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Database updated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('NEXT STEPS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Update .env.local with the new key:');
  console.log(`   IDEXX_ENCRYPTION_KEY="${freshKey}"`);
  console.log('');
  console.log('2. Restart pims-sync service');
  console.log('');
  console.log('3. Verify decryption works:');
  console.log('   node scripts/test-decrypt-credentials.cjs');
  console.log('');
  console.log('4. Test the sync:');
  console.log('   curl -X POST http://localhost:5050/api/sync/full \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "X-API-Key: pk_ar_Xk9mN2pLqR8vT5wY3zB7cD4eF6gH1jK" \\');
  console.log('     -d \'{"daysAhead": 7, "lookbackDays": 7}\'');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
