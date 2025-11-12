# Vercel Environment Configuration

This guide shows how to configure environment variables in Vercel for the ODIS AI Web application across all three environments using a single Vercel project.

## 🚀 Vercel Project Setup

### 1. Single Vercel Project

You have one Vercel project that handles all environments through branch-based deployments:

- **Development**: Deploys from `dev` branch
- **Staging**: Deploys from `staging` branch  
- **Production**: Deploys from `main` branch

### 2. Environment Variables Configuration

Configure environment variables with different scopes for each environment in your single Vercel project:

## 🔧 Development Environment (dev branch)

**Project:** `odis-ai-web-dev`

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres.cfolejjpkgytbkfsavjv:LHCX4S11Mb6t03TxZseVLOwFG1Mh5774n3px@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase - Development (odisai-dev)
NEXT_PUBLIC_SUPABASE_URL=https://cfolejjpkgytbkfsavjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb2xlampwa2d5dGJrZnNhdmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTU1NTUsImV4cCI6MjA3NTYzMTU1NX0.NHF_HGNXu-yluFHQZXoS1mkZj3wgDFwQaNmypaSzqC8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb2xlampwa2d5dGJrZnNhdmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA1NTU1NSwiZXhwIjoyMDc1NjMxNTU1fQ.XxZyOVe3scYXpVFsidPCu83Uy64F7R5ShlsR3izKtkI

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_Y70cB5rLrVkFrxTNDvcUfeXmcUGgzrI9mGlYzWId7ul
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Environment
NODE_ENV=development
```

## 🧪 Staging Environment (staging branch)

**Project:** `odis-ai-web-staging`

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres.zgfhxzvithljbfvzsrwv:jfVcunXHScBHgfrZEMytWaGGRpdwsAuW@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase - Staging (odisai-staging)
NEXT_PUBLIC_SUPABASE_URL=https://zgfhxzvithljbfvzsrwv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZmh4enZpdGhsamJmdnpzcnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTY3NzAsImV4cCI6MjA3NTYzMjc3MH0.xgDwFoFi2iSPBMHTHpR6TDJuTOYWZ5Yi_d2pQT4TrhM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZmh4enZpdGhsamJmdnpzcnd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA1Njc3MCwiZXhwIjoyMDc1NjMyNzcwfQ.cIZoqjhiqOn0L9MeJvGXDJuEDceu9nXo0uSsPWCGwio

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_Y70cB5rLrVkFrxTNDvcUfeXmcUGgzrI9mGlYzWId7ul
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Environment
NODE_ENV=production
```

## 🏭 Production Environment (main branch)

**Project:** `odis-ai-web-prod`

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres.jjvjqjcitupulqiqnihy:qViDDEPopfieTQVIkQSEXxeyDipQtVbHskqu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase - Production (odisai-prod)
NEXT_PUBLIC_SUPABASE_URL=https://jjvjqjcitupulqiqnihy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdmpxamNpdHVwdWxxaXFuaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTY2ODUsImV4cCI6MjA3NTYzMjY4NX0.jwiWkb8FpuEmBDYAjdzhTryCShumRos9-2XB_3nXqXI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdmpxamNpdHVwdWxxaXFuaWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA1NjY4NSwiZXhwIjoyMDc1NjMyNjg1fQ.jkcJHKZHt7QKWanOB_wVZ-1yDZxRLKcyDg9gEO2fhV8

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_Y70cB5rLrVkFrxTNDvcUfeXmcUGgzrI9mGlYzWId7ul
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Environment
NODE_ENV=production
```

## 📋 Step-by-Step Vercel Setup

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Your Existing Project
```bash
# In your project directory
vercel link

# When prompted:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? Yes
# - Select your existing project from the list
```

### 4. Configure Environment Variables for All Environments

You'll add each environment variable with different scopes (Development, Preview, Production):

#### Add Development Environment Variables
```bash
vercel env add DATABASE_URL
# Paste: postgresql://postgres.cfolejjpkgytbkfsavjv:LHCX4S11Mb6t03TxZseVLOwFG1Mh5774n3px@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
# Environment: Development

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://cfolejjpkgytbkfsavjv.supabase.co
# Environment: Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb2xlampwa2d5dGJrZnNhdmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTU1NTUsImV4cCI6MjA3NTYzMTU1NX0.NHF_HGNXu-yluFHQZXoS1mkZj3wgDFwQaNmypaSzqC8
# Environment: Development

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb2xlampwa2d5dGJrZnNhdmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA1NTU1NSwiZXhwIjoyMDc1NjMxNTU1fQ.XxZyOVe3scYXpVFsidPCu83Uy64F7R5ShlsR3izKtkI
# Environment: Development

