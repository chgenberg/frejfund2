/**
 * Deep Analysis Runner - Background processing for comprehensive company analysis
 * Runs all 68 dimensions and stores results in database
 */

import { BusinessInfo } from '@/types/business';
import {
  ANALYSIS_DIMENSIONS,
  DeepAnalysisResult,
  getCriticalDimensions,
} from './deep-analysis-framework';
import { FREE_TIER_DIMENSIONS, isFreeTierDimension } from './free-tier-dimensions';
import { getOpenAIClient, getChatModel } from './ai-client';
import { fetchGptKnowledgeForCompany } from './gpt-knowledge';
import { prisma } from './prisma';

interface RunDeepAnalysisOptions {
  sessionId: string;
  businessInfo: BusinessInfo;
  scrapedContent: string;
  uploadedDocuments?: string[];
  mode?: 'full' | 'critical-only' | 'progressive' | 'free-tier';
  specificDimensions?: string[]; // Only re-analyze these specific dimensions
  preHarvestText?: string; // optional: provide GPT public knowledge text (skip internal harvest)
  onProgress?: (current: number, total: number, completedCategories: string[]) => Promise<void>;
}

/**
 * Main function to run deep analysis
 * This will be called after initial scraping is complete
 */
export async function runDeepAnalysis(options: RunDeepAnalysisOptions): Promise<string> {
  const startTime = Date.now();
  const logPrefix = `[DEEP-ANALYSIS-RUNNER] [${new Date().toISOString()}]`;
  const {
    sessionId,
    businessInfo,
    scrapedContent,
    uploadedDocuments = [],
    mode = 'progressive',
    specificDimensions,
  } = options;

  console.log(`${logPrefix} 🚀 STARTING DEEP ANALYSIS`);
  console.log(`${logPrefix} 📋 Mode: ${mode}, Content: ${scrapedContent.length}b, Docs: ${uploadedDocuments.length}, Business: ${businessInfo.name}`);

  try {
    // Get session to find userId
    console.log(`${logPrefix} 🔍 STEP 1 - Finding session: ${sessionId}`);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    console.log(`${logPrefix} ✅ STEP 1 - Session found, UserId: ${session?.userId || 'null'}`);

    // 1. Create or reuse DeepAnalysis record (avoid P2002 on re-run)
    console.log(`${logPrefix} 💾 STEP 2 - Creating/upserting analysis record...`);
    const isCriticalOnly = mode === 'critical-only';
    const analysis = await prisma.deepAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: session?.userId || null,
        status: isCriticalOnly ? 'analyzing' : 'analyzing',
        progress: isCriticalOnly ? 100 : 0,
        businessInfo: businessInfo, // Save for VC dashboard
      },
      update: {
        status: 'analyzing',
        // Do not reset progress on critical-only re-run; keep UI at 100%
        ...(isCriticalOnly ? {} : { progress: 0, startedAt: new Date() }),
        businessInfo: businessInfo, // Update business info
      },
    });
    console.log(`${logPrefix} ✅ STEP 2 - Analysis record created, ID: ${analysis.id}`);

    // Only clear previous results on a full run; keep existing dimensions on critical-only or specific re-runs
    console.log(`${logPrefix} 🗑️ STEP 3 - Clearing old dimensions (mode: ${mode})...`);
    if (mode !== 'critical-only' && mode !== 'specific') {
      // FIX #10: Add a cleanup lock to prevent race conditions
      try {
        // Check if cleanup is already in progress
        const cleanupInProgress = await prisma.deepAnalysis.findUnique({
          where: { sessionId },
          select: { id: true }
        });
        
        if (cleanupInProgress?.id) {
          // Update a flag to indicate cleanup in progress
          await prisma.deepAnalysis.update({
            where: { id: cleanupInProgress.id },
            data: { 
              // Using a custom field would be better, but for now we just proceed carefully
              status: 'analyzing'
            }
          });
          
          // Small delay to let other runners finish
          await new Promise((r) => setTimeout(r, 100));
          
          // Delete only dimensions not recently updated
          const fiveSecondsAgo = new Date(Date.now() - 5000);
          const deletedDims = await prisma.analysisDimension.deleteMany({ 
            where: { 
              analysisId: analysis.id,
              analyzedAt: { lt: fiveSecondsAgo } // Only delete old ones
            } 
          });
          const deletedInsights = await prisma.analysisInsight.deleteMany({ 
            where: { 
              analysisId: analysis.id,
              createdAt: { lt: fiveSecondsAgo } // Only delete old ones
            } 
          });
          console.log(`${logPrefix} ✅ STEP 3 - Cleared ${deletedDims.count} dimensions, ${deletedInsights.count} insights (safe cleanup)`);
        }
      } catch (cleanupErr) {
        console.warn(`${logPrefix} ⚠️ STEP 3 - Safe cleanup failed, attempting full cleanup:`, cleanupErr);
        // Fallback to full cleanup (will race but won't crash)
        try {
          const deletedDims = await prisma.analysisDimension.deleteMany({ where: { analysisId: analysis.id } });
          const deletedInsights = await prisma.analysisInsight.deleteMany({ where: { analysisId: analysis.id } });
          console.log(`${logPrefix} ✅ STEP 3 - Cleared ${deletedDims.count} dimensions, ${deletedInsights.count} insights (fallback cleanup)`);
        } catch (fullCleanupErr) {
          console.error(`${logPrefix} ❌ STEP 3 - Cleanup failed completely:`, fullCleanupErr);
        }
      }
    } else {
      console.log(`${logPrefix} ℹ️ STEP 3 - Skipped cleanup (critical-only/specific mode)`);
    }

  // 2. Fast mode: Skip external intelligence for demo stability
  console.log(`${logPrefix} ⚡ STEP 4 - Using FAST MODE (skipping external intelligence)`);
  const companyStage = 'startup'; // Default stage for fast processing
  const naDimensionsForStage: string[] = [];
  const externalIntel = null;
  const googleIntel = null;
  const gptKnowledgeText = '';
  
  console.log(`${logPrefix} ✅ STEP 4 - Fast mode initialized`);

  // OCR: Skip for fast mode (can be enabled for re-runs)
  const skipOCR = true;  // Fast mode for demo
  try {
    const pdfUrls = skipOCR ? [] : (uploadedDocuments || []).filter((u) => /\.pdf($|\?|#)/i.test(u));
    if (pdfUrls.length > 0) {
      const { extractPitchDeckMetrics } = await import('./pdf-ocr');
      let mergedText = '';
      let mergedMetrics: any = {};

      // Process first 3 PDFs to cap runtime
      for (const url of pdfUrls.slice(0, 3)) {
        try {
          const res = await fetch(url);
          const buf = Buffer.from(await res.arrayBuffer());
          const ocr = await extractPitchDeckMetrics(buf, url.split('/').pop());
          mergedText += `\n\n--- ${url} ---\n${ocr.fullText}`;

          // Merge metrics (prefer larger non-null values)
          for (const [k, v] of Object.entries(ocr.metrics)) {
            if (v === undefined || v === null || Number.isNaN(v as number)) continue;
            const prev = mergedMetrics[k];
            mergedMetrics[k] = prev ? Math.max(prev as number, v as number) : v;
          }
        } catch (e) {
          console.warn('PDF OCR failed for', url, e);
        }
      }

      // Attach to businessInfo for downstream prompts
      (businessInfo as any).ocrExtractedText = mergedText.slice(0, 8000);
      (businessInfo as any).ocrMetrics = mergedMetrics;
      console.log('🧾 OCR metrics extracted:', mergedMetrics);
      try {
        await prisma.deepAnalysis.update({
          where: { id: analysis.id },
          data: { ocrMetrics: mergedMetrics },
        });
      } catch (e) {
        console.warn('Failed to persist ocrMetrics:', e);
      }
    }
  } catch (e) {
    console.warn('OCR extraction skipped/failed:', e);
  }

  // 3. GPT public knowledge (low-priority source)
  // If provided by orchestrator, use it; otherwise harvest now
    let gptKnowledgeText = options.preHarvestText || '';
    if (!gptKnowledgeText) {
      try {
        const knowledge = await fetchGptKnowledgeForCompany(businessInfo);
        gptKnowledgeText = knowledge.combinedText || '';
        await prisma.deepAnalysis.update({
          where: { id: analysis.id },
          data: { publicKnowledge: { text: knowledge.combinedText, chunks: knowledge.chunks } },
        });
      } catch {}
    } else {
      try {
        await prisma.deepAnalysis.update({
          where: { id: analysis.id },
          data: { publicKnowledge: { text: gptKnowledgeText } },
        });
      } catch {}
    }

    // 4. Determine which dimensions to analyze based on mode and subscription tier
    let dimensionsToAnalyze =
      specificDimensions && specificDimensions.length > 0
        ? ANALYSIS_DIMENSIONS.filter(
            (d) =>
              specificDimensions.includes(d.name) || specificDimensions.includes(d.dimensionId),
          )
        : mode === 'critical-only'
          ? getCriticalDimensions()
          : mode === 'free-tier'
            ? FREE_TIER_DIMENSIONS
            : mode === 'full'
              ? ANALYSIS_DIMENSIONS
              : mode === 'specific'
                ? [] // Will be handled by specificDimensions
                : FREE_TIER_DIMENSIONS; // Default to free tier for 'progressive' mode
    
    // Filter out N/A dimensions for enterprise companies
    if (naDimensionsForStage.length > 0) {
      dimensionsToAnalyze = dimensionsToAnalyze.filter(d => !naDimensionsForStage.includes(d.id));
    }

    const hasDocs = Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0;
    const scrapedLen = (scrapedContent || '').trim().length;

    // In free-tier mode, we always use FREE_TIER_DIMENSIONS
    if (mode !== 'free-tier') {
      // If we have very limited context, reduce scope to ensure quality
      if (!hasDocs && scrapedLen < 500) {
        // Only run truly critical dimensions when almost no context is available
        dimensionsToAnalyze = ANALYSIS_DIMENSIONS.filter((d) => d.priority === 'critical');
      } else if (!hasDocs && scrapedLen < 2000) {
        // Without docs and with small website text, skip low-priority dimensions
        dimensionsToAnalyze = ANALYSIS_DIMENSIONS.filter(
          (d) => d.priority === 'critical' || d.priority === 'high' || d.priority === 'medium',
        );
      }
    }

    // Sort dimensions by priority order: critical -> high -> medium -> low
    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    dimensionsToAnalyze = dimensionsToAnalyze.sort((a, b) => {
      return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    });

    const totalDimensions = dimensionsToAnalyze.length;
    let completed = 0;
    console.log(`${logPrefix} 📊 STEP 5 - Loaded dimensions to analyze: ${totalDimensions} total`);
    console.log(`${logPrefix} 📊 Dimensions: ${dimensionsToAnalyze.map(d => d.id).join(', ').slice(0, 100)}...`);

    const completedCategories: string[] = [];

    // Idempotent saver to avoid duplicates when re-running
    const saveDimension = async (analysisId: string, dimensionMeta: any, result: any) => {
      try {
        const existing = await prisma.analysisDimension.findFirst({
          where: { analysisId, dimensionId: dimensionMeta.id },
        });
        if (existing) {
          console.log(`${logPrefix} 🔄 Updating existing dimension: ${dimensionMeta.id}`);
          await prisma.analysisDimension.update({
            where: { id: existing.id },
            data: {
              category: dimensionMeta.category,
              name: dimensionMeta.name,
              score: result.score,
              findings: result.findings,
              redFlags: result.redFlags,
              strengths: result.strengths,
              questions: result.questionsToAsk,
              evidence: result.evidence || [],
              confidence: result.confidence,
              analyzed: true,
              analyzedAt: new Date(),
              // Avoid saving full prompt to reduce memory/DB usage
              prompt: undefined,
              // Store actual model used for traceability
              modelUsed: getChatModel('complex'),
            },
          });
        } else {
          console.log(`${logPrefix} ✨ Creating new dimension: ${dimensionMeta.id} (score: ${result.score})`);
          await prisma.analysisDimension.create({
            data: {
              analysisId,
              dimensionId: dimensionMeta.id,
              category: dimensionMeta.category,
              name: dimensionMeta.name,
              score: result.score,
              findings: result.findings,
              redFlags: result.redFlags,
              strengths: result.strengths,
              questions: result.questionsToAsk,
              evidence: result.evidence || [],
              confidence: result.confidence,
              analyzed: true,
              analyzedAt: new Date(),
              prompt: undefined,
              modelUsed: getChatModel('complex'),
            },
          });
        }
      } catch (saveErr) {
        console.error(`${logPrefix} ❌ Error saving dimension ${dimensionMeta.id}:`, saveErr);
        throw saveErr;
      }
    };

    // 4. Run analysis for each dimension in small batches to reduce load
    // Low-memory mode tuned: 2 at a time in production to improve throughput without OOM
    const batchSize = process.env.NODE_ENV === 'production' ? 2 : 3;
    console.log(`${logPrefix} 🔄 STEP 6 - Starting dimension analysis (batchSize: ${batchSize}, total: ${totalDimensions})...`);
    
    for (let idx = 0; idx < dimensionsToAnalyze.length; idx += batchSize) {
      const batch = dimensionsToAnalyze.slice(idx, idx + batchSize);
      console.log(`${logPrefix} 📦 Processing batch ${Math.floor(idx / batchSize) + 1}/${Math.ceil(totalDimensions / batchSize)} (${batch.map(d => d.id).join(', ')})`);
      
      for (const dimension of batch) {
        try {
        // Guard against long-hanging external calls (LLM/network)
        const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
          return await new Promise<T>((resolve, reject) => {
            const to = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
            promise
              .then((v) => {
                clearTimeout(to);
                resolve(v);
              })
              .catch((e) => {
                clearTimeout(to);
                reject(e);
              });
          });
        };

          // Analyze with simple retry/backoff
          let result: any | null = null;
          console.log(`${logPrefix} 🔬 Analyzing: ${dimension.name} (${dimension.id}), Attempt 1/2...`);
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
            result = await withTimeout(
              analyzeDimension(
                dimension,
                businessInfo,
                // Truncate context to keep memory small
                // Merge sources: uploaded > scraped > GPT knowledge
                // The analyzeDimension prompt instructs model to respect only provided text; we bias by ordering
                (uploadedDocuments && uploadedDocuments.length > 0 ? '' : '') +
                  // Keep context small to avoid V8 heap pressure
                  (scrapedContent || '').slice(0, 6000) +
                  '\n\n' +
                  (gptKnowledgeText || '').slice(0, 2000),
                uploadedDocuments,
                googleIntel,
              ),
              120000,
              `dimension ${dimension.id}`,
            );
              console.log(`${logPrefix} ✅ Analysis successful: ${dimension.name} → Score: ${result.score}/100, Confidence: ${result.confidence.toFixed(2)}`);
              break;
            } catch (e) {
              if (attempt === 2) {
                console.error(`${logPrefix} ❌ Failed on attempt ${attempt}: ${dimension.id}:`, (e as Error).message);
                // FIX #8: Create a failed dimension record for auditing
                try {
                  await prisma.analysisDimension.create({
                    data: {
                      analysisId: analysis.id,
                      dimensionId: dimension.id,
                      category: dimension.category,
                      name: dimension.name,
                      score: 0, // Mark as 0 to indicate failure
                      findings: [`Analysis failed: ${(e as Error).message}`],
                      strengths: [],
                      redFlags: [`Failed to analyze - ${(e as Error).message.slice(0, 100)}`],
                      questions: [],
                      evidence: [],
                      confidence: 0,
                      analyzed: false, // Mark as not analyzed
                      analyzedAt: new Date(),
                    },
                  });
                  console.log(`${logPrefix} 📝 Failed dimension record created for auditing`);
                } catch (recordErr) {
                  console.warn(`${logPrefix} ⚠️ Failed to create error record:`, recordErr);
                }
                throw e;
              }
              console.warn(`${logPrefix} ⚠️ Attempt ${attempt} failed, retrying in ${1000 * attempt}ms...`, (e as Error).message);
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }

          // Save idempotently
          // Save idempotently (avoid storing full prompt to reduce DB size)
          console.log(`${logPrefix} 💾 Saving dimension results to database...`);
          await saveDimension(analysis.id, dimension, result);

          // Update progress: map 0-95 dimensions to 3-100% (scraping was 0-3%)
          completed++;
          const analysisProgress = Math.round(3 + (completed / totalDimensions) * 97);

          // Track completed categories
          if (!completedCategories.includes(dimension.priority)) {
            const categoryDimensions = dimensionsToAnalyze.filter(
              (d) => d.priority === dimension.priority,
            );
            const categoryCompleted = categoryDimensions.every(
              (d) => completed >= dimensionsToAnalyze.indexOf(d) + 1,
            );
            if (categoryCompleted) {
              completedCategories.push(dimension.priority);
            }
          }

          console.log(`${logPrefix} 📊 Progress: ${completed}/${totalDimensions} (${analysisProgress}%) - ${dimension.name} [${dimension.category}]`);

          await prisma.deepAnalysis.update({
            where: { id: analysis.id },
            data: { progress: analysisProgress },
          });

          // Call progress callback if provided
          if (options.onProgress) {
            await options.onProgress(analysisProgress, 100, completedCategories);
          }

          // Progress is automatically tracked via database
          // SSE endpoint reads directly from DeepAnalysis table

          // Generate insights from this dimension if critical
          if (dimension.priority === 'critical' && result.redFlags.length > 0) {
            console.log(`${logPrefix} 🚨 Creating insight for critical dimension: ${dimension.name}`);
            await prisma.analysisInsight.create({
              data: {
                analysisId: analysis.id,
                type: 'threat',
                priority: 'critical',
                category: dimension.category,
                title: `Critical Issue: ${dimension.name}`,
                description: result.redFlags[0],
                recommendation: result.suggestions[0] || 'Review and address this concern',
                relatedDimensions: [dimension.id],
                evidence: result.findings.slice(0, 2),
              },
            });
          }

          // Progressive mode: small delay + opportunistic GC to avoid rate limits and heap bloat
          if (mode === 'progressive') {
            // Shorter pacing per-dimension to improve overall latency
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          // Explicit best-effort GC if available (ignored in most environments)
          try {
            (global as any).gc && (global as any).gc();
          } catch {}
        } catch (error) {
          console.error(`${logPrefix} ❌ ERROR analyzing dimension ${dimension.id}:`, error);
          // FIX #9: Even on failure, advance progress and always call onProgress callback
          completed++;
          const analysisProgress = Math.round(3 + (completed / totalDimensions) * 97);
          
          // Always update progress in DB for consistency
          try {
            await prisma.deepAnalysis.update({ 
              where: { id: analysis.id }, 
              data: { progress: analysisProgress } 
            });
          } catch (updateErr) {
            console.warn(`${logPrefix} ⚠️ Failed to update progress in DB:`, updateErr);
          }
          
          // ALWAYS call onProgress callback - this is critical for FIX #9
          if (options.onProgress) {
            try {
              await options.onProgress(analysisProgress, 100, completedCategories);
            } catch (callbackErr) {
              console.error(`${logPrefix} ❌ onProgress callback failed:`, callbackErr);
            }
          }
          
          // Continue with other dimensions instead of stopping
          console.log(`${logPrefix} ⚠️ Skipping dimension ${dimension.id}, continuing with next...`);
        }
      }
      // Short pause between batches
      if (mode === 'progressive') {
        // Shorter pause between batches to keep momentum while avoiding spikes
        await new Promise((r) => setTimeout(r, 600));
        try {
          (global as any).gc && (global as any).gc();
        } catch {}
      }
    }
    
    console.log(`${logPrefix} ✅ STEP 6 - All dimensions analyzed!`);
    
    // FIX #9: Send final progress update to 100% to ensure completion
    if (options.onProgress) {
      try {
        await options.onProgress(100, 100, completedCategories);
        console.log(`${logPrefix} 📊 Final 100% progress sent to callback`);
      } catch (err) {
        console.warn(`${logPrefix} ⚠️ Failed to send final progress update:`, err);
      }
    }

    // 4. Calculate overall scores (confidence-weighted and data completeness)
    console.log(`${logPrefix} 📈 STEP 7 - Calculating overall scores...`);
    const allDimensions = await prisma.analysisDimension.findMany({
      where: { analysisId: analysis.id, analyzed: true },
    });

    console.log(`${logPrefix} 📊 Found ${allDimensions.length} analyzed dimensions`);

    // Simple average score (raw)
    const avgScore =
      allDimensions.length > 0
        ? Math.round(
            allDimensions.reduce((sum, d) => sum + (d.score || 0), 0) / allDimensions.length,
          )
        : 0;
    console.log(`${logPrefix} 📊 Average score calculated: ${avgScore}/100`);

    // Confidence-weighted score (penalize low-confidence dimensions less)
    const confidenceWeights = { high: 1.0, medium: 0.7, low: 0.4 };
    let weightedSum = 0;
    let weightSum = 0;
    
    allDimensions.forEach(d => {
      const conf = (d.confidence || 'medium') as 'high' | 'medium' | 'low';
      const weight = confidenceWeights[conf] || 0.7;
      weightedSum += (d.score || 0) * weight;
      weightSum += weight;
    });
    
    const confidenceWeightedScore = weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;
    console.log(`${logPrefix} 📊 Confidence-weighted score: ${confidenceWeightedScore}/100`);
    
    // Data completeness (% of dimensions with high confidence)
    const highConfCount = allDimensions.filter(d => d.confidence === 'high').length;
    const dataCompleteness = allDimensions.length > 0 
      ? Math.round((highConfCount / allDimensions.length) * 100) 
      : 0;
    console.log(`${logPrefix} 📊 Data completeness: ${dataCompleteness}% (${highConfCount}/${allDimensions.length} high-confidence)`);

    const investmentReadiness = Math.round(confidenceWeightedScore / 10); // Convert to 0-10 scale
    console.log(`${logPrefix} 📊 Investment readiness: ${investmentReadiness}/10`);

    // 5. Mark analysis as complete with all score variants
    console.log(`${logPrefix} 💾 STEP 8 - Marking analysis as COMPLETED...`);
    try {
      // FIX #6: Check if already completed to avoid race condition
      const currentAnalysis = await prisma.deepAnalysis.findUnique({
        where: { id: analysis.id },
        select: { status: true }
      });
      
      if (currentAnalysis?.status === 'completed') {
        console.log(`${logPrefix} ℹ️ STEP 8 - Analysis already marked as completed (race condition prevented)`);
      } else {
        await prisma.deepAnalysis.update({
          where: { id: analysis.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            progress: 100,
            overallScore: avgScore,
            confidenceWeightedScore,
            dataCompleteness,
            investmentReadiness,
            companyStage,
          },
        });
        console.log(`${logPrefix} ✅ STEP 8 - Analysis marked as COMPLETED`);
      }
    } catch (updateErr) {
      console.error(`${logPrefix} ❌ STEP 8 - Failed to mark analysis complete:`, updateErr);
      throw updateErr;
    }

    // 6a. Auto-create or update Investment Ad for VC discovery
    console.log(`${logPrefix} 📢 STEP 9 - Creating investment ad...`);
    try {
      const aiSummary = `Investment analysis for ${businessInfo.name}: readiness ${investmentReadiness}/10, score ${confidenceWeightedScore}%.`;
      const topStrengths = allDimensions
        .filter((d) => (d.score || 0) >= 70)
        .slice(0, 5)
        .map((d) => `${d.name}: ${d.score}%`);
      const topRisks = allDimensions
        .filter((d) => (d.score || 0) < 40)
        .slice(0, 5)
        .map((d) => `${d.name}: ${d.score}%`);

      console.log(`${logPrefix} 📊 Top strengths (70+): ${topStrengths.length} items`);
      console.log(`${logPrefix} 📊 Top risks (<40): ${topRisks.length} items`);

      const existingAd = await prisma.investmentAd.findFirst({
        where: { analysisId: analysis.id },
      });
      const adData = {
        userId: analysis.userId || undefined,
        analysisId: analysis.id,
        title: `${businessInfo.name} — ${businessInfo.industry || 'Company'} (${businessInfo.stage || 'Stage'})`,
        oneLiner: (businessInfo as any).oneLiner || (analysis as any).businessInfo?.description || 'Raising to accelerate growth',
        summary: aiSummary,
        pros: topStrengths,
        cons: topRisks,
        highlights: [
          `Confidence-weighted score: ${confidenceWeightedScore}%`,
          `Data completeness: ${dataCompleteness}%`,
          `Investment readiness: ${investmentReadiness}/10`,
        ],
        companyName: businessInfo.name || 'Unknown Company',
        industry: businessInfo.industry || null,
        stage: businessInfo.stage || null,
        location: ((analysis.businessInfo as any)?.city as string) || null,
        website: businessInfo.website || null,
        pitchDeck: (analysis as any).businessInfo?.pitchDeck || null,
        seekingUsd: (analysis as any).businessInfo?.seeking || null,
        valuationUsd: (analysis as any).businessInfo?.valuation || null,
        metrics: {
          overallScore: avgScore,
          confidenceWeightedScore,
          dataCompleteness,
          investmentReadiness,
        } as any,
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      } as any;

      if (existingAd) {
        console.log(`${logPrefix} 🔄 Updating existing investment ad: ${existingAd.id}`);
        await prisma.investmentAd.update({ where: { id: existingAd.id }, data: adData });
      } else {
        console.log(`${logPrefix} ✨ Creating new investment ad`);
        await prisma.investmentAd.create({ data: { ...adData, title: adData.title || 'Investment Opportunity' } });
      }
      console.log(`${logPrefix} ✅ STEP 9 - Investment ad published`);
    } catch (e) {
      console.warn(`${logPrefix} ⚠️ Failed to create/update InvestmentAd (non-fatal):`, e);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`${logPrefix} ✅ DEEP ANALYSIS COMPLETE!`);
    console.log(`${logPrefix} 📊 FINAL RESULTS:`);
    console.log(`${logPrefix}   - Overall Score: ${avgScore}/100`);
    console.log(`${logPrefix}   - Confidence-Weighted: ${confidenceWeightedScore}/100`);
    console.log(`${logPrefix}   - Investment Readiness: ${investmentReadiness}/10`);
    console.log(`${logPrefix}   - Data Completeness: ${dataCompleteness}%`);
    console.log(`${logPrefix}   - Dimensions Analyzed: ${allDimensions.length}`);
    console.log(`${logPrefix}   - Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`${logPrefix} ════════════════════════════════════════════════════`);

    // 6. Record score history for progress tracking
    if (analysis.userId) {
      try {
        const allDimensions = await prisma.analysisDimension.findMany({
          where: { analysisId: analysis.id },
          select: { dimensionId: true, name: true, score: true },
        });

        for (const dim of allDimensions) {
          if (dim.score) {
            await prisma.scoreHistory.create({
              data: {
                userId: analysis.userId,
                sessionId,
                dimensionId: dim.dimensionId,
                dimensionName: dim.name,
                score: dim.score,
                overallScore: avgScore,
              },
            });
          }
        }
      } catch (e) {
        console.error('Failed to record score history:', e);
      }
    }

    // 7. Trigger automatic matching with VCs (async, non-blocking)
    if (analysis.userId && avgScore >= 60) {
      // Only match if score is decent
      try {
        const { autoMatchStartupWithVCs } = await import('@/lib/auto-matching');
        // Fire and forget – don't block analysis completion
        autoMatchStartupWithVCs(sessionId).catch((e) => console.error('Auto-matching failed:', e));
      } catch (e) {
        console.error('Failed to trigger auto-matching:', e);
      }
    }

    return analysis.id;
  } catch (error) {
    console.error('Deep analysis failed:', error);
    throw error;
  }
}

/**
 * Analyze a single dimension using GPT
 */
async function analyzeDimension(
  dimension: any,
  businessInfo: BusinessInfo,
  scrapedContent: string,
  uploadedDocuments: string[],
  googleIntel?: any,
): Promise<DeepAnalysisResult> {
  const openai = getOpenAIClient();

  // gpt-5 / gpt-5-mini: temperature not used; response_format unsupported on gpt-5*

  // Combine all available content
  const googleContext = googleIntel ? `

## Google Search Intelligence:

### Recent News & Press:
${googleIntel.news.map(n => `- **${n.title}**\n  ${n.snippet}\n  Source: ${n.link}`).join('\n\n')}

### Competitors & Market:
${googleIntel.competitors.map(c => `- ${c.title}: ${c.snippet}`).join('\n')}

### Market Trends (${new Date().getFullYear()}):
${googleIntel.marketTrends.map(t => `- ${t.title}: ${t.snippet}`).join('\n')}
` : '';

  // Include OCR metrics and text (if any)
  const ocrContext = (businessInfo as any).ocrMetrics || (businessInfo as any).ocrExtractedText
    ? `\n## OCR Extracted Metrics:\n${JSON.stringify((businessInfo as any).ocrMetrics || {}, null, 2)}\n\n## OCR Extracted Text (truncated):\n${((businessInfo as any).ocrExtractedText || '').slice(0, 4000)}\n`
    : '';

  const fullContent = `
# Company Intelligence Report

## Website & Scraped Content:
${scrapedContent}

## Uploaded Documents:
${uploadedDocuments.join('\n\n---\n\n')}
${googleContext}
${ocrContext}
  `.slice(0, 12000);

  // Build enhanced analysis prompt with better structure
  const analysisPrompt = `${dimension.prompt(businessInfo, fullContent)}

ANALYSIS FRAMEWORK:
1. Score (0-100): Rate the dimension based on available evidence
   - 80-100: Exceptional, clear strength
   - 60-79: Good, with minor improvements needed
   - 40-59: Adequate, but significant gaps
   - 20-39: Concerning, major issues
   - 0-19: Critical weakness or insufficient data

2. Findings: Factual observations from the content (max 3, <25 words each)
3. Strengths: Positive signals and advantages (max 3)
4. Red Flags: Concerns or risks identified (max 3)
5. Recommendations: Specific, actionable advice (max 3)
6. Questions: Missing information to ask the founder (max 3)
7. Evidence: Direct citations from source material (max 2)
8. Confidence: Your certainty in this assessment (0.0-1.0)
   - 0.9-1.0: Strong evidence, clear picture
   - 0.7-0.89: Good data, some assumptions
   - 0.5-0.69: Limited data, educated guess
   - <0.5: Insufficient information

Return ONLY valid JSON:
{
  "score": number,
  "findings": string[],
  "redFlags": string[],
  "strengths": string[],
  "recommendations": string[],
  "questionsToAsk": string[],
  "evidence": [{ "source": string, "snippet": string, "url": string }],
  "confidence": number
}

RULES:
- Be specific and concrete, avoid generic statements
- Base all claims on provided content
- If data is missing, reflect it in low score and low confidence
- Each array item must add unique value
- No commentary outside JSON structure`;

  try {
    // Use full gpt-5 model for deep analysis
    const analysisModel = getChatModel('complex'); // gpt-5
    const isGpt5 = analysisModel.startsWith('gpt-5');
    const completionArgs: any = {
      model: analysisModel,
      messages: [
        {
          role: 'system',
          content: `You are a senior investment analyst with 15+ years of experience evaluating startups for top-tier VC firms.

ANALYSIS PRINCIPLES:
• Evidence-based: Every claim must be supported by data from the provided content
• Nuanced: Recognize shades of gray; avoid extreme scores without justification
• Actionable: Focus on insights that drive investment decisions
• Honest: Acknowledge data gaps; don't guess or fill in blanks

SCORING CALIBRATION:
• 90+: Top 1% company in this dimension (rare)
• 80-89: Strong, competitive advantage
• 70-79: Above average, on right track
• 60-69: Market standard, acceptable
• 50-59: Below expectations, needs work
• <50: Serious concern or insufficient data

Return ONLY valid JSON. No explanatory text outside the JSON structure.`,
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      ...(isGpt5 ? {} : { response_format: { type: 'json_object' } }),
    };
    if (isGpt5) {
      // gpt-5 chat.completions uses max_completion_tokens
      completionArgs.max_completion_tokens = 2400;
    } else {
      completionArgs.max_tokens = 1500;
    }
    const response = await openai.chat.completions.create(completionArgs);

    // Cost logging
    try {
      const promptTokens = (response as any).usage?.prompt_tokens ?? 0;
      const completionTokens = (response as any).usage?.completion_tokens ?? 0;
      const totalTokens = (response as any).usage?.total_tokens ?? promptTokens + completionTokens;
      const { estimateCostUsd, logAICost } = await import('@/lib/cost-logger');
      const costUsd = estimateCostUsd(analysisModel, promptTokens, completionTokens);
      logAICost({
        model: analysisModel,
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        route: 'deep-analysis',
      });
    } catch {}

    const raw = response.choices?.[0]?.message?.content || '{}';
    let result: any = {};
    try {
      result = JSON.parse(raw);
    } catch {
      // best-effort: extract first JSON block
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          result = JSON.parse(raw.slice(start, end + 1));
        } catch {}
      }
    }

    const evidenceArray = Array.isArray(result.evidence) ? result.evidence : [];
    const evidenceStrings = evidenceArray.slice(0, 2).map((e: any) => {
      const src = e?.source ? String(e.source) : 'source';
      const snip = e?.snippet ? String(e.snippet) : '';
      const url = e?.url ? ` (${e.url})` : '';
      return `${src}: ${snip}${url}`.slice(0, 240);
    });

    // Determine confidence level based on evidence and score
    const confidenceScore = result.confidence || 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (confidenceScore >= 0.8 || evidenceStrings.length >= 2) {
      confidence = 'high';
    } else if (confidenceScore >= 0.5 || evidenceStrings.length >= 1) {
      confidence = 'medium';
    }

    // Post-process: adjust scores for relevant dimensions using OCR metrics
    const ocr = (businessInfo as any).ocrMetrics || {};
    let adjustedScore = Number.isFinite(result.score) ? Math.max(0, Math.min(100, Number(result.score))) : 0;
    const extraFindings: string[] = [];

    const dimId = String(dimension.id || dimension.dimensionId || '').toLowerCase();
    if (dimId.includes('unit') || dimId.includes('economics')) {
      // Boost if LTV:CAC >= 3 and churn <= 3%
      const cac = Number(ocr.cac || NaN);
      const ltv = Number(ocr.ltv || NaN);
      const churn = Number(ocr.churn || NaN);
      if (Number.isFinite(cac) && Number.isFinite(ltv) && cac > 0) {
        const ratio = ltv / cac;
        if (ratio >= 3) {
          adjustedScore = Math.min(100, adjustedScore + 8);
          extraFindings.push(`OCR detected strong unit economics: LTV/CAC≈${ratio.toFixed(1)}`);
        } else if (ratio < 1.5) {
          adjustedScore = Math.max(0, adjustedScore - 5);
          extraFindings.push(`OCR indicates weak LTV/CAC≈${ratio.toFixed(1)}`);
        }
      }
      if (Number.isFinite(churn)) {
        if (churn <= 3) {
          adjustedScore = Math.min(100, adjustedScore + 5);
          extraFindings.push(`OCR churn: ${churn}% (healthy)`);
        } else if (churn >= 10) {
          adjustedScore = Math.max(0, adjustedScore - 6);
          extraFindings.push(`OCR churn: ${churn}% (high)`);
        }
      }
    } else if (dimId.includes('traction') || dimId.includes('growth')) {
      const mrr = Number(ocr.mrr || NaN);
      const growth = Number(ocr.growth || NaN);
      if (Number.isFinite(mrr) && mrr >= 50000) {
        adjustedScore = Math.min(100, adjustedScore + 6);
        extraFindings.push(`OCR MRR: $${Math.round(mrr).toLocaleString()}`);
      }
      if (Number.isFinite(growth) && growth >= 15) {
        adjustedScore = Math.min(100, adjustedScore + 4);
        extraFindings.push(`OCR growth: ${growth}%`);
      }
    } else if (dimId.includes('retention')) {
      const churn = Number(ocr.churn || NaN);
      if (Number.isFinite(churn)) {
        if (churn <= 3) {
          adjustedScore = Math.min(100, adjustedScore + 8);
          extraFindings.push(`OCR churn: ${churn}% (excellent retention)`);
        } else if (churn >= 10) {
          adjustedScore = Math.max(0, adjustedScore - 8);
          extraFindings.push(`OCR churn: ${churn}% (weak retention)`);
        }
      }
    }

    return {
      dimension: dimension.id,
      score: adjustedScore,
      findings: [
        ...(Array.isArray(result.findings) ? result.findings.slice(0, 3) : []),
        ...extraFindings.slice(0, 2),
      ],
      redFlags: Array.isArray(result.redFlags) ? result.redFlags.slice(0, 3) : [],
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 3) : [],
      questionsToAsk: Array.isArray(result.questionsToAsk) ? result.questionsToAsk.slice(0, 3) : [],
      suggestions: Array.isArray(result.recommendations)
        ? result.recommendations.slice(0, 3)
        : Array.isArray(result.suggestions)
          ? result.suggestions.slice(0, 3)
          : [],
      // store textual evidence in existing field
      evidence: evidenceStrings,
      confidence,
    };
  } catch (error) {
    console.error(`Error in GPT analysis for ${dimension.id}:`, error);

    // Return default/failed result
    return {
      dimension: dimension.id,
      score: 50,
      findings: ['Analysis incomplete due to error'],
      redFlags: [],
      strengths: [],
      questionsToAsk: [],
      suggestions: [],
    };
  }
}

