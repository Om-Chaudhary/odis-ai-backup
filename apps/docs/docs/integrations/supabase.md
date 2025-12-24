---
sidebar_position: 1
title: Supabase
description: Database and authentication infrastructure
---

# Supabase Integration

ODIS AI uses Supabase as its backend infrastructure for database, authentication, and real-time features.

## Architecture

```
ODIS AI Application
    │
    ├── Supabase Auth ─── User Authentication
    │
    ├── Supabase DB ────── PostgreSQL Database
    │
    └── Supabase Edge ──── Serverless Functions
```

## Database Schema

### Core Tables

| Table          | Description                  |
| -------------- | ---------------------------- |
| `users`        | Clinic staff accounts        |
| `clinics`      | Clinic information           |
| `calls`        | Call records and transcripts |
| `cases`        | Patient cases                |
| `appointments` | Scheduled appointments       |

### Row Level Security

All tables use RLS policies to ensure data isolation:

```sql
-- Users can only see their clinic's data
CREATE POLICY "clinic_isolation" ON calls
  FOR SELECT
  USING (clinic_id = auth.jwt() ->> 'clinic_id');
```

## Authentication

### Supported Methods

- **Email/Password** - Standard credential login
- **Magic Link** - Passwordless email login
- **SSO** - Enterprise single sign-on (coming soon)

### Session Management

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, anonKey);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@clinic.com",
  password: "password",
});

// Get current session
const session = await supabase.auth.getSession();
```

## Edge Functions

ODIS AI uses Supabase Edge Functions for:

- Webhook processing
- Scheduled tasks
- Third-party API integrations

### Deploying Functions

```bash
# Deploy a function
supabase functions deploy webhook-handler

# Invoke locally
supabase functions serve webhook-handler
```

## Real-time Subscriptions

Subscribe to database changes for live updates:

```typescript
const subscription = supabase
  .channel("calls")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "calls" },
    (payload) => {
      console.log("New call:", payload.new);
    },
  )
  .subscribe();
```

## Best Practices

1. **Use RLS** - Always enable Row Level Security
2. **Index queries** - Add indexes for frequently queried columns
3. **Connection pooling** - Use connection pooling in production
4. **Backup regularly** - Enable point-in-time recovery
