import { NextRequest, NextResponse } from 'next/server';
import { analyzeDataGaps } from '@/lib/gap-analysis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const gapAnalysis = await analyzeDataGaps(sessionId);

    return NextResponse.json({
      ...gapAnalysis,
      message: gapAnalysis.totalGaps === 0 
        ? 'Your analysis is complete!' 
        : `${gapAnalysis.totalGaps} data gaps identified. Complete them to improve your investment readiness.`
    });

  } catch (error) {
    console.error('Error analyzing gaps:', error);
    return NextResponse.json(
      { error: 'Failed to analyze gaps' },
      { status: 500 }
    );
  }
}

