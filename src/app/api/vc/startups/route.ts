import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get all users with completed deep analysis
    const startups = await prisma.user.findMany({
      where: {
        isProfilePublic: true,
        deepAnalyses: {
          some: {
            status: 'completed'
          }
        }
      },
      include: {
        deepAnalyses: {
          where: {
            status: 'completed'
          },
          orderBy: {
            completedAt: 'desc'
          },
          take: 1,
          include: {
            dimensions: true,
            insights: true
          }
        },
        sessions: {
          select: {
            businessInfo: true
          },
          take: 1
        }
      }
    });

    // Transform to startup format for VC dashboard
    const transformedStartups = startups.map(user => {
      const analysis = user.deepAnalyses[0];
      const businessInfo = user.sessions[0]?.businessInfo as any || {};
      
      // Extract key metrics from dimensions
      const dimensions = analysis?.dimensions || [];
      const getScore = (name: string) => {
        const dim = dimensions.find(d => d.name === name);
        return dim?.score || 0;
      };

      return {
        id: user.id,
        name: user.name || businessInfo.founderName || 'Unknown',
        companyName: user.company || businessInfo.name || 'Unknown Company',
        location: {
          city: businessInfo.city || 'Stockholm',
          country: businessInfo.country || 'Sweden',
          coordinates: getCoordinates(businessInfo.city || 'Stockholm')
        },
        industry: user.industry || businessInfo.industry || 'Tech',
        stage: user.stage || businessInfo.stage || 'Seed',
        raised: businessInfo.raised || 0,
        seeking: user.askAmount || businessInfo.seeking || 1000000,
        monthlyRevenue: businessInfo.monthlyRevenue || 0,
        teamSize: businessInfo.teamSize || 1,
        foundedYear: businessInfo.foundedYear || new Date().getFullYear(),
        readinessScore: analysis?.investmentReadiness || 50,
        overallScore: analysis?.overallScore || 50,
        oneLiner: user.oneLiner || businessInfo.description || 'Building the future',
        metrics: {
          growth: getScore('Revenue Growth') || businessInfo.growthRate || 0,
          retention: getScore('Customer Retention') || 0,
          burnRate: businessInfo.burnRate || 0,
          unitEconomics: getScore('Unit Economics') || 0,
          marketSize: getScore('Market Size') || 0,
          productMarketFit: getScore('Product-Market Fit') || 0
        },
        tags: extractTags(dimensions),
        lastActive: analysis?.completedAt || new Date(),
        website: user.website || businessInfo.website,
        linkedIn: businessInfo.linkedinProfiles?.[0],
        pitchDeck: user.pitchDeck,
        traction: user.traction || businessInfo.traction,
        insights: analysis?.insights || []
      };
    });

    return NextResponse.json({ startups: transformedStartups });

  } catch (error) {
    console.error('Error fetching startups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch startups' },
      { status: 500 }
    );
  }
}

function getCoordinates(city: string): [number, number] {
  // Simple coordinate mapping for major cities
  const cityCoords: Record<string, [number, number]> = {
    'Stockholm': [59.3293, 18.0686],
    'Berlin': [52.5200, 13.4050],
    'London': [51.5074, -0.1278],
    'Paris': [48.8566, 2.3522],
    'Amsterdam': [52.3676, 4.9041],
    'Copenhagen': [55.6761, 12.5683],
    'Oslo': [59.9139, 10.7522],
    'Helsinki': [60.1699, 24.9384],
    'Madrid': [40.4168, -3.7038],
    'Barcelona': [41.3851, 2.1734]
  };
  
  return cityCoords[city] || [59.3293, 18.0686]; // Default to Stockholm
}

function extractTags(dimensions: any[]): string[] {
  const tags = new Set<string>();
  
  dimensions.forEach(dim => {
    if (dim.score >= 80) {
      if (dim.category.includes('Tech')) tags.add('Strong Tech');
      if (dim.category.includes('Market')) tags.add('Large Market');
      if (dim.category.includes('Team')) tags.add('Experienced Team');
      if (dim.category.includes('Traction')) tags.add('Good Traction');
    }
  });
  
  return Array.from(tags).slice(0, 3);
}