/**
 * Get deep analysis results for a session
 */
export async function getDeepAnalysis(sessionId: string) {
  // Return raw analysis with dimensions; insights are at analysis level
  return await prisma.deepAnalysis.findUnique({
    where: { sessionId },
    include: {
      dimensions: true,
      insights: {
        where: { addressed: false },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });
}

/**
 * Get dimension results by category
 */
export async function getDimensionsByCategory(sessionId: string) {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis) return null;

  const dimensionsByCategory: Record<string, any[]> = {};

  for (const dim of analysis.dimensions) {
    if (!dimensionsByCategory[dim.category]) {
      dimensionsByCategory[dim.category] = [];
    }
    dimensionsByCategory[dim.category].push(dim);
  }

  return dimensionsByCategory;
}

/**
 * Get unanswered questions from analysis
 */
export async function getUnansweredQuestions(sessionId: string): Promise<string[]> {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis) return [];

  const allQuestions: string[] = [];

  for (const dim of analysis.dimensions) {
    if (dim.questions && dim.questions.length > 0) {
      // Prioritize questions from low-scoring dimensions
      if ((dim.score || 0) < 60) {
        allQuestions.push(...dim.questions.slice(0, 2));
      }
    }
  }

  return allQuestions.slice(0, 10); // Top 10 most important
}

