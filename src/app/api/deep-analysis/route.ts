import { NextRequest, NextResponse } from 'next/server';
import { runDeepAnalysis, getDeepAnalysis } from '@/lib/deep-analysis-runner';

/**
 * POST /api/deep-analysis
 * Trigger deep background analysis for a session
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logPrefix = `[DEEP-ANALYSIS-API] [${new Date().toISOString()}]`;
  
  try {
    console.log(`${logPrefix} 🚀 REQUEST RECEIVED`);
    const { sessionId, businessInfo, scrapedContent, uploadedDocuments } = await request.json();
    console.log(`${logPrefix} 📝 Payload - SessionID: ${sessionId}, Business: ${businessInfo?.name}, Content: ${scrapedContent?.length || 0}b, Docs: ${uploadedDocuments?.length || 0}`);

    if (!sessionId || !businessInfo) {
      console.warn(`${logPrefix} ❌ CHECKPOINT 1 FAILED - Missing required fields`);
      return NextResponse.json(
        { error: 'sessionId and businessInfo are required' },
        { status: 400 },
      );
    }
    console.log(`${logPrefix} ✅ CHECKPOINT 1 - Validation passed`);

    // Single-run guard: Check if already running BEFORE starting
    const { prisma } = await import('@/lib/prisma');
    console.log(`${logPrefix} 🔍 CHECKPOINT 2 - Checking if analysis already running...`);
    const existing = await prisma.deepAnalysis.findUnique({
      where: { sessionId },
      select: { status: true, progress: true, userId: true },
    });

    if (existing && existing.status === 'analyzing') {
      console.log(
        `${logPrefix} ⚠️ CHECKPOINT 2 GUARD - Analysis already running for session: ${sessionId} (${existing.progress}% complete)`,
      );
      return NextResponse.json({
        success: true,
        already_running: true,
        message: 'Analysis already in progress',
        progress: existing.progress,
        sessionId,
      });
    }
    console.log(`${logPrefix} ✅ CHECKPOINT 2 - No existing analysis running`);

    console.log(`${logPrefix} 🚀 Starting deep analysis for session: ${sessionId}`);

    // Soft daily quota (disabled by default). Enable with SOFT_QUOTA_ENABLED=true and set ANALYSIS_DAILY_LIMIT.
    console.log(`${logPrefix} 🔍 CHECKPOINT 3 - Checking daily quota...`);
    try {
      if (process.env.SOFT_QUOTA_ENABLED === 'true' && existing?.userId) {
        const limit = Number(process.env.ANALYSIS_DAILY_LIMIT || '5');
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const used = await prisma.deepAnalysis.count({
          where: { userId: existing.userId, startedAt: { gte: startOfDay } },
        });
        console.log(`${logPrefix} 📊 Quota check - Used: ${used}/${limit} today`);
        if (used >= limit) {
          console.warn(`${logPrefix} ❌ CHECKPOINT 3 FAILED - Daily limit exceeded (${used}/${limit})`);
          return NextResponse.json(
            {
              error: 'Daily analysis limit reached',
              message: `You have reached your daily analysis limit (${limit}). Please try again tomorrow.`,
            },
            { status: 429 },
          );
        }
        console.log(`${logPrefix} ✅ CHECKPOINT 3 - Quota OK`);
      } else {
        console.log(`${logPrefix} ℹ️ CHECKPOINT 3 - Quota check skipped (SOFT_QUOTA_ENABLED=${process.env.SOFT_QUOTA_ENABLED})`);
      }
    } catch (qErr) {
      console.warn(`${logPrefix} ⚠️ Quota check failed, proceeding:`, qErr);
    }

    // Immediately reset status to analyzing so SSE won't emit 'complete' from a previous run
    console.log(`${logPrefix} 💾 CHECKPOINT 4 - Upserting analysis record...`);
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
      console.log(`${logPrefix} ✅ CHECKPOINT 4 - Analysis record created/updated`);
    } catch (e) {
      console.warn(`${logPrefix} ⚠️ Could not reset analysis row at start:`, e);
    }

    // Auto-publish founder profile by default (opt-out later in dashboard)
    console.log(`${logPrefix} 👤 CHECKPOINT 5 - Auto-publishing founder profile...`);
    try {
      const sessionRow = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { userId: true, businessInfo: true },
      });
      const bi: any = (sessionRow?.businessInfo as any) || (businessInfo as any) || {};

      if (sessionRow?.userId) {
        console.log(`${logPrefix} 👤 Updating existing user: ${sessionRow.userId}`);
        await prisma.user.update({
          where: { id: sessionRow.userId },
          data: {
            isProfilePublic: true,
            name: bi.founderName || undefined,
            company: bi.name || undefined,
            industry: bi.industry || undefined,
            stage: bi.stage || undefined,
            website: bi.website || undefined,
            oneLiner: bi.description || undefined,
            askAmount: bi.seeking || undefined,
          },
        });
      } else {
        console.log(`${logPrefix} 👤 Creating new user with email: ${bi.email}`);
        const user = await prisma.user.create({
          data: {
            email: bi.email || `${sessionId}@frejfund.com`,
            name: bi.founderName || null,
            company: bi.name || null,
            industry: bi.industry || null,
            stage: bi.stage || null,
            website: bi.website || null,
            oneLiner: bi.description || null,
            askAmount: bi.seeking || null,
            isProfilePublic: true,
          },
        });
        console.log(`${logPrefix} 👤 New user created: ${user.id}`);
        await prisma.session.update({ where: { id: sessionId }, data: { userId: user.id } });
      }
      console.log(`${logPrefix} ✅ CHECKPOINT 5 - Profile published`);
    } catch (pubErr) {
      console.warn(`${logPrefix} ⚠️ Auto-publish profile failed (non-fatal):`, pubErr);
    }

    // Unified progress: 0-100% including scraping (0-3%) + analysis (3-100%)
    const { getPub, getProgressChannel } = await import('@/lib/redis');
    const pub = getPub();
    const channel = getProgressChannel(sessionId);
    
    console.log(`${logPrefix} 📡 CHECKPOINT 6 - Setting up Redis SSE channel: ${channel}`);
    // Immediate 1% so user sees it start
    await pub.publish(channel, JSON.stringify({ type: 'progress', current: 1, total: 100 })).catch(() => {
      console.warn(`${logPrefix} ⚠️ Failed to publish 1% progress`);
    });
    try {
      await prisma.deepAnalysis.update({ where: { sessionId }, data: { progress: 1 } });
    } catch {}
    console.log(`${logPrefix} ✅ CHECKPOINT 6 - Redis SSE channel ready`);
    
    // Scraping phase (0-3%)
    console.log(`${logPrefix} 🌐 CHECKPOINT 7 - Scraping phase starting...`);
    const preHarvestText = '';  // Skip GPT harvest
    let mergedScraped = scrapedContent || '';
    
    if (businessInfo.website) {
      try {
        console.log(`${logPrefix} 🌐 Scraping website: ${businessInfo.website}`);
        await pub.publish(channel, JSON.stringify({ type: 'progress', current: 2, total: 100 })).catch(() => {});
        try {
          await prisma.deepAnalysis.update({ where: { sessionId }, data: { progress: 2 } });
        } catch {}
        
        const { scrapeSiteShallow } = await import('@/lib/web-scraper');
        const websiteData = await Promise.race([
          scrapeSiteShallow(businessInfo.website, 6),  // Get decent content (6 pages)
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 240000))  // 4 min max (extra safe for demo)
        ]).catch((err) => {
          console.warn(`${logPrefix} ⚠️ Website scraping failed:`, err.message);
          return null;
        });
        
        if (websiteData && (websiteData as any).combinedText) {
          const scrapedLength = ((websiteData as any).combinedText || '').length;
          console.log(`${logPrefix} ✅ Website scraped successfully - ${scrapedLength}b of content`);
          mergedScraped = (scrapedContent || '') + '\n\n' + ((websiteData as any).combinedText || '');
          
          // Store for future re-runs
          await prisma.deepAnalysis.update({
            where: { sessionId },
            data: {
              publicKnowledge: {
                scrapedContent: mergedScraped,
                sources: (websiteData as any).sources || []
              }
            }
          }).catch(console.warn);
        } else {
          console.log(`${logPrefix} ℹ️ No website data scraped`);
        }
        
        await pub.publish(channel, JSON.stringify({ type: 'progress', current: 3, total: 100 })).catch(() => {});
        try {
          await prisma.deepAnalysis.update({ where: { sessionId }, data: { progress: 3 } });
        } catch {}
        console.log(`${logPrefix} ✅ CHECKPOINT 7 - Scraping phase complete`);
      } catch (err) {
        console.warn(`${logPrefix} ⚠️ Scraping failed (continuing with minimal data):`, err);
      }
    } else {
      console.log(`${logPrefix} ℹ️ No website provided, skipping scraping`);
    }
    
    // Analysis phase starts at 3%, ends at 100%
    console.log(`${logPrefix} 🔍 CHECKPOINT 8 - Starting background analysis phase...`);
    Promise.resolve().then(async () => {
      console.log(`${logPrefix} 📋 Analysis phase initializing...`);
      // Enqueue deep analysis with merged pre-context (phase 1)
      // Only use Bull on dedicated worker (WORKER=1). Web should run inline.
      const useBull = process.env.USE_BULLMQ === 'true' && process.env.WORKER === '1';
      console.log(`${logPrefix} 🔧 Configuration - USE_BULLMQ: ${useBull}, WORKER: ${process.env.WORKER}`);
      
      try {
        if (useBull) {
          console.log(`${logPrefix} 📦 Enqueueing to BullMQ...`);
          const { deepAnalysisQueue } = await import('@/lib/queues/deep-analysis');
          await deepAnalysisQueue.add(
            'run' as any,
            {
              sessionId,
              businessInfo,
              scrapedContent: mergedScraped,
              uploadedDocuments: uploadedDocuments || [],
              mode: 'progressive',
              preHarvestText,
            } as any,
            {
              jobId: `deep:${sessionId}:phase1`,
              removeOnComplete: { age: 3600, count: 1000 },
              removeOnFail: { age: 86400, count: 1000 },
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
            },
          );
          console.log(`${logPrefix} ✅ CHECKPOINT 8A - Job enqueued to BullMQ`);
        } else {
          throw new Error('BullMQ disabled or no worker');
        }
      } catch (e) {
        console.error(`${logPrefix} ❌ CHECKPOINT 8A FAILED - Falling back to inline:`, e);
        // FIX #7: Fire-and-forget inline execution (don't await, don't block request)
        // Wrap in try-catch to prevent unhandled promise rejection
        (async () => {
          try {
            const { getPub, getProgressChannel } = await import('@/lib/redis');
            const pub = getPub();
            const channel = getProgressChannel(sessionId);
            console.log(`${logPrefix} 🔄 Fallback to inline execution (fire-and-forget)`);
            // Emit immediate 0% so UI shows running state
            try {
              await pub.publish(channel, JSON.stringify({ type: 'progress', current: 0, total: 95 }));
            } catch {}
            console.log(`${logPrefix} 🔬 Starting inline deep analysis...`);
            await runDeepAnalysis({
              sessionId,
              businessInfo,
              scrapedContent: mergedScraped,
              uploadedDocuments: uploadedDocuments || [],
              mode: 'progressive',
              preHarvestText,
              onProgress: async (current, total, completedCategories) => {
                console.log(`${logPrefix} 📊 Progress: ${current}/${total}% - Categories: ${completedCategories?.join(', ') || 'processing'}`);
                // FIX #2: Improved error handling for progress callback
                try {
                  await pub.publish(
                    channel,
                    JSON.stringify({ type: 'progress', current, total, completedCategories }),
                  );
                } catch (pubErr) {
                  console.warn(`${logPrefix} ⚠️ Failed to publish progress update via Redis (will use SSE polling):`, pubErr);
                  // Silently fail - SSE polling will catch up anyway
                }
              },
            });
          } catch (inlineErr) {
            console.error(`${logPrefix} ❌ Inline analysis failed:`, inlineErr);
          }
        })();
      }

      // Kick off deep scrape in background while phase 1 runs
      console.log(`${logPrefix} 🌐 CHECKPOINT 8B - Starting background deep scrape...`);
      const deepResultPromise = businessInfo.website
        ? (async () => {
            const { scrapeSiteDeep } = await import('@/lib/web-scraper');
            try {
              console.log(`${logPrefix} 🌐 Deep scraping in background: ${businessInfo.website}`);
              return await scrapeSiteDeep(businessInfo.website, 20, 2);
            } catch (err) {
              console.warn(`${logPrefix} ⚠️ Deep scrape failed:`, err);
              return { combinedText: '', sources: [] };
            }
          })()
        : Promise.resolve({ combinedText: '', sources: [] });

      // After deep scrape, optionally enqueue a targeted re-run with deeper context
      const deepResult = await deepResultPromise;
      const hasDeeper = (deepResult?.combinedText || '').length > 0;
      console.log(`${logPrefix} 🌐 Deep scrape result: ${(deepResult?.combinedText || '').length}b`);
      
      if (hasDeeper) {
        try {
          console.log(`${logPrefix} 📦 CHECKPOINT 8C - Enqueueing phase 2 with deeper context...`);
          const { deepAnalysisQueue } = await import('@/lib/queues/deep-analysis');
          await deepAnalysisQueue.add(
            'run' as any,
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
            } as any,
            {
              jobId: `deep:${sessionId}:phase2`,
              removeOnComplete: { age: 3600, count: 1000 },
              removeOnFail: { age: 86400, count: 1000 },
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
            },
          );
          console.log(`${logPrefix} ✅ CHECKPOINT 8C - Phase 2 enqueued`);
        } catch (err) {
          console.error(`${logPrefix} ⚠️ Phase 2 enqueue failed (non-fatal):`, err);
        }
      }
    })
      .then(() => {
        console.log(`${logPrefix} ✅ DEEP ANALYSIS ORCHESTRATION COMPLETE - Total time: ${Date.now() - startTime}ms`);
      })
      .catch((error: any) => {
        console.error(`${logPrefix} ❌ BACKGROUND DEEP ANALYSIS ORCHESTRATION FAILED:`, error);
      });

    console.log(`${logPrefix} ✅ ORCHESTRATION COMPLETE - API returning immediately (total: ${Date.now() - startTime}ms)`);
    return NextResponse.json({
      success: true,
      message: 'Deep analysis orchestration started',
      sessionId,
      _debug: {
        checkpointsReached: 8,
        totalTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error(`[DEEP-ANALYSIS-API] ❌ FATAL ERROR:`, error);
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

    // Compute derived unit economics if possible
    const overrides = (analysis as any).metricOverrides || {};
    const ocr = (analysis as any).ocrMetrics || {};
    const src = { ...ocr, ...overrides }; // overrides win
    const cac = Number(src.cac);
    const ltv = Number(src.ltv);
    const churn = Number(src.churn);
    const mrr = Number(src.mrr);
    const customers = Number(src.customers);
    const grossMargin = Number(src.grossMargin); // optional
    const arpu = Number.isFinite(mrr) && Number.isFinite(customers) && customers > 0 ? mrr / customers : Number(src.arpu);
    const ltvCac = Number.isFinite(ltv) && Number.isFinite(cac) && cac > 0 ? ltv / cac : undefined;
    const paybackMonths = Number.isFinite(cac) && Number.isFinite(arpu) && arpu > 0
      ? (Number.isFinite(grossMargin) && grossMargin > 0 ? cac / (arpu * (grossMargin / 100)) : cac / arpu)
      : undefined;

    return NextResponse.json({
      status: analysis.status,
      progress: analysis.progress,
      overallScore: analysis.overallScore,
      confidenceWeightedScore: (analysis as any).confidenceWeightedScore,
      dataCompleteness: (analysis as any).dataCompleteness,
      companyStage: (analysis as any).companyStage,
      investmentReadiness: analysis.investmentReadiness,
      ocrMetrics: (analysis as any).ocrMetrics || null,
      metricOverrides: (analysis as any).metricOverrides || null,
      derivedUnitEconomics: {
        ltvCac: Number.isFinite(ltvCac as number) ? Number(ltvCac?.toFixed(2)) : null,
        paybackMonths: Number.isFinite(paybackMonths as number) ? Number((paybackMonths as number).toFixed(1)) : null,
        arpu: Number.isFinite(arpu) ? Math.round(arpu) : null,
        grossMargin: Number.isFinite(grossMargin) ? Number(grossMargin.toFixed(1)) : null,
      },
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
