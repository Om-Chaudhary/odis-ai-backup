# Database Schema Changes: ODIS-134 & ODIS-135

**Documentation Date:** November 2, 2025
**Features:** Template Sharing (ODIS-134) & Case Sharing (ODIS-135)

## Table of Contents

- [Overview](#overview)
- [ODIS-134: Template Sharing Schema](#odis-134-template-sharing-schema)
- [ODIS-135: Case Sharing Schema](#odis-135-case-sharing-schema)
- [Schema Diagrams](#schema-diagrams)
- [Migration SQL](#migration-sql)
- [Index Strategy](#index-strategy)
- [Trigger Functions](#trigger-functions)

## Overview

Both features introduce junction tables to implement many-to-many sharing relationships between users and resources (templates or cases). The schema design follows PostgreSQL best practices with proper constraints, indexes, and timestamp tracking.

### Design Principles

1. **Junction Table Pattern:** Separate tables for sharing relationships
2. **Referential Integrity:** Foreign key constraints with cascade deletion
3. **Uniqueness Constraints:** Prevent duplicate shares
4. **Audit Trail:** Automatic timestamp tracking
5. **Performance Optimization:** Strategic indexes on foreign keys
6. **Security First:** Row Level Security on all tables

## ODIS-134: Template Sharing Schema

### New Tables

#### 1. soap_template_shares

Junction table for sharing SOAP note templates between users.

**Table Definition:**

```sql
CREATE TABLE public.soap_template_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.temp_soap_templates(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(template_id, shared_with_user_id)
);
```

**Column Details:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the share record |
| `template_id` | UUID | NOT NULL, FOREIGN KEY → temp_soap_templates(id) | Reference to the shared template |
| `shared_with_user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) | User who receives access |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | When the share was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | When the share was last modified |

**Constraints:**

- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `template_id` → `temp_soap_templates(id)` ON DELETE CASCADE
  - `shared_with_user_id` → `auth.users(id)` ON DELETE CASCADE
- **Unique Constraint:** `(template_id, shared_with_user_id)` - Prevents duplicate shares

**Indexes:**

```sql
CREATE INDEX idx_soap_template_shares_template_id
    ON public.soap_template_shares(template_id);

CREATE INDEX idx_soap_template_shares_shared_with_user_id
    ON public.soap_template_shares(shared_with_user_id);
```

#### 2. discharge_template_shares

Junction table for sharing discharge summary templates between users.

**Table Definition:**

```sql
CREATE TABLE public.discharge_template_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.temp_discharge_summary_templates(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(template_id, shared_with_user_id)
);
```

**Column Details:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the share record |
| `template_id` | UUID | NOT NULL, FOREIGN KEY → temp_discharge_summary_templates(id) | Reference to the shared template |
| `shared_with_user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) | User who receives access |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | When the share was created |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | When the share was last modified |

**Constraints:**

- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `template_id` → `temp_discharge_summary_templates(id)` ON DELETE CASCADE
  - `shared_with_user_id` → `auth.users(id)` ON DELETE CASCADE
- **Unique Constraint:** `(template_id, shared_with_user_id)` - Prevents duplicate shares

**Indexes:**

```sql
CREATE INDEX idx_discharge_template_shares_template_id
    ON public.discharge_template_shares(template_id);

CREATE INDEX idx_discharge_template_shares_shared_with_user_id
    ON public.discharge_template_shares(shared_with_user_id);
```

### Modified Tables

#### temp_soap_templates

**Policy Changes:**
The existing `temp_soap_templates` table received updated RLS policies to enable shared access.

**New Policy:**

```sql
DROP POLICY IF EXISTS "Users can read shared soap templates"
    ON public.temp_soap_templates;

CREATE POLICY "Users can read shared soap templates"
    ON public.temp_soap_templates
    FOR SELECT
    USING (
        user_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM public.soap_template_shares s
            WHERE s.template_id = temp_soap_templates.id
            AND s.shared_with_user_id = auth.uid()
        )
    );
```

**Impact:**

- Users can read templates they own (unchanged)
- Users can read templates shared with them (new)
- No changes to INSERT, UPDATE, DELETE policies

#### temp_discharge_summary_templates

**Policy Changes:**
The existing `temp_discharge_summary_templates` table received updated RLS policies to enable shared access.

**New Policy:**

```sql
DROP POLICY IF EXISTS "Users can read shared discharge templates"
    ON public.temp_discharge_summary_templates;

CREATE POLICY "Users can read shared discharge templates"
    ON public.temp_discharge_summary_templates
    FOR SELECT
    USING (
        user_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM public.discharge_template_shares s
            WHERE s.template_id = temp_discharge_summary_templates.id
            AND s.shared_with_user_id = auth.uid()
        )
    );
```

**Impact:**

- Users can read templates they own (unchanged)
- Users can read templates shared with them (new)
- No changes to INSERT, UPDATE, DELETE policies

## ODIS-135: Case Sharing Schema

### Expected Tables

Based on the pattern established in ODIS-134, ODIS-135 likely introduces:

#### case_shares (Expected)

**Hypothetical Table Definition:**

```sql
CREATE TABLE public.case_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(case_id, shared_with_user_id)
);
```

**Expected Indexes:**

```sql
CREATE INDEX idx_case_shares_case_id
    ON public.case_shares(case_id);

CREATE INDEX idx_case_shares_shared_with_user_id
    ON public.case_shares(shared_with_user_id);
```

**Note:** Actual implementation may vary; this is based on the template sharing pattern.

### Modified Tables (Expected)

#### cases

**Expected Policy Changes:**

```sql
-- Expected new policy for shared case access
CREATE POLICY "Users can read shared cases"
    ON public.cases
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.case_shares s
            WHERE s.case_id = cases.id
            AND s.shared_with_user_id = auth.uid()
        )
    );
```

## Schema Diagrams

### Template Sharing Relationships

```
auth.users
    ↓ (user_id)
temp_soap_templates ←──┐
    ↓                  │
    ↓ (template_id)    │ (shared_with_user_id)
    ↓                  │
soap_template_shares ──┘
```

```
auth.users
    ↓ (user_id)
temp_discharge_summary_templates ←──┐
    ↓                                │
    ↓ (template_id)                  │ (shared_with_user_id)
    ↓                                │
discharge_template_shares ──────────┘
```

### Case Sharing Relationships (Expected)

```
auth.users
    ↓ (user_id)
cases ←──────────┐
    ↓            │
    ↓ (case_id)  │ (shared_with_user_id)
    ↓            │
case_shares ─────┘
```

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│                 │
│  - id (UUID)    │
└────────┬────────┘
         │
         │ owns
         ↓
┌─────────────────────────┐
│  temp_soap_templates    │
│                         │
│  - id (UUID)            │
│  - user_id (UUID)       │
│  - name                 │
│  - content              │
└────────┬────────────────┘
         │
         │ shared via
         ↓
┌──────────────────────────┐       ┌─────────────────┐
│ soap_template_shares     │       │   auth.users    │
│                          │       │                 │
│ - id (UUID)              │──────→│  - id (UUID)    │
│ - template_id (UUID)     │       └─────────────────┘
│ - shared_with_user_id    │           (recipient)
│ - created_at             │
│ - updated_at             │
└──────────────────────────┘
```

## Migration SQL

### Complete ODIS-134 Migration Script

See `/Users/s0381806/Development/odis-ai-ios/apply_template_sharing_migration.sh` for the full migration script.

**Key Steps:**

1. Create sharing tables
2. Create indexes
3. Enable RLS
4. Create RLS policies
5. Update template policies
6. Create trigger functions
7. Create triggers
8. Grant permissions

### Rollback Procedure

If migration needs to be rolled back:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS update_soap_template_shares_updated_at
    ON public.soap_template_shares;
DROP TRIGGER IF EXISTS update_discharge_template_shares_updated_at
    ON public.discharge_template_shares;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_soap_template_shares_updated_at();
DROP FUNCTION IF EXISTS update_discharge_template_shares_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Users can read their own template shares"
    ON public.soap_template_shares;
DROP POLICY IF EXISTS "Template owners can create shares"
    ON public.soap_template_shares;
DROP POLICY IF EXISTS "Template owners can delete shares"
    ON public.soap_template_shares;

DROP POLICY IF EXISTS "Users can read their own template shares"
    ON public.discharge_template_shares;
DROP POLICY IF EXISTS "Template owners can create shares"
    ON public.discharge_template_shares;
DROP POLICY IF EXISTS "Template owners can delete shares"
    ON public.discharge_template_shares;

-- Restore original template policies
-- (Create SELECT policies without shared access)

-- Drop tables (cascades will handle foreign keys)
DROP TABLE IF EXISTS public.soap_template_shares CASCADE;
DROP TABLE IF EXISTS public.discharge_template_shares CASCADE;
```

## Index Strategy

### Purpose of Indexes

1. **Foreign Key Lookup:** Fast retrieval of shares by template_id
2. **User Share Lookup:** Fast retrieval of shares by shared_with_user_id
3. **JOIN Performance:** Optimize policy evaluation in RLS queries

### Index Performance Analysis

**Queries Optimized:**

```sql
-- Find all users who have access to a template
SELECT shared_with_user_id
FROM soap_template_shares
WHERE template_id = $1;
-- Uses: idx_soap_template_shares_template_id

-- Find all templates shared with a user
SELECT template_id
FROM soap_template_shares
WHERE shared_with_user_id = $1;
-- Uses: idx_soap_template_shares_shared_with_user_id

-- Check if specific share exists (uses unique constraint index)
SELECT * FROM soap_template_shares
WHERE template_id = $1 AND shared_with_user_id = $2;
-- Uses: unique constraint index on (template_id, shared_with_user_id)
```

### Index Maintenance

**Considerations:**

- Indexes automatically maintained by PostgreSQL
- Monitor index bloat with large datasets
- Consider REINDEX if performance degrades
- VACUUM regularly to maintain statistics

## Trigger Functions

### Automatic Timestamp Updates

Both sharing tables have triggers that automatically update the `updated_at` timestamp.

#### SOAP Template Shares Trigger

```sql
CREATE OR REPLACE FUNCTION update_soap_template_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_soap_template_shares_updated_at
    BEFORE UPDATE ON public.soap_template_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_soap_template_shares_updated_at();
```

**Behavior:**

- Fires on every UPDATE to `soap_template_shares`
- Automatically sets `updated_at` to current timestamp
- Prevents manual override of `updated_at`

#### Discharge Template Shares Trigger

```sql
CREATE OR REPLACE FUNCTION update_discharge_template_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discharge_template_shares_updated_at
    BEFORE UPDATE ON public.discharge_template_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_discharge_template_shares_updated_at();
```

**Behavior:**

- Fires on every UPDATE to `discharge_template_shares`
- Automatically sets `updated_at` to current timestamp
- Prevents manual override of `updated_at`

### Trigger Testing

**Verify trigger functionality:**

```sql
-- Insert a share
INSERT INTO soap_template_shares (template_id, shared_with_user_id)
VALUES ('template-uuid', 'user-uuid');

-- Check initial timestamps
SELECT created_at, updated_at
FROM soap_template_shares
WHERE template_id = 'template-uuid';
-- created_at and updated_at should be equal

-- Wait a moment, then update (no actual change needed)
UPDATE soap_template_shares
SET template_id = template_id
WHERE template_id = 'template-uuid';

-- Check updated timestamps
SELECT created_at, updated_at
FROM soap_template_shares
WHERE template_id = 'template-uuid';
-- updated_at should be newer than created_at
```

## Data Migration Considerations

### Existing Data

- No existing data migration required
- All tables are new junction tables
- Existing templates and cases remain unchanged
- No data loss or transformation needed

### Backward Compatibility

- Old queries continue to work
- Apps without sharing support see only owned resources
- Additive changes only; no breaking changes

### Future Schema Evolution

**Potential Enhancements:**

1. **Permission Levels:**

   ```sql
   ALTER TABLE soap_template_shares
   ADD COLUMN permission_level VARCHAR(20) DEFAULT 'read';
   ```

2. **Expiration Dates:**

   ```sql
   ALTER TABLE soap_template_shares
   ADD COLUMN expires_at TIMESTAMPTZ;
   ```

3. **Share Metadata:**

   ```sql
   ALTER TABLE soap_template_shares
   ADD COLUMN share_message TEXT,
   ADD COLUMN shared_by_user_id UUID REFERENCES auth.users(id);
   ```

4. **Access Tracking:**
   ```sql
   CREATE TABLE template_share_access_log (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       share_id UUID REFERENCES soap_template_shares(id),
       accessed_at TIMESTAMPTZ DEFAULT now(),
       access_type VARCHAR(20)
   );
   ```

## Performance Benchmarks

### Expected Query Performance

**Single Template Lookup (with shares):**

```sql
EXPLAIN ANALYZE
SELECT t.* FROM temp_soap_templates t
WHERE t.id = $1
AND (
    t.user_id = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM soap_template_shares s
        WHERE s.template_id = t.id
        AND s.shared_with_user_id = auth.uid()
    )
);
```

**Expected:** < 5ms with proper indexes

**All Templates for User (with shares):**

```sql
EXPLAIN ANALYZE
SELECT t.* FROM temp_soap_templates t
WHERE t.user_id = auth.uid()::text
UNION
SELECT t.* FROM temp_soap_templates t
JOIN soap_template_shares s ON t.id = s.template_id
WHERE s.shared_with_user_id = auth.uid();
```

**Expected:** < 50ms for typical user (< 100 templates)

### Optimization Tips

1. **Index Coverage:** Ensure all foreign keys are indexed
2. **Query Plans:** Regularly check EXPLAIN ANALYZE output
3. **Connection Pooling:** Use Supabase connection pooling
4. **Materialized Views:** Consider for frequently accessed shares
5. **Pagination:** Always paginate large result sets

## Summary

The database schema changes for ODIS-134 and ODIS-135 follow a clean, scalable design pattern:

**Strengths:**

- ✅ Proper foreign key constraints with cascade deletion
- ✅ Performance indexes on all foreign keys
- ✅ Unique constraints prevent duplicate shares
- ✅ Automatic timestamp tracking via triggers
- ✅ Row Level Security on all tables
- ✅ Backward compatible with existing data

**Best Practices Followed:**

- UUID primary keys for distributed systems
- TIMESTAMPTZ for timezone-aware timestamps
- Normalized junction table design
- Comprehensive indexing strategy
- Defensive constraint usage

**Recommendations:**

- Monitor index performance as data grows
- Consider partitioning if share volumes exceed millions
- Implement regular VACUUM and ANALYZE maintenance
- Add monitoring for slow queries involving shares
