import IORedis from 'ioredis';

type PubLike = { publish: (channel: string, payload: string) => Promise<number> };
type SubLike = { subscribe: (channel: string) => Promise<number>; on: (ev: string, fn: (...args: any[]) => void) => void };

let redis: IORedis | null = null;
let pub: (IORedis & PubLike) | (PubLike & { connected?: boolean }) | null = null;
let sub: (IORedis & SubLike) | (SubLike & { connected?: boolean }) | null = null;

function createNoopPub(): PubLike {
  return {
    async publish() {
      return 0; // no-op
    },
  };
}

function createNoopSub(): SubLike {
  return {
    async subscribe() {
      return 0; // no-op
    },
    on() {},
  };
}

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
  if (!process.env.REDIS_URL) return createNoopPub();
  
  try {
    if (!pub) {
      const url = process.env.REDIS_URL;
      pub = new IORedis(url, { 
        maxRetriesPerRequest: null, 
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: () => null  // Don't retry on failure
      }) as any;
      pub.on('error', (err: any) => {
        console.warn('Redis pub error (non-fatal):', err.code);
      });
    }
    return pub as any;
  } catch (err) {
    console.warn('Redis pub init failed, using no-op:', err);
    return createNoopPub();
  }
}

export function getSub(): SubLike {
  if (!process.env.REDIS_URL) return createNoopSub();
  
  try {
    if (!sub) {
      const url = process.env.REDIS_URL;
      sub = new IORedis(url, { 
        maxRetriesPerRequest: null, 
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: () => null
      }) as any;
      sub.on('error', (err: any) => {
        console.warn('Redis sub error (non-fatal):', err.code);
      });
    }
    return sub as any;
  } catch (err) {
    console.warn('Redis sub init failed, using no-op:', err);
    return createNoopSub();
  }
}

export function getProgressChannel(sessionId: string) {
  return `deepAnalysis:progress:${sessionId}`;
}
