#!/usr/bin/env tsx
/**
 * Update tsconfig.base.json path aliases to reflect new grouped structure
 */

import * as fs from "fs";

const newPaths = {
  // Shared
  "@odis-ai/shared/types": ["libs/shared/types/src/index.ts"],
  "@odis-ai/shared/types/*": ["libs/shared/types/src/*"],
  "@odis-ai/shared/validators": ["libs/shared/validators/src/index.ts"],
  "@odis-ai/shared/validators/*": ["libs/shared/validators/src/*"],
  "@odis-ai/shared/util": ["libs/shared/util/src/index.ts"],
  "@odis-ai/shared/util/*": ["libs/shared/util/src/*"],
  "@odis-ai/shared/constants": ["libs/shared/constants/src/index.ts"],
  "@odis-ai/shared/constants/*": ["libs/shared/constants/src/*"],
  "@odis-ai/shared/ui": ["libs/shared/ui/src/index.ts"],
  "@odis-ai/shared/ui/*": ["libs/shared/ui/src/*"],
  "@odis-ai/shared/hooks": ["libs/shared/hooks/src/index.ts"],
  "@odis-ai/shared/hooks/*": ["libs/shared/hooks/src/*"],
  "@odis-ai/shared/styles": ["libs/shared/styles/src/index.css"],
  "@odis-ai/shared/styles/*": ["libs/shared/styles/src/*"],
  "@odis-ai/shared/logger": ["libs/shared/logger/src/index.ts"],
  "@odis-ai/shared/logger/*": ["libs/shared/logger/src/*"],
  "@odis-ai/shared/crypto": ["libs/shared/crypto/src/index.ts"],
  "@odis-ai/shared/crypto/*": ["libs/shared/crypto/src/*"],
  "@odis-ai/shared/testing": ["libs/shared/testing/src/index.ts"],
  "@odis-ai/shared/testing/*": ["libs/shared/testing/src/*"],
  "@odis-ai/shared/env": ["libs/shared/env/src/index.ts"],
  "@odis-ai/shared/env/*": ["libs/shared/env/src/*"],
  "@odis-ai/shared/email": ["libs/shared/email/src/index.ts"],
  "@odis-ai/shared/email/*": ["libs/shared/email/src/*"],

  // Data Access
  "@odis-ai/data-access/api": ["libs/data-access/api/src/index.ts"],
  "@odis-ai/data-access/api/*": ["libs/data-access/api/src/*"],
  "@odis-ai/data-access/db": ["libs/data-access/db/src/index.ts"],
  "@odis-ai/data-access/db/*": ["libs/data-access/db/src/*"],

  // Integrations
  "@odis-ai/integrations/vapi": ["libs/integrations/vapi/src/index.ts"],
  "@odis-ai/integrations/vapi/*": ["libs/integrations/vapi/src/*"],
  "@odis-ai/integrations/idexx": ["libs/integrations/idexx/src/index.ts"],
  "@odis-ai/integrations/idexx/*": ["libs/integrations/idexx/src/*"],
  "@odis-ai/integrations/qstash": ["libs/integrations/qstash/src/index.ts"],
  "@odis-ai/integrations/qstash/*": ["libs/integrations/qstash/src/*"],
  "@odis-ai/integrations/resend": ["libs/integrations/resend/src/index.ts"],
  "@odis-ai/integrations/resend/*": ["libs/integrations/resend/src/*"],
  "@odis-ai/integrations/slack": ["libs/integrations/slack/src/index.ts"],
  "@odis-ai/integrations/slack/*": ["libs/integrations/slack/src/*"],
  "@odis-ai/integrations/ai": ["libs/integrations/ai/src/index.ts"],
  "@odis-ai/integrations/ai/*": ["libs/integrations/ai/src/*"],
  "@odis-ai/integrations/retell": ["libs/integrations/retell/src/index.ts"],
  "@odis-ai/integrations/retell/*": ["libs/integrations/retell/src/*"],

  // Domain
  "@odis-ai/domain/cases": ["libs/domain/cases/data-access/src/index.ts"],
  "@odis-ai/domain/cases/*": ["libs/domain/cases/data-access/src/*"],
  "@odis-ai/domain/discharge": ["libs/domain/discharge/data-access/src/index.ts"],
  "@odis-ai/domain/discharge/*": ["libs/domain/discharge/data-access/src/*"],
  "@odis-ai/domain/shared": ["libs/domain/shared/util/src/index.ts"],
  "@odis-ai/domain/shared/*": ["libs/domain/shared/util/src/*"],
  "@odis-ai/domain/clinics": ["libs/domain/clinics/util/src/index.ts"],
  "@odis-ai/domain/clinics/*": ["libs/domain/clinics/util/src/*"],
  "@odis-ai/domain/auth": ["libs/domain/auth/util/src/index.ts"],
  "@odis-ai/domain/auth/*": ["libs/domain/auth/util/src/*"],

  // Extension
  "@odis-ai/extension/shared": ["libs/extension/shared/src/index.ts"],
  "@odis-ai/extension/shared/*": ["libs/extension/shared/src/*"],
  "@odis-ai/extension/storage": ["libs/extension/storage/src/index.ts"],
  "@odis-ai/extension/storage/*": ["libs/extension/storage/src/*"],
  "@odis-ai/extension/env": ["libs/extension/env/src/index.ts"],
  "@odis-ai/extension/env/*": ["libs/extension/env/src/*"],
};

function updatePathAliases() {
  const tsconfigPath = "tsconfig.base.json";
  const content = fs.readFileSync(tsconfigPath, "utf-8");
  const config = JSON.parse(content);

  // Replace paths completely
  config.compilerOptions.paths = newPaths;

  // Write updated config
  fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + "\n");
  console.log("✅ Updated tsconfig.base.json with new path aliases");
  console.log(`   Total aliases: ${Object.keys(newPaths).length}`);
}

updatePathAliases();
