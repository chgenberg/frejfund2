import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Prefer Investment Ads (auto-published) as source for VC feed
    const ads = await prisma.investmentAd.findMany({
      where: { status: 'published', isPublic: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
      include: { user: true, analysis: { include: { dimensions: true, insights: true } } },
    });

    const startups = ads.map((ad) => {
      const analysis = ad.analysis as any;
      const businessInfo = (analysis?.businessInfo as any) || {};
      const dimensions = analysis?.dimensions || [];
      const getScore = (name: string) => {
        const dim = dimensions.find((d: any) => d.name === name);
        return dim?.score || 0;
      };
      return {
        id: ad.userId || ad.id,
        name: ad.user?.name || businessInfo.founderName || 'Unknown',
        companyName: ad.companyName,
        logo: ad.user?.logo || businessInfo.logo,
        location: {
          city: businessInfo.city || ad.location || 'Stockholm',
          country: businessInfo.country || 'Sweden',
          coordinates: getCoordinates(businessInfo.city || 'Stockholm'),
        },
        industry: ad.industry || 'Tech',
        stage: ad.stage || 'Seed',
        raised: businessInfo.raised || 0,
        seeking: ad.seekingUsd || 1000000,
        monthlyRevenue: businessInfo.monthlyRevenue || 0,
        teamSize: businessInfo.teamSize || 1,
        foundedYear: businessInfo.foundingYear || new Date().getFullYear(),
        readinessScore: analysis?.investmentReadiness || 50,
        overallScore: analysis?.overallScore || 50,
        oneLiner: ad.oneLiner || ad.title,
        metrics: {
          growth: getScore('Revenue Growth') || businessInfo.growthRate || 0,
          retention: getScore('Customer Retention') || 0,
          burnRate: businessInfo.burnRate || 0,
          unitEconomics: getScore('Unit Economics') || 0,
          marketSize: getScore('Market Size') || 0,
          productMarketFit: getScore('Product-Market Fit') || 0,
        },
        tags: extractTags(dimensions),
        lastActive: analysis?.completedAt || ad.publishedAt,
        website: ad.website || businessInfo.website,
        linkedIn: businessInfo.linkedinProfiles?.[0],
        pitchDeck: ad.pitchDeck || businessInfo.pitcDeck,
        traction: businessInfo.traction,
        insights: analysis?.insights || [],
      };
    });

    return NextResponse.json({ startups });
  } catch (error) {
    console.error('Error fetching startups:', error);
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 });
  }
}

function getCoordinates(city: string): [number, number] {
  // Simple coordinate mapping for major cities
  const cityCoords: Record<string, [number, number]> = {
    Stockholm: [59.3293, 18.0686],
    Berlin: [52.52, 13.405],
    London: [51.5074, -0.1278],
    Paris: [48.8566, 2.3522],
    Amsterdam: [52.3676, 4.9041],
    Copenhagen: [55.6761, 12.5683],
    Oslo: [59.9139, 10.7522],
    Helsinki: [60.1699, 24.9384],
    Madrid: [40.4168, -3.7038],
    Barcelona: [41.3851, 2.1734],
  };

  return cityCoords[city] || [59.3293, 18.0686]; // Default to Stockholm
}

function extractTags(dimensions: any[]): string[] {
  const tags = new Set<string>();

  dimensions.forEach((dim) => {
    if (dim.score >= 80) {
      if (dim.category.includes('Tech')) tags.add('Strong Tech');
      if (dim.category.includes('Market')) tags.add('Large Market');
      if (dim.category.includes('Team')) tags.add('Experienced Team');
      if (dim.category.includes('Traction')) tags.add('Good Traction');
    }
  });

  return Array.from(tags).slice(0, 3);
}
