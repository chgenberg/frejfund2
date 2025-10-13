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
}

/**
 * Main function to run deep analysis
 * This will be called after initial scraping is complete
 */
export async function runDeepAnalysis(options: RunDeepAnalysisOptions): Promise<string> {
  const { sessionId, businessInfo, scrapedContent, uploadedDocuments = [], mode = 'progressive' } = options;
  
  try {
    // 1. Create DeepAnalysis record in database
    const analysis = await prisma.deepAnalysis.create({
      data: {
        sessionId,
        userId: businessInfo.email, // Use email as userId for now
        status: 'analyzing',
        progress: 0
      }
    });

    // 2. Determine which dimensions to analyze
    const dimensionsToAnalyze = mode === 'critical-only' 
      ? getCriticalDimensions()
      : ANALYSIS_DIMENSIONS;

    const totalDimensions = dimensionsToAnalyze.length;
    let completed = 0;

    // 3. Run analysis for each dimension
    for (const dimension of dimensionsToAnalyze) {
      try {
        // Analyze this dimension
        const result = await analyzeDimension(
          dimension,
          businessInfo,
          scrapedContent,
          uploadedDocuments
        );

        // Save to database
        await prisma.analysisDimension.create({
          data: {
            analysisId: analysis.id,
            dimensionId: dimension.id,
            category: dimension.category,
            name: dimension.name,
            score: result.score,
            findings: result.findings,
            redFlags: result.redFlags,
            strengths: result.strengths,
            questions: result.questionsToAsk,
            evidence: [], // Could extract specific quotes
            analyzed: true,
            analyzedAt: new Date(),
            prompt: dimension.prompt(businessInfo, scrapedContent),
            modelUsed: getChatModel('simple')
          }
        });

        // Update progress
        completed++;
        const progress = Math.round((completed / totalDimensions) * 100);
        
        await prisma.deepAnalysis.update({
          where: { id: analysis.id },
          data: { progress }
        });

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

        // Progressive mode: Add delay to avoid rate limits
        if (mode === 'progressive') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`Error analyzing dimension ${dimension.id}:`, error);
        // Continue with other dimensions
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
  
  // Combine all available content
  const fullContent = `
Website Content:
${scrapedContent}

Uploaded Documents:
${uploadedDocuments.join('\n\n')}
  `.slice(0, 8000); // Limit to prevent token overflow

  // Build the analysis prompt
  const analysisPrompt = `${dimension.prompt(businessInfo, fullContent)}

Based on the above information, provide a structured analysis in JSON format:
{
  "score": <number 0-100>,
  "findings": ["finding1", "finding2", ...],
  "redFlags": ["concern1", "concern2", ...],
  "strengths": ["strength1", "strength2", ...],
  "questionsToAsk": ["question1", "question2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...]
}

Be specific and reference actual data from the content when possible.`;

  try {
    const response = await openai.chat.completions.create({
      model: getChatModel('simple'),
      messages: [
        {
          role: 'system',
          content: 'You are an expert investment analyst. Analyze startups objectively and provide structured feedback in JSON format.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3, // Lower for more consistent analysis
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      dimension: dimension.id,
      score: result.score || 50,
      findings: result.findings || [],
      redFlags: result.redFlags || [],
      strengths: result.strengths || [],
      questionsToAsk: result.questionsToAsk || [],
      suggestions: result.suggestions || []
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
  return await prisma.deepAnalysis.findUnique({
    where: { sessionId },
    include: {
      dimensions: true,
      insights: {
        where: { addressed: false },
        orderBy: [
          { priority: 'asc' }, // critical first
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
