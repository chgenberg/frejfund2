import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

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
      
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));
      
      let lastProgress = 0;
      
      // Poll for updates from database
      const interval = setInterval(async () => {
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
            const totalCount = 95; // Total dimensions
            const completedCategories = [...new Set(analysis.dimensions.map(d => d.category))];
            
            // Only send update if progress changed
            if (completedCount !== lastProgress || completedCount === 0) {
              lastProgress = completedCount;
              
              const data = {
                type: 'progress',
                current: completedCount,
                total: totalCount,
                completedCategories
              };
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              console.log(`📡 SSE: Sent progress ${completedCount}/${totalCount} to client`);
            }
            
            // Check if complete
            if (analysis.status === 'completed' && completedCount >= totalCount) {
              controller.enqueue(encoder.encode('data: {"type":"complete"}\n\n'));
              console.log('📡 SSE: Analysis complete, closing connection');
              clearInterval(interval);
              controller.close();
            }
          }
        } catch (error) {
          console.error('SSE poll error:', error);
        }
      }, 2000); // Check every 2 seconds
      
      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        console.log('📡 SSE: Client disconnected');
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
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
