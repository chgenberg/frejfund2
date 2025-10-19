/**
 * Freja Coaching Engine
 * Uses deep analysis results to provide intelligent, context-aware coaching
 */

import {
  getDeepAnalysis,
  getUnansweredQuestions,
  getCriticalRedFlags,
} from './deep-analysis-runner';
import { BusinessInfo } from '@/types/business';
import { analyzeDataGaps, getGapSummaryForFreja } from './gap-analysis';

/**
 * Get enhanced coaching context from deep analysis
 * NOW WITH: proactive triggers, dimension references, evidence citations, smart questions
 */
export async function getFrejaCoachingContext(sessionId: string): Promise<string> {
  const analysis = await getDeepAnalysis(sessionId);

  if (!analysis || analysis.status !== 'completed') {
    return 'Deep analysis is still running. Using basic context for now.';
  }

  // Build comprehensive context for Freja
  const context: string[] = [];

  context.push(`=== DEEP ANALYSIS INTELLIGENCE (95 dimensions) ===`);
  context.push(`Investment Readiness: ${analysis.investmentReadiness}/10`);
  context.push(`Overall Score: ${analysis.overallScore}/100`);
  context.push(`Completed: ${new Date(analysis.completedAt || '').toLocaleDateString()}\n`);

  // === PROACTIVE COACHING TRIGGERS ===
  context.push(`--- PROACTIVE COACHING ALERTS ---`);
  const triggers: string[] = [];

  for (const dim of analysis.dimensions) {
    const score = dim.score || 0;

    // Trigger 1: Critical dimensions with low scores
    if (
      score < 50 &&
      [
        'Problem & Solution',
        'Market & Competition',
        'Business Model',
        'Traction & Growth',
      ].includes(dim.category)
    ) {
      triggers.push(
        `🚨 URGENT: ${dim.name} (${score}%) - ${dim.redFlags?.[0] || 'Needs immediate attention'}`,
      );
    }

    // Trigger 2: High-impact opportunities
    if (score >= 40 && score < 70 && dim.category.includes('Traction')) {
      triggers.push(`💡 OPPORTUNITY: ${dim.name} (${score}%) - Quick wins available`);
    }

    // Trigger 3: Strengths to leverage
    if (score >= 85) {
      triggers.push(
        `✅ LEVERAGE: ${dim.name} (${score}%) - ${dim.strengths?.[0] || 'Strong asset to highlight'}`,
      );
    }
  }

  if (triggers.length > 0) {
    context.push(triggers.slice(0, 5).join('\n'));
  } else {
    context.push('No critical alerts - good foundation overall');
  }
  context.push('');

  // === DIMENSION-SPECIFIC CONTEXT WITH EVIDENCE ===
  context.push(`--- DETAILED DIMENSION INSIGHTS ---`);

  // Group by category
  const categoryData: Record<string, any[]> = {};
  for (const dim of analysis.dimensions) {
    if (!categoryData[dim.category]) categoryData[dim.category] = [];
    categoryData[dim.category].push(dim);
  }

  for (const [category, dimensions] of Object.entries(categoryData)) {
    const avgScore = Math.round(
      dimensions.reduce((sum, d) => sum + (d.score || 0), 0) / dimensions.length,
    );
    context.push(`\n${category} (Average: ${avgScore}/100):`);

    // For each dimension, include actionable context
    for (const dim of dimensions) {
      const score = dim.score || 0;
      const evidence = (dim.evidence || []).slice(0, 1).join(' ');

      context.push(`  • ${dim.name}: ${score}%`);

      if (score < 60 && dim.redFlags && dim.redFlags.length > 0) {
        context.push(`    ⚠️ Issue: ${dim.redFlags[0]}`);
        if (evidence) context.push(`    📄 Evidence: ${evidence.slice(0, 120)}`);
      } else if (score >= 80 && dim.strengths && dim.strengths.length > 0) {
        context.push(`    ✅ Strength: ${dim.strengths[0]}`);
      }

      if (dim.findings && dim.findings.length > 0) {
        context.push(`    📊 Finding: ${dim.findings[0]}`);
      }
    }
  }

  // === SMART QUESTIONS (avoiding duplicates) ===
  context.push(`\n--- UNANSWERED STRATEGIC QUESTIONS ---`);
  const allQuestions = await getUnansweredQuestions(sessionId);
  const uniqueQuestions = [...new Set(allQuestions)]; // Deduplicate

  if (uniqueQuestions.length > 0) {
    context.push('Ask these when relevant (prioritized by impact):');
    uniqueQuestions.slice(0, 7).forEach((q, i) => {
      context.push(`${i + 1}. ${q}`);
    });
  } else {
    context.push('All key questions addressed ✅');
  }

  // === CRITICAL ACTIONS ===
  const redFlags = await getCriticalRedFlags(sessionId);
  if (redFlags.length > 0) {
    context.push(`\n--- CRITICAL ACTIONS NEEDED ---`);
    redFlags.slice(0, 3).forEach((flag) => {
      context.push(`⚠️ ${flag.dimension}: ${flag.issue}`);
      context.push(`   → Fix: ${flag.recommendation || 'Address before fundraising'}`);
    });
  }

  // === DATA GAPS & PROGRESSIVE QUESTIONING ===
  try {
    const gapSummary = await getGapSummaryForFreja(sessionId);
    if (gapSummary && !gapSummary.includes('No data gaps')) {
      context.push(`\n${gapSummary}`);
    }
  } catch (error) {
    console.log('Gap analysis not available');
  }

  // === COACHING INSTRUCTIONS ===
  context.push(`\n--- FREJA COACHING RULES ---`);
  context.push(
    `1. ALWAYS reference specific dimensions when giving advice (e.g., "According to your Unit Economics analysis...")`,
  );
  context.push(`2. CITE evidence when available (e.g., "Your website mentions X, but...")`);
  context.push(`3. BE PROACTIVE: Point out low-scoring dimensions without being asked`);
  context.push(`4. TRACK PROGRESS: Compare to previous conversations when relevant`);
  context.push(
    `5. ASK SMART QUESTIONS: Use unanswered questions above, avoid asking what you already know`,
  );
  context.push(`6. BE SPECIFIC: Always give concrete numbers, timelines, and next steps`);
  context.push(
    `7. PROGRESSIVE QUESTIONING: If data gaps exist, ask for ONE gap at a time, guide user on how to obtain it`,
  );
  context.push(`8. ACCEPT UPLOADS: Tell user they can drag & drop documents directly in chat`);
  context.push(
    `9. CELEBRATE PROGRESS: When user fills a gap, acknowledge improvement and move to next`,
  );

  return context.join('\n');
}

