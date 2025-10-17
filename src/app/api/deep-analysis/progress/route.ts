import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ANALYSIS_DIMENSIONS } from '@/lib/deep-analysis-framework';
import { getSub, getProgressChannel } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Global progress store (in production, use Redis or similar)
const progressStore = new Map<string, {
  current: number;
  total: number;
  completedCategories: string[];
  lastUpdate: number;
}>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  // Import prisma dynamically
  const { prisma } = await import('@/lib/prisma');
  
  // Create a stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const safeEnqueue = (chunk: string) => {
        if (closed) return; // guard double-writes after close
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const write = (payload: any) => {
        safeEnqueue(`data: ${JSON.stringify(payload)}\n\n`);
      };

      // Send initial connection message
      write({ type: 'connected' });

      let lastProgress = -1;

      // Subscribe to Redis progress channel for near-real-time updates
      const sub = getSub();
      const channel = getProgressChannel(sessionId);
      sub.subscribe(channel).catch(()=>{});

      // Poll DB as a fallback (every few seconds)
      const interval = setInterval(async () => {
        if (closed) return;
        try {
          // Check database for progress
          const analysis = await prisma.deepAnalysis.findUnique({
            where: { sessionId },
            include: {
              dimensions: {
                where: { analyzed: true },
                select: { category: true }
              }
            }
          });
          
          if (analysis) {
            const completedCount = analysis.dimensions.length;
            const totalCount = ANALYSIS_DIMENSIONS.length;

            // Compute client-facing progress as max(db.progress, computed)
            const coarseDbProgress = Math.max(0, Math.min(100, analysis.progress || 0));
            const computedProgress = Math.round((completedCount / Math.max(1, totalCount)) * 100);
            const effectiveCount = Math.max(Math.round((coarseDbProgress / 100) * totalCount), completedCount);
            const completedCategories = [...new Set(analysis.dimensions.map(d => d.category))];
            
            // Only send update if progress changed
            if (effectiveCount !== lastProgress || effectiveCount === 0) {
              lastProgress = effectiveCount;
              const data = { type: 'progress', current: effectiveCount, total: totalCount, completedCategories, sessionId };
              write(data);
              console.log(`📡 SSE: Sent progress ${effectiveCount}/${totalCount} to client (session ${sessionId})`);
            }
            
            // Check if complete (require both DB status and count to agree)
            if (analysis.status === 'completed' && effectiveCount >= totalCount) {
              write({ type: 'complete' });
              console.log('📡 SSE: Analysis complete, closing connection');
              clearInterval(interval);
              clearInterval(keepAlive);
              if (!closed) {
                closed = true;
                try { controller.close(); } catch {}
              }
            }
          }
        } catch (error) {
          console.error('SSE poll error:', error);
        }
      }, 2500); // Check every 2.5 seconds to reduce churn

      // Heartbeat to keep Safari/Proxies alive
      const keepAlive = setInterval(() => {
        if (closed) return;
        safeEnqueue(':keepalive\n\n');
      }, 15000); // Slightly more frequent to survive strict proxies

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        console.log('📡 SSE: Client disconnected');
        clearInterval(interval);
        clearInterval(keepAlive);
        try { sub.unsubscribe(channel); } catch {}
        if (!closed) {
          closed = true;
          try { controller.close(); } catch {}
        }
      });

      // Handle Redis messages
      sub.on('message', (_chan, payload) => {
        if (_chan !== channel) return;
        try {
          const data = JSON.parse(payload);
          if (data?.type === 'progress') {
            lastProgress = data.current;
            write(data);
          } else if (data?.type === 'complete') {
            write({ type: 'complete' });
            clearInterval(interval);
            clearInterval(keepAlive);
            try { sub.unsubscribe(channel); } catch {}
            if (!closed) { closed = true; try { controller.close(); } catch {} }
          }
        } catch {}
      });
    },
    cancel() {
      // Stream consumer cancelled; ensure we stop timers and stop writing
      try { /* no-op */ } catch {}
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    },
  });
}

// Endpoint to update progress (called by deep-analysis-runner)
export async function POST(request: NextRequest) {
  const { sessionId, current, total, completedCategories } = await request.json();
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }
  
  progressStore.set(sessionId, {
    current,
    total,
    completedCategories,
    lastUpdate: Date.now()
  });
  
  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of progressStore.entries()) {
    if (value.lastUpdate < oneHourAgo) {
      progressStore.delete(key);
    }
  }
  
  return NextResponse.json({ success: true });
}
