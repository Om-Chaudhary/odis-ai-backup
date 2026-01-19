#!/bin/bash
#
# Helper script to run standalone migration scripts with environment variables
#
# Usage:
#   ./scripts/standalone/run.sh debug garrybath@hotmail.com
#   ./scripts/standalone/run.sh link garrybath@hotmail.com
#   ./scripts/standalone/run.sh sync garrybath@hotmail.com
#   ./scripts/standalone/run.sh migrate-pilots [--dry-run]
#

# Check if .env file exists in standalone directory
if [ -f "$(dirname "$0")/.env" ]; then
  echo "📁 Loading environment from scripts/standalone/.env"
  set -a
  source "$(dirname "$0")/.env"
  set +a
elif [ -f ".env" ]; then
  echo "📁 Loading environment from .env"
  set -a
  source .env
  set +a
else
  echo "⚠️  No .env file found. Make sure environment variables are set."
  echo "   CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  echo ""
fi

# Get command
COMMAND=$1
shift

case "$COMMAND" in
  debug)
    echo "🔍 Running debug-user-clerk-sync.ts"
    pnpm tsx scripts/standalone/debug-user-clerk-sync.ts "$@"
    ;;
  link)
    echo "🔗 Running link-clerk-account.ts"
    pnpm tsx scripts/standalone/link-clerk-account.ts "$@"
    ;;
  sync)
    echo "🔄 Running sync-clerk-user.ts"
    pnpm tsx scripts/standalone/sync-clerk-user.ts "$@"
    ;;
  migrate-pilots)
    echo "🏥 Running migrate-pilot-clinics.ts"
    pnpm tsx scripts/standalone/migrate-pilot-clinics.ts "$@"
    ;;
  *)
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  debug <email>           - Debug user Clerk sync status"
    echo "  link <email>            - Link Clerk account to existing Supabase user"
    echo "  sync <email>            - Create new Supabase user from Clerk account"
    echo "  migrate-pilots [flags]  - Migrate pilot clinics (use --dry-run for preview)"
    echo ""
    echo "Examples:"
    echo "  $0 debug garrybath@hotmail.com"
    echo "  $0 link garrybath@hotmail.com"
    echo "  $0 migrate-pilots --dry-run"
    exit 1
    ;;
esac
