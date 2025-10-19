import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startup = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        deepAnalyses: {
          where: {
            status: 'completed',
          },
          orderBy: {
            completedAt: 'desc',
          },
          take: 1,
          include: {
            dimensions: {
              select: {
                dimensionId: true,
                name: true,
                category: true,
                score: true,
                analyzed: true,
                findings: true,
                strengths: true,
                redFlags: true,
                questions: true,
                evidence: true,
              },
            },
            insights: true,
          },
        },
        sessions: {
          select: {
            businessInfo: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    // Allow access if profile is public OR caller is an authenticated VC (cookie set by middleware)
    const vcSession = cookies().get('vc-session');
    const isVC = Boolean(vcSession?.value);

    if (!startup || (!startup.isProfilePublic && !isVC)) {
      return NextResponse.json({ error: 'Startup not found or not accessible' }, { status: 404 });
    }

    const analysis = startup.deepAnalyses[0];
    const businessInfo = (startup.sessions[0]?.businessInfo as any) || {};

    // Group dimensions by category
    const dimensionsByCategory: Record<string, any[]> = {};
    if (analysis?.dimensions) {
      analysis.dimensions.forEach((dim) => {
        if (!dimensionsByCategory[dim.category]) {
          dimensionsByCategory[dim.category] = [];
        }
        dimensionsByCategory[dim.category].push(dim);
      });
    }

    // Transform to detailed startup profile with null guards
    const profile = {
      id: startup.id,
      name: startup.name || businessInfo?.founderName || 'Unknown',
      companyName: startup.company || businessInfo?.name || 'Unknown Company',
      logo: startup.logo || businessInfo?.logo || null,
      location: {
        city: businessInfo?.city || 'Stockholm',
        country: businessInfo?.country || 'Sweden',
      },
      industry: startup.industry || businessInfo?.industry || 'Tech',
      stage: startup.stage || businessInfo?.stage || 'Seed',
      raised: businessInfo?.raised || 0,
      seeking: startup.askAmount || businessInfo?.seeking || 1000000,
      monthlyRevenue: businessInfo?.monthlyRevenue || 0,
      teamSize: businessInfo?.teamSize || 1,
      foundedYear: businessInfo?.foundedYear || new Date().getFullYear(),
      readinessScore: analysis?.investmentReadiness || 50,
      overallScore: analysis?.overallScore || 50,
      oneLiner: startup.oneLiner || businessInfo?.description || 'Building the future',
      website: startup.website || businessInfo?.website || null,
      linkedIn: businessInfo?.linkedinProfiles?.[0] || null,
      pitchDeck: startup.pitchDeck || null,
      traction: startup.traction || businessInfo?.traction || {},
      metrics: {
        growth:
          getScoreFromDimensions(analysis?.dimensions || [], 'Revenue Growth') ||
          businessInfo?.growthRate ||
          0,
        retention: getScoreFromDimensions(analysis?.dimensions || [], 'Customer Retention') || 0,
        burnRate: businessInfo?.burnRate || 0,
        unitEconomics: getScoreFromDimensions(analysis?.dimensions || [], 'Unit Economics') || 0,
        marketSize: getScoreFromDimensions(analysis?.dimensions || [], 'Market Size') || 0,
        productMarketFit:
          getScoreFromDimensions(analysis?.dimensions || [], 'Product-Market Fit') || 0,
      },
      dimensions: analysis?.dimensions || [],
      dimensionsByCategory,
      insights: analysis?.insights || [],
      analysisCompletedAt: analysis?.completedAt || null,
      createdAt: startup.createdAt,
      updatedAt: startup.updatedAt,
    };

    return NextResponse.json({ startup: profile });
  } catch (error) {
    console.error('Error fetching startup profile:', error);
    return NextResponse.json({ error: 'Failed to fetch startup profile' }, { status: 500 });
  }
}

function getScoreFromDimensions(dimensions: any[], name: string): number {
  const dim = dimensions.find((d) => d.name === name);
  return dim?.score || 0;
}
