#!/usr/bin/env node
/**
 * Reset Alum Rock IDEXX credentials with fresh encryption
 * Run: node scripts/reset-alum-rock-credentials.cjs
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

// Manual .env.local loading
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
  console.log('✅ Loaded .env.local\n');
}

// Encryption function (matches aes-encryption.ts)
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

// Prompt for credentials
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    console.error('   IDEXX_ENCRYPTION_KEY:', process.env.IDEXX_ENCRYPTION_KEY ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';
  const userId = 'c51bffe0-0f84-4560-8354-2fa65d646f28';

  console.log('🔐 Reset Alum Rock Animal Hospital - IDEXX Credentials\n');
  console.log('This will re-encrypt credentials using your current IDEXX_ENCRYPTION_KEY\n');

  // Prompt for credentials
  console.log('Enter IDEXX credentials (they will be encrypted):');
  const username = await question('Username: ');
  const password = await question('Password: ');
  const companyId = await question('Company ID (e.g., 9229): ');

  rl.close();

  if (!username || !password || !companyId) {
    console.error('\n❌ All fields are required');
    process.exit(1);
  }

  console.log('\n🔄 Encrypting credentials...');

  try {
    const usernameEncrypted = encrypt(username, 'default');
    const passwordEncrypted = encrypt(password, 'default');
    const companyIdEncrypted = encrypt(companyId, 'default');

    console.log('✅ Credentials encrypted successfully');
    console.log('\n🔄 Updating database...');

    // Update the credential record
    const { error: updateError } = await supabase
      .from('idexx_credentials')
      .update({
        user_id: userId,
        username_encrypted: usernameEncrypted,
        password_encrypted: passwordEncrypted,
        company_id_encrypted: companyIdEncrypted,
        encryption_key_id: 'default',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', clinicId);

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Successfully reset credentials for Alum Rock\n');
    console.log('Details:');
    console.log('  Clinic ID:', clinicId);
    console.log('  User ID:', userId);
    console.log('  Encryption Key ID: default');
    console.log('  Username length:', username.length);
    console.log('  Password length:', password.length);
    console.log('  Company ID:', companyId);
    console.log('\nYou can now retry your curl command:');
    console.log('  curl -X POST http://localhost:5050/api/sync/full \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -H "X-API-Key: pk_ar_Xk9mN2pLqR8vT5wY3zB7cD4eF6gH1jK" \\');
    console.log('    -d \'{"daysAhead": 7, "lookbackDays": 7}\'');
    console.log('');
  } catch (err) {
    console.error('❌ Encryption error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
