/**
 * One-time script to store IDEXX credentials
 * Run with: npx tsx scripts/store-idexx-credentials.ts
 */

import { IdexxCredentialManager } from '@odis-ai/idexx';

async function main() {
  const userId = 'c51bffe0-0f84-4560-8354-2fa65d646f28'; // garrybath@hotmail.com
  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae'; // Alum Rock Animal Hospital
  const username = 'alumrockanimalhospital@yahoo.com';
  const password = 'GoNeo123!';
  const companyId = '9229';

  console.log('Creating credential manager...');
  const manager = await IdexxCredentialManager.create();

  console.log('Storing credentials...');
  const result = await manager.storeCredentials(
    userId,
    clinicId,
    username,
    password,
    companyId
  );

  console.log('✅ Credentials stored successfully!');
  console.log('Credential ID:', result.id);
}

main().catch((error) => {
  console.error('❌ Failed to store credentials:', error);
  process.exit(1);
});

