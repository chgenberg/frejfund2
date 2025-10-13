import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateReadinessScore } from '@/lib/coaching-prompts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Check if deep analysis exists and is complete
    const deepAnalysis = await prisma.deepAnalysis.findFirst({
      where: {
        sessionId,
        status: 'completed'
      },
      include: {
        dimensions: true
      }
    });

    if (!deepAnalysis) {
      return NextResponse.json({ 
        completed: false,
        message: 'Deep analysis not completed yet'
      });
    }

    // Get business info to calculate readiness score
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session?.businessInfo) {
      return NextResponse.json({ 
        completed: false,
        message: 'Business info not found'
      });
    }

    // Calculate readiness score
    const readiness = calculateReadinessScore(session.businessInfo as any);

    return NextResponse.json({
      completed: true,
      score: readiness.score,
      completedAt: deepAnalysis.completedAt,
      dimensionsAnalyzed: deepAnalysis.dimensions.length
    });

  } catch (error) {
    console.error('Failed to check deep analysis status:', error);
    return NextResponse.json(
      { error: 'Failed to check analysis status' },
      { status: 500 }
    );
  }
}
