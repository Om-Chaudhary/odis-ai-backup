# Database Type Generation

## Overview

The `update-types` script generates TypeScript types from your Supabase database schema. This ensures type safety when working with database queries.

## Usage

```bash
pnpm update-types
```

## How It Works

1. **Reads Environment Variables**: The script automatically loads variables from `.env` or `.env.local`
2. **Extracts Project ID**: Parses the project reference from `NEXT_PUBLIC_SUPABASE_URL`
3. **Generates Types**: Uses the Supabase CLI to generate types and saves them to `src/database.types.ts`

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-ref.supabase.co`)

## First-Time Setup

If you encounter authentication errors, you need to link your project:

```bash
# Login to Supabase CLI (one-time setup)
npx supabase login

# Link your project (one-time setup)
npx supabase link --project-ref YOUR_PROJECT_REF
```

After linking once, the script will work without requiring authentication each time.

## Output Location

Types are generated at: `src/database.types.ts`

## Common Issues

### Script Hangs

**Solution**: Make sure you've run `npx supabase link` at least once. The script uses the `--linked` flag which requires the project to be linked locally.

### Authentication Errors

**Solution**:

1. Run `npx supabase login`
2. Run `npx supabase link --project-ref YOUR_PROJECT_REF`
3. Try `pnpm update-types` again

### Missing Environment Variables

**Solution**: Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in your `.env.local` file.

## What Changed (Nov 2024)

### Previous Issues

- Script used `PROJECT_REF` environment variable which wasn't consistently set
- Generated types to the wrong location (`database.types.ts` at root)
- Would hang waiting for Supabase CLI authentication

### Current Solution

- Uses `NEXT_PUBLIC_SUPABASE_URL` which is already required for the app
- Generates to the correct location (`src/database.types.ts`)
- Uses `--linked` flag to avoid hanging (requires one-time setup with `supabase link`)
- Provides helpful error messages with clear next steps

## Technical Details

The script is located at `scripts/update-types.js` and:

1. Loads environment variables from `.env` or `.env.local`
2. Extracts the project ref from `NEXT_PUBLIC_SUPABASE_URL` using regex
3. Runs `npx supabase gen types typescript --linked`
4. Outputs to `src/database.types.ts`

The `package.json` script simply calls this Node.js script:

```json
{
  "scripts": {
    "update-types": "node scripts/update-types.js"
  }
}
```

## When to Run

Run this script whenever you:

- Make changes to your database schema (tables, columns, views, functions)
- Add new tables or modify existing ones
- Want to ensure your TypeScript types match your database

## Integration with CI/CD

You can add this to your CI/CD pipeline to ensure types are always up-to-date:

```bash
# In your CI script
pnpm update-types
git diff --exit-code src/database.types.ts || echo "⚠️ Database types are out of sync"
```
