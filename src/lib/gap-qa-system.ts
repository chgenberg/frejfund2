/**
 * Gap-driven Q&A System
 * Identifies gaps in analysis and generates targeted questions
 */

import { prisma } from '@/lib/prisma';
import { ANALYSIS_DIMENSIONS } from './deep-analysis-framework';
import { FREE_TIER_DIMENSIONS } from './free-tier-dimensions';
import { getChatModel, getOpenAIClient } from './ai-client';
import OpenAI from 'openai';

export interface AnalysisGap {
  dimensionId: string;
  dimensionName: string;
  category: string;
  gapType: 'missing_data' | 'low_confidence' | 'needs_clarification';
  requiredSources: string[];
  suggestedQuestions: string[];
  potentialDocuments: string[];
}

export interface GapQuestion {
  id: string;
  dimensionId: string;
  question: string;
  helpText: string;
  inputType: 'text' | 'number' | 'select' | 'multiselect' | 'file';
  options?: string[]; // For select/multiselect
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Analyze completed dimensions and identify gaps
 */
export async function identifyAnalysisGaps(sessionId: string): Promise<AnalysisGap[]> {
  // Get the analysis and its dimensions
  const analysis = await prisma.deepAnalysis.findUnique({
    where: { sessionId },
    include: {
      dimensions: true,
    },
  });

  if (!analysis) {
    throw new Error('Analysis not found');
  }

  const gaps: AnalysisGap[] = [];
  const analyzedDimensionIds = new Set(analysis.dimensions.map((d) => d.dimensionId));

  // Check for missing dimensions (not analyzed yet)
  const allDimensions =
    analysis.businessInfo?.analysisMode === 'free' ? FREE_TIER_DIMENSIONS : ANALYSIS_DIMENSIONS;

  for (const dimension of allDimensions) {
    if (!analyzedDimensionIds.has(dimension.id)) {
      // This dimension wasn't analyzed - likely due to missing data
      gaps.push({
        dimensionId: dimension.id,
        dimensionName: dimension.name,
        category: dimension.category,
        gapType: 'missing_data',
        requiredSources: (dimension as any).required_sources || [],
        suggestedQuestions: generateQuestionsForDimension(dimension),
        potentialDocuments: suggestDocumentsForDimension(dimension),
      });
    } else {
      // Check the quality of analyzed dimensions
      const analyzedDim = analysis.dimensions.find((d) => d.dimensionId === dimension.id);
      if (analyzedDim) {
        // Low score indicates potential gap
        if (analyzedDim.score < 50) {
          gaps.push({
            dimensionId: dimension.id,
            dimensionName: dimension.name,
            category: dimension.category,
            gapType: 'low_confidence',
            requiredSources: (dimension as any).required_sources || [],
            suggestedQuestions: generateClarifyingQuestions(dimension, analyzedDim),
            potentialDocuments: suggestDocumentsForDimension(dimension),
          });
        }

        // Check if dimension has many questions/red flags
        if (analyzedDim.questions.length > 3 || analyzedDim.redFlags.length > 2) {
          gaps.push({
            dimensionId: dimension.id,
            dimensionName: dimension.name,
            category: dimension.category,
            gapType: 'needs_clarification',
            requiredSources: (dimension as any).required_sources || [],
            suggestedQuestions: analyzedDim.questions.slice(0, 3),
            potentialDocuments: suggestDocumentsForDimension(dimension),
          });
        }
      }
    }
  }

  // Sort gaps by priority (critical dimensions first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => {
    const dimA = allDimensions.find((d) => d.id === a.dimensionId);
    const dimB = allDimensions.find((d) => d.id === b.dimensionId);
    return (
      (priorityOrder[dimA?.priority || 'low'] || 3) - (priorityOrder[dimB?.priority || 'low'] || 3)
    );
  });

  return gaps.slice(0, 10); // Return top 10 gaps
}

/**
 * Generate specific questions for a dimension
 */
function generateQuestionsForDimension(dimension: any): string[] {
  const questionMap: Record<string, string[]> = {
    'market-size': [
      'What is your total addressable market (TAM) in dollars?',
      'How many potential customers exist in your target market?',
      'What percentage of the market do you aim to capture in 3 years?',
    ],
    'unit-economics': [
      'What is your current Customer Acquisition Cost (CAC)?',
      'What is the average customer lifetime value (LTV)?',
      'What is your gross margin percentage?',
    ],
    'revenue-growth': [
      'What is your current monthly recurring revenue (MRR)?',
      'What was your MRR 6 months ago?',
      'How many paying customers do you have today?',
    ],
    'retention-metrics': [
      'What is your monthly churn rate?',
      'What percentage of customers renew after the first year?',
      'What is your net revenue retention (NRR)?',
    ],
    'founder-background': [
      'How many years of experience do you have in this industry?',
      'Have you built and scaled a company before?',
      'What unique insight led you to start this company?',
    ],
    'runway-burn': [
      'How many months of runway do you have left?',
      'What is your current monthly burn rate?',
      'When do you expect to reach profitability?',
    ],
  };

  return (
    questionMap[dimension.id] || [
      `Can you provide more details about ${dimension.name}?`,
      `What evidence supports your approach to ${dimension.name}?`,
      `How do you measure success for ${dimension.name}?`,
    ]
  );
}

/**
 * Generate clarifying questions based on low scores
 */
