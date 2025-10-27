import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ANALYSIS_DIMENSIONS } from '@/lib/deep-analysis-framework';
import { getSub, getProgressChannel } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Global progress store (in production, use Redis or similar)
const progressStore = new Map<
  string,
  {
    current: number;
    total: number;
    completedCategories: string[];
    lastUpdate: number;
  }
>();

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const logPrefix = `[PROGRESS-SSE] [${new Date().toISOString()}]`;
  const startTime = Date.now();  // FIX #1, #5: MOVE TO HERE before stream creation

  if (!sessionId) {
    return new NextResponse('sessionId is required', { status: 400 });
  }

  console.log(`${logPrefix} 🔌 SSE connection opened for session: ${sessionId}`);

  // Create SSE response
  const stream = new ReadableStream({
    async start(controller) {
      console.log(`${logPrefix} 📡 Controller ready for ${sessionId}`);
      
      try {
        // Get initial status
        const { prisma } = await import('@/lib/prisma');
        let lastProgress = -1;
        let completionSent = false;  // FIX #4: Track if we sent completion already
        
        // Send initial status
        const analysis = await prisma.deepAnalysis.findUnique({
          where: { sessionId },
          select: { status: true, progress: true }
        });
        
        if (analysis) {
          console.log(`${logPrefix} 📊 Initial status: ${analysis.status}, progress: ${analysis.progress}%`);
          controller.enqueue(`data: ${JSON.stringify({
            type: 'progress',
            current: analysis.progress,
            total: 100,
            status: analysis.status
          })}\n\n`);
          lastProgress = analysis.progress;
          
          // FIX #4: If already completed on initial read, send complete event immediately
          if (analysis.status === 'completed' && !completionSent) {
            console.log(`${logPrefix} ✅ Analysis already completed, sending complete event`);
            controller.enqueue(`data: ${JSON.stringify({
              type: 'complete'
            })}\n\n`);
            completionSent = true;
            clearInterval(pollInterval);
            controller.close();
            return;
          }
        }

        // Poll for updates
        const pollInterval = setInterval(async () => {
          try {
            const latest = await prisma.deepAnalysis.findUnique({
              where: { sessionId },
              select: { status: true, progress: true }
            });

            if (!latest) {
              console.warn(`${logPrefix} ⚠️ Analysis not found, closing connection`);
              clearInterval(pollInterval);
              controller.close();
              return;
            }

            // Send progress update if changed
            if (latest.progress !== lastProgress) {
              console.log(`${logPrefix} 📊 Progress update: ${latest.progress}%`);
              controller.enqueue(`data: ${JSON.stringify({
                type: 'progress',
                current: latest.progress,
                total: 100
              })}\n\n`);
              lastProgress = latest.progress;
            }

            // FIX #4: Send completion only once, regardless of progress value
            if (latest.status === 'completed' && !completionSent) {
              console.log(`${logPrefix} ✅ Analysis completed!`);
              controller.enqueue(`data: ${JSON.stringify({
                type: 'complete'
              })}\n\n`);
              completionSent = true;
              clearInterval(pollInterval);
              controller.close();
              return;
            }

            // FIX #1, #5: Use startTime which is now defined
            if (Date.now() - startTime > 30 * 60 * 1000) {
              console.warn(`${logPrefix} ⚠️ Timeout - closing connection after 30 minutes`);
              clearInterval(pollInterval);
              controller.close();
              return;
            }
          } catch (error) {
            console.error(`${logPrefix} ❌ Error in poll loop:`, error);
            clearInterval(pollInterval);
            controller.close();
          }
        }, 1000); // Poll every second

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          console.log(`${logPrefix} 🔌 Client disconnected`);
          clearInterval(pollInterval);
          controller.close();
        });
      } catch (error) {
        console.error(`${logPrefix} ❌ Error setting up SSE:`, error);
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
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
    lastUpdate: Date.now(),
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
