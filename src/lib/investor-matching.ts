import prisma from './prisma';
import { getOpenAIClient, getChatModel } from './ai-client';
import { normalizeKpis, estimateReadiness, blendMatchScore } from './matching-utils';

interface BusinessProfile {
  name: string;
  industry: string;
  stage: string;
  targetMarket: string;
  businessModel: string;
  fundingGoal?: number;
}

interface InvestorMatch {
  investor: any;
  matchScore: number;
  reasoning: string;
  stageMatch: number;
  industryMatch: number;
  geoMatch: number;
  checkSizeMatch: number;
}

/**
 * Calculate match score between a business and an investor
 */
function calculateMatchScore(
  business: BusinessProfile,
  investor: any
): { score: number; breakdown: any } {
  let stageMatch = 0;
  let industryMatch = 0;
  let geoMatch = 0;
  let checkSizeMatch = 0;

  // Stage matching
  const businessStage = normalizeStage(business.stage);
  if (investor.stage.includes(businessStage)) {
    stageMatch = 100;
  } else if (
    (businessStage === 'pre_seed' && investor.stage.includes('seed')) ||
    (businessStage === 'seed' && investor.stage.includes('series_a'))
  ) {
    stageMatch = 60; // Adjacent stage
  }

  // Industry matching
  const businessIndustry = normalizeIndustry(business.industry);
  if (investor.industries.includes(businessIndustry)) {
    industryMatch = 100;
  } else if (hasRelatedIndustry(businessIndustry, investor.industries)) {
    industryMatch = 70;
  } else if (investor.industries.includes('generalist')) {
    industryMatch = 50;
  }

  // Geography matching
  const businessGeo = normalizeGeography(business.targetMarket);
  if (investor.geographies.includes(businessGeo)) {
    geoMatch = 100;
  } else if (investor.geographies.includes('global')) {
    geoMatch = 80;
  } else if (hasRelatedGeo(businessGeo, investor.geographies)) {
    geoMatch = 60;
  }

  // Check size matching
  if (business.fundingGoal && investor.checkSizeMin && investor.checkSizeMax) {
    const goal = business.fundingGoal;
    if (goal >= investor.checkSizeMin && goal <= investor.checkSizeMax) {
      checkSizeMatch = 100;
    } else if (goal >= investor.checkSizeMin * 0.5 && goal <= investor.checkSizeMax * 1.5) {
      checkSizeMatch = 70;
    } else {
      checkSizeMatch = 30;
    }
  } else {
    checkSizeMatch = 50; // Neutral if no data
  }

  // Weighted average
  const score = Math.round(
    stageMatch * 0.35 +
    industryMatch * 0.35 +
    geoMatch * 0.15 +
    checkSizeMatch * 0.15
  );

  return {
    score,
    breakdown: {
      stageMatch,
      industryMatch,
      geoMatch,
      checkSizeMatch
    }
  };
}

/**
 * Generate AI reasoning for why this investor is a good match
 */
