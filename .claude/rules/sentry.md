---
paths:
  - "apps/web/src/**"
  - "libs/**"
---

# Sentry Instrumentation

Always import as: `import * as Sentry from "@sentry/nextjs"`

## Exceptions

Use `Sentry.captureException(error)` in try/catch blocks or where exceptions are expected.

## Tracing (Spans)

Use `Sentry.startSpan({ op, name }, callback)` for meaningful actions (button clicks, API calls, key functions). Set descriptive `op` (e.g., `"ui.click"`, `"http.client"`, `"db.query"`) and `name`. Attach attributes for context via `span.setAttribute(key, value)`.

Child spans can nest within parent spans.

## Logging

- Reference logger via `Sentry.logger`
- Methods: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Use `logger.fmt` template literal for structured variable interpolation: `` logger.debug(logger.fmt`Cache miss for user: ${userId}`) ``

## Configuration Files

- Client: `instrumentation-client.ts`
- Server: `sentry.server.config.ts`
- Edge: `sentry.edge.config.ts`

Do NOT repeat `Sentry.init()` outside these files. Logging requires `enableLogs: true` in the init config.
