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
  try {
    if (!process.env.REDIS_URL) return createNoopPub();
    if (!pub) {
      const url = process.env.REDIS_URL;
      pub = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true }) as any;
    }
    return pub as any;
  } catch {
    return createNoopPub();
  }
}

export function getSub(): SubLike {
  try {
    if (!process.env.REDIS_URL) return createNoopSub();
    if (!sub) {
      const url = process.env.REDIS_URL;
      sub = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true }) as any;
    }
    return sub as any;
  } catch {
    return createNoopSub();
  }
}

export function getProgressChannel(sessionId: string) {
  return `deepAnalysis:progress:${sessionId}`;
}
