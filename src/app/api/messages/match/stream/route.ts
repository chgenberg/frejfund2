import { NextRequest } from 'next/server';
import { ssePublish, sseSubscribe, sseUnsubscribe } from '@/lib/sse-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const introRequestId = url.searchParams.get('introRequestId');
  const subscriberId = url.searchParams.get('subId') || Math.random().toString(36).slice(2);
  if (!introRequestId) {
    return new Response('introRequestId required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => controller.enqueue(encoder.encode(data));
      const onClose = () => {
        try { controller.close(); } catch {}
      };

      // Initial keepalive
      send(': connected\n\n');
      sseSubscribe(introRequestId, subscriberId!, send, onClose);
    },
    cancel() {
      sseUnsubscribe(introRequestId, subscriberId!);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    }
  });
}


