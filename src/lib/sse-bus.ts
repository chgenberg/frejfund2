// Simple in-memory SSE bus keyed by channel (e.g., introRequestId)
// Note: In-memory is fine for single-instance demos. For multi-instance, use Redis pub/sub.

type Subscriber = {
  id: string;
  send: (data: string) => void;
  close: () => void;
};

type Channel = {
  subscribers: Map<string, Subscriber>;
};

const globalAny = global as unknown as { __FF_SSE__: Map<string, Channel> };

if (!globalAny.__FF_SSE__) {
  globalAny.__FF_SSE__ = new Map();
}

function getChannel(channelId: string): Channel {
  let ch = globalAny.__FF_SSE__!.get(channelId);
  if (!ch) {
    ch = { subscribers: new Map() };
    globalAny.__FF_SSE__!.set(channelId, ch);
  }
  return ch;
}

export function sseSubscribe(channelId: string, subscriberId: string, send: (data: string) => void, onClose: () => void) {
  const ch = getChannel(channelId);
  ch.subscribers.set(subscriberId, { id: subscriberId, send, close: onClose });
}

export function sseUnsubscribe(channelId: string, subscriberId: string) {
  const ch = getChannel(channelId);
  const sub = ch.subscribers.get(subscriberId);
  if (sub) {
    try { sub.close(); } catch {}
    ch.subscribers.delete(subscriberId);
  }
}

export function ssePublish(channelId: string, event: string, payload: any) {
  const ch = getChannel(channelId);
  const data = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const [, sub] of ch.subscribers) {
    try { sub.send(data); } catch {}
  }
}