function generateClarifyingQuestions(dimension: any, analyzedDim: any): string[] {
  // Use the questions identified during analysis
  const analysisQuestions = analyzedDim.questions || [];

  // Add specific clarifying questions based on red flags
  const clarifyingQuestions: string[] = [];

  if (analyzedDim.redFlags.length > 0) {
    clarifyingQuestions.push(
      `How do you address this concern: ${analyzedDim.redFlags[0]}?`,
      `What steps are you taking to mitigate risks in ${dimension.name}?`,
    );
  }

  return [...analysisQuestions.slice(0, 2), ...clarifyingQuestions].slice(0, 3);
}

/**
 * Suggest documents that could help fill gaps
 */
function suggestDocumentsForDimension(dimension: any): string[] {
  const documentMap: Record<string, string[]> = {
    'market-size': ['Market research report', 'TAM analysis', 'Industry report'],
    'unit-economics': ['Financial model', 'P&L statement', 'Unit economics spreadsheet'],
    'revenue-growth': [
      'Revenue dashboard screenshot',
      'Stripe/payment processor export',
      'Growth metrics deck',
    ],
    'retention-metrics': ['Cohort analysis', 'Churn report', 'Customer analytics export'],
    'founder-background': [
      'Founder LinkedIn profiles',
      'Team bios',
      'Previous company case studies',
    ],
    'competitive-moat': [
      'Patent filings',
      'Technical architecture diagram',
      'Competitive analysis',
    ],
    'customer-love': ['Customer testimonials', 'NPS survey results', 'Case studies'],
    'funding-stage-appropriate': ['Pitch deck', 'Financial projections', 'Fundraising plan'],
  };

  const category = dimension.category.toLowerCase();
  const defaultDocs = {
    'business model': ['Pitch deck', 'Financial model', 'Pricing strategy doc'],
    traction: ['Metrics dashboard', 'Growth data export', 'Customer list'],
    team: ['Team slide', 'Org chart', 'Hiring plan'],
    market: ['Market analysis', 'Competitive landscape', 'Go-to-market strategy'],
  };

  return (
    documentMap[dimension.id] ||
    Object.entries(defaultDocs).find(([key]) => category.includes(key))?.[1] || [
      'Pitch deck',
      'Company overview',
      'Relevant metrics',
    ]
  );
}

/**
 * Generate smart questions using AI based on gaps
 */
export async function generateSmartQuestions(
  gaps: AnalysisGap[],
  businessInfo: any,
): Promise<GapQuestion[]> {
  // If no key, skip AI path and fall back immediately
  const hasKey = Boolean((process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '').trim());
  if (!hasKey) {
    return gaps.slice(0, 5).map((gap, i) => ({
      id: `gap-q-${i}`,
      dimensionId: gap.dimensionId,
      question: gap.suggestedQuestions[0] || `Tell us more about ${gap.dimensionName}`,
      helpText: `This helps us understand ${gap.category.toLowerCase()}`,
      inputType: 'text' as const,
      validation: { required: true },
    }));
  }

  const openai: OpenAI = getOpenAIClient() as any;

  const prompt = `You are helping gather missing information for an investment analysis.

Business: ${businessInfo.name || 'Unknown'} (${businessInfo.industry || 'Unknown industry'})
Stage: ${businessInfo.stage || 'Unknown'}

We have identified the following gaps in our analysis:
${gaps.map((g) => `- ${g.dimensionName}: ${g.gapType} (${g.category})`).join('\n')}

Generate 3-7 specific, actionable questions that will help fill these gaps.
Each question should be:
1. Specific and measurable (avoid vague questions)
2. Relevant to investment decision-making
3. Easy for a founder to answer with data they likely have

Return a JSON array of questions with this structure:
{
  "id": "unique-id",
  "dimensionId": "dimension-id-from-gaps",
  "question": "The specific question",
  "helpText": "Brief explanation of why this matters",
  "inputType": "text|number|select|file",
  "validation": { "required": true }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: getChatModel('simple'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"questions":[]}');
    return result.questions || [];
  } catch (error) {
    console.error('Error generating smart questions:', error);
    // Fallback to manual questions
    return gaps.slice(0, 5).map((gap, i) => ({
      id: `gap-q-${i}`,
      dimensionId: gap.dimensionId,
      question: gap.suggestedQuestions[0] || `Tell us more about ${gap.dimensionName}`,
      helpText: `This helps us understand ${gap.category.toLowerCase()}`,
      inputType: 'text' as const,
      validation: { required: true },
    }));
  }
}

/**
 * Save answers and trigger incremental reanalysis
 */
export async function saveGapAnswers(
  sessionId: string,
  answers: Record<string, any>,
): Promise<void> {
  // Store answers in the session or a new GapAnswers table
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      metadata: {
        gapAnswers: answers,
        gapAnsweredAt: new Date(),
      },
    },
  });
}

/**
 * Run incremental analysis on specific dimensions with new data
 */
export async function runIncrementalAnalysis(
  sessionId: string,
  dimensionIds: string[],
  additionalContext: string,
): Promise<void> {
  const { runDeepAnalysis } = await import('./deep-analysis-runner');

  // Get existing analysis data
  const analysis = await prisma.deepAnalysis.findUnique({
    where: { sessionId },
    include: { dimensions: true },
  });

  if (!analysis) {
    throw new Error('Analysis not found');
  }

  // Run analysis only on specific dimensions with additional context
  await runDeepAnalysis({
    sessionId,
    businessInfo: analysis.businessInfo as any,
    scrapedContent: additionalContext, // Use gap answers as additional context
    uploadedDocuments: [],
    mode: 'progressive',
    specificDimensions: dimensionIds,
  });
}
