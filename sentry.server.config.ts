import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  release: process.env.SENTRY_RELEASE,
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.httpIntegration({ tracing: true }),
  ],
});


