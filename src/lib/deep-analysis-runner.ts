/**
 * Deep Analysis Runner - Background processing for comprehensive company analysis
 * Runs all 68 dimensions and stores results in database
 */

import { BusinessInfo } from '@/types/business';
import { ANALYSIS_DIMENSIONS, DeepAnalysisResult, getCriticalDimensions } from './deep-analysis-framework';
import { getOpenAIClient, getChatModel } from './ai-client';
import { prisma } from './prisma';

interface RunDeepAnalysisOptions {
  sessionId: string;
  businessInfo: BusinessInfo;
  scrapedContent: string;
  uploadedDocuments?: string[];
  mode?: 'full' | 'critical-only' | 'progressive';
  specificDimensions?: string[]; // Only re-analyze these specific dimensions
}

/**
 * Main function to run deep analysis
 * This will be called after initial scraping is complete
 */
export async function runDeepAnalysis(options: RunDeepAnalysisOptions): Promise<string> {
  const { sessionId, businessInfo, scrapedContent, uploadedDocuments = [], mode = 'progressive', specificDimensions } = options;
  
  console.log(`🔬 Starting deep analysis for ${businessInfo.name} (${sessionId})`);
  console.log(`📋 Mode: ${mode}, Content length: ${scrapedContent.length}, Docs: ${uploadedDocuments.length}`);
  
  try {
    // 1. Create or reuse DeepAnalysis record (avoid P2002 on re-run)
    const analysis = await prisma.deepAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: businessInfo.email, // Use email as userId for now
        status: 'analyzing',
        progress: 0
      },
      update: {
        status: 'analyzing',
        // reset progress if a new run starts
        progress: 0,
        startedAt: new Date(),
      }
    });

    // If we are re-running for this session, clear prior dimension results/insights to avoid 95/95 at start
    await prisma.analysisDimension.deleteMany({ where: { analysisId: analysis.id } });
    await prisma.analysisInsight.deleteMany({ where: { analysisId: analysis.id } });

    // 2. Determine which dimensions to analyze
    let dimensionsToAnalyze = specificDimensions && specificDimensions.length > 0
      ? ANALYSIS_DIMENSIONS.filter(d => specificDimensions.includes(d.name))
      : mode === 'critical-only' 
        ? getCriticalDimensions()
        : ANALYSIS_DIMENSIONS;

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
        where: { analysisId, dimensionId: dimensionMeta.id }
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
            analyzed: true,
            analyzedAt: new Date(),
            prompt: dimensionMeta.prompt?.(businessInfo, scrapedContent),
            modelUsed: getChatModel('complex')
          }
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
            analyzed: true,
            analyzedAt: new Date(),
            prompt: dimensionMeta.prompt?.(businessInfo, scrapedContent),
            modelUsed: getChatModel('complex')
          }
        });
      }
    };

    // 3. Run analysis for each dimension in small batches to reduce load
    const batchSize = 5;
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
              scrapedContent,
              uploadedDocuments
            );
            break;
          } catch (e) {
            if (attempt === 2) throw e;
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }

        // Save idempotently
        await saveDimension(analysis.id, dimension, result);

        // Update progress
        completed++;
        const progress = Math.round((completed / totalDimensions) * 100);
        
        // Track completed categories
        if (!completedCategories.includes(dimension.priority)) {
          const categoryDimensions = dimensionsToAnalyze.filter(d => d.priority === dimension.priority);
          const categoryCompleted = categoryDimensions.every(d => 
            completed >= dimensionsToAnalyze.indexOf(d) + 1
          );
          if (categoryCompleted) {
            completedCategories.push(dimension.priority);
          }
        }
        
        await prisma.deepAnalysis.update({
          where: { id: analysis.id },
          data: { progress }
        });
        
        console.log(`📊 Progress: ${completed}/${totalDimensions} (${progress}%) - ${dimension.name}`);
        
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
              evidence: result.findings.slice(0, 2)
            }
          });
        }

        // Progressive mode: small delay between dimensions to avoid rate limits
        if (mode === 'progressive') {
          await new Promise(resolve => setTimeout(resolve, 250));
        }

      } catch (error) {
        console.error(`Error analyzing dimension ${dimension.id}:`, error);
        // Continue with other dimensions
      }
      }
      // Short pause between batches
      if (mode === 'progressive') {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // 4. Calculate overall scores
    const allDimensions = await prisma.analysisDimension.findMany({
      where: { analysisId: analysis.id, analyzed: true }
    });

    const avgScore = allDimensions.length > 0
      ? Math.round(allDimensions.reduce((sum, d) => sum + (d.score || 0), 0) / allDimensions.length)
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
        investmentReadiness
      }
    });

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
  uploadedDocuments: string[]
): Promise<DeepAnalysisResult> {
  
  const openai = getOpenAIClient();
  
  // gpt-5 / gpt-5-mini: temperature not used; response_format unsupported on gpt-5*
  
  // Combine all available content (enriched with LinkedIn, GitHub, Product Hunt)
  const fullContent = `
# Company Intelligence Report

${scrapedContent}

## Uploaded Documents:
${uploadedDocuments.join('\n\n---\n\n')}
  `.slice(0, 8000);

  // Build the analysis prompt – optimized for concise, value-dense output
  const analysisPrompt = `${dimension.prompt(businessInfo, fullContent)}

Return ONLY valid compact JSON using this schema (no extra text):
{
  "score": number,                       // 0-100
  "findings": string[],                  // max 3 items, <= 25 words each
  "redFlags": string[],                  // max 3
  "strengths": string[],                 // max 3
  "recommendations": string[],           // max 3, actionable
  "questionsToAsk": string[],            // max 3
  "evidence": [                          // up to 2 citations
    { "source": "website|document|github|producthunt|linkedin", "snippet": string, "url": string }
  ],
  "impactTag": "growth|risk|fundraising|product|team|market",
  "confidence": number                   // 0.0-1.0
}

Rules:
- Use the available content only; if insufficient, set arrays to [] and score to 0.
- Keep each list item short and specific.
- Do not include any commentary outside JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: getChatModel('complex'), // Use gpt-5 for deep reasoning
      messages: [
        {
          role: 'system',
          content: `You are an expert investment analyst. Be concise, factual, and strictly structured.
Use only the provided context. If data is missing, set empty arrays and low confidence.
Output must be valid JSON only.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      ...(getChatModel('complex').startsWith('gpt-5') ? {} : { response_format: { type: 'json_object' } }),
      ...(getChatModel('complex').startsWith('gpt-5') ? { max_completion_tokens: 1500 } : { max_tokens: 1500 })
    });

    const raw = response.choices?.[0]?.message?.content || '{}';
    let result: any = {};
    try {
      result = JSON.parse(raw);
    } catch {
      // best-effort: extract first JSON block
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try { result = JSON.parse(raw.slice(start, end + 1)); } catch {}
      }
    }
    
    const evidenceArray = Array.isArray(result.evidence) ? result.evidence : [];
    const evidenceStrings = evidenceArray.slice(0, 2).map((e: any) => {
      const src = e?.source ? String(e.source) : 'source';
      const snip = e?.snippet ? String(e.snippet) : '';
      const url = e?.url ? ` (${e.url})` : '';
      return `${src}: ${snip}${url}`.slice(0, 240);
    });

    return {
      dimension: dimension.id,
      score: Number.isFinite(result.score) ? Math.max(0, Math.min(100, Number(result.score))) : 0,
      findings: Array.isArray(result.findings) ? result.findings.slice(0, 3) : [],
      redFlags: Array.isArray(result.redFlags) ? result.redFlags.slice(0, 3) : [],
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 3) : [],
      questionsToAsk: Array.isArray(result.questionsToAsk) ? result.questionsToAsk.slice(0, 3) : [],
      suggestions: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 3) : (Array.isArray(result.suggestions) ? result.suggestions.slice(0, 3) : []),
      // store textual evidence in existing field
      evidence: evidenceStrings
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
      suggestions: []
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
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ]
      }
    }
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
        questions: dim.questions
      });
    }
  }

  return criticalIssues.slice(0, 5); // Top 5 most critical
}
