# ODIS AI Web - Environment Configuration

This document outlines the environment strategy for the ODIS AI Web application, following the same pattern as the ODIS AI Backend and iOS repositories.

## 🌿 Branching Strategy

The repository follows a three-branch strategy synchronized across all ODIS AI repositories:

| Branch | Environment | Purpose | Auto-Deploy |
|--------|-------------|---------|-------------|
| `dev` | Development | Feature development, testing | ✅ Yes |
| `staging` | Staging | Pre-production testing, demos | ✅ Yes |
| `main` | Production | Stable releases, live users | ⚠️ Manual approval |

## 🏗️ Environment Configuration

### Environment Files

The project uses environment-specific configuration files:

- `.env.development` - Development environment (dev branch)
- `.env.staging` - Staging environment (staging branch)  
- `.env.production` - Production environment (main branch)
- `.env.example` - Template for environment variables
- `.env.local` - Local overrides (gitignored)

### Environment Variables

Each environment requires the following variables:

```bash
# Database
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY="[POSTHOG_KEY]"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# Environment
NODE_ENV="development|production"
```

### Environment Detection

The application automatically detects the current environment using:

1. `NODE_ENV` for basic development vs production
2. `VERCEL_ENV` for deployment platform detection
3. Branch-based detection in CI/CD

## 🚀 Deployment Workflow

### Development Flow

```bash
# 1. Make changes on dev branch
git checkout dev
# Make your changes
git add . && git commit -m "feat: add new feature"
git push origin dev  # Auto-deploys to dev environment

# 2. Update with backend changes
git pull origin dev
# Update TypeScript types if needed
git add . && git commit -m "sync: update with backend changes"
git push origin dev
```

### Staging Flow

```bash
# 1. Deploy backend to staging first
cd ../odis-ai-backend
git checkout staging
git merge dev
git push origin staging  # Auto-deploys to staging

# 2. Deploy web app to staging
cd ../odis-ai-web
git checkout staging
git merge dev
git push origin staging  # Auto-deploys to staging

# 3. Test staging environment
# Verify all functionality works end-to-end
```

### Production Flow

```bash
# 1. Deploy backend to production
cd ../odis-ai-backend
git checkout main
git merge staging
git push origin main  # Requires manual approval

# 2. Deploy web app to production
cd ../odis-ai-web
git checkout main
git merge staging
git push origin main  # Requires manual approval
```

## 🛠️ Local Development

### Prerequisites

- Node.js 20+
- pnpm package manager
- Supabase CLI (for backend integration)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd odis-ai-web
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   # Copy the appropriate environment file
   cp .env.development .env.local
   # Edit .env.local with your actual values
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

### Environment-Specific Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build:dev             # Build for development
pnpm start:dev             # Start production server (dev env)

# Staging
pnpm dev:staging           # Start dev server (staging config)
pnpm build:staging         # Build for staging
pnpm start:staging         # Start production server (staging env)

# Production
pnpm build:production      # Build for production
pnpm start:production      # Start production server
```

## 🔧 CI/CD Configuration

### CircleCI Pipeline

The project uses CircleCI for automated deployments:

- **Development**: Auto-deploy on `dev` branch push
- **Staging**: Auto-deploy on `staging` branch push  
- **Production**: Manual approval required on `main` branch

### Environment Variables in CI/CD

Configure these environment variables in CircleCI:

```bash
# Supabase Configuration
SUPABASE_DEV_PROJECT_REF=your-dev-project-ref
SUPABASE_DEV_DB_PASSWORD=your-dev-db-password
SUPABASE_STAGING_PROJECT_REF=your-staging-project-ref
SUPABASE_STAGING_DB_PASSWORD=your-staging-db-password
SUPABASE_PROD_PROJECT_REF=your-prod-project-ref
SUPABASE_PROD_DB_PASSWORD=your-prod-db-password

# Deployment Platform (e.g., Vercel)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

## 🔄 Repository Synchronization

### Keeping in Sync with Backend

When the backend makes changes:

1. **Database Schema Changes:**
   - Update TypeScript types if using code generation
   - Update API calls if schema changes affect them
   - Test client app against new schema

2. **Edge Function Changes:**
   - Update API calls in client app
   - Update function URLs if changed
   - Test new functionality

3. **Configuration Changes:**
   - Update client app configuration
   - Test against new settings

### Branch Synchronization

All repositories maintain synchronized branches:

```bash
# Check if branches are in sync
git log --oneline -1 dev      # Should be same across all repos
git log --oneline -1 staging  # Should be same across all repos
git log --oneline -1 main     # Should be same across all repos
```

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading:**
   - Check `.env.local` file exists
   - Verify variable names match `src/env.js` schema
   - Restart development server

2. **Build Failures:**
   - Check environment-specific build commands
   - Verify all required environment variables are set
   - Check CircleCI logs for deployment issues

3. **Database Connection Issues:**
   - Verify `DATABASE_URL` is correct for environment
   - Check Supabase project status
   - Verify network connectivity

### Rollback Strategy

1. **Backend Rollback:**
   ```bash
   # Create rollback migration
   supabase migration new rollback_problematic_change
   # Add rollback SQL
   git add . && git commit -m "rollback: revert problematic change"
   git push origin main
   ```

2. **Client App Rollback:**
   ```bash
   # Revert to previous commit
   git checkout main
   git reset --hard HEAD~1
   git push --force origin main
   ```

## 📚 Quick Reference

### Daily Development
```bash
# Make changes
git checkout dev
# Edit files
git add . && git commit -m "feat: new feature"
git push origin dev  # Auto-deploys

# Sync with backend changes
git pull origin dev
# Update types/API calls if needed
git add . && git commit -m "sync: backend updates"
git push origin dev
```

### Release to Staging
```bash
git checkout staging
git merge dev
git push origin staging  # Auto-deploys to staging
```

### Release to Production
```bash
git checkout main
git merge staging
git push origin main  # Requires manual approval
```

### Environment URLs
- **Development**: `https://your-dev-project-ref.supabase.co`
- **Staging**: `https://your-staging-project-ref.supabase.co`
- **Production**: `https://your-prod-project-ref.supabase.co`

## 🤝 Contributing

1. Create feature branch from `dev`
2. Make your changes
3. Test locally with appropriate environment
4. Create pull request to `dev`
5. Coordinate with backend team for testing
6. Follow the deployment workflow for releases