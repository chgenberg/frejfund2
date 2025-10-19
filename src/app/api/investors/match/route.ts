import { NextRequest, NextResponse } from 'next/server';
import { findInvestorMatches, getSavedMatches } from '@/lib/investor-matching';

export const dynamic = 'force-dynamic';

// POST /api/investors/match - Find investor matches for a business
export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { businessInfo, limit = 10 } = body;

    if (!businessInfo) {
      return NextResponse.json({ error: 'Business info required' }, { status: 400 });
    }

    // Find matches
    const matches = await findInvestorMatches(businessInfo, sessionId, limit);

    return NextResponse.json({
      matches: matches.map((m) => ({
        investor: {
          id: m.investor.id,
          name: m.investor.name,
          firmName: m.investor.firmName,
          type: m.investor.type,
          website: m.investor.website,
          linkedIn: m.investor.linkedIn,
          stage: m.investor.stage,
          industries: m.investor.industries,
          geographies: m.investor.geographies,
          checkSizeMin: m.investor.checkSizeMin,
          checkSizeMax: m.investor.checkSizeMax,
          thesis: m.investor.thesis,
          notableInvestments: m.investor.notableInvestments,
          portfolioCount: m.investor.portfolioCount,
        },
        matchScore: m.matchScore,
        reasoning: m.reasoning,
        breakdown: {
          stage: m.stageMatch,
          industry: m.industryMatch,
          geography: m.geoMatch,
          checkSize: m.checkSizeMatch,
        },
      })),
    });
  } catch (error) {
    console.error('Error finding investor matches:', error);
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
  }
}

// GET /api/investors/match - Get saved matches for a session
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const matches = await getSavedMatches(sessionId);

    return NextResponse.json({
      matches: matches.map((m) => ({
        id: m.id,
        investor: {
          id: m.investor.id,
          name: m.investor.name,
          firmName: m.investor.firmName,
          type: m.investor.type,
          website: m.investor.website,
          linkedIn: m.investor.linkedIn,
          stage: m.investor.stage,
          industries: m.investor.industries,
          geographies: m.investor.geographies,
          checkSizeMin: m.investor.checkSizeMin,
          checkSizeMax: m.investor.checkSizeMax,
          thesis: m.investor.thesis,
          notableInvestments: m.investor.notableInvestments,
        },
        matchScore: m.matchScore,
        reasoning: m.reasoning,
        status: m.status,
        contactedAt: m.contactedAt,
        breakdown: {
          stage: m.stageMatch,
          industry: m.industryMatch,
          geography: m.geoMatch,
          checkSize: m.checkSizeMatch,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching saved matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
