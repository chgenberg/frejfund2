import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deepAnalysisRunner } from '@/lib/deep-analysis-runner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, cardId, data } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get the existing analysis
    const analysis = await prisma.deepAnalysis.findUnique({
      where: { sessionId },
      include: {
        dimensions: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Update businessInfo with new data
    const businessInfo = analysis.businessInfo as any || {};
    
    // Handle different card types
    if (cardId.includes('upload-deck') && data.file) {
      // Mark that a pitch deck was uploaded
      businessInfo.pitchDeckUploaded = true;
      businessInfo.lastUploadedFile = data.file;
    } else if (cardId.includes('metric')) {
      // Update metrics
      if (!businessInfo.metrics) businessInfo.metrics = {};
      Object.assign(businessInfo.metrics, data);
    } else if (cardId.includes('critical')) {
      // Update critical information
      if (!businessInfo.additionalData) businessInfo.additionalData = {};
      Object.assign(businessInfo.additionalData, data);
    }

    // Save updated business info
    await prisma.deepAnalysis.update({
      where: { id: analysis.id },
      data: {
        businessInfo: businessInfo,
      },
    });

    // If significant new data was added, re-run specific dimensions
    if (data.file || Object.keys(data).length > 2) {
      // Determine which dimensions to re-analyze based on the card type
      const dimensionsToReanalyze: string[] = [];
      
      if (cardId.includes('metric') || cardId.includes('unit')) {
        dimensionsToReanalyze.push('unit-economics', 'retention', 'scalability');
      } else if (cardId.includes('retention')) {
        dimensionsToReanalyze.push('retention', 'customer-love', 'product-market-fit');
      } else if (cardId.includes('tech')) {
        dimensionsToReanalyze.push('tech-differentiation', 'scalability', 'technical-depth');
      }

      // Re-run analysis for specific dimensions in the background
      if (dimensionsToReanalyze.length > 0) {
        // This runs asynchronously - we don't wait for it
        deepAnalysisRunner.reanalyzeDimensions(sessionId, dimensionsToReanalyze).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis updated',
      reanalyzingDimensions: cardId.includes('metric') || cardId.includes('upload') ? true : false,
    });
  } catch (error) {
    console.error('Deep analysis update error:', error);
    return NextResponse.json(
      { error: 'Failed to update analysis' },
      { status: 500 }
    );
  }
}