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

  // Create a stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));
      
      // Poll for updates
      const interval = setInterval(() => {
        const progress = progressStore.get(sessionId);
        
        if (progress) {
          const data = {
            type: 'progress',
            current: progress.current,
            total: progress.total,
            completedCategories: progress.completedCategories
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          
          // Check if complete
          if (progress.current >= progress.total) {
            controller.enqueue(encoder.encode('data: {"type":"complete"}\n\n'));
            clearInterval(interval);
            controller.close();
            progressStore.delete(sessionId);
          }
        }
      }, 1000); // Check every second
      
      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
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
