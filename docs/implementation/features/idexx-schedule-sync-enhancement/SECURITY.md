# Security & Compliance

## Security Architecture

### Layer 1: Transport Security

- HTTPS/TLS 1.3 for all API calls
- Certificate pinning for IDEXX connections

### Layer 2: Authentication & Authorization

- Supabase Auth for user authentication
- RLS policies for data isolation
- Service role for automated operations

### Layer 3: Credential Encryption

- AES-256-GCM encryption at rest
- PBKDF2 key derivation (100,000 iterations)
- Separate encryption keys per environment

### Layer 4: Audit & Compliance

- Comprehensive audit logging
- 6-year retention (HIPAA requirement)
- Tamper-proof audit trail

## Encryption Implementation

```typescript
// AES-256-GCM encryption
const algorithm = 'aes-256-gcm';
const keyDerivation = 'pbkdf2'; // 100,000 iterations

// Encrypt credentials before storage
async encrypt(text: string, keyId: string): Promise<EncryptedData> {
  const key = await deriveKey(keyId); // PBKDF2
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  // ... encryption logic
  return { encrypted, iv, authTag, keyId };
}
```

## HIPAA Compliance Checklist

- ✅ **Encryption**: AES-256 for data at rest and in transit
- ✅ **Access Control**: RLS policies enforce user isolation
- ✅ **Audit Logs**: All access logged with timestamp and user
- ✅ **Data Retention**: 6-year retention policy
- ✅ **Breach Notification**: Alert system for unauthorized access
- ⚠️ **Business Associate Agreement**: Required with IDEXX

## Credential Lifecycle

```
[not_configured] → [configured] → [validated] → [active]
                                         ↓
                                    [suspended] (on validation failure)
                                         ↓
                                    [active] (on re-validation)
```

**States:**

- `not_configured` - No credentials stored
- `configured` - Credentials stored, not validated
- `validated` - Credentials tested and working
- `active` - Sync enabled
- `suspended` - Validation failed, sync disabled

## Access Control

### Row-Level Security (RLS)

- Users can only access their own credentials and sync data
- Service role can access all data for automation
- Admins can access all data for monitoring

### Session Management

- Automatic session timeout detection
- Re-authentication on timeout
- Session refresh every 25 minutes
- Secure session storage

## Related

- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Database](./DATABASE.md)** - RLS policies
- **[API](./API.md)** - Authentication details
