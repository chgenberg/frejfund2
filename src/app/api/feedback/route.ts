import { NextRequest, NextResponse } from 'next/server';
import { appendFeedback, getFeedbackCount } from '@/lib/feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messageId, sessionId, rating, reason, missing } = await req.json();
    if (!messageId || (rating !== 'up' && rating !== 'down')) {
      return NextResponse.json({ error: 'messageId and rating required' }, { status: 400 });
    }

    await appendFeedback({
      messageId,
      sessionId,
      rating,
      reason,
      missing,
      createdAt: Date.now()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}

export async function GET() {
  const count = await getFeedbackCount();
  return NextResponse.json({ count });
}