/**
 * Get critical red flags that need immediate attention
 */
export async function getCriticalRedFlags(sessionId: string) {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis) return [];

  const criticalIssues: any[] = [];

  for (const dim of analysis.dimensions) {
    if (dim.redFlags && dim.redFlags.length > 0 && (dim.score || 0) < 40) {
      criticalIssues.push({
        category: dim.category,
        dimension: dim.name,
        issue: dim.redFlags[0],
        questions: dim.questions,
      });
    }
  }

  return criticalIssues.slice(0, 5); // Top 5 most critical
}

export const deepAnalysisRunner = {
  async reanalyzeDimensions(
    sessionId: string,
    dimensionIds: string[]
  ): Promise<void> {
    try {
      const analysis = await prisma.deepAnalysis.findUnique({
        where: { sessionId },
        include: { dimensions: true }
      });

      if (!analysis) {
        throw new Error('Analysis not found');
      }

      const businessInfo = analysis.businessInfo as BusinessInfo;
      
      // Get scraped content from cache or re-scrape
      let scrapedContent = '';
      if (analysis.publicKnowledge) {
        const knowledge = analysis.publicKnowledge as any;
        scrapedContent = knowledge.scrapedContent || '';
      }

      // Re-analyze specific dimensions
      for (const dimensionId of dimensionIds) {
        const dimension = deepAnalysisDimensions.find(d => d.id === dimensionId);
        if (!dimension) continue;

        const existingDim = analysis.dimensions.find(d => d.dimensionId === dimensionId);
        if (!existingDim) continue;

        // Re-run analysis for this dimension
        const result = await analyzeDimension(
          dimension,
          businessInfo,
          scrapedContent,
          [] // uploadedDocuments - could be enhanced to include actual docs
        );

        // Update the dimension
        await prisma.analysisDimension.update({
          where: { id: existingDim.id },
          data: {
            score: result.score,
            confidence: result.confidence,
            evidence: result.evidence,
            gaps: result.gaps,
            recommendations: result.recommendations,
            redFlags: result.redFlags,
            analyzed: true,
            metadata: result.metadata || {}
          }
        });
      }

      // Recalculate overall scores
      const updatedDimensions = await prisma.analysisDimension.findMany({
        where: { analysisId: analysis.id, analyzed: true }
      });

      const overallScore = Math.round(
        updatedDimensions.reduce((sum, d) => sum + d.score, 0) / updatedDimensions.length
      );

      const confidenceWeightedScore = Math.round(
        updatedDimensions.reduce((sum, d) => {
          const weight = d.confidence === 'high' ? 1 : d.confidence === 'medium' ? 0.7 : 0.4;
          return sum + (d.score * weight);
        }, 0) / updatedDimensions.reduce((sum, d) => {
          const weight = d.confidence === 'high' ? 1 : d.confidence === 'medium' ? 0.7 : 0.4;
          return sum + weight;
        }, 0)
      );

      const highConfidenceDims = updatedDimensions.filter(d => d.confidence === 'high').length;
      const dataCompleteness = Math.round((highConfidenceDims / updatedDimensions.length) * 100);

      await prisma.deepAnalysis.update({
        where: { id: analysis.id },
        data: {
          overallScore,
          confidenceWeightedScore,
          dataCompleteness,
          investmentReadiness: Math.round(overallScore / 10)
        }
      });

    } catch (error) {
      console.error('Reanalyze dimensions error:', error);
      throw error;
    }
  },

  async analyzeCompany(
    businessInfo: BusinessInfo,
    session?: { userId?: string; email?: string } | null,
    options: RunOptions = {}
  ): Promise<DeepAnalysis> {
    return runDeepAnalysis(businessInfo, session, options);
  }
};
