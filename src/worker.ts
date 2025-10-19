import { startDeepAnalysisWorker } from '@/lib/queues/deep-analysis';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

async function main() {
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      release: process.env.SENTRY_RELEASE,
    });
    logger.info('worker_started', { release: process.env.SENTRY_RELEASE });
  } catch {}
  console.log('[worker] starting deep-analysis worker');
  startDeepAnalysisWorker();
}

main().catch((e) => {
  try {
    Sentry.captureException(e as any);
  } catch {}
  console.error('[worker] fatal error', e);
  process.exit(1);
});
