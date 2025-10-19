import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runDeepAnalysis } from '@/lib/deep-analysis-runner';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, dimensionIds, newData } = await req.json();

    if (!sessionId || !dimensionIds || !Array.isArray(dimensionIds)) {
      return NextResponse.json({ error: 'Session ID and dimension IDs required' }, { status: 400 });
    }

    // Find the analysis
    const analysis = await prisma.deepAnalysis.findUnique({
      where: { sessionId },
      include: { dimensions: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Update the analysis status
    await prisma.deepAnalysis.update({
      where: { sessionId },
      data: {
        status: 'analyzing',
        additionalContext: JSON.stringify({
          ...JSON.parse(analysis.additionalContext || '{}'),
          gapResponses: newData,
        }),
      },
    });

    // Re-run analysis for specific dimensions with the new data
    const updatedContext = `
${analysis.scrapedContent || ''}

UPDATED INFORMATION FROM USER:
${Object.entries(newData)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
`;

    // Run partial analysis
    await runDeepAnalysis({
      sessionId,
      businessInfo: JSON.parse(analysis.businessInfo),
      scrapedContent: updatedContext,
      uploadedDocuments: [],
      mode: 'specific',
      specificDimensions: dimensionIds,
    });

    return NextResponse.json({
      success: true,
      message: 'Analysis update initiated',
    });
  } catch (error) {
    console.error('Error updating analysis:', error);
    return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 });
  }
}
