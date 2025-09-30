import { NextRequest, NextResponse } from 'next/server';
import { appendFeedback, getFeedbackCount } from '@/lib/feedback-store';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messageId, sessionId, rating, reason, missing } = await req.json();
    if (!messageId || (rating !== 'up' && rating !== 'down')) {
      return NextResponse.json({ error: 'messageId and rating required' }, { status: 400 });
    }

    // Save to file-based store (legacy)
    await appendFeedback({
      messageId,
      sessionId,
      rating,
      reason,
      missing,
      createdAt: Date.now()
    });
    
    // Also save to Prisma database
    try {
      await prisma.feedback.create({
        data: {
          messageId,
          sessionId,
          rating,
          reason: reason || null,
          missing: missing || null,
          userAgent: req.headers.get('user-agent') || null
        }
      });
    } catch (e) {
      console.error('Failed to save feedback to database:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}

export async function GET() {
  const count = await getFeedbackCount();
  
  // Also get count from database
  try {
    const dbCount = await prisma.feedback.count();
    return NextResponse.json({ count, dbCount });
  } catch {
    return NextResponse.json({ count });
  }
}


