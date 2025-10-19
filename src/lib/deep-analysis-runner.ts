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
  const {
    sessionId,
    businessInfo,
    scrapedContent,
    uploadedDocuments = [],
    mode = 'progressive',
    specificDimensions,
  } = options;

  console.log(`🔬 Starting deep analysis for ${businessInfo.name} (${sessionId})`);
  console.log(
    `📋 Mode: ${mode}, Content length: ${scrapedContent.length}, Docs: ${uploadedDocuments.length}`,
  );

  try {
    // Get session to find userId
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    // 1. Create or reuse DeepAnalysis record (avoid P2002 on re-run)
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

    // Only clear previous results on a full run; keep existing dimensions on critical-only or specific re-runs
    if (mode !== 'critical-only' && mode !== 'specific') {
      await prisma.analysisDimension.deleteMany({ where: { analysisId: analysis.id } });
      await prisma.analysisInsight.deleteMany({ where: { analysisId: analysis.id } });
    }

    // 2. GPT public knowledge (low-priority source)
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

    // 3. Determine which dimensions to analyze based on mode and subscription tier
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
    const completedCategories: string[] = [];

    // Idempotent saver to avoid duplicates when re-running
    const saveDimension = async (analysisId: string, dimensionMeta: any, result: any) => {
      const existing = await prisma.analysisDimension.findFirst({
        where: { analysisId, dimensionId: dimensionMeta.id },
      });
      if (existing) {
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
    };

    // 4. Run analysis for each dimension in small batches to reduce load
    // Low-memory mode tuned: 2 at a time in production to improve throughput without OOM
    const batchSize = process.env.NODE_ENV === 'production' ? 2 : 3;
    for (let idx = 0; idx < dimensionsToAnalyze.length; idx += batchSize) {
      const batch = dimensionsToAnalyze.slice(idx, idx + batchSize);
      for (const dimension of batch) {
        try {
          // Analyze with simple retry/backoff
          let result: any | null = null;
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              result = await analyzeDimension(
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
              );
              break;
            } catch (e) {
              if (attempt === 2) throw e;
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }

          // Save idempotently
          // Save idempotently (avoid storing full prompt to reduce DB size)
          await saveDimension(analysis.id, dimension, result);

          // Update progress
          completed++;
          const progress = Math.round((completed / totalDimensions) * 100);

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

          await prisma.deepAnalysis.update({
            where: { id: analysis.id },
            data: { progress },
          });

          console.log(
            `📊 Progress: ${completed}/${totalDimensions} (${progress}%) - ${dimension.name}`,
          );

          // Call progress callback if provided
          if (options.onProgress) {
            await options.onProgress(completed, totalDimensions, completedCategories);
          }

          // Progress is automatically tracked via database
          // SSE endpoint reads directly from DeepAnalysis table

          // Generate insights from this dimension if critical
          if (dimension.priority === 'critical' && result.redFlags.length > 0) {
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
          console.error(`Error analyzing dimension ${dimension.id}:`, error);
          // Continue with other dimensions
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

    // 4. Calculate overall scores
    const allDimensions = await prisma.analysisDimension.findMany({
      where: { analysisId: analysis.id, analyzed: true },
    });

    const avgScore =
      allDimensions.length > 0
        ? Math.round(
            allDimensions.reduce((sum, d) => sum + (d.score || 0), 0) / allDimensions.length,
          )
        : 0;

    const investmentReadiness = Math.round(avgScore / 10); // Convert to 0-10 scale

    // 5. Mark analysis as complete
    await prisma.deepAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        overallScore: avgScore,
        investmentReadiness,
      },
    });

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
        autoMatchStartupWithVCs(sessionId).catch((e) =>
          console.error('Auto-matching failed:', e),
        );
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
): Promise<DeepAnalysisResult> {
  const openai = getOpenAIClient();

  // gpt-5 / gpt-5-mini: temperature not used; response_format unsupported on gpt-5*

  // Combine all available content (enriched with LinkedIn, GitHub, Product Hunt)
  const fullContent = `
# Company Intelligence Report

${scrapedContent}

## Uploaded Documents:
${uploadedDocuments.join('\n\n---\n\n')}
  `.slice(0, 6000);

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

    return {
      dimension: dimension.id,
      score: Number.isFinite(result.score) ? Math.max(0, Math.min(100, Number(result.score))) : 0,
      findings: Array.isArray(result.findings) ? result.findings.slice(0, 3) : [],
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
