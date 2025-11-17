# Test Mode Configuration

## Overview

Test mode allows you to safely test bulk discharge operations (calls and emails) without accidentally sending real communications to customers. When enabled, all outbound calls and emails are redirected to your test contact information instead of customer contact information.

This is especially useful when:
- Testing the bulk discharge scheduler in the Chrome extension
- Verifying discharge summary generation with real data
- Testing VAPI call workflows without bothering customers
- Debugging email templates and delivery

## Setup

### 1. Add Environment Variables

Add these variables to your `.env.local` file:

```bash
# Enable test mode
TEST_MODE="true"

# Your test contact information (will receive all calls/emails)
TEST_EMAIL="your-email@example.com"
TEST_PHONE="+15551234567"  # E.164 format (+ country code + number)
```

### 2. Restart Development Server

After adding the environment variables, restart your development server:

```bash
pnpm dev
```

## How It Works

### Affected Endpoints

Test mode affects these API endpoints:

1. **`POST /api/generate/discharge-summary`**
   - Overrides `ownerPhone` with `TEST_PHONE`
   - Overrides `ownerEmail` with `TEST_EMAIL`
   - Scheduled VAPI calls go to test phone number

2. **`POST /api/send/discharge-email`**
   - Overrides `recipientEmail` with `TEST_EMAIL`
   - All discharge emails go to test email address

### Override Behavior

When `TEST_MODE="true"`:

- **Phone Numbers**: All VAPI calls will be made to `TEST_PHONE` instead of customer phone numbers
- **Email Addresses**: All discharge emails will be sent to `TEST_EMAIL` instead of customer email addresses
- **Original Data Preserved**: The database still stores the original customer contact information
- **Logging**: Console logs show when test mode is active and what values are being overridden

### Example Log Output

```
[TEST_MODE] Enabled - Overriding contact information {
  originalPhone: '+14155551234',
  originalEmail: 'customer@example.com',
  testPhone: '+15551234567',
  testEmail: 'test@yourdomain.com'
}
```

## Bulk Discharge Scheduling

### Using with Chrome Extension

1. **Enable Test Mode** in your `.env.local`:
   ```bash
   TEST_MODE="true"
   TEST_EMAIL="your-email@example.com"
   TEST_PHONE="+15551234567"
   ```

2. **Use Extension Normally**: The Chrome extension calls the same API endpoints, so test mode will automatically redirect all communications

3. **Verify Results**:
   - Check your test email inbox for discharge emails
   - Check your test phone for VAPI calls
   - Review the database to confirm original customer data is preserved

### Disabling Test Mode

To send real communications to customers:

1. **Option 1**: Remove or comment out the environment variables:
   ```bash
   # TEST_MODE="true"
   # TEST_EMAIL="your-email@example.com"
   # TEST_PHONE="+15551234567"
   ```

2. **Option 2**: Set `TEST_MODE` to `false`:
   ```bash
   TEST_MODE="false"
   ```

3. **Restart Server**: Always restart your development server after changing environment variables

## Production Deployment

### Important Notes

- **Never enable test mode in production** unless you're intentionally testing
- Test mode environment variables should **not** be set in production environment
- Vercel/deployment platforms should not have `TEST_MODE="true"` configured

### Deployment Checklist

Before deploying to production:

- [ ] Verify `TEST_MODE` is not set (or set to `false`) in production environment
- [ ] Verify `TEST_EMAIL` and `TEST_PHONE` are not set in production
- [ ] Test with test mode enabled in staging/preview deployments
- [ ] Disable test mode before merging to main branch

## Troubleshooting

### Test Mode Not Working

**Symptom**: Real customer contacts are still receiving calls/emails

**Solutions**:
1. Verify environment variables are set in `.env.local`
2. Restart development server after adding variables
3. Check console logs for `[TEST_MODE]` messages
4. Ensure `TEST_MODE="true"` (string "true", not boolean)

### Missing Test Contacts

**Symptom**: Calls/emails fail or are not sent

**Solutions**:
1. Verify `TEST_EMAIL` is a valid email address
2. Verify `TEST_PHONE` is in E.164 format (+country code + number)
3. Check server logs for error messages

### Extension Not Respecting Test Mode

**Symptom**: Extension seems to ignore test mode

**Solutions**:
1. Verify the extension is calling the correct API endpoint (check `CEB_BACKEND_API_URL` in extension `.env`)
2. Confirm test mode is enabled on the backend server the extension is calling
3. Check if extension has its own environment variables (it shouldn't - test mode is backend-only)

## Security Considerations

### Data Privacy

- Customer contact information is **never modified** in the database
- Test mode only affects outbound communications
- Original customer data remains intact for auditing and compliance

### Access Control

- Test mode respects all existing authentication and authorization
- Only authenticated users can schedule calls/emails (with or without test mode)
- Test mode does not bypass RLS policies or permission checks

## Development Workflow

### Recommended Workflow

1. **Enable test mode** in local development
2. **Test bulk operations** with real case data from staging/development database
3. **Verify all communications** go to your test contacts
4. **Review database** to confirm data integrity
5. **Disable test mode** when ready for production testing
6. **Test with one real case** before bulk operations in production

### Testing Checklist

- [ ] Test mode enabled in `.env.local`
- [ ] Valid `TEST_EMAIL` and `TEST_PHONE` configured
- [ ] Server restarted after environment changes
- [ ] Bulk discharge scheduled via extension
- [ ] Verified test email received discharge emails
- [ ] Verified test phone received VAPI calls
- [ ] Confirmed database has original customer contact information
- [ ] Disabled test mode before production deployment

## Environment Variable Reference

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `TEST_MODE` | No | `"true"` or `"false"` | Enables/disables test mode redirect |
| `TEST_EMAIL` | Conditional* | Valid email | Email address to receive all discharge emails |
| `TEST_PHONE` | Conditional* | E.164 format | Phone number to receive all VAPI calls |

*Required when `TEST_MODE="true"`

## Related Documentation

- [VAPI Integration](CLAUDE.md#vapi-ai-integration) - VAPI call system documentation
- [Environment Variables](.env.example) - All environment variable templates
- [Discharge Summary API](src/app/api/generate/discharge-summary/route.ts) - API implementation
- [Discharge Email API](src/app/api/send/discharge-email/route.ts) - Email implementation
