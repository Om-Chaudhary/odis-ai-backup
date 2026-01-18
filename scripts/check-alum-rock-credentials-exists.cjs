#!/usr/bin/env node
/**
 * Check if Alum Rock has IDEXX credentials in the database
 * Run: node scripts/check-alum-rock-credentials-exists.cjs
 */

const path = require('path');
const fs = require('fs');

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

async function main() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';

  console.log('🔍 Checking IDEXX credentials for Alum Rock Animal Hospital\n');
  console.log('Clinic ID:', clinicId);

  // Check for credentials
  const { data: credentials, error } = await supabase
    .from('idexx_credentials')
    .select('*')
    .eq('clinic_id', clinicId);

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  if (!credentials || credentials.length === 0) {
    console.log('\n❌ No IDEXX credentials found for Alum Rock');
    console.log('\nYou need to insert credentials into the database.');
    console.log('The credentials should include:');
    console.log('  - username_encrypted (bytea)');
    console.log('  - password_encrypted (bytea)');
    console.log('  - company_id_encrypted (bytea)');
    console.log('  - encryption_key_id (text)');
    console.log('  - is_active (boolean)');
    process.exit(1);
  }

  console.log(`\n✅ Found ${credentials.length} credential record(s):\n`);

  credentials.forEach((cred, idx) => {
    console.log(`Record ${idx + 1}:`);
    console.log('  ID:', cred.id);
    console.log('  Encryption Key ID:', cred.encryption_key_id);
    console.log('  Is Active:', cred.is_active);
    console.log('  Created:', cred.created_at);
    console.log('  Updated:', cred.updated_at);
    console.log('  Has username:', !!cred.username_encrypted);
    console.log('  Has password:', !!cred.password_encrypted);
    console.log('  Has company_id:', !!cred.company_id_encrypted);
    console.log('');
  });

  // Check for active credentials
  const activeCredentials = credentials.filter(c => c.is_active);
  if (activeCredentials.length === 0) {
    console.log('⚠️  No active credentials found. Set is_active = true for one of them.');
  } else {
    console.log(`✅ ${activeCredentials.length} active credential(s) ready to use.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
