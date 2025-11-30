# IDEXX Encryption Key Setup Guide

This guide explains how to set up the `IDEXX_ENCRYPTION_KEY` environment variable for local development and Vercel deployment.

## Overview

The `IDEXX_ENCRYPTION_KEY` is used to encrypt IDEXX Neo credentials stored in the database using AES-256-GCM encryption. This key must be:
- **32 bytes (256 bits)** minimum length
- **Base64 encoded** for easy storage
- **Unique per environment** (dev, staging, production)
- **Kept secret** (never committed to git)

## Generating a Secure Key

### Method 1: Using Node.js (Recommended)

```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('base64'));"
```

This will output a secure random key like:
```
EFxjYCAidZqnksE+8lelLhfLflBcjXpAfJ228zte/FQ=
```

### Method 2: Using OpenSSL

```bash
openssl rand -base64 32
```

### Method 3: Using Python

```bash
python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

## Local Development Setup

### 1. Generate Your Key

Run the Node.js command above to generate a unique key for your local environment.

### 2. Add to `.env.local`

Add the generated key to your `.env.local` file:

```bash
IDEXX_ENCRYPTION_KEY=EFxjYCAidZqnksE+8lelLhfLflBcjXpAfJ228zte/FQ=
```

**Important:** 
- The `.env.local` file is already in `.gitignore` and will not be committed
- Use a different key for each developer's local environment
- Never share your key or commit it to git

### 3. Verify Setup

Restart your Next.js dev server to load the new environment variable:

```bash
pnpm dev
```

The application will validate the key on startup. If the key is missing or too short, you'll see an error.

## Vercel Deployment Setup

### Option 1: Via Vercel Dashboard (Recommended)

1. **Navigate to your project** in the [Vercel Dashboard](https://vercel.com/dashboard)

2. **Go to Settings → Environment Variables**

3. **Add the environment variable:**
   - **Name:** `IDEXX_ENCRYPTION_KEY`
   - **Value:** Your generated encryption key (use a different key than local!)
   - **Environment:** Select all environments (Production, Preview, Development) or specific ones

4. **Click "Save"**

5. **Redeploy** your application for the changes to take effect

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add the environment variable
vercel env add IDEXX_ENCRYPTION_KEY

# When prompted, paste your generated key
# Select which environments to apply to (production, preview, development)

# Redeploy
vercel --prod
```

### Option 3: Via Vercel API

```bash
# Get your Vercel token from: https://vercel.com/account/tokens
export VERCEL_TOKEN="your-vercel-token"
export PROJECT_ID="your-project-id"
export ENCRYPTION_KEY="your-generated-key"

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"key\": \"IDEXX_ENCRYPTION_KEY\",
    \"value\": \"$ENCRYPTION_KEY\",
    \"type\": \"encrypted\",
    \"target\": [\"production\", \"preview\", \"development\"]
  }"
```

## Key Rotation

To rotate encryption keys without downtime:

1. **Generate a new key** using one of the methods above

2. **Add as versioned key** in environment variables:
   ```
   IDEXX_ENCRYPTION_KEY_V2=your-new-key-here
   ```

3. **Use the credential rotation API** to re-encrypt existing credentials:
   ```typescript
   const credentialManager = await IdexxCredentialManager.create();
   await credentialManager.rotateCredentials(userId, 'v2');
   ```

4. **Update default key** after all credentials are rotated:
   ```
   IDEXX_ENCRYPTION_KEY=your-new-key-here
   ```

5. **Remove old versioned keys** after migration is complete

## Security Best Practices

1. **Never commit keys to git** - Always use `.env.local` for local development
2. **Use different keys per environment** - Dev, staging, and production should have unique keys
3. **Rotate keys periodically** - At least annually, or immediately if compromised
4. **Store keys securely** - Use a password manager or secure vault
5. **Limit access** - Only developers who need it should have access to production keys
6. **Monitor usage** - Check audit logs regularly for unauthorized access

## Troubleshooting

### Error: "IDEXX_ENCRYPTION_KEY not configured"

**Solution:** Make sure the environment variable is set in your `.env.local` file and restart your dev server.

### Error: "Encryption key not found for keyId"

**Solution:** Check that the key exists in your environment variables. For versioned keys, ensure the format is `IDEXX_ENCRYPTION_KEY_V1`, `IDEXX_ENCRYPTION_KEY_V2`, etc.

### Error: "Decryption failed: Authentication tag verification failed"

**Solution:** This means the encryption key has changed or is incorrect. If you rotated keys, ensure all credentials are re-encrypted with the new key.

## Related Documentation

- [API Documentation](./API.md) - Credential management endpoints
- [Security Documentation](./SECURITY.md) - Security architecture and compliance
- [Implementation Guide](./IMPLEMENTATION.md) - Full implementation details
