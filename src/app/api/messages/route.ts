import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET messages for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Ensure session exists
    const session = await prisma.session.upsert({
      where: { id: sessionId },
      update: { lastActivity: new Date() },
      create: { id: sessionId },
    });

    // Get messages
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
        metrics: {
          tokens: m.tokens,
          latencyMs: m.latencyMs,
          costUsdEstimate: m.cost,
          model: m.model,
        },
      })),
    });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST save a message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, role, content, tokens, latencyMs, cost, model } = body;

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        {
          error: 'sessionId, role, and content required',
        },
        { status: 400 },
      );
    }

    // Ensure session exists
    await prisma.session.upsert({
      where: { id: sessionId },
      update: { lastActivity: new Date() },
      create: { id: sessionId },
    });

    // Save message
    const message = await prisma.message.create({
      data: {
        sessionId,
        role,
        content,
        tokens: tokens || null,
        latencyMs: latencyMs || null,
        cost: cost || null,
        model: model || null,
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
