import { NextRequest, NextResponse } from 'next/server';
import { identifyAnalysisGaps, generateSmartQuestions } from '@/lib/gap-qa-system';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get analysis to verify it exists and get business info
    const analysis = await prisma.deepAnalysis.findUnique({
      where: { sessionId },
      select: { businessInfo: true }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Identify gaps in the analysis
    const gaps = await identifyAnalysisGaps(sessionId);

    // Generate smart questions based on gaps
    const questions = await generateSmartQuestions(gaps, analysis.businessInfo);

    return NextResponse.json({
      gaps,
      questions,
      totalGaps: gaps.length,
      businessInfo: analysis.businessInfo
    });
  } catch (error) {
    console.error('Error identifying gaps:', error);
    return NextResponse.json(
      { error: 'Failed to identify analysis gaps' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answers } = await req.json();

    if (!sessionId || !answers) {
      return NextResponse.json(
        { error: 'Session ID and answers required' },
        { status: 400 }
      );
    }

    // Save gap answers
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        metadata: {
          ...(await prisma.session.findUnique({
            where: { id: sessionId },
            select: { metadata: true }
          }))?.metadata as any,
          gapAnswers: answers,
          gapAnsweredAt: new Date()
        }
      }
    });

    // Get dimension IDs from answers
    const dimensionIds = Object.keys(answers).map(key => {
      const parts = key.split('-');
      return parts.slice(0, -1).join('-'); // Remove question suffix
    }).filter(Boolean);

    // Trigger incremental reanalysis for affected dimensions
    if (dimensionIds.length > 0) {
      const { runIncrementalAnalysis } = await import('@/lib/gap-qa-system');
      
      // Format answers as additional context
      const additionalContext = Object.entries(answers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n\n');

      await runIncrementalAnalysis(sessionId, dimensionIds, additionalContext);
    }

    return NextResponse.json({
      success: true,
      message: 'Answers saved and analysis updated',
      updatedDimensions: dimensionIds.length
    });
  } catch (error) {
    console.error('Error saving gap answers:', error);
    return NextResponse.json(
      { error: 'Failed to save answers' },
      { status: 500 }
    );
  }
}