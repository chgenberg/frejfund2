import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ssePublish } from '@/lib/sse-bus';

export const dynamic = 'force-dynamic';

// GET /api/messages/match?introRequestId=xxx - Get messages for a match
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const introRequestId = url.searchParams.get('introRequestId');
    
    if (!introRequestId) {
      return NextResponse.json({ error: 'Intro request ID required' }, { status: 400 });
    }

    const messages = await prisma.matchMessage.findMany({
      where: { introRequestId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error fetching match messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/messages/match - Send a message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { introRequestId, senderType, senderEmail, content } = body;

    if (!introRequestId || !senderType || !senderEmail || !content) {
      return NextResponse.json({ 
        error: 'All fields required' 
      }, { status: 400 });
    }

    // Verify the intro request exists and is accepted
    const introRequest = await prisma.introRequest.findUnique({
      where: { id: introRequestId }
    });

    if (!introRequest) {
      return NextResponse.json({ error: 'Intro request not found' }, { status: 404 });
    }

    if (introRequest.status !== 'accepted' && introRequest.status !== 'intro_sent') {
      return NextResponse.json({ 
        error: 'Can only message after intro is accepted' 
      }, { status: 403 });
    }

    // Create message
    const message = await prisma.matchMessage.create({
      data: {
        introRequestId,
        senderType,
        senderEmail,
        content
      }
    });

    // Broadcast over SSE to both parties
    ssePublish(introRequestId, 'message', { message });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error.message
    }, { status: 500 });
  }
}
