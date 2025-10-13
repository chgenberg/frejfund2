import { NextRequest, NextResponse } from 'next/server';
import { runDeepAnalysis, getDeepAnalysis } from '@/lib/deep-analysis-runner';

/**
 * POST /api/deep-analysis
 * Trigger deep background analysis for a session
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, businessInfo, scrapedContent, uploadedDocuments } = await request.json();

    if (!sessionId || !businessInfo) {
      return NextResponse.json(
        { error: 'sessionId and businessInfo are required' },
        { status: 400 }
      );
    }

    // Single-run guard: Check if already running BEFORE starting
    const { prisma } = await import('@/lib/prisma');
    const existing = await prisma.deepAnalysis.findUnique({ 
      where: { sessionId },
      select: { status: true, progress: true }
    });
    
    if (existing && existing.status === 'analyzing') {
      console.log('⚠️ Analysis already running for session:', sessionId, `(${existing.progress}% complete)`);
      return NextResponse.json({ 
        success: true, 
        already_running: true, 
        message: 'Analysis already in progress',
        progress: existing.progress,
        sessionId 
      });
    }

    console.log('🚀 Starting deep analysis for session:', sessionId);
    
    // Start deep analysis in background (non-blocking)
    // Note: In production, this should be a background job (BullMQ, Inngest, etc.)
    runDeepAnalysis({
      sessionId,
      businessInfo,
      scrapedContent: scrapedContent || '',
      uploadedDocuments: uploadedDocuments || [],
      mode: 'progressive' // Run progressively to avoid rate limits
    }).then(() => {
      console.log('✅ Deep analysis completed for session:', sessionId);
    }).catch(error => {
      console.error('❌ Background deep analysis failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Deep analysis started in background',
      sessionId
    });

  } catch (error) {
    console.error('Deep analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to start deep analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deep-analysis?sessionId=xxx
 * Get deep analysis results for a session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const analysis = await getDeepAnalysis(sessionId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    const dimensionsByCategory: Record<string, any[]> = {};

    for (const dim of analysis.dimensions) {
      if (!categoryScores[dim.category]) {
        categoryScores[dim.category] = 0;
        dimensionsByCategory[dim.category] = [];
      }
      categoryScores[dim.category] += dim.score || 0;
      dimensionsByCategory[dim.category].push(dim);
    }

    // Average scores per category
    for (const category in categoryScores) {
      const count = dimensionsByCategory[category].length;
      categoryScores[category] = Math.round(categoryScores[category] / count);
    }

    // Transform dimensions to match frontend interface
    const transformedDimensions = analysis.dimensions.map(dim => {
      // Safely parse JSON fields
      const parseJsonField = (field: any): any[] => {
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      return {
        id: dim.dimensionId,
        name: dim.name,
        category: dim.category,
        score: dim.score || 0,
        status: dim.analyzed ? 'completed' : 'pending',
        findings: parseJsonField(dim.findings),
        strengths: parseJsonField(dim.strengths),
        redFlags: parseJsonField(dim.redFlags),
        recommendations: parseJsonField(dim.questions),
        questions: parseJsonField(dim.questions),
        evidence: parseJsonField(dim.evidence)
      };
    });

    return NextResponse.json({
      status: analysis.status,
      progress: analysis.progress,
      overallScore: analysis.overallScore,
      investmentReadiness: analysis.investmentReadiness,
      categoryScores,
      insights: analysis.insights,
      completedAt: analysis.completedAt,
      totalDimensions: analysis.dimensions.length,
      analyzedDimensions: analysis.dimensions.filter(d => d.analyzed).length,
      dimensions: transformedDimensions
    });

  } catch (error) {
    console.error('Get deep analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
