#!/bin/bash
# Migrate all imports from old path aliases to new grouped aliases

echo "🔄 Migrating imports to new path aliases..."
echo "This will update ~2000+ import statements"
echo ""

# Count total TypeScript files
TOTAL_FILES=$(find . -name "*.ts" -o -name "*.tsx" | wc -l | tr -d ' ')
echo "📁 Found $TOTAL_FILES TypeScript files"
echo ""

# Shared libraries
echo "📦 Updating shared library imports..."
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' '
  s|from "@odis-ai/types"|from "@odis-ai/shared/types"|g
  s|from "@odis-ai/types/|from "@odis-ai/shared/types/|g
  s|from "@odis-ai/validators"|from "@odis-ai/shared/validators"|g
  s|from "@odis-ai/validators/|from "@odis-ai/shared/validators/|g
  s|from "@odis-ai/utils"|from "@odis-ai/shared/util"|g
  s|from "@odis-ai/utils/|from "@odis-ai/shared/util/|g
  s|from "@odis-ai/constants"|from "@odis-ai/shared/constants"|g
  s|from "@odis-ai/constants/|from "@odis-ai/shared/constants/|g
  s|from "@odis-ai/ui"|from "@odis-ai/shared/ui"|g
  s|from "@odis-ai/ui/|from "@odis-ai/shared/ui/|g
  s|from "@odis-ai/hooks"|from "@odis-ai/shared/hooks"|g
  s|from "@odis-ai/hooks/|from "@odis-ai/shared/hooks/|g
  s|from "@odis-ai/styles"|from "@odis-ai/shared/styles"|g
  s|from "@odis-ai/styles/|from "@odis-ai/shared/styles/|g
  s|from "@odis-ai/logger"|from "@odis-ai/shared/logger"|g
  s|from "@odis-ai/logger/|from "@odis-ai/shared/logger/|g
  s|from "@odis-ai/crypto"|from "@odis-ai/shared/crypto"|g
  s|from "@odis-ai/crypto/|from "@odis-ai/shared/crypto/|g
  s|from "@odis-ai/testing"|from "@odis-ai/shared/testing"|g
  s|from "@odis-ai/testing/|from "@odis-ai/shared/testing/|g
  s|from "@odis-ai/env"|from "@odis-ai/shared/env"|g
  s|from "@odis-ai/env/|from "@odis-ai/shared/env/|g
  s|from "@odis-ai/email"|from "@odis-ai/shared/email"|g
  s|from "@odis-ai/email/|from "@odis-ai/shared/email/|g
' {} \;

# Data Access libraries
echo "📦 Updating data-access library imports..."
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' '
  s|from "@odis-ai/api"|from "@odis-ai/data-access/api"|g
  s|from "@odis-ai/api/|from "@odis-ai/data-access/api/|g
  s|from "@odis-ai/db"|from "@odis-ai/data-access/db"|g
  s|from "@odis-ai/db/|from "@odis-ai/data-access/db/|g
' {} \;

# Integration libraries
echo "📦 Updating integration library imports..."
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' '
  s|from "@odis-ai/vapi"|from "@odis-ai/integrations/vapi"|g
  s|from "@odis-ai/vapi/|from "@odis-ai/integrations/vapi/|g
  s|from "@odis-ai/idexx"|from "@odis-ai/integrations/idexx"|g
  s|from "@odis-ai/idexx/|from "@odis-ai/integrations/idexx/|g
  s|from "@odis-ai/qstash"|from "@odis-ai/integrations/qstash"|g
  s|from "@odis-ai/qstash/|from "@odis-ai/integrations/qstash/|g
  s|from "@odis-ai/resend"|from "@odis-ai/integrations/resend"|g
  s|from "@odis-ai/resend/|from "@odis-ai/integrations/resend/|g
  s|from "@odis-ai/slack"|from "@odis-ai/integrations/slack"|g
  s|from "@odis-ai/integrations/slack/|from "@odis-ai/integrations/slack/|g
  s|from "@odis-ai/ai"|from "@odis-ai/integrations/ai"|g
  s|from "@odis-ai/ai/|from "@odis-ai/integrations/ai/|g
  s|from "@odis-ai/retell"|from "@odis-ai/integrations/retell"|g
  s|from "@odis-ai/retell/|from "@odis-ai/integrations/retell/|g
' {} \;

# Domain libraries
echo "📦 Updating domain library imports..."
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' '
  s|from "@odis-ai/services-cases"|from "@odis-ai/domain/cases"|g
  s|from "@odis-ai/services-cases/|from "@odis-ai/domain/cases/|g
  s|from "@odis-ai/services-discharge"|from "@odis-ai/domain/discharge"|g
  s|from "@odis-ai/services-discharge/|from "@odis-ai/domain/discharge/|g
  s|from "@odis-ai/services-shared"|from "@odis-ai/domain/shared"|g
  s|from "@odis-ai/services-shared/|from "@odis-ai/domain/shared/|g
  s|from "@odis-ai/clinics"|from "@odis-ai/domain/clinics"|g
  s|from "@odis-ai/clinics/|from "@odis-ai/domain/clinics/|g
  s|from "@odis-ai/auth"|from "@odis-ai/domain/auth"|g
  s|from "@odis-ai/auth/|from "@odis-ai/domain/auth/|g
' {} \;

# Extension libraries
echo "📦 Updating extension library imports..."
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' '
  s|from "@odis-ai/extension-shared"|from "@odis-ai/extension/shared"|g
  s|from "@odis-ai/extension-shared/|from "@odis-ai/extension/shared/|g
  s|from "@odis-ai/extension-storage"|from "@odis-ai/extension/storage"|g
  s|from "@odis-ai/extension-storage/|from "@odis-ai/extension/storage/|g
  s|from "@odis-ai/extension-env"|from "@odis-ai/extension/env"|g
  s|from "@odis-ai/extension-env/|from "@odis-ai/extension/env/|g
' {} \;

echo ""
echo "✅ Import migration complete!"
echo "Run 'pnpm nx typecheck --skip-nx-cache' to verify"
