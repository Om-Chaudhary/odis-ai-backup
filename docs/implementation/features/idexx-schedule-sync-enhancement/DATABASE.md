# Database Schema

**Related Jira Tickets:**

- [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Migrate existing users to clinic schedule schema
- [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Add clinic lookup utilities and integrate with existing code

## Tables

### `idexx_credentials`

Encrypted IDEXX Neo credentials per user.

```sql
CREATE TABLE idexx_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  encryption_key_id TEXT NOT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

### `idexx_sync_sessions`

Tracks each sync execution session.

```sql
CREATE TABLE idexx_sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  consultations_synced INTEGER DEFAULT 0,
  consultations_failed INTEGER DEFAULT 0,
  discharge_calls_scheduled INTEGER DEFAULT 0,
  error_details JSONB,
  next_scheduled_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `consultation_sync_status`

Tracks reconciliation status for each consultation.

```sql
CREATE TABLE consultation_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id),
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')),
  has_clinical_notes BOOLEAN DEFAULT false,
  notes_synced_at TIMESTAMPTZ,
  discharge_call_scheduled BOOLEAN DEFAULT false,
  discharge_call_id UUID REFERENCES scheduled_discharge_calls(id),
  last_sync_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consultation_id, user_id)
);
```

### `idexx_sync_audit_log`

HIPAA-compliant audit log (6-year retention).

```sql
CREATE TABLE idexx_sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT,
  ip_address INET,
  session_id TEXT,
  error_details JSONB,
  metadata JSONB
);
```

## Row-Level Security

All tables have RLS enabled:

- Users can only access their own data
- Service role can access all data for automation
- Admins can access all data for monitoring

## Indexes

- `idexx_credentials`: `user_id`, `validation_status`
- `idexx_sync_sessions`: `user_id`, `status`, `started_at`
- `consultation_sync_status`: `user_id`, `case_id`, `consultation_id`, `sync_status`
- `idexx_sync_audit_log`: `user_id`, `timestamp`, `action`

## Related

- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Security](./SECURITY.md)** - RLS policies
- **[Implementation](./IMPLEMENTATION.md)** - Migration steps
