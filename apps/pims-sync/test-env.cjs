#!/usr/bin/env node
/**
 * Test if .env.local is being loaded correctly
 * Run from apps/pims-sync: node test-env.cjs
 */

console.log('\n🔍 Testing environment variable loading...\n');

// Check what dotenv-cli would load
console.log('Expected .env.local path:', require('path').resolve(__dirname, '../../.env.local'));
console.log('File exists:', require('fs').existsSync(require('path').resolve(__dirname, '../../.env.local')));

console.log('\n📋 Environment variables for pims-sync:\n');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'IDEXX_ENCRYPTION_KEY',
  'PORT',
  'HEADLESS',
  'ENABLE_SCHEDULER'
];

const optionalVars = [
  'NODE_ENV',
  'HOST',
  'SYNC_TIMEOUT_MS'
];

console.log('Required variables:');
requiredVars.forEach(key => {
  const value = process.env[key];
  const status = value ? '✓' : '✗';
  const display = value ? (key.includes('KEY') ? '[REDACTED]' : value.substring(0, 50) + '...') : 'NOT SET';
  console.log(`  ${status} ${key}: ${display}`);
});

console.log('\nOptional variables:');
optionalVars.forEach(key => {
  const value = process.env[key];
  const status = value ? '✓' : '-';
  const display = value || 'not set (will use default)';
  console.log(`  ${status} ${key}: ${display}`);
});

const allRequired = requiredVars.every(key => !!process.env[key]);
console.log('\n' + (allRequired ? '✅ All required variables are set!' : '❌ Some required variables are missing!'));
console.log('\n');
