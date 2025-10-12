import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ssePublish } from '@/lib/sse-bus';

export const dynamic = 'force-dynamic';

// POST /api/messages/match/read - mark messages as read
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { introRequestId, readerEmail } = body;
    if (!introRequestId || !readerEmail) {
      return NextResponse.json({ error: 'introRequestId and readerEmail required' }, { status: 400 });
    }

    const result = await prisma.matchMessage.updateMany({
      where: { introRequestId, isRead: false, senderEmail: { not: readerEmail } },
      data: { isRead: true, readAt: new Date() as any }
    });

    ssePublish(introRequestId, 'read_receipt', { count: result.count, readerEmail });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error: any) {
    console.error('Error marking read:', error);
    return NextResponse.json({ error: 'Failed to mark read', details: error.message }, { status: 500 });
  }
}


