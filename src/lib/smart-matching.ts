import prisma from './prisma';

/**
 * SMART MATCHING ALGORITHM
 * Learns from VC swipe behavior to improve match scores over time
 */

interface VCPreferences {
  vcEmail: string;
  preferredStages: Record<string, number>; // { 'seed': 0.8, 'series_a': 0.2 }
  preferredIndustries: Record<string, number>;
  avgCheckSize: number;
  likeThreshold: number; // Min score they typically like
  patterns: {
    likesHighGrowth: boolean;
    likesLargeTeams: boolean;
    likesEstablishedMarkets: boolean;
  };
}

/**
 * Learn VC preferences from their swipe history
 */
export async function learnVCPreferences(vcEmail: string): Promise<VCPreferences> {
  // Get all swipes for this VC
  const swipes = await prisma.vCSwipe.findMany({
    where: { vcEmail },
    orderBy: { createdAt: 'desc' },
    take: 100, // Last 100 swipes
  });

  if (swipes.length < 5) {
    // Not enough data, return defaults
    return getDefaultPreferences(vcEmail);
  }

  const likes = swipes.filter((s) => s.action === 'like' || s.action === 'super_like');
  const passes = swipes.filter((s) => s.action === 'pass');

  // Analyze liked profiles
  const preferredStages: Record<string, number> = {};
  const preferredIndustries: Record<string, number> = {};
  let totalCheckSize = 0;
  let checkSizeCount = 0;

  likes.forEach((swipe) => {
    const data = swipe.anonymousData as any;

    // Count stages
    if (data.stage) {
      preferredStages[data.stage] = (preferredStages[data.stage] || 0) + 1;
    }

    // Count industries
    if (data.industry) {
      preferredIndustries[data.industry] = (preferredIndustries[data.industry] || 0) + 1;
    }

    // Avg check size
    if (data.askAmount) {
      totalCheckSize += data.askAmount;
      checkSizeCount++;
    }
  });

  // Normalize to percentages
  const totalLikes = likes.length;
  Object.keys(preferredStages).forEach((stage) => {
    preferredStages[stage] = preferredStages[stage] / totalLikes;
  });
  Object.keys(preferredIndustries).forEach((industry) => {
    preferredIndustries[industry] = preferredIndustries[industry] / totalLikes;
  });

  // Calculate average match score of liked profiles
  const likedScores = likes.map((s) => s.matchScore || 0).filter((s) => s > 0);
  const likeThreshold =
    likedScores.length > 0
      ? Math.min(...likedScores) - 5 // Slightly below their lowest like
      : 70;

  // Detect patterns
  const likedData = likes.map((s) => s.anonymousData as any);
  const likesHighGrowth =
    likedData.filter((d) => d.traction?.growth && parseInt(d.traction.growth) > 20).length >
    likes.length * 0.6;

  const likesLargeTeams =
    likedData.filter((d) => d.traction?.teamSize && d.traction.teamSize > 5).length >
    likes.length * 0.5;

  return {
    vcEmail,
    preferredStages,
    preferredIndustries,
    avgCheckSize: checkSizeCount > 0 ? totalCheckSize / checkSizeCount : 2000000,
    likeThreshold,
    patterns: {
      likesHighGrowth,
      likesLargeTeams,
      likesEstablishedMarkets: false, // TODO: implement
    },
  };
}

/**
 * Calculate enhanced match score using learned preferences
 */
export async function calculateSmartMatchScore(
  vcEmail: string,
  founderProfile: any,
): Promise<{ score: number; reasoning: string }> {
  // Get learned preferences
  const prefs = await learnVCPreferences(vcEmail);

  let score = 70; // Base score
  const reasons: string[] = [];

  // Stage preference
  if (prefs.preferredStages[founderProfile.stage]) {
    const stageBonus = prefs.preferredStages[founderProfile.stage] * 15;
    score += stageBonus;
    reasons.push(`Strong stage fit (${founderProfile.stage})`);
  }

  // Industry preference
  if (prefs.preferredIndustries[founderProfile.industry]) {
    const industryBonus = prefs.preferredIndustries[founderProfile.industry] * 15;
    score += industryBonus;
    reasons.push(`Industry match (${founderProfile.industry})`);
  }

  // Check size preference
  if (founderProfile.askAmount) {
    const checkDiff = Math.abs(founderProfile.askAmount - prefs.avgCheckSize);
    const checkSimilarity = 1 - checkDiff / prefs.avgCheckSize;
    if (checkSimilarity > 0.5) {
      score += checkSimilarity * 10;
      reasons.push('Check size aligned with your typical investments');
    }
  }

  // Pattern matching
  if (prefs.patterns.likesHighGrowth && founderProfile.traction?.growth) {
    const growth = parseInt(founderProfile.traction.growth);
    if (growth > 20) {
      score += 5;
      reasons.push(`High growth (${growth}% MoM)`);
    }
  }

  if (prefs.patterns.likesLargeTeams && founderProfile.traction?.teamSize > 5) {
    score += 3;
    reasons.push('Established team');
  }

  // Cap at 100
  score = Math.min(100, Math.round(score));

  const reasoning =
    reasons.length > 0 ? reasons.join('. ') + '.' : 'Matches your general investment criteria.';

  return { score, reasoning };
}

function getDefaultPreferences(vcEmail: string): VCPreferences {
  return {
    vcEmail,
    preferredStages: { seed: 0.6, series_a: 0.4 },
    preferredIndustries: { saas: 0.5, fintech: 0.3, marketplace: 0.2 },
    avgCheckSize: 2000000,
    likeThreshold: 70,
    patterns: {
      likesHighGrowth: true,
      likesLargeTeams: false,
      likesEstablishedMarkets: false,
    },
  };
}

/**
 * Get personalized founder recommendations for a VC
 */
export async function getPersonalizedRecommendations(
  vcEmail: string,
  limit: number = 10,
): Promise<any[]> {
  // Get VC preferences
  const prefs = await learnVCPreferences(vcEmail);

  // Get public founder profiles that VC hasn't swiped yet
  const swipedSessionIds = await prisma.vCSwipe.findMany({
    where: { vcEmail },
    select: { sessionId: true },
  });

  const swipedIds = new Set(swipedSessionIds.map((s) => s.sessionId));

  const publicSessions = await prisma.session.findMany({
    where: {
      user: {
        isProfilePublic: true,
      },
    },
    include: { user: true },
    take: 100,
  });

  // Score each profile
  const scored = await Promise.all(
    publicSessions
      .filter((s) => !swipedIds.has(s.id))
      .map(async (session) => {
        const businessInfo = session.businessInfo as any;
        const user = session.user;

        const profileData = {
          stage: businessInfo?.stage || user?.stage,
          industry: businessInfo?.industry || user?.industry,
          askAmount: user?.askAmount,
          traction: user?.traction || businessInfo?.traction,
        };

        const { score, reasoning } = await calculateSmartMatchScore(vcEmail, profileData);

        return {
          sessionId: session.id,
          score,
          reasoning,
          profile: {
            ...profileData,
            oneLiner: user?.oneLiner,
            readinessScore: businessInfo?.readinessScore,
          },
        };
      }),
  );

  // Sort by score and return top N
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
