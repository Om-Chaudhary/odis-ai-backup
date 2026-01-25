import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Redact sensitive data from server errors
    beforeSend(event) {
        // Sanitize user data if needed, though Sentry does a lot by default.
        // Explicitly redact known sensitive keys in extra data
        if (event.extra) {
            const sensitiveKeys = ['password', 'apiKey', 'secret', 'token', 'credentials'];
            Object.keys(event.extra).forEach(key => {
                if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                    event.extra![key] = '[REDACTED]';
                }
            });
        }
        return event;
    },
});