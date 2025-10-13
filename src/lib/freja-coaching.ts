/**
 * Freja Coaching Engine
 * Uses deep analysis results to provide intelligent, context-aware coaching
 */

import { getDeepAnalysis, getUnansweredQuestions, getCriticalRedFlags } from './deep-analysis-runner';
import { BusinessInfo } from '@/types/business';

/**
 * Get enhanced coaching context from deep analysis
 */
export async function getFrejaCoachingContext(sessionId: string): Promise<string> {
  const analysis = await getDeepAnalysis(sessionId);
  
  if (!analysis || analysis.status !== 'completed') {
    return 'Deep analysis is still running. Using basic context for now.';
  }

  // Build comprehensive context for Freja
  const context: string[] = [];

  context.push(`DEEP ANALYSIS COMPLETED (${analysis.dimensions.length} dimensions analyzed)`);
  context.push(`Overall Investment Readiness: ${analysis.investmentReadiness}/10`);
  context.push(`Overall Score: ${analysis.overallScore}/100\n`);

  // Group dimensions by category with scores
  const categoryData: Record<string, any[]> = {};
  for (const dim of analysis.dimensions) {
    if (!categoryData[dim.category]) {
      categoryData[dim.category] = [];
    }
    categoryData[dim.category].push(dim);
  }

  // Summarize each category
  for (const [category, dimensions] of Object.entries(categoryData)) {
    const avgScore = Math.round(
      dimensions.reduce((sum, d) => sum + (d.score || 0), 0) / dimensions.length
    );
    
    context.push(`**${category}** (${avgScore}/100):`);
    
    // List low-scoring dimensions in this category
    const weakDimensions = dimensions.filter(d => (d.score || 0) < 60);
    if (weakDimensions.length > 0) {
      context.push(`  ⚠️ Weak areas: ${weakDimensions.map(d => d.name).join(', ')}`);
      
      // Add specific red flags
      for (const dim of weakDimensions) {
        if (dim.redFlags && dim.redFlags.length > 0) {
          context.push(`    - ${dim.name}: ${dim.redFlags[0]}`);
        }
      }
    }
    
    // List strengths
    const strongDimensions = dimensions.filter(d => (d.score || 0) >= 80);
    if (strongDimensions.length > 0) {
      context.push(`  ✅ Strengths: ${strongDimensions.map(d => d.name).join(', ')}`);
    }
    
    context.push('');
  }

  // Add critical insights
  if (analysis.insights && analysis.insights.length > 0) {
    context.push('\nCRITICAL INSIGHTS:');
    for (const insight of analysis.insights.slice(0, 5)) {
      context.push(`- [${insight.priority.toUpperCase()}] ${insight.title}: ${insight.description}`);
      if (insight.recommendation) {
        context.push(`  → Recommendation: ${insight.recommendation}`);
      }
    }
  }

  // Add unanswered questions
  const unansweredQuestions = await getUnansweredQuestions(sessionId);
  if (unansweredQuestions.length > 0) {
    context.push('\nKEY QUESTIONS TO ASK FOUNDER:');
    unansweredQuestions.slice(0, 5).forEach((q, i) => {
      context.push(`${i + 1}. ${q}`);
    });
  }

  // Add critical red flags
  const redFlags = await getCriticalRedFlags(sessionId);
  if (redFlags.length > 0) {
    context.push('\nCRITICAL RED FLAGS:');
    redFlags.forEach(flag => {
      context.push(`⚠️ ${flag.category} - ${flag.dimension}: ${flag.issue}`);
    });
  }

  return context.join('\n');
}

/**
 * Get specific dimension data for detailed discussion
 */
export async function getDimensionDetails(sessionId: string, dimensionId: string) {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis) return null;

  const dimension = analysis.dimensions.find(d => d.dimensionId === dimensionId);
  return dimension;
}

/**
 * Get coaching questions based on analysis
 */
export async function getSmartCoachingQuestions(sessionId: string, limit = 5): Promise<string[]> {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis || analysis.status !== 'completed') {
    return [
      'What\'s your biggest challenge right now?',
      'Tell me about your customer acquisition strategy',
      'What metrics are you tracking?'
    ];
  }

  // Prioritize questions from:
  // 1. Critical dimensions with low scores
  // 2. High-priority dimensions with missing data
  // 3. Red flags that need addressing

  const allQuestions: Array<{ question: string; priority: number }> = [];

  for (const dim of analysis.dimensions) {
    const score = dim.score || 50;
    let priority = 0;

    // Calculate priority score
    if (dim.category.includes('Problem') || dim.category.includes('Market')) priority += 10;
    if (score < 40) priority += 20; // Very low score
    else if (score < 60) priority += 10; // Low score
    if (dim.redFlags && dim.redFlags.length > 0) priority += 15;

    // Add questions from this dimension
    for (const question of dim.questions || []) {
      allQuestions.push({ question, priority });
    }
  }

  // Sort by priority and return top questions
  return allQuestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map(q => q.question);
}

/**
 * Get next best action based on deep analysis
 */
export async function getNextBestActionFromAnalysis(sessionId: string): Promise<{
  action: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
  category: string;
} | null> {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis) return null;

  // Find the lowest-scoring critical dimension
  const criticalDimensions = analysis.dimensions
    .filter(d => d.category.includes('Problem') || d.category.includes('Business Model') || d.category.includes('Traction'))
    .sort((a, b) => (a.score || 0) - (b.score || 0));

  if (criticalDimensions.length === 0) return null;

  const lowestDim = criticalDimensions[0];
  
  return {
    action: lowestDim.questions?.[0] || `Improve your ${lowestDim.name}`,
    reason: lowestDim.redFlags?.[0] || `This dimension scores only ${lowestDim.score}/100`,
    priority: (lowestDim.score || 0) < 40 ? 'critical' : 'high',
    category: lowestDim.category
  };
}
