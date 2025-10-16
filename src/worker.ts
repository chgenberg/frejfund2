import { startDeepAnalysisWorker } from '@/lib/queues/deep-analysis';

async function main() {
  console.log('[worker] starting deep-analysis worker');
  startDeepAnalysisWorker();
}

main().catch((e) => {
  console.error('[worker] fatal error', e);
  process.exit(1);
});