/**
 * Get specific dimension data for detailed discussion
 */
export async function getDimensionDetails(sessionId: string, dimensionId: string) {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis) return null;

  const dimension = analysis.dimensions.find((d) => d.dimensionId === dimensionId);
  return dimension;
}

/**
 * Get coaching questions based on analysis
 */
export async function getSmartCoachingQuestions(sessionId: string, limit = 5): Promise<string[]> {
  const analysis = await getDeepAnalysis(sessionId);
  if (!analysis || analysis.status !== 'completed') {
    return [
      "What's your biggest challenge right now?",
      'Tell me about your customer acquisition strategy',
      'What metrics are you tracking?',
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
    if (score < 40)
      priority += 20; // Very low score
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
    .map((q) => q.question);
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
    .filter(
      (d) =>
        d.category.includes('Problem') ||
        d.category.includes('Business Model') ||
        d.category.includes('Traction'),
    )
    .sort((a, b) => (a.score || 0) - (b.score || 0));

  if (criticalDimensions.length === 0) return null;

  const lowestDim = criticalDimensions[0];

  return {
    action: lowestDim.questions?.[0] || `Improve your ${lowestDim.name}`,
    reason: lowestDim.redFlags?.[0] || `This dimension scores only ${lowestDim.score}/100`,
    priority: (lowestDim.score || 0) < 40 ? 'critical' : 'high',
    category: lowestDim.category,
  };
}

/**
 * Track progress over time - compare current vs previous analysis
 */
export async function getProgressComparison(sessionId: string): Promise<string> {
  const { prisma } = await import('./prisma');

  // Get all completed analyses for this session, ordered by date
  const analyses = await prisma.deepAnalysis.findMany({
    where: { sessionId, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    take: 2,
    include: { dimensions: true },
  });

  if (analyses.length < 2) {
    return 'First analysis - no historical comparison available yet.';
  }

  const [current, previous] = analyses;
  const comparison: string[] = [];

  comparison.push(`=== PROGRESS SINCE LAST ANALYSIS ===`);
  comparison.push(`Last analysis: ${new Date(previous.completedAt || '').toLocaleDateString()}`);
  comparison.push(
    `Current analysis: ${new Date(current.completedAt || '').toLocaleDateString()}\n`,
  );

  // Compare overall scores
  const scoreDelta = (current.overallScore || 0) - (previous.overallScore || 0);
  if (scoreDelta > 0) {
    comparison.push(
      `📈 Overall improvement: +${scoreDelta} points (${previous.overallScore} → ${current.overallScore})`,
    );
  } else if (scoreDelta < 0) {
    comparison.push(
      `📉 Overall decline: ${scoreDelta} points (${previous.overallScore} → ${current.overallScore})`,
    );
  } else {
    comparison.push(`➡️ Overall score stable at ${current.overallScore}/100`);
  }

  // Find biggest improvements and declines
  const improvements: string[] = [];
  const declines: string[] = [];

  for (const currDim of current.dimensions) {
    const prevDim = previous.dimensions.find((d) => d.dimensionId === currDim.dimensionId);
    if (!prevDim) continue;

    const delta = (currDim.score || 0) - (prevDim.score || 0);
    if (delta >= 10) {
      improvements.push(`  ✅ ${currDim.name}: +${delta}% (${prevDim.score} → ${currDim.score})`);
    } else if (delta <= -10) {
      declines.push(`  ⚠️ ${currDim.name}: ${delta}% (${prevDim.score} → ${currDim.score})`);
    }
  }

  if (improvements.length > 0) {
    comparison.push(`\nBiggest Improvements:`);
    comparison.push(improvements.slice(0, 3).join('\n'));
  }

  if (declines.length > 0) {
    comparison.push(`\nAreas Needing Attention:`);
    comparison.push(declines.slice(0, 3).join('\n'));
  }

  return comparison.join('\n');
}
