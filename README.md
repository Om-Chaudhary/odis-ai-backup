# ODIS AI Web

A comprehensive Next.js web application for veterinary professionals, providing AI-powered case management, SOAP note generation, practice integration, and content management. This app is part of the ODIS AI ecosystem and consumes the centralized backend managed in `odis-ai-backend`.

Built with the [T3 Stack](https://create.t3.gg/) and Supabase authentication with Drizzle ORM.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
  - [Authentication & Authorization](#authentication--authorization)
  - [User Dashboard](#user-dashboard)
  - [Onboarding Flow](#onboarding-flow)
  - [Admin Panel](#admin-panel)
  - [AI SOAP Note Generation](#ai-soap-note-generation)
  - [Blog System](#blog-system)
  - [Landing Page](#landing-page)
  - [Support Hub](#support-hub)
  - [Analytics & Tracking](#analytics--tracking)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [API Routes & tRPC](#api-routes--trpc)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Deployment](#deployment)

## Architecture Overview

- **Frontend**: Next.js 15 with App Router and React Server Components
- **Backend**: Centralized Supabase backend (`odis-ai-backend`)
- **Environment Management**: Multi-environment support (dev/staging/prod)
- **Authentication**: Supabase Auth with server-side session management
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **CMS**: Sanity for blog content management
- **Styling**: Tailwind CSS with shadcn/ui components
- **Type Safety**: End-to-end TypeScript with tRPC
- **Analytics**: PostHog for user behavior tracking

## Related Repositories

- **`odis-ai-backend`** - Centralized backend with database migrations, Edge Functions, and CI/CD
- **`odis-ai-ios`** - SwiftUI iOS application (shares same backend)

## Features

### Authentication & Authorization

- Email/password authentication with Supabase Auth
- Server-side session management with secure cookies
- Role-based access control (admin, veterinarian, practice_owner, vet_tech, client)
- Automatic user profile creation on first login
- Protected routes with middleware-based authentication
- Admin-only access to sensitive features
- Email verification and OAuth callback handling

**Key Files:**

- `src/server/actions/auth.ts` - Authentication server actions
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/signup/page.tsx` - Signup with onboarding
- `src/middleware.ts` - Auth middleware and route protection

### User Dashboard

A personalized dashboard for veterinary professionals with:

- **Profile Display**:
  - User name, email, and avatar
  - Clinic name and license number
  - Role badges and account status
  - Last login information

- **Settings Tabs**:
  - **Personal Information**: Update name, email, clinic name, license number
  - **Account Settings**: View account status, user ID, data export options
  - **Security**: Password management, email verification status, login notifications, session management

**Key Files:**

- `src/app/dashboard/page.tsx` - Dashboard page
- `src/components/dashboard/DashboardProfileHeader.tsx` - Profile header
- `src/components/dashboard/DashboardProfileContent.tsx` - Settings tabs

### Onboarding Flow

Two-step guided onboarding process for new users:

#### Step 1: Account Creation

- Email and password registration
- Real-time validation
- Password strength requirements

#### Step 2: PIMS Selection

- **Practice Information Management System (PIMS) Integration**
- Support for 6 major veterinary PIMS platforms:
  - IDEXX Neo
  - AVImark
  - Cornerstone (IDEXX)
  - ezyVet
  - Digitail
  - Vetspire
- Visual selection with platform logos
- Secure credential input (username/password)
- Optional manual entry or skip option
- Credentials stored securely in user profile
- Multi-PIMS support for practices using multiple systems

**Key Files:**

- `src/components/onboarding/OnboardingContainer.tsx` - Orchestrates onboarding flow
- `src/components/onboarding/AccountStep.tsx` - Account creation step
- `src/components/onboarding/PIMSStep.tsx` - PIMS selection and configuration
- `src/components/onboarding/StepIndicator.tsx` - Progress indicator

### Admin Panel

Comprehensive administrative interface for managing templates and testing AI features:

#### Template Management Dashboard

- Quick action cards for common tasks
- Statistics and overview metrics
- Direct links to template management

#### SOAP Templates Management

- **Data Table** with search and filtering:
  - Filter by user assignment
  - Filter by default status
  - Sortable columns
  - Bulk operations
  - Inline edit/delete actions

- **Template CRUD Operations**:
  - Create new SOAP templates from scratch
  - Edit existing templates
  - Delete templates with confirmation
  - Assign templates to specific users
  - Mark templates as default

- **Template Customization**:
  - Template metadata (name, display name, icon)
  - Custom SOAP sections (Subjective, Objective, Assessment, Plan)
  - Client instructions template
  - Flexible prompt engineering for each section
  - System prompt additions for AI customization
  - Template versioning and management

#### SOAP Playground (Testing Environment)

- Load any template for testing
- Sample transcription data for quick testing
- Real-time SOAP note generation
- Template override support
- Copy-to-clipboard for generated content
- Results display for all SOAP sections:
  - Subjective
  - Objective
  - Assessment
  - Plan
  - Client Instructions

**Key Files:**

- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/admin/templates/soap/page.tsx` - Template list
- `src/app/admin/templates/soap/new/page.tsx` - Create template
- `src/app/admin/templates/soap/[id]/page.tsx` - Edit template
- `src/app/admin/soap-playground/page.tsx` - Testing playground
- `src/components/admin/SoapTemplateForm.tsx` - Template form component
- `src/components/admin/SoapTemplatesFilters.tsx` - Filter component
- `src/components/admin/soap-templates-columns.tsx` - Table definitions

### AI SOAP Note Generation

Powerful AI-driven SOAP note generation from veterinary transcriptions:

- **Template-Based Generation**: Use custom templates for different specialties
- **Transcription Processing**: Convert voice recordings to structured SOAP notes
- **Customizable Prompts**: Fine-tune AI behavior per section
- **Multiple Output Formats**: Generate complete SOAP notes with client instructions
- **Edge Function Integration**: Powered by Supabase edge functions (generate-soap-notes-v2)

**Generated Sections:**

- Subjective (Patient history and owner concerns)
- Objective (Physical examination findings)
- Assessment (Diagnosis and clinical interpretation)
- Plan (Treatment plan and recommendations)
- Client Instructions (Take-home care instructions)

**Key Files:**

- `src/app/api/generate-soap/route.ts` - SOAP generation API endpoint
- `src/server/api/routers/templates.ts` - Template management router
- `src/server/api/routers/playground.ts` - Playground testing router

### Blog System

Full-featured blog powered by Sanity CMS:

#### Blog Features

- **Content Management**: Headless CMS via Sanity
- **Rich Content**: PortableText for rich text rendering
- **Author Management**: Author profiles with bios and images
- **Category System**: Organize posts by categories
- **SEO Optimization**:
  - Meta tags and Open Graph support
  - JSON-LD structured data (Article, BreadcrumbList)
  - Automatic sitemap generation
  - Custom metadata per post

#### Blog List Page

- Dynamic post loading from Sanity
- Post cards with featured images
- Author information and publication dates
- Category badges
- Post excerpts/summaries
- Skeleton loading states
- Responsive grid layout
- Breadcrumb navigation

#### Individual Blog Posts

- Full rich text content rendering
- Featured images with hover effects
- Author bio section with avatar
- Publication and last updated dates
- Category information
- Social sharing ready
- Back-to-blog navigation
- Custom typography and formatting

**Key Files:**

- `src/app/blog/page.tsx` - Blog list page
- `src/app/blog/[slug]/page.tsx` - Individual blog post
- `src/components/BlogLayout.tsx` - Blog card layout
- `src/sanity/schemaTypes/` - Content type definitions
- `src/app/studio/[[...tool]]/page.tsx` - Sanity Studio admin

### Landing Page

Professional marketing landing page with:

#### Sections

- **Hero Section**:
  - Compelling headline and subheadline
  - Floating animation effects
  - Primary CTA to waitlist
  - Particle background animations

- **Trust/Integration Logos**:
  - Auto-scrolling carousel
  - Major PIMS integrations showcase
  - Social proof

- **Testimonials**:
  - Customer testimonials carousel
  - Veterinary professional quotes
  - Practice information

- **Pricing**:
  - Three-tier pricing structure:
    - **Starter** ($120/month): ~1 note/day, 30 notes/month
    - **Core** ($375/month): Unlimited generations, full support
    - **Enterprise** (Custom): White-label, custom integrations
  - Feature comparison
  - CTA buttons for each tier

- **FAQ**:
  - Accordion-style questions and answers
  - Common concerns addressed
  - Expandable/collapsible sections

- **Call-to-Action**:
  - Secondary CTA section
  - Waitlist signup prompt
  - Value proposition reinforcement

- **Footer**:
  - Links to key pages
  - Company information
  - Social media links
  - Legal links (Privacy, Terms)

#### Waitlist Modal

- Modal-based signup form
- Fields: Full name, email, practice name, role
- Role selection (veterinarian, practice manager, technician, other)
- Success confirmation with next steps
- Multiple trigger locations (navigation, hero, CTA)
- PostHog analytics tracking
- Duplicate prevention
- Form validation

**Key Files:**

- `src/app/page.tsx` - Homepage
- `src/components/Navigation.tsx` - Header navigation
- `src/components/HeroFloating.tsx` - Hero section
- `src/components/TrustLogos.tsx` - Logo carousel
- `src/components/Testimonials.tsx` - Testimonials carousel
- `src/components/blocks/pricing.tsx` - Pricing component
- `src/components/FAQ.tsx` - FAQ accordion
- `src/components/CTA.tsx` - Call-to-action section
- `src/components/WaitlistModal.tsx` - Waitlist modal
- `src/components/Footer.tsx` - Footer

### Support Hub

Comprehensive support resource center:

#### Support Categories (6 Main Categories)

1. **Getting Started**
   - Onboarding guides
   - Initial setup
   - PIMS integration
   - Team management

2. **Integration Guide**
   - Connect your PIMS
   - API integration
   - Data synchronization

3. **Features & Usage**
   - Automation features
   - Scheduling
   - Reports and analytics
   - AI insights

4. **Security & Privacy**
   - Data encryption
   - HIPAA compliance
   - Access controls
   - Privacy policies

5. **Documentation**
   - API documentation
   - User manuals
   - Best practices
   - Technical guides

6. **Video Tutorials**
   - Feature walkthroughs
   - Product demos
   - Training webinars
   - How-to videos

#### Contact Options

- **Live Chat**: Instant support
- **Email Support**: support@odis.ai
- **Phone Support**: 1-800-ODIS-AI

#### Additional Features

- FAQ section
- Resource downloads
- Contact CTA
- Breadcrumb navigation

**Key Files:**

- `src/app/support/page.tsx` - Support hub

### Analytics & Tracking

Comprehensive user behavior tracking with PostHog:

#### Tracked Events

- **Landing Page Metrics**:
  - Page views with device type and viewport
  - Scroll depth tracking
  - Section visibility detection
  - User engagement metrics

- **Waitlist Interactions**:
  - Modal open/close events
  - Form start events
  - Field focus/blur events
  - Signup success/failure
  - Duplicate signup attempts
  - Conversion tracking

- **Support Engagement**:
  - Support page views
  - Category exploration
  - Contact method selection

- **User Journey**:
  - Onboarding completion
  - Feature discovery
  - Page navigation patterns

#### Analytics Hooks

- `useScrollTracking` - Scroll position monitoring
- `useSectionVisibility` - Section intersection detection
- `useDeviceDetection` - Device type and viewport tracking

**Key Files:**

- `src/lib/posthog.ts` - PostHog configuration
- `src/components/PostHogProvider.tsx` - Analytics provider
- `src/hooks/useScrollTracking.ts` - Scroll tracking
- `src/hooks/useSectionVisibility.ts` - Visibility tracking
- `src/hooks/useDeviceDetection.ts` - Device detection

## Tech Stack

### Core Framework

- [Next.js 15](https://nextjs.org) - React framework with App Router and Server Components
- [React 19](https://react.dev) - UI library
- [TypeScript 5](https://www.typescriptlang.org) - Type-safe JavaScript

### Backend & Database

- [Supabase](https://supabase.com) - Backend-as-a-Service with PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe SQL ORM
- [tRPC](https://trpc.io) - End-to-end type-safe APIs

### UI & Styling

- [Tailwind CSS 4](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Re-usable component library
- [Radix UI](https://www.radix-ui.com) - Unstyled accessible components
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide Icons](https://lucide.dev) - Icon library

### Content Management

- [Sanity](https://www.sanity.io) - Headless CMS
- [Portable Text](https://portabletext.org) - Rich text specification

### Analytics & Monitoring

- [PostHog](https://posthog.com) - Product analytics and feature flags

### Forms & Validation

- [React Hook Form](https://react-hook-form.com) - Form management
- [Zod](https://zod.dev) - TypeScript-first schema validation

### Development Tools

- [ESLint](https://eslint.org) - Code linting
- [Prettier](https://prettier.io) - Code formatting
- [pnpm](https://pnpm.io) - Fast, disk space efficient package manager

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

   # PostHog Analytics (optional)
   NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key-here"
   NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

   # Sanity CMS (optional for blog)
   NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_SANITY_DATASET="production"
   SANITY_API_TOKEN="your-api-token"

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

2. **Start the development server**

   ```bash
   pnpm dev
   ```

3. **Open in browser**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Verify backend connection**
   - Check that you can sign up/login
   - Verify database operations work
   - Test against development backend

### Additional Setup

#### Sanity CMS (Optional for Blog)

```bash
# Install Sanity CLI globally
pnpm install -g @sanity/cli

# Login to Sanity
sanity login

# Initialize Sanity Studio (if not already done)
sanity init

# Start Sanity Studio locally
pnpm sanity dev
```

Access Sanity Studio at: `http://localhost:3000/studio`

## Development Workflow

### Local Development

1. **Backend Setup**: Ensure `odis-ai-backend` is running locally or connected to dev environment

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

| Environment | Database         | Purpose                    | Command                                        |
| ----------- | ---------------- | -------------------------- | ---------------------------------------------- |
| Development | `odisai-dev`     | Local development, testing | `pnpm dev`                                     |
| Staging     | `odisai-staging` | Pre-production testing     | `pnpm build && pnpm start` with `.env.staging` |
| Production  | `odisai-prod`    | Live application           | Deploy with `.env.production`                  |

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

### Daily Development Process

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
   - Check analytics events

5. **Code quality checks**

   ```bash
   pnpm check        # Run lint and typecheck
   pnpm lint:fix     # Fix linting issues
   pnpm format:write # Format code
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new functionality"
   git push origin dev
   ```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build production bundle
pnpm start            # Start production server
pnpm preview          # Build and start production server

# Code Quality
pnpm check            # Run lint and typecheck
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm typecheck        # Run TypeScript compiler check
pnpm format:check     # Check code formatting
pnpm format:write     # Format code with Prettier

# Database
pnpm db:push          # Push schema changes (dev only)
pnpm db:pull          # Pull schema from backend
pnpm db:generate      # Generate TypeScript types
pnpm db:studio        # Open Drizzle Studio

# Sanity CMS
pnpm sanity dev       # Start Sanity Studio
pnpm update-types     # Update Supabase types
```

## Project Structure

```
odis-ai-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Auth pages group
│   │   │   ├── login/              # Login page
│   │   │   └── signup/             # Signup with onboarding
│   │   ├── admin/                   # Admin panel (protected)
│   │   │   ├── templates/          # Template management
│   │   │   │   └── soap/           # SOAP templates CRUD
│   │   │   │       ├── new/        # Create template
│   │   │   │       └── [id]/       # Edit template
│   │   │   └── soap-playground/    # Testing environment
│   │   ├── api/                     # API routes
│   │   │   ├── generate-soap/      # SOAP generation endpoint
│   │   │   └── trpc/               # tRPC handler
│   │   ├── auth/                    # Auth callbacks
│   │   │   └── callback/           # OAuth callback
│   │   ├── blog/                    # Blog section
│   │   │   ├── [slug]/             # Individual blog post
│   │   │   └── page.tsx            # Blog list
│   │   ├── dashboard/               # User dashboard (protected)
│   │   ├── studio/                  # Sanity Studio CMS
│   │   ├── support/                 # Support hub
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Homepage/landing
│   │   ├── not-found.tsx            # 404 page
│   │   ├── robots.ts                # Robots.txt generation
│   │   └── sitemap.ts               # Sitemap generation
│   ├── components/                  # React components
│   │   ├── admin/                  # Admin-specific components
│   │   │   ├── SoapTemplateForm.tsx
│   │   │   ├── SoapTemplatesFilters.tsx
│   │   │   └── soap-templates-columns.tsx
│   │   ├── blocks/                 # Landing page blocks
│   │   │   └── pricing.tsx
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── DashboardProfileHeader.tsx
│   │   │   └── DashboardProfileContent.tsx
│   │   ├── onboarding/             # Onboarding flow
│   │   │   ├── OnboardingContainer.tsx
│   │   │   ├── AccountStep.tsx
│   │   │   ├── PIMSStep.tsx
│   │   │   └── StepIndicator.tsx
│   │   ├── profile-page/           # Profile page components
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── ... (30+ UI components)
│   │   ├── BlogLayout.tsx          # Blog card layout
│   │   ├── CTA.tsx                 # Call-to-action
│   │   ├── FAQ.tsx                 # FAQ accordion
│   │   ├── Footer.tsx              # Footer
│   │   ├── HeroFloating.tsx        # Hero section
│   │   ├── Navigation.tsx          # Header navigation
│   │   ├── PostHogProvider.tsx     # Analytics provider
│   │   ├── SEO.tsx                 # SEO component
│   │   ├── Testimonials.tsx        # Testimonials carousel
│   │   ├── TrustLogos.tsx          # Logo carousel
│   │   └── WaitlistModal.tsx       # Waitlist signup modal
│   ├── hooks/                       # Custom React hooks
│   │   ├── useDeviceDetection.ts   # Device type detection
│   │   ├── useScrollTracking.ts    # Scroll position tracking
│   │   ├── useSectionVisibility.ts # Section visibility detection
│   │   ├── use-media-query.ts      # Responsive breakpoints
│   │   ├── use-event-listener.ts   # Event listener management
│   │   └── use-on-click-outside.tsx # Click outside detection
│   ├── lib/                         # Utility libraries
│   │   ├── supabase/               # Supabase clients
│   │   │   ├── client.ts           # Client-side client
│   │   │   ├── server.ts           # Server-side client
│   │   │   └── middleware.ts       # Middleware client
│   │   ├── posthog.ts              # PostHog analytics
│   │   └── utils.ts                # Utility functions
│   ├── sanity/                      # Sanity CMS configuration
│   │   ├── env.ts                  # Environment config
│   │   ├── lib/                    # Sanity utilities
│   │   │   ├── client.ts           # Sanity client
│   │   │   ├── image.ts            # Image URL builder
│   │   │   └── live.ts             # Live preview
│   │   ├── schemaTypes/            # Content type schemas
│   │   │   ├── authorType.ts       # Author schema
│   │   │   ├── blockContentType.ts # Rich text schema
│   │   │   ├── categoryType.ts     # Category schema
│   │   │   ├── postType.ts         # Blog post schema
│   │   │   └── index.ts            # Schema exports
│   │   └── structure.ts            # Studio structure
│   ├── server/                      # Server-side code
│   │   ├── actions/                # Server actions
│   │   │   └── auth.ts             # Auth actions
│   │   └── api/                    # tRPC API
│   │       ├── routers/            # tRPC routers
│   │       │   ├── playground.ts   # Playground router
│   │       │   ├── templates.ts    # Templates router
│   │       │   └── waitlist.ts     # Waitlist router
│   │       ├── root.ts             # Root router
│   │       └── trpc.ts             # tRPC configuration
│   ├── trpc/                        # tRPC client
│   │   ├── client.ts               # Client setup
│   │   └── react.tsx               # React integration
│   ├── types/                       # TypeScript types
│   ├── database.types.ts            # Supabase generated types (src/database.types.ts)
│   └── middleware.ts                # Next.js middleware
├── public/                          # Static assets
│   ├── images/                     # Images and logos
│   └── fonts/                      # Custom fonts
├── .env.example                     # Environment template
├── .env.local                       # Local development env
├── .env.staging                     # Staging environment
├── .env.production                  # Production environment
├── next.config.js                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── sanity.config.ts                 # Sanity CMS configuration
├── drizzle.config.ts               # Drizzle ORM configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## Pages & Routes

### Public Pages

| Route          | Page         | Description                                              |
| -------------- | ------------ | -------------------------------------------------------- |
| `/`            | Landing Page | Marketing homepage with hero, pricing, testimonials, FAQ |
| `/support`     | Support Hub  | Support resources, documentation, contact options        |
| `/blog`        | Blog List    | All blog posts from Sanity CMS                           |
| `/blog/[slug]` | Blog Post    | Individual blog post with rich content                   |

### Authentication Pages

| Route            | Page          | Description                                   |
| ---------------- | ------------- | --------------------------------------------- |
| `/login`         | Login         | Sign in with email/password                   |
| `/signup`        | Signup        | Sign up with onboarding flow (Account + PIMS) |
| `/auth/callback` | Auth Callback | OAuth and email verification callback         |

### Protected User Pages

| Route        | Page           | Description                           |
| ------------ | -------------- | ------------------------------------- |
| `/dashboard` | User Dashboard | Profile, settings, account management |

### Protected Admin Pages

| Route                        | Page            | Description                           |
| ---------------------------- | --------------- | ------------------------------------- |
| `/admin`                     | Admin Dashboard | Overview and quick actions            |
| `/admin/templates/soap`      | Template List   | Browse and manage SOAP templates      |
| `/admin/templates/soap/new`  | Create Template | Create new SOAP template              |
| `/admin/templates/soap/[id]` | Edit Template   | Edit existing SOAP template           |
| `/admin/soap-playground`     | SOAP Playground | Test SOAP generation with sample data |

### CMS Pages

| Route     | Page          | Description                              |
| --------- | ------------- | ---------------------------------------- |
| `/studio` | Sanity Studio | Content management for blog (admin only) |

## API Routes & tRPC

### REST API Routes

#### SOAP Generation API

```typescript
POST /api/generate-soap

Body: {
  transcription: string,      // Veterinary transcription text
  template_id?: string,        // Optional template ID
  user_id: string,            // User ID
  overrides?: {               // Optional template overrides
    subjective?: string,
    objective?: string,
    assessment?: string,
    plan?: string,
    clientInstructions?: string
  }
}

Response: {
  subjective: string,         // Generated subjective section
  objective: string,          // Generated objective section
  assessment: string,         // Generated assessment section
  plan: string,              // Generated plan section
  clientInstructions: string  // Generated client instructions
}
```

#### tRPC Handler

```typescript
GET / POST / api / trpc / [trpc];
// Handles all tRPC requests
```

### tRPC Routers

#### Waitlist Router (`waitlist`)

**Public Procedures:**

```typescript
waitlist.join;
// Sign up to waitlist
// Input: { name, email, practiceName, role }
// Output: { success: boolean, message: string }
```

**Protected Procedures:**

```typescript
waitlist.getMyWaitlistStatus;
// Get current user's waitlist status
// Output: { status: string, joinedAt: Date }

waitlist.updateWaitlistProfile;
// Update profile information
// Input: { name?, practiceName?, role? }
```

#### Templates Router (`templates`)

**Admin-Only Procedures:**

```typescript
templates.listSoapTemplates;
// List all SOAP templates with filtering
// Input: { userId?: string, isDefault?: boolean }
// Output: Template[]

templates.getSoapTemplate;
// Get single template by ID
// Input: { id: string }
// Output: Template

templates.createSoapTemplate;
// Create new SOAP template
// Input: { name, displayName, sections, userId?, isDefault? }
// Output: { success: boolean, templateId: string }

templates.updateSoapTemplate;
// Update existing template
// Input: { id, name?, displayName?, sections?, userId?, isDefault? }
// Output: { success: boolean }

templates.deleteSoapTemplate;
// Delete template
// Input: { id: string }
// Output: { success: boolean }

templates.listUsers;
// Get all users for assignment dropdown
// Output: User[]
```

#### Playground Router (`playground`)

**Admin-Only Procedures:**

```typescript
playground.getTemplatesForPlayground;
// Get all templates with user information for testing
// Output: Template[]
```

### Server Actions

Located in `src/server/actions/auth.ts`:

```typescript
// Authentication
signUp(email: string, password: string)
signIn(email: string, password: string)
signOut()

// User Management
getUser() // Get current user with auto-profile creation
getUserProfile(userId: string)
updateUserProfile(userId: string, data: ProfileUpdateData)
createUserProfile(userId: string, data: ProfileData)
```

## Database Schema

The project uses the centralized database schema managed by `odis-ai-backend`:

### Core Tables

- **users** - User accounts linked to Supabase auth
  - Role-based access (admin, veterinarian, practice_owner, vet_tech, client)
  - Profile information (name, clinic, license)
  - PIMS integration preferences
  - Onboarding completion status

- **cases** - Veterinary cases
  - Status, type, visibility settings
  - Patient linkage
  - Veterinarian assignment

- **patients** - Patient information
  - Linked to cases
  - Animal details and history

- **transcriptions** - Audio transcriptions
  - Speaker segmentation
  - Timestamps
  - Linked to cases

- **audio_files** - Audio file metadata
  - Processing status
  - File storage references

- **soap_notes** - SOAP notes
  - Subjective, Objective, Assessment, Plan sections
  - Client instructions
  - Template references
  - Linked to cases and transcriptions

- **temp_soap_templates** - SOAP templates
  - Template metadata
  - Custom prompts per section
  - User assignments
  - Default template flags

- **templates** - Generic templates
  - Reusable templates for documents
  - Versioning support

- **generations** - AI-generated content
  - Linked to templates and cases
  - Generation history

- **discharge_summaries** - Discharge documentation
  - Patient discharge information

- **contact_submissions** - Contact form data
  - Lead capture from website

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

### Middleware Protection

Routes are protected via middleware (`src/middleware.ts`):

- Admin routes require `admin` role
- Dashboard routes require authentication
- Public routes are accessible to all

## Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Connect GitHub repository

2. **Configure Environment Variables**
   - Add all variables from `.env.production`
   - Set `NEXT_PUBLIC_ENVIRONMENT=production`

3. **Deploy**
   ```bash
   # Vercel will automatically deploy on push to main
   git push origin main
   ```

### Manual Deployment

1. **Build the application**

   ```bash
   pnpm build
   ```

2. **Start production server**
   ```bash
   pnpm start
   ```

### Environment Variables Required for Deployment

```env
# Required
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_ENVIRONMENT

# Optional (for full functionality)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
SANITY_API_TOKEN
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Supabase edge functions deployed
- [ ] Sanity CMS configured and deployed
- [ ] PostHog analytics configured
- [ ] Domain configured with SSL
- [ ] CORS settings updated in Supabase
- [ ] Email templates configured
- [ ] Test authentication flow
- [ ] Test SOAP generation
- [ ] Verify analytics tracking

## Learn More

### Framework Documentation

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Documentation](https://react.dev)

### Backend & Database

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [tRPC Documentation](https://trpc.io/docs)

### UI & Styling

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

### Content & Analytics

- [Sanity Documentation](https://www.sanity.io/docs)
- [PostHog Documentation](https://posthog.com/docs)

## Support & Contribution

### Getting Help

- Check the [documentation](https://docs.odis.ai) (if available)
- Review the support page at `/support`
- Contact the team at support@odis.ai

### Reporting Issues

1. Check existing issues in the repository
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment information

### Development Guidelines

1. Follow the established code style
2. Write meaningful commit messages
3. Test changes locally before pushing
4. Update documentation as needed
5. Run code quality checks before committing:
   ```bash
   pnpm check
   pnpm format:write
   ```

## License

[Add license information here]

---

Built with ❤️ for veterinary professionals by the ODIS AI team.
