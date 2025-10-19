import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseMetricsFromText, mergeMetricsIntoBusinessInfo } from '@/lib/metric-parser';
import { runDeepAnalysis } from '@/lib/deep-analysis-runner';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userMessage } = await request.json();

    if (!sessionId || !userMessage) {
      return NextResponse.json({ error: 'sessionId and userMessage required' }, { status: 400 });
    }

    // Parse metrics from user's message
    const extractedMetrics = parseMetricsFromText(userMessage);

    if (extractedMetrics.length === 0) {
      return NextResponse.json({
        success: true,
        metricsFound: false,
        message: 'No metrics detected in message',
      });
    }

    console.log(`📊 Extracted ${extractedMetrics.length} metrics from user message`);

    // Get current session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { businessInfo: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Merge metrics into businessInfo
    const currentBusinessInfo = (session.businessInfo as any) || {};
    const updatedBusinessInfo = mergeMetricsIntoBusinessInfo(currentBusinessInfo, extractedMetrics);

    // Save updated businessInfo
    await prisma.session.update({
      where: { id: sessionId },
      data: { businessInfo: updatedBusinessInfo },
    });

    console.log(`✅ Updated businessInfo with ${extractedMetrics.length} metrics`);

    // Get unique dimensions affected
    const affectedDimensions = new Set<string>();
    extractedMetrics.forEach((m) => {
      m.relatedDimensions.forEach((d) => affectedDimensions.add(d));
    });

    console.log(`🔄 Triggering targeted re-analysis for ${affectedDimensions.size} dimensions`);

    // Trigger targeted re-analysis in background
    runDeepAnalysis({
      sessionId,
      businessInfo: updatedBusinessInfo,
      scrapedContent: currentBusinessInfo.preScrapedText || '',
      uploadedDocuments: [],
      mode: 'critical-only',
      specificDimensions: Array.from(affectedDimensions), // Only re-analyze affected dimensions
    }).catch((error) => {
      console.error('❌ Targeted re-analysis failed:', error);
    });

    return NextResponse.json({
      success: true,
      metricsFound: true,
      count: extractedMetrics.length,
      extractedMetrics: extractedMetrics.map((m) => ({
        type: m.type,
        value: m.value,
        unit: m.unit,
        dimensions: m.relatedDimensions.slice(0, 2), // Top 2 affected dimensions
      })),
      affectedDimensions: Array.from(affectedDimensions),
      message: `Updated ${extractedMetrics.length} metric(s) and triggered re-analysis of ${affectedDimensions.size} dimension(s)`,
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    return NextResponse.json({ error: 'Failed to update metrics' }, { status: 500 });
  }
}
