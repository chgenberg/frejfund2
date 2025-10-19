import IORedis from 'ioredis';

let redis: IORedis | null = null;
let pub: IORedis | null = null;
let sub: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redis = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  }
  return redis;
}

export function getPub(): IORedis {
  if (!pub) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    pub = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  }
  return pub;
}

export function getSub(): IORedis {
  if (!sub) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    sub = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  }
  return sub;
}

export function getProgressChannel(sessionId: string) {
  return `deepAnalysis:progress:${sessionId}`;
}
