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

    // 2. Determine which dimensions to analyze
    let dimensionsToAnalyze = mode === 'critical-only' 
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
            modelUsed: getChatModel('complex') // Use gpt-5 for deep analysis
          }
        });

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
  
  // Note: Using gpt-5 (o1) for deep reasoning - takes 2-5 min per dimension
  // gpt-5 doesn't support temperature or response_format
  
  // Combine all available content (enriched with LinkedIn, GitHub, Product Hunt)
  const fullContent = `
# Company Intelligence Report

${scrapedContent}

## Uploaded Documents Analysis:
${uploadedDocuments.join('\n\n---\n\n')}
  `.slice(0, 12000); // Increased limit for enriched data

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
      model: getChatModel('complex'), // Use gpt-5 for deep reasoning
      messages: [
        {
          role: 'system',
          content: `You are an expert investment analyst with access to comprehensive company intelligence including:
- Website content and marketing materials
- LinkedIn data (team size, hiring velocity, company growth)
- GitHub activity (technical execution, code quality, development velocity)
- Product Hunt traction (community validation, PMF signals)
- Uploaded business documents

Analyze startups objectively using ALL available data sources. Reference specific data points from LinkedIn, GitHub, and Product Hunt when relevant. Provide structured feedback in JSON format.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      // Note: gpt-5 (o1) doesn't support response_format
      // It will naturally produce structured JSON output from the prompt
      ...(getChatModel('complex').startsWith('gpt-5') ? {} : { response_format: { type: 'json_object' } })
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
  const analysis = await prisma.deepAnalysis.findUnique({
    where: { sessionId },
    include: {
      dimensions: {
        include: {
          insights: true
        }
      },
      insights: {
        where: { addressed: false },
        orderBy: [
          { priority: 'asc' }, // critical first
          { createdAt: 'desc' }
        ]
      }
    }
  });
  
  if (!analysis) return null;
  
  // Transform to match the UI format
  return {
    ...analysis,
    dimensions: analysis.dimensions.map(dim => ({
      id: dim.dimension,
      name: dim.name,
      category: dim.category,
      score: dim.score || 0,
      status: dim.status,
      findings: dim.insights?.filter(i => i.type === 'finding').map(i => i.content) || [],
      strengths: dim.insights?.filter(i => i.type === 'strength').map(i => i.content) || [],
      redFlags: dim.insights?.filter(i => i.type === 'red_flag').map(i => i.content) || [],
      recommendations: dim.insights?.filter(i => i.type === 'recommendation').map(i => i.content) || []
    }))
  };
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
