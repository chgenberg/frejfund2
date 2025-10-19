/**
 * Automatic matching when startup completes analysis
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { notifyVCsOfNewStartup } from '@/lib/notification-service';

interface StartupProfile {
  userId: string;
  name: string;
  email: string;
  stage: string;
  industry: string;
  seeking: number;
  location?: string;
  overallScore: number;
}

/**
 * Calculate match score between startup and VC preferences
 */
function calculateMatchScore(
  startup: StartupProfile,
  vcPrefs: {
    stages: string[];
    industries: string[];
    geographies: string[];
    minCheckSize?: number;
    maxCheckSize?: number;
  },
): { score: number; breakdown: any } {
  let stageMatch = 0;
  let industryMatch = 0;
  let geoMatch = 0;
  let checkSizeMatch = 0;

  // Stage match
  const normalizedStage = normalizeStage(startup.stage);
  if (vcPrefs.stages.some((s) => normalizeStage(s) === normalizedStage)) {
    stageMatch = 100;
  } else if (isAdjacentStage(normalizedStage, vcPrefs.stages)) {
    stageMatch = 60;
  }

  // Industry match
  const normalizedIndustry = normalizeIndustry(startup.industry);
  if (vcPrefs.industries.some((i) => normalizeIndustry(i) === normalizedIndustry)) {
    industryMatch = 100;
  } else if (vcPrefs.industries.includes('Generalist')) {
    industryMatch = 50;
  }

  // Geography match
  const startupGeo = normalizeGeography(startup.location || '');
  if (vcPrefs.geographies.some((g) => normalizeGeography(g) === startupGeo)) {
    geoMatch = 100;
  } else if (vcPrefs.geographies.includes('Global')) {
    geoMatch = 80;
  } else if (vcPrefs.geographies.includes('Europe') && startupGeo.includes('europe')) {
    geoMatch = 70;
  }

  // Check size match
  if (vcPrefs.minCheckSize && vcPrefs.maxCheckSize && startup.seeking) {
    const min = Number(vcPrefs.minCheckSize);
    const max = Number(vcPrefs.maxCheckSize);
    if (startup.seeking >= min && startup.seeking <= max) {
      checkSizeMatch = 100;
    } else if (startup.seeking >= min * 0.5 && startup.seeking <= max * 1.5) {
      checkSizeMatch = 70;
    } else {
      checkSizeMatch = 30;
    }
  } else {
    checkSizeMatch = 50;
  }

  // Weighted score: stage 35%, industry 35%, geo 15%, check 15%
  const score = Math.round(
    stageMatch * 0.35 + industryMatch * 0.35 + geoMatch * 0.15 + checkSizeMatch * 0.15,
  );

  return {
    score,
    breakdown: { stageMatch, industryMatch, geoMatch, checkSizeMatch },
  };
}

/**
 * Run automatic matching when startup completes analysis
 */
export async function autoMatchStartupWithVCs(sessionId: string) {
  try {
    logger.info('auto_matching_started', { sessionId });

    // Get completed analysis
    const analysis = await prisma.deepAnalysis.findUnique({
      where: { sessionId },
      select: {
        userId: true,
        overallScore: true,
        businessInfo: true,
      },
    });

    if (!analysis || !analysis.userId) {
      logger.warn('auto_matching_skipped_no_user', { sessionId });
      return;
    }

    const businessInfo = (analysis.businessInfo as any) || {};
    const startup: StartupProfile = {
      userId: analysis.userId,
      name: businessInfo.name || 'Unknown',
      email: businessInfo.email || '',
      stage: businessInfo.stage || 'seed',
      industry: businessInfo.industry || 'tech',
      seeking: businessInfo.seeking || 1000000,
      location: `${businessInfo.city || ''}, ${businessInfo.country || ''}`.trim(),
      overallScore: analysis.overallScore || 50,
    };

    // Fetch all VCs with preferences
    const vcs = await prisma.vCUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firm: true,
        stages: true,
        industries: true,
        geographies: true,
        minCheckSize: true,
        maxCheckSize: true,
      },
    });

    let matchCount = 0;
    const MATCH_THRESHOLD = 65; // Only notify for strong matches

    for (const vc of vcs) {
      const { score, breakdown } = calculateMatchScore(startup, {
        stages: vc.stages || [],
        industries: vc.industries || [],
        geographies: vc.geographies || [],
        minCheckSize: vc.minCheckSize ? Number(vc.minCheckSize) : undefined,
        maxCheckSize: vc.maxCheckSize ? Number(vc.maxCheckSize) : undefined,
      });

      if (score >= MATCH_THRESHOLD) {
        matchCount++;

        // Notify VC of new match
        await notifyVCsOfNewStartup(
          startup.userId,
          startup.name,
          score,
          vc.email,
          undefined, // VCUser doesn't have userId yet; can add later
        );

        logger.info('vc_notified_of_match', {
          vcEmail: vc.email,
          startupUserId: startup.userId,
          matchScore: score,
        });
      }
    }

    logger.info('auto_matching_completed', { sessionId, matchCount });
  } catch (error) {
    logger.error('auto_matching_failed', { sessionId, error: String(error) });
  }
}

// Helper functions
function normalizeStage(stage: string): string {
  const s = stage.toLowerCase().replace(/[^a-z]/g, '');
  if (s.includes('idea') || s.includes('preseed')) return 'pre_seed';
  if (s.includes('seed')) return 'seed';
  if (s.includes('seriesa') || s.includes('a')) return 'series_a';
  if (s.includes('seriesb') || s.includes('b')) return 'series_b';
  if (s.includes('growth')) return 'growth';
  return 'seed';
}

function normalizeIndustry(industry: string): string {
  const i = industry.toLowerCase();
  if (i.includes('saas') || i.includes('software') || i.includes('b2b')) return 'saas';
  if (i.includes('fintech') || i.includes('finance')) return 'fintech';
  if (i.includes('health') || i.includes('medtech')) return 'healthtech';
  if (i.includes('climate') || i.includes('clean')) return 'climate';
  if (i.includes('ai') || i.includes('ml')) return 'ai';
  if (i.includes('ecommerce') || i.includes('retail')) return 'ecommerce';
  return i;
}

function normalizeGeography(geo: string): string {
  const g = geo.toLowerCase();
  if (g.includes('sweden') || g.includes('nordic') || g.includes('scandinav')) return 'nordics';
  if (g.includes('europe') || g.includes('eu') || g.includes('uk') || g.includes('germany'))
    return 'europe';
  if (g.includes('us') || g.includes('usa') || g.includes('america')) return 'us';
  if (g.includes('global') || g.includes('world')) return 'global';
  return 'europe';
}

function isAdjacentStage(stage: string, vcStages: string[]): boolean {
  const adjacency: Record<string, string[]> = {
    pre_seed: ['seed'],
    seed: ['pre_seed', 'series_a'],
    series_a: ['seed', 'series_b'],
    series_b: ['series_a', 'growth'],
  };
  return vcStages.some((vcStage) => adjacency[stage]?.includes(normalizeStage(vcStage)));
}
