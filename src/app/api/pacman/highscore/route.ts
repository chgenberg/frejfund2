import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    // Get personal best
    let personalBest = 0;
    if (sessionId) {
      const personal = await prisma.pacmanScore.findFirst({
        where: { sessionId },
        orderBy: { score: 'desc' },
      });
      personalBest = personal?.score || 0;
    }

    // Get weekly best (top score from last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekly = await prisma.pacmanScore.findFirst({
      where: { createdAt: { gte: weekAgo } },
      orderBy: { score: 'desc' },
    });

    return NextResponse.json({
      personalBest,
      weeklyBest: weekly?.score || 0,
      weeklyPlayer: weekly?.playerName || 'Anonymous',
    });
  } catch (error) {
    console.error('Error fetching highscore:', error);
    return NextResponse.json({ personalBest: 0, weeklyBest: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, score, playerName } = await req.json();

    if (!sessionId || typeof score !== 'number') {
      return NextResponse.json({ error: 'sessionId and score required' }, { status: 400 });
    }

    // Save score
    await prisma.pacmanScore.create({
      data: {
        sessionId,
        score,
        playerName: playerName || 'Anonymous',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}

