# Scripts

Utility scripts for data operations, syncing, and development tooling.

## Quick Start

```bash
# Run any script with tsx
pnpm tsx scripts/backfill/backfill-discharge-summaries.ts --dry-run

# Or use pnpm shortcuts (if defined in package.json)
pnpm backfill:inbound-outcomes --dry-run
```

## Directory Structure

| Directory   | Purpose                                          |
| ----------- | ------------------------------------------------ |
| `tooling/`  | Build & dev utilities (nx docs, type generation) |
| `backfill/` | Data backfill operations                         |
| `sync/`     | External service syncing (VAPI, etc.)            |

## Creating New Scripts

1. Copy `_template.ts` to the appropriate directory
2. Update the script description and env requirements
3. Implement your logic in `main()`
4. Test with `--dry-run` first

## Environment Variables

Scripts load from `.env.local` (then `.env`). Common variables:

| Variable                    | Required For         |
| --------------------------- | -------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | All database scripts |
| `ANTHROPIC_API_KEY`         | AI-powered backfills |
| `VAPI_PRIVATE_KEY`          | VAPI sync scripts    |

## Standard Flags

| Flag        | Description                       |
| ----------- | --------------------------------- |
| `--dry-run` | Preview changes without executing |
| `--verbose` | Show detailed progress            |
| `--limit=N` | Process max N records             |
| `--days=N`  | Filter to last N days             |

## Scripts Inventory

### Tooling (`scripts/tooling/`)

| Script                | Description                           | pnpm command        |
| --------------------- | ------------------------------------- | ------------------- |
| `generate-nx-docs.js` | Regenerate Nx workspace documentation | `pnpm docs:nx`      |
| `update-types.js`     | Update Supabase TypeScript types      | `pnpm update-types` |
| `kill-dev-servers.js` | Kill all dev server processes         | `pnpm kill-dev`     |

### Backfill (`scripts/backfill/`)

| Script                             | Description                        |
| ---------------------------------- | ---------------------------------- |
| `backfill-discharge-summaries.ts`  | Backfill discharge call summaries  |
| `backfill-inbound-calls.ts`        | Backfill inbound call records      |
| `backfill-inbound-summaries.ts`    | Backfill inbound call summaries    |
| `backfill-inbound-transcripts.ts`  | Backfill inbound call transcripts  |
| `backfill-outbound-transcripts.ts` | Backfill outbound call transcripts |
| `backfill-structured-outputs.ts`   | Backfill structured output data    |
| `backfill-unknown-pet-names.ts`    | Backfill missing pet names         |

### Sync (`scripts/sync/`)

| Script                        | Description                        |
| ----------------------------- | ---------------------------------- |
| `sync-vapi-assistants.ts`     | Sync VAPI assistants configuration |
| `sync-stuck-inbound-calls.ts` | Re-process stuck inbound calls     |
| `generate-vapi-schemas.ts`    | Generate VAPI Zod schemas          |
