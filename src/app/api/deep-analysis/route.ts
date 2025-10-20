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
        { status: 400 },
      );
    }

    // Single-run guard: Check if already running BEFORE starting
    const { prisma } = await import('@/lib/prisma');
    const existing = await prisma.deepAnalysis.findUnique({
      where: { sessionId },
      select: { status: true, progress: true, userId: true },
    });

    if (existing && existing.status === 'analyzing') {
      console.log(
        '⚠️ Analysis already running for session:',
        sessionId,
        `(${existing.progress}% complete)`,
      );
      return NextResponse.json({
        success: true,
        already_running: true,
        message: 'Analysis already in progress',
        progress: existing.progress,
        sessionId,
      });
    }

    console.log('🚀 Starting deep analysis for session:', sessionId);

    // Soft daily quota (disabled by default). Enable with SOFT_QUOTA_ENABLED=true and set ANALYSIS_DAILY_LIMIT.
    try {
      if (process.env.SOFT_QUOTA_ENABLED === 'true' && existing?.userId) {
        const limit = Number(process.env.ANALYSIS_DAILY_LIMIT || '5');
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const used = await prisma.deepAnalysis.count({
          where: { userId: existing.userId, startedAt: { gte: startOfDay } },
        });
        if (used >= limit) {
          return NextResponse.json(
            {
              error: 'Daily analysis limit reached',
              message: `You have reached your daily analysis limit (${limit}). Please try again tomorrow.`,
            },
            { status: 429 },
          );
        }
      }
    } catch (qErr) {
      console.warn('Quota check failed, proceeding:', qErr);
    }

    // Immediately reset status to analyzing so SSE won't emit 'complete' from a previous run
    try {
      await prisma.deepAnalysis.upsert({
        where: { sessionId },
        create: {
          sessionId,
          status: 'analyzing',
          progress: 0,
          startedAt: new Date(),
          userId: existing?.userId || null,
          businessInfo,
        },
        update: { status: 'analyzing', progress: 0, startedAt: new Date(), businessInfo },
      });
    } catch (e) {
      console.warn('Could not reset analysis row at start:', e);
    }

    // Orchestrate: harvest (mini) + scrape + docs before analysis
    (async () => {
      const { fetchGptKnowledgeForCompany } = await import('@/lib/gpt-knowledge');
      const { scrapeSiteShallow } = await import('@/lib/web-scraper');

      // Run harvest and shallow scrape in parallel with adaptive gating
      const abortController = new AbortController();
      const harvestPromise = fetchGptKnowledgeForCompany(businessInfo, abortController.signal);
      const scrapePromise = businessInfo.website
        ? scrapeSiteShallow(businessInfo.website, 6)
        : Promise.resolve({ combinedText: '', sources: [] });

      const baseGateMs = 120000; // 120s
      const extraSliceMs = 60000; // 60s slices
      const hardMaxMs = 240000; // 240s

      const waitWithTimeout = async <T>(p: Promise<T>, ms: number): Promise<T | null> => {
        return await Promise.race<T | null>([
          p as any,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
        ]);
      };

      let harvest = await waitWithTimeout(harvestPromise as any, baseGateMs);
      let websiteData = await waitWithTimeout(scrapePromise as any, baseGateMs);

      let waited = baseGateMs;
      const isHarvestWeak = () =>
        !harvest ||
        !(harvest as any).combinedText ||
        ((harvest as any).combinedText as string).length < 1200 ||
        (Array.isArray((harvest as any).chunks) && (harvest as any).chunks.length < 3);
      const isScrapeWeak = () =>
        !websiteData ||
        !(websiteData as any).combinedText ||
        ((websiteData as any).combinedText as string).length < 20000 ||
        (Array.isArray((websiteData as any).sources) && (websiteData as any).sources.length < 3);

      // Extend to 180s if harvest+scrape are weak
      if (isHarvestWeak() && isScrapeWeak() && waited < 180000) {
        const slice = await Promise.all([
          harvest ? Promise.resolve(harvest) : waitWithTimeout(harvestPromise as any, extraSliceMs),
          websiteData
            ? Promise.resolve(websiteData)
            : waitWithTimeout(scrapePromise as any, extraSliceMs),
        ]);
        harvest = slice[0] ?? harvest;
        websiteData = slice[1] ?? websiteData;
        waited += extraSliceMs;
      }

      // Final chance up to 240s hard max if båda fortfarande svaga
      if (isHarvestWeak() && isScrapeWeak() && waited < hardMaxMs) {
        const slice = await Promise.all([
          harvest ? Promise.resolve(harvest) : waitWithTimeout(harvestPromise as any, extraSliceMs),
          websiteData
            ? Promise.resolve(websiteData)
            : waitWithTimeout(scrapePromise as any, extraSliceMs),
        ]);
        harvest = slice[0] ?? harvest;
        websiteData = slice[1] ?? websiteData;
        waited += extraSliceMs;
      }

      try {
        abortController.abort();
      } catch {}

      const preHarvestText =
        harvest && (harvest as any).combinedText ? (harvest as any).combinedText : '';
      const mergedScraped =
        (scrapedContent || '') + '\n\n' + ((websiteData as any)?.combinedText || '');

      // Enqueue deep analysis with merged pre-context (phase 1) via BullMQ if enabled
      const useBull = process.env.USE_BULLMQ === 'true';
      try {
        if (useBull) {
          const { deepAnalysisQueue } = await import('@/lib/queues/deep-analysis');
          await deepAnalysisQueue.add(
            'run',
            {
              sessionId,
              businessInfo,
              scrapedContent: mergedScraped,
              uploadedDocuments: uploadedDocuments || [],
              mode: 'progressive',
              preHarvestText,
            },
            {
              jobId: `deep:${sessionId}:phase1`,
              removeOnComplete: { age: 3600, count: 1000 },
              removeOnFail: { age: 86400, count: 1000 },
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
            },
          );
        } else {
          throw new Error('BullMQ disabled');
        }
      } catch (e) {
        console.error('Failed to enqueue phase1 deep analysis, falling back to in-process:', e);
        // Fallback: run inline and publish progress via Redis so SSE updates live
        const { getPub, getProgressChannel } = await import('@/lib/redis');
        const pub = getPub();
        const channel = getProgressChannel(sessionId);
        // Emit immediate 0% so UI shows running state
        try {
          await pub.publish(channel, JSON.stringify({ type: 'progress', current: 0, total: 95 }));
        } catch {}
        runDeepAnalysis({
          sessionId,
          businessInfo,
          scrapedContent: mergedScraped,
          uploadedDocuments: uploadedDocuments || [],
          mode: 'progressive',
          preHarvestText,
          onProgress: async (current, total, completedCategories) => {
            try {
              await pub.publish(
                channel,
                JSON.stringify({ type: 'progress', current, total, completedCategories }),
              );
            } catch {}
          },
        });
      }

      // Kick off deep scrape in background while phase 1 runs
      const deepResultPromise = businessInfo.website
        ? (async () => {
            const { scrapeSiteDeep } = await import('@/lib/web-scraper');
            try {
              return await scrapeSiteDeep(businessInfo.website, 20, 2);
            } catch {
              return { combinedText: '', sources: [] };
            }
          })()
        : Promise.resolve({ combinedText: '', sources: [] });

      // After deep scrape, optionally enqueue a targeted re-run with deeper context
      const deepResult = await deepResultPromise;
      const hasDeeper = (deepResult?.combinedText || '').length > 0;
      if (hasDeeper) {
        try {
          const { deepAnalysisQueue } = await import('@/lib/queues/deep-analysis');
          await deepAnalysisQueue.add(
            'run',
            {
              sessionId,
              businessInfo,
              scrapedContent: (mergedScraped + '\n\n' + (deepResult.combinedText || '')).slice(
                0,
                180000,
              ),
              uploadedDocuments: uploadedDocuments || [],
              mode: 'critical-only',
              specificDimensions: [] as any,
              preHarvestText,
            },
            {
              jobId: `deep:${sessionId}:phase2`,
              removeOnComplete: { age: 3600, count: 1000 },
              removeOnFail: { age: 86400, count: 1000 },
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
            },
          );
        } catch (err) {
          console.error('Targeted re-run enqueue failed:', err);
        }
      }
    })()
      .then(() => {
        console.log('✅ Deep analysis completed for session:', sessionId);
      })
      .catch((error) => {
        console.error('❌ Background deep analysis failed:', error);
      });

    return NextResponse.json({
      success: true,
      message: 'Deep analysis orchestration started',
      sessionId,
    });
  } catch (error) {
    console.error('Deep analysis API error:', error);
    return NextResponse.json({ error: 'Failed to start deep analysis' }, { status: 500 });
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
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const analysis = await getDeepAnalysis(sessionId);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
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
    const transformedDimensions = analysis.dimensions.map((dim) => {
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
        evidence: parseJsonField(dim.evidence),
        confidence: dim.confidence || 'low',
      };
    });

    return NextResponse.json({
      status: analysis.status,
      progress: analysis.progress,
      overallScore: analysis.overallScore,
      confidenceWeightedScore: (analysis as any).confidenceWeightedScore,
      dataCompleteness: (analysis as any).dataCompleteness,
      companyStage: (analysis as any).companyStage,
      investmentReadiness: analysis.investmentReadiness,
      categoryScores,
      insights: analysis.insights,
      completedAt: analysis.completedAt,
      totalDimensions: analysis.dimensions.length,
      analyzedDimensions: analysis.dimensions.filter((d) => d.analyzed).length,
      dimensions: transformedDimensions,
    });
  } catch (error) {
    console.error('Get deep analysis error:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}
