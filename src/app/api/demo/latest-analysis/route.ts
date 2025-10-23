import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch the most recent completed analysis with all relations
    const analysis = await prisma.deepAnalysis.findFirst({
      where: {
        status: 'completed',
        overallScore: { not: null }
      },
      orderBy: {
        completedAt: 'desc'
      },
      include: {
        dimensions: {
          include: {
            insights: true
          },
          orderBy: {
            score: 'desc'
          }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'No completed analysis found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedAnalysis = {
      id: analysis.id,
      overallScore: analysis.overallScore,
      confidenceWeightedScore: analysis.confidenceWeightedScore || analysis.overallScore,
      dataCompleteness: analysis.dataCompleteness || 85,
      investmentReadiness: analysis.investmentReadiness || Math.round((analysis.overallScore || 0) / 10),
      companyStage: analysis.companyStage || 'startup',
      businessInfo: analysis.businessInfo || {},
      publicKnowledge: analysis.publicKnowledge,
      ocrMetrics: analysis.ocrMetrics,
      metricOverrides: analysis.metricOverrides,
      dimensions: analysis.dimensions.map(dim => ({
        id: dim.id,
        name: dim.name,
        category: dim.category,
        score: dim.score || 0,
        importance: dim.importance as 'critical' | 'high' | 'medium' | 'low',
        status: getStatus(dim.score || 0),
        insights: dim.insights.map(i => i.content),
        recommendations: dim.insights
          .filter(i => i.type === 'recommendation')
          .map(i => i.content),
        confidence: dim.dataConfidence as 'high' | 'medium' | 'low' || 'medium',
        isApplicable: dim.isApplicable
      }))
    };

    return NextResponse.json(transformedAnalysis);
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

function getStatus(score: number): 'strong' | 'moderate' | 'weak' | 'critical' {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'weak';
  return 'critical';
}
