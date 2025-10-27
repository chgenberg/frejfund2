import IORedis from 'ioredis';

type PubLike = { publish: (channel: string, payload: string) => Promise<number> };
type SubLike = { subscribe: (channel: string) => Promise<number>; on: (ev: string, fn: (...args: any[]) => void) => void };

let redis: IORedis | null = null;
let pub: (IORedis & PubLike) | (PubLike & { connected?: boolean }) | null = null;
let sub: (IORedis & SubLike) | (SubLike & { connected?: boolean }) | null = null;

const createNoopPub = () => ({
  publish: async (channel: string, message: string) => {
    // FIX #3: Silently succeed to prevent unhandled rejections
    // In production, consider logging this for monitoring
    return 1; // Simulate successful publish
  },
  on: (event: string, callback: any) => {
    // No-op event handler
  },
  quit: async () => {
    // No-op
  },
});

const createNoopSub = () => ({
  subscribe: async (channel: string) => {
    // No-op subscription
  },
  on: (event: string, callback: any) => {
    // No-op event handler
  },
  unsubscribe: async (channel: string) => {
    // No-op unsubscription
  },
  quit: async () => {
    // No-op
  },
});

export function getRedis(): IORedis | null {
  try {
    if (!process.env.REDIS_URL) return null;
    if (!redis) {
      const url = process.env.REDIS_URL;
      redis = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
    }
    return redis;
  } catch {
    return null;
  }
}

export function getPub(): PubLike {
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured, using no-op pub');
    return createNoopPub();
  }
  
  try {
    if (!pub) {
      const url = process.env.REDIS_URL;
      pub = new IORedis(url, { 
        maxRetriesPerRequest: null, 
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: (times) => {
          // FIX #3: Better retry strategy with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, times), 10000);
          console.warn(`[Redis Pub] Retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err) => {
          // FIX #3: Gracefully handle connection errors
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            console.warn('[Redis Pub] Read-only error, reconnecting...');
            return true;
          }
          return false;
        }
      }) as any;
      pub.on('error', (err: any) => {
        console.warn('[Redis Pub Error] Non-fatal Redis error:', err.code || err.message);
      });
      pub.on('close', () => {
        console.warn('[Redis Pub] Connection closed');
      });
    }
    return pub as any;
  } catch (err) {
    console.warn('[Redis Pub] Failed to initialize, using no-op:', err);
    return createNoopPub();
  }
}

export function getSub(): SubLike {
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured, using no-op sub');
    return createNoopSub();
  }
  
  try {
    if (!sub) {
      const url = process.env.REDIS_URL;
      sub = new IORedis(url, { 
        maxRetriesPerRequest: null, 
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: (times) => {
          // FIX #3: Better retry strategy
          const delay = Math.min(1000 * Math.pow(2, times), 10000);
          console.warn(`[Redis Sub] Retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        }
      }) as any;
      sub.on('error', (err: any) => {
        console.warn('[Redis Sub Error] Non-fatal Redis error:', err.code || err.message);
      });
      sub.on('close', () => {
        console.warn('[Redis Sub] Connection closed');
      });
    }
    return sub as any;
  } catch (err) {
    console.warn('[Redis Sub] Failed to initialize, using no-op:', err);
    return createNoopSub();
  }
}

export function getProgressChannel(sessionId: string) {
  return `deepAnalysis:progress:${sessionId}`;
}