vercel env add NEXT_PUBLIC_POSTHOG_KEY
# Paste: phc_Y70cB5rLrVkFrxTNDvcUfeXmcUGgzrI9mGlYzWId7ul
# Environment: Development

vercel env add NEXT_PUBLIC_POSTHOG_HOST
# Paste: https://us.i.posthog.com
# Environment: Development

vercel env add NODE_ENV
# Paste: development
# Environment: Development
```

#### Add Staging Environment Variables
```bash
vercel env add DATABASE_URL
# Paste: postgresql://postgres.zgfhxzvithljbfvzsrwv:jfVcunXHScBHgfrZEMytWaGGRpdwsAuW@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
# Environment: Preview

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://zgfhxzvithljbfvzsrwv.supabase.co
# Environment: Preview

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZmh4enZpdGhsamJmdnpzcnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTY3NzAsImV4cCI6MjA3NTYzMjc3MH0.xgDwFoFi2iSPBMHTHpR6TDJuTOYWZ5Yi_d2pQT4TrhM
# Environment: Preview

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZmh4enZpdGhsamJmdnpzcnd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA1Njc3MCwiZXhwIjoyMDc1NjMyNzcwfQ.cIZoqjhiqOn0L9MeJvGXDJuEDceu9nXo0uSsPWCGwio
# Environment: Preview

vercel env add NEXT_PUBLIC_POSTHOG_KEY
# Paste: phc_Y70cB5rLrVkFrxTNDvcUfeXmcUGgzrI9mGlYzWId7ul
# Environment: Preview

vercel env add NEXT_PUBLIC_POSTHOG_HOST
# Paste: https://us.i.posthog.com
# Environment: Preview

vercel env add NODE_ENV
# Paste: production
# Environment: Preview
```

#### Add Production Environment Variables
```bash
vercel env add DATABASE_URL
# Paste: postgresql://postgres.jjvjqjcitupulqiqnihy:qViDDEPopfieTQVIkQSEXxeyDipQtVbHskqu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
# Environment: Production

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://jjvjqjcitupulqiqnihy.supabase.co
# Environment: Production

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdmpxamNpdHVwdWxxaXFuaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTY2ODUsImV4cCI6MjA3NTYzMjY4NX0.jwiWkb8FpuEmBDYAjdzhTryCShumRos9-2XB_3nXqXI
# Environment: Production

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdmpxamNpdHVwdWxxaXFuaWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA1NjY4NSwiZXhwIjoyMDc1NjMyNjg1fQ.jkcJHKZHt7QKWanOB_wVZ-1yDZxRLKcyDg9gEO2fhV8
# Environment: Production

vercel env add NEXT_PUBLIC_POSTHOG_KEY
# Paste: phc_Y70cB5rLrVkFrxTNDvcUfeXmcUGgzrI9mGlYzWId7ul
# Environment: Production

vercel env add NEXT_PUBLIC_POSTHOG_HOST
# Paste: https://us.i.posthog.com
# Environment: Production

vercel env add NODE_ENV
# Paste: production
# Environment: Production
```

## 🔄 Alternative: Vercel Dashboard Setup

You can also configure environment variables through the Vercel dashboard:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate environment scope:
   - **Development**: For `dev` branch deployments
   - **Preview**: For `staging` branch deployments  
   - **Production**: For `main` branch deployments

### Environment Variable Mapping

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `DATABASE_URL` | odisai-dev | odisai-staging | odisai-prod |
| `NEXT_PUBLIC_SUPABASE_URL` | cfolejjpkgytbkfsavjv | zgfhxzvithljbfvzsrwv | jjvjqjcitupulqiqnihy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev key | staging key | prod key |
| `SUPABASE_SERVICE_ROLE_KEY` | dev key | staging key | prod key |
| `NODE_ENV` | development | production | production |

## 🚀 Deployment Workflow

### Development Deployment
```bash
git checkout dev
git push origin dev
# Vercel automatically deploys from dev branch
```

### Staging Deployment
```bash
git checkout staging
git merge dev
git push origin staging
# Vercel automatically deploys from staging branch
```

### Production Deployment
```bash
git checkout main
git merge staging
git push origin main
# Vercel automatically deploys from main branch
```

## 🔍 Verification

After setting up all environments, verify each deployment:

1. **Development**: Check that it connects to `odisai-dev` Supabase project
2. **Staging**: Check that it connects to `odisai-staging` Supabase project
3. **Production**: Check that it connects to `odisai-prod` Supabase project

You can verify by checking the network tab in browser dev tools to see which Supabase URL is being used.

## 📝 Notes

- Each Vercel project should be linked to its respective Git branch
- Environment variables are automatically injected based on the deployment environment
- Make sure to set the correct environment scope for each variable
- The `NODE_ENV` should be `development` for dev and `production` for staging/prod