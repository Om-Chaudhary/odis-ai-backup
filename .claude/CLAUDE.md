## Development Workflow

- Never use `git commit` or `git add` — GitButler handles all commits
- After completing a task, GitButler auto-commits your changes
- Use conventional commits: type(scope): description

## OdisAI Commit Scopes

Use these scopes in commit messages:

- (web): Next.js frontend
- (extension): Chrome extension, IDEXX Neo
- (cases): case management, SOAP notes
- (clinics): clinic config, multi-tenant
- (vapi): VAPI voice AI
- (outbound): discharge calls/emails
- (inbound): incoming calls, booking
- (dashboard): widgets, analytics
- (ui): shared components
- (util): utilities
- (db): Supabase

## Project Structure

Nx monorepo:

- apps/web — Next.js dashboard
- apps/extension — Chrome extension
- libs/domain/\* — Business logic
- libs/integrations/\* — External services (vapi, qstash, ai, resend)
- libs/shared/\* — Shared utilities, UI, validators