async function generateReasoning(
  business: BusinessProfile,
  investor: any,
  breakdown: any
): Promise<string> {
  const prompt = `You are a fundraising advisor. Explain in 2-3 sentences why ${investor.firmName || investor.name} is a good match for ${business.name}.

Business:
- Industry: ${business.industry}
- Stage: ${business.stage}
- Market: ${business.targetMarket}
- Model: ${business.businessModel}

Investor:
- Focus: ${investor.industries.join(', ')}
- Stage: ${investor.stage.join(', ')}
- Notable investments: ${investor.notableInvestments.slice(0, 3).join(', ')}
- Thesis: ${investor.thesis || 'N/A'}

Match scores:
- Stage: ${breakdown.stageMatch}/100
- Industry: ${breakdown.industryMatch}/100
- Geography: ${breakdown.geoMatch}/100

Be specific and actionable. Mention their portfolio companies if relevant.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: getChatModel('simple'),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    });

    return response.choices[0].message.content?.trim() || 'Good match based on investment criteria';
  } catch (error) {
    console.error('Error generating reasoning:', error);
    return `Strong match: ${breakdown.stageMatch}% stage fit, ${breakdown.industryMatch}% industry alignment`;
  }
}

/**
 * Find best investor matches for a business
 */
export async function findInvestorMatches(
  business: BusinessProfile,
  sessionId: string,
  limit: number = 10
): Promise<InvestorMatch[]> {
  // Fetch all investors from database
  const investors = await prisma.investor.findMany({
    orderBy: { ranking: 'desc' }
  });

  // Calculate match scores for all investors
  const matches: InvestorMatch[] = [];

  for (const investor of investors) {
  const { score, breakdown } = calculateMatchScore(business, investor);
  const kpis = normalizeKpis((investor as any)?.traction || {});
  const readiness = estimateReadiness(business as any, kpis);
  const finalScore = blendMatchScore({ baseScore: score, kpiScore: kpis.composite, readinessScore: readiness, affinity: {} });

    // Only include matches above 50%
    if (finalScore >= 50) {
      const reasoning = await generateReasoning(business, investor, breakdown);

      matches.push({
        investor,
        matchScore: finalScore,
        reasoning,
        stageMatch: breakdown.stageMatch,
        industryMatch: breakdown.industryMatch,
        geoMatch: breakdown.geoMatch,
        checkSizeMatch: breakdown.checkSizeMatch
      });
    }
  }

  // Sort by match score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // Save top matches to database
  const topMatches = matches.slice(0, limit);
  
  for (const match of topMatches) {
    await prisma.investorMatch.upsert({
      where: {
        sessionId_investorId: {
          sessionId,
          investorId: match.investor.id
        }
      },
      create: {
        sessionId,
        investorId: match.investor.id,
        matchScore: match.matchScore,
        reasoning: match.reasoning,
        stageMatch: match.stageMatch,
        industryMatch: match.industryMatch,
        geoMatch: match.geoMatch,
        checkSizeMatch: match.checkSizeMatch
      },
      update: {
        matchScore: match.matchScore,
        reasoning: match.reasoning,
        stageMatch: match.stageMatch,
        industryMatch: match.industryMatch,
        geoMatch: match.geoMatch,
        checkSizeMatch: match.checkSizeMatch,
        updatedAt: new Date()
      }
    });
  }

  return topMatches;
}

/**
 * Get saved investor matches for a session
 */
export async function getSavedMatches(sessionId: string) {
  const matches = await prisma.investorMatch.findMany({
    where: { sessionId },
    include: { investor: true },
    orderBy: { matchScore: 'desc' }
  });

  return matches;
}

/**
 * Update match status (contacted, meeting_scheduled, etc.)
 */
export async function updateMatchStatus(
  matchId: string,
  status: string,
  notes?: string
) {
  return await prisma.investorMatch.update({
    where: { id: matchId },
    data: {
      status,
      notes,
      contactedAt: status === 'contacted' ? new Date() : undefined,
      updatedAt: new Date()
    }
  });
}

// Helper functions
function normalizeStage(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes('pre') || s.includes('idea')) return 'pre_seed';
  if (s.includes('seed')) return 'seed';
  if (s.includes('series a') || s.includes('a-round')) return 'series_a';
  if (s.includes('series b')) return 'series_b';
  if (s.includes('series c')) return 'series_c';
  if (s.includes('growth')) return 'growth';
  return 'seed'; // default
}

function normalizeIndustry(industry: string): string {
  const i = industry.toLowerCase();
  if (i.includes('saas') || i.includes('software')) return 'saas';
  if (i.includes('fintech') || i.includes('finance')) return 'fintech';
  if (i.includes('health') || i.includes('medical')) return 'health tech';
  if (i.includes('market')) return 'marketplace';
  if (i.includes('consumer')) return 'consumer';
  if (i.includes('b2b')) return 'saas';
  if (i.includes('ai') || i.includes('ml')) return 'deep_tech';
  if (i.includes('climate') || i.includes('sustainability')) return 'sustainability';
  return 'saas'; // default to SaaS as most common
}

function normalizeGeography(market: string): string {
  const m = market.toLowerCase();
  if (m.includes('sweden') || m.includes('norway') || m.includes('denmark') || 
      m.includes('finland') || m.includes('nordic')) return 'nordics';
  if (m.includes('europe') || m.includes('eu')) return 'europe';
  if (m.includes('us') || m.includes('usa') || m.includes('america')) return 'us';
  if (m.includes('global') || m.includes('world')) return 'global';
  return 'europe'; // default
}

function hasRelatedIndustry(industry: string, investorIndustries: string[]): boolean {
  const related: Record<string, string[]> = {
    'saas': ['fintech', 'health tech', 'marketplace'],
    'fintech': ['saas', 'marketplace'],
    'health tech': ['saas', 'deep_tech'],
    'marketplace': ['saas', 'consumer'],
    'deep_tech': ['saas', 'health tech']
  };
  
  return investorIndustries.some(inv => related[industry]?.includes(inv));
}

function hasRelatedGeo(geo: string, investorGeos: string[]): boolean {
  const related: Record<string, string[]> = {
    'nordics': ['europe', 'global'],
    'europe': ['global', 'us'],
    'us': ['global']
  };
  
  return investorGeos.some(inv => related[geo]?.includes(inv));
}
