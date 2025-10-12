# Odis AI Web

This is a [T3 Stack](https://create.t3.gg/) project with Supabase authentication and database integration using Drizzle ORM.

## Features

- 🔐 **Supabase Authentication** - Email/password authentication with server-side session management
- 🗄️ **Drizzle ORM** - Type-safe database operations with PostgreSQL
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- ⚡ **Next.js 15** - App Router with server components and actions
- 🔒 **Type Safety** - End-to-end TypeScript with tRPC
- 🚀 **Performance** - Optimized with Supabase connection pooling

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

1. Copy the environment variables template:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres.cfolejjpkgytbkfsavjv:LHCX4S11Mb6t03TxZseVLOwFG1Mh5774n3px@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://cfolejjpkgytbkfsavjv.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

   # PostHog (optional)
   NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key-here"
   NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
   ```

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up the database schema:
   ```bash
   pnpm db:push
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The project includes a comprehensive veterinary practice management system with the following database tables:

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

### Running Migrations

```bash
# Generate migration files
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema changes directly (development)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

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
