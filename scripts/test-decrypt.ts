/**
 * Test decryption of stored credentials
 */

import { IdexxCredentialManager } from '../libs/idexx/src/credential-manager';

async function main() {
  const userId = 'c51bffe0-0f84-4560-8354-2fa65d646f28';
  const clinicId = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae';

  console.log('ENV KEY LENGTH:', process.env.IDEXX_ENCRYPTION_KEY?.length);
  console.log('ENV KEY FIRST 10:', process.env.IDEXX_ENCRYPTION_KEY?.substring(0, 10));
  
  console.log('\nCreating credential manager...');
  const manager = await IdexxCredentialManager.create();

  console.log('Getting credentials...');
  const creds = await manager.getCredentials(userId, clinicId);
  
  if (creds) {
    console.log('✅ Decryption successful!');
    console.log('Username:', creds.username);
  } else {
    console.log('❌ No credentials found');
  }
}

main().catch((error) => {
  console.error('❌ Failed:', error.message);
  process.exit(1);
});

