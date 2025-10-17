import { Queue, Worker, Job, QueueEvents, BackoffOptions } from 'bullmq';
import { getRedis, getPub, getProgressChannel } from '@/lib/redis';
import { runDeepAnalysis } from '@/lib/deep-analysis-runner';

export type DeepAnalysisJob = {
  sessionId: string;
  businessInfo: any;
  scrapedContent: string;
  uploadedDocuments?: string[];
  mode?: 'full' | 'critical-only' | 'progressive';
  specificDimensions?: string[];
  preHarvestText?: string;
};

const connection = getRedis();

export const deepAnalysisQueue = new Queue<DeepAnalysisJob>('deep-analysis', { connection });
export const deepAnalysisEvents = new QueueEvents('deep-analysis', { connection });

export function startDeepAnalysisWorker() {
  const backoff: BackoffOptions = { type: 'exponential', delay: 2000 } as any;
  const worker = new Worker<DeepAnalysisJob>(
    'deep-analysis',
    async (job: Job<DeepAnalysisJob>) => {
      const { sessionId, businessInfo, scrapedContent, uploadedDocuments = [], mode = 'progressive', specificDimensions, preHarvestText } = job.data;

      // Wrap run with progress hooks via pub/sub
      const pub = getPub();
      let lastEmitted = -1;
      const reportProgress = async (current: number, total: number, completedCategories?: string[]) => {
        if (current === lastEmitted) return;
        lastEmitted = current;
        const channel = getProgressChannel(sessionId);
        await pub.publish(channel, JSON.stringify({ type: 'progress', current, total, completedCategories }));
        await job.updateProgress(Math.round((current / Math.max(1, total)) * 100));
      };

      // Monkey-patch prisma updates interception is complex; rely on SSE polling as fallback.
      // We still publish keep-alives every 15s
      const keepAlive = setInterval(async () => {
        await pub.publish(getProgressChannel(sessionId), JSON.stringify({ type: 'keepalive' }));
      }, 15000);

      try {
        // Determine analysis mode - free-tier for now (will add pro logic later)
        const analysisMode = mode || 'free-tier'; // TODO: Check user subscription status
        
        await runDeepAnalysis({ 
          sessionId, 
          businessInfo, 
          scrapedContent, 
          uploadedDocuments, 
          mode: analysisMode, 
          specificDimensions, 
          preHarvestText,
          onProgress: reportProgress
        });
        await pub.publish(getProgressChannel(sessionId), JSON.stringify({ type: 'complete' }));
        return true;
      } finally {
        clearInterval(keepAlive);
      }
    },
    {
      connection,
      concurrency: 1,
      lockDuration: 600000,
      limiter: { max: 3, duration: 1000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400, count: 1000 },
      backoff,
      attempts: 3
    }
  );

  worker.on('failed', (job, err) => {
    console.error('Deep analysis job failed:', job?.id, err?.message);
  });

  return worker;
}


