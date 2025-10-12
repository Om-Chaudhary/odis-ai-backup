# ODIS AI Web

A Next.js web application for veterinary professionals, providing AI-powered case management, transcription, and SOAP note generation. This app is part of the ODIS AI ecosystem and consumes the centralized backend managed in `odis-ai-backend`.

Built with the [T3 Stack](https://create.t3.gg/) and Supabase authentication with Drizzle ORM.

## 🏗️ Architecture Overview

- **Frontend**: Next.js 15 with App Router and React Server Components
- **Backend**: Centralized Supabase backend (`odis-ai-backend`)
- **Environment Management**: Multi-environment support (dev/staging/prod)
- **Authentication**: Supabase Auth with server-side session management
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Type Safety**: End-to-end TypeScript

## 🔗 Related Repositories

- **`odis-ai-backend`** - Centralized backend with database migrations, Edge Functions, and CI/CD
- **`odis-ai-ios`** - SwiftUI iOS application (shares same backend)

## Features

- 🔐 **Supabase Authentication** - Email/password authentication with server-side session management
- 🗄️ **Drizzle ORM** - Type-safe database operations with PostgreSQL
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- ⚡ **Next.js 15** - App Router with server components and actions
- 🔒 **Type Safety** - End-to-end TypeScript with tRPC
- 🚀 **Performance** - Optimized with Supabase connection pooling
- 📱 **Responsive** - Mobile-first design that works across all devices

## Tech Stack

- [Next.js](https://nextjs.org) - React framework with App Router
- [Supabase](https://supabase.com) - Backend-as-a-Service with PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe SQL ORM
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Re-usable component library
- [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account and project

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd odis-ai-web
   ```

2. **Copy environment variables template**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables**
   
   Update `.env.local` with your environment-specific Supabase credentials:
   
   **For Development:**
   ```env
   # Database (Development)
   DATABASE_URL="postgresql://postgres.your-dev-ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Supabase (Development)
   NEXT_PUBLIC_SUPABASE_URL="https://your-dev-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-dev-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-dev-service-role-key"

   # PostHog (optional)
   NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key-here"
   NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
   
   # Environment identifier
   NEXT_PUBLIC_ENVIRONMENT="development"
   ```

4. **Additional environment files** (for different deployment environments)
   
   Create `.env.staging` for staging:
   ```env
   DATABASE_URL="postgresql://postgres.your-staging-ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   NEXT_PUBLIC_SUPABASE_URL="https://your-staging-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-staging-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-staging-service-role-key"
   NEXT_PUBLIC_ENVIRONMENT="staging"
   ```
   
   Create `.env.production` for production:
   ```env
   DATABASE_URL="postgresql://postgres.your-prod-ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   NEXT_PUBLIC_SUPABASE_URL="https://your-prod-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-prod-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-prod-service-role-key"
   NEXT_PUBLIC_ENVIRONMENT="production"
   ```

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up the database schema** (sync with backend)
   ```bash
   pnpm db:push
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open in browser**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Verify backend connection**
   - Check that you can sign up/login
   - Verify database operations work
   - Test against development backend

## 🔧 Development Workflow

### Local Development

1. **Backend Setup**: Ensure `odis-ai-backend` is running locally
   ```bash
   cd ../odis-ai-backend
   supabase start
   ```

2. **Web Development**: Work with development environment
   ```bash
   cd ../odis-ai-web
   pnpm dev
   # Runs on http://localhost:3000
   # Points to development Supabase project
   ```

### Environment Configuration

The app automatically uses different environments based on configuration:

| Environment | Database | Purpose | Command |
|-------------|----------|---------|---------|
| Development | `odisai-dev` | Local development, testing | `pnpm dev` |
| Staging | `odisai-staging` | Pre-production testing | `pnpm build && pnpm start` with `.env.staging` |
| Production | `odisai-prod` | Live application | Deploy with `.env.production` |

### Backend Synchronization

When backend changes are deployed, you may need to update the web app:

#### 1. Database Schema Changes
```bash
# Check for new/changed data models
cd ../odis-ai-backend
git pull origin dev

# Review migration files
ls supabase/migrations/

# Update web app if needed
cd ../odis-ai-web
pnpm db:pull  # Pull latest schema
pnpm db:generate  # Generate new types
pnpm db:push  # Push to local if needed
```

#### 2. Edge Function Changes  
```bash
# Check for API endpoint changes
cd ../odis-ai-backend/supabase/functions

# Update web app service calls if needed
cd ../odis-ai-web
# - Update API calls
# - Update request/response types
# - Test integration
```

#### 3. Authentication Changes
```bash
# Review auth-related changes
# Update auth flows if needed
# Test authentication end-to-end
```

## 🚀 Daily Development Process

### Development Workflow

1. **Pull latest backend changes**
   ```bash
   cd ../odis-ai-backend
   git pull origin dev
   ```

2. **Check for breaking changes**
   - Review commit messages for API changes
   - Check migration files for schema changes
   - Update web app code if needed

3. **Web development**
   ```bash
   cd ../odis-ai-web
   git pull origin dev
   pnpm dev
   # Make your changes
   # Test locally against dev backend
   ```

4. **Testing**
   - Test against development environment
   - Verify responsive design
   - Test authentication flows

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new functionality"
   git push origin dev
   ```

### Release Workflow

#### Development → Staging
1. **Backend staging deployment**
   ```bash
   cd ../odis-ai-backend
   git checkout staging
   git merge dev
   git push origin staging  # Auto-deploys to staging
   ```

2. **Web app staging testing**
   ```bash
   cd ../odis-ai-web
   # Update environment to point to staging
   cp .env.staging .env.local
   pnpm build
   pnpm start
   # Test against staging backend
   ```

#### Staging → Production
1. **Backend production deployment**
   ```bash
   cd ../odis-ai-backend
   git checkout main
   git merge staging
   git push origin main  # Requires approval, deploys to production
   ```

2. **Web app production deployment**
   ```bash
   cd ../odis-ai-web
   # Deploy to production (Vercel, Netlify, etc.)
   # Use .env.production variables
   ```

## Database Schema

The project uses the centralized database schema managed by `odis-ai-backend`:

- **users** - User accounts linked to Supabase auth with veterinary roles
- **cases** - Veterinary cases with status, type, and visibility settings
- **patients** - Patient information linked to cases
- **transcriptions** - Audio transcriptions with speaker segmentation
- **audio_files** - Audio file metadata and processing information
- **soap_notes** - SOAP (Subjective, Objective, Assessment, Plan) notes
- **templates** - Reusable templates for various document types
- **generations** - AI-generated content linked to templates and cases
- **discharge_summaries** - Patient discharge documentation
- **contact_submissions** - Contact form submissions from potential customers
- **temp_soap_templates** - Temporary SOAP note templates with smart defaults

### Database Operations

```bash
# Pull latest schema from backend
pnpm db:pull

# Generate TypeScript types from schema
pnpm db:generate

# Push local schema changes (development only)
pnpm db:push

# Run database migrations
pnpm db:migrate

# Open Drizzle Studio for database exploration
pnpm db:studio
```

**Note**: Schema migrations are managed centrally in `odis-ai-backend`. Local schema changes should be coordinated with backend team.

## Authentication Flow

### Server-Side Authentication

The app uses server-side authentication with cookies for security:

```typescript
// Get current user in server components
import { getUser } from "~/server/actions/auth";

export default async function ProtectedPage() {
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return <div>Welcome, {user.email}!</div>;
}
```

### Client-Side Authentication

For client components, use the Supabase client:

```typescript
"use client";
import { createClient } from "~/lib/supabase/client";

export default function ClientComponent() {
  const supabase = createClient();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  
  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## API Routes

### Server Actions

The project includes server actions for authentication:

- `signUp(email, password)` - Create new user account
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `getUser()` - Get current authenticated user
- `getUserProfile(userId)` - Get user profile data
- `createUserProfile(userId, data)` - Create user profile
- `updateUserProfile(userId, data)` - Update user profile

### Example Usage

```typescript
import { signIn, getUser } from "~/server/actions/auth";

// In a form action
async function handleSignIn(formData: FormData) {
  await signIn(formData);
}

// In a server component
export default async function Page() {
  const user = await getUser();
  return <div>User: {user?.email}</div>;
}
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── auth/              # Auth callbacks
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   └── supabase/         # Supabase client setup
├── server/               # Server-side code
│   ├── actions/          # Server actions
│   └── db/              # Database schema and connection
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## Learn More

- [T3 Stack Documentation](https://create.t3.gg/)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js App Router](https://nextjs.org/docs/app)

## Deployment

Follow the deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker).

Make sure to set all environment variables in your deployment platform.
