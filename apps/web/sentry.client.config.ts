import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

    integrations: [
        Sentry.replayIntegration({
            // Privacy controls
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    // Filter sensitive headers
    beforeSend(event) {
        if (event.request?.headers) {
            if (event.request.headers.authorization) {
                delete event.request.headers.authorization;
            }
            if (event.request.headers.cookie) {
                delete event.request.headers.cookie;
            }
        }
        return event;
    },

    // Ignore common noise
    ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
    ],
});