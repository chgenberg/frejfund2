/**
 * Gap Analysis Engine
 * Identifies missing data and generates targeted questions for Freja
 */

import { getDeepAnalysis } from './deep-analysis-runner';

export interface DataGap {
  dimensionId: string;
  dimensionName: string;
  category: string;
  currentScore: number;
  targetScore: number;
  missingInfo: string[];
  suggestedDocuments: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  questions: string[];
  potentialScoreIncrease: number;
}

export interface GapAnalysisResult {
  totalGaps: number;
  criticalGaps: number;
  potentialScoreIncrease: number;
  gaps: DataGap[];
  nextBestAction: DataGap | null;
  estimatedTimeToComplete: string;
}

/**
 * Analyze all dimensions and identify data gaps
 */
export async function analyzeDataGaps(sessionId: string): Promise<GapAnalysisResult> {
  const analysis = await getDeepAnalysis(sessionId);
  
  if (!analysis || analysis.status !== 'completed') {
    return {
      totalGaps: 0,
      criticalGaps: 0,
      potentialScoreIncrease: 0,
      gaps: [],
      nextBestAction: null,
      estimatedTimeToComplete: 'N/A'
    };
  }

  const gaps: DataGap[] = [];
  let totalPotentialIncrease = 0;

  for (const dimension of analysis.dimensions) {
    const score = dimension.score || 0;
    
    // Only analyze dimensions with score < 80
    if (score >= 80) continue;

    const gap = identifyGapForDimension(dimension);
    if (gap && gap.missingInfo.length > 0) {
      gaps.push(gap);
      totalPotentialIncrease += gap.potentialScoreIncrease;
    }
  }

  // Sort by priority and potential increase
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  gaps.sort((a, b) => {
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialScoreIncrease - a.potentialScoreIncrease;
  });

  const criticalGaps = gaps.filter(g => g.priority === 'critical').length;
  const estimatedTime = estimateCompletionTime(gaps);

  return {
    totalGaps: gaps.length,
    criticalGaps,
    potentialScoreIncrease: totalPotentialIncrease,
    gaps,
    nextBestAction: gaps[0] || null,
    estimatedTimeToComplete: estimatedTime
  };
}

/**
 * Identify specific gaps for a dimension
 */
function identifyGapForDimension(dimension: any): DataGap | null {
  const score = dimension.score || 0;
  const name = dimension.name;
  const category = dimension.category;
  
  // Map dimension to required data
  const gapMapping: Record<string, {
    missingInfo: string[];
    documents: string[];
    questions: string[];
  }> = {
    'Unit Economics': {
      missingInfo: ['CAC', 'LTV', 'Payback period', 'Gross margin'],
      documents: ['Financial model', 'KPI dashboard', 'P&L statement'],
      questions: [
        'What is your Customer Acquisition Cost (CAC)?',
        'What is your average Customer Lifetime Value (LTV)?',
        'How long does it take to recover CAC?',
        'What are your gross margins per customer?'
      ]
    },
    'Revenue Growth': {
      missingInfo: ['Monthly revenue', 'Growth rate', 'Revenue breakdown'],
      documents: ['Financial statements', 'KPI dashboard', 'Revenue reports'],
      questions: [
        'What was your revenue last month vs this month?',
        'What is your month-over-month growth rate?',
        'Can you share a revenue breakdown by customer segment?'
      ]
    },
    'Customer Retention': {
      missingInfo: ['Churn rate', 'Retention cohorts', 'NPS score'],
      documents: ['Churn analysis', 'Cohort retention data', 'Customer surveys'],
      questions: [
        'What is your monthly churn rate?',
        'Do you track retention by cohort?',
        'What is your Net Promoter Score?'
      ]
    },
    'Product-Market Fit': {
      missingInfo: ['Customer feedback', 'Usage metrics', 'Testimonials'],
      documents: ['Customer testimonials', 'Usage analytics', 'Case studies'],
      questions: [
        'How many customers would be "very disappointed" if you shut down?',
        'What are your daily/weekly active user metrics?',
        'Can you share customer testimonials or case studies?'
      ]
    },
    'Market Size': {
      missingInfo: ['TAM/SAM/SOM', 'Market research', 'Competitor data'],
      documents: ['Market research report', 'Competitive analysis', 'Industry reports'],
      questions: [
        'What is your Total Addressable Market (TAM)?',
        'What is your Serviceable Addressable Market (SAM)?',
        'Do you have market research or industry reports?'
      ]
    },
    'Competitive Moat': {
      missingInfo: ['Unique advantages', 'Patents', 'Network effects'],
      documents: ['IP documentation', 'Technology description', 'Competitive analysis'],
      questions: [
        'What prevents competitors from copying your solution?',
        'Do you have any patents or proprietary technology?',
        'Are there network effects in your business model?'
      ]
    },
    'Team Composition': {
      missingInfo: ['Team bios', 'Previous experience', 'Advisors'],
      documents: ['Team CVs', 'LinkedIn profiles', 'Advisory board list'],
      questions: [
        'What is your background and previous experience?',
        'Who are your co-founders and what do they bring?',
        'Do you have advisors or board members?'
      ]
    },
    'Burn Rate': {
      missingInfo: ['Monthly expenses', 'Cash runway', 'Burn timeline'],
      documents: ['P&L statement', 'Cash flow statement', 'Budget'],
      questions: [
        'What are your monthly operating expenses?',
        'How many months of runway do you have?',
        'What is your biggest expense category?'
      ]
    },
    'Use of Funds': {
      missingInfo: ['Allocation plan', 'Milestones', 'ROI projections'],
      documents: ['Fundraising deck', 'Budget allocation', 'Milestone plan'],
      questions: [
        'How will you use the capital you raise?',
        'What specific milestones will each $100k unlock?',
        'What is your expected ROI timeline?'
      ]
    },
    'Customer Acquisition Cost': {
      missingInfo: ['CAC by channel', 'Marketing spend', 'Conversion rates'],
      documents: ['Marketing budget', 'Channel analytics', 'Ad performance'],
      questions: [
        'What is your CAC breakdown by acquisition channel?',
        'How much are you spending on marketing monthly?',
        'What are your conversion rates at each funnel stage?'
      ]
    },
    'Storytelling & Pitch': {
      missingInfo: ['Pitch deck', 'Company story', 'Vision statement'],
      documents: ['Pitch deck', 'One-pager', 'Company presentation'],
      questions: [
        'Can you share your pitch deck or investor presentation?',
        'How do you explain your company vision in one sentence?',
        'What is your origin story - why did you start this?'
      ]
    },
    'Founder Background': {
      missingInfo: ['Previous experience', 'Domain expertise', 'Track record'],
      documents: ['LinkedIn profile', 'CV/Resume', 'Previous ventures'],
      questions: [
        'What is your professional background and relevant experience?',
        'Have you built or exited companies before?',
        'What makes you uniquely qualified to solve this problem?'
      ]
    },
    'Financial Projections': {
      missingInfo: ['3-year forecast', 'Revenue model', 'Cost breakdown'],
      documents: ['Financial model', '3-year projections', 'Budget plan'],
      questions: [
        'Can you share your 3-year financial projections?',
        'What are your revenue assumptions and growth drivers?',
        'What is your path to profitability?'
      ]
    },
    'Valuation': {
      missingInfo: ['Valuation rationale', 'Comparables', 'Funding round details'],
      documents: ['Cap table', 'Previous funding docs', 'Valuation analysis'],
      questions: [
        'What valuation are you targeting for this round?',
        'What comparable companies are you using for valuation?',
        'How much equity are you offering?'
      ]
    },
    // Default for any other dimension
    'default': {
      missingInfo: ['Specific metrics', 'Supporting documentation'],
      documents: ['Relevant business documents'],
      questions: [`Can you provide more details about your ${name}?`]
    }
  };

  const mapping = gapMapping[name] || gapMapping['default'];
  
  // Calculate priority based on score and category
  let priority: 'critical' | 'high' | 'medium' | 'low';
  if (score < 40 && (category.includes('Problem') || category.includes('Market') || category.includes('Business Model'))) {
    priority = 'critical';
  } else if (score < 50) {
    priority = 'high';
  } else if (score < 65) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // Calculate potential score increase
  const potentialIncrease = Math.min(100 - score, 30); // Max 30 point increase per gap

  return {
    dimensionId: dimension.dimensionId,
    dimensionName: name,
    category,
    currentScore: score,
    targetScore: Math.min(score + potentialIncrease, 100),
    missingInfo: mapping.missingInfo,
    suggestedDocuments: mapping.documents,
    priority,
    questions: mapping.questions,
    potentialScoreIncrease: potentialIncrease
  };
}

/**
 * Get prioritized questions for Freja to ask
 */
export async function getNextQuestions(sessionId: string, limit: number = 3): Promise<string[]> {
  const gapAnalysis = await analyzeDataGaps(sessionId);
  
  if (gapAnalysis.gaps.length === 0) {
    return []; // No gaps - all good!
  }

  const questions: string[] = [];
  
  // Take top questions from critical/high priority gaps
  for (const gap of gapAnalysis.gaps) {
    if (questions.length >= limit) break;
    if (gap.priority === 'critical' || gap.priority === 'high') {
      questions.push(...gap.questions.slice(0, 1));
    }
  }

  return questions.slice(0, limit);
}

/**
 * Get formatted gap summary for Freja
 */
export async function getGapSummaryForFreja(sessionId: string): Promise<string> {
  const gapAnalysis = await analyzeDataGaps(sessionId);
  
  if (gapAnalysis.totalGaps === 0) {
    return 'No data gaps identified - excellent coverage! 🎯';
  }

  const summary: string[] = [];
  
  summary.push(`=== DATA GAPS IDENTIFIED (${gapAnalysis.totalGaps} areas) ===`);
  summary.push(`Critical gaps: ${gapAnalysis.criticalGaps}`);
  summary.push(`Potential score increase: +${gapAnalysis.potentialScoreIncrease} points`);
  summary.push(`Est. completion time: ${gapAnalysis.estimatedTimeToComplete}\n`);
  
  // List critical gaps
  const criticalGaps = gapAnalysis.gaps.filter(g => g.priority === 'critical');
  if (criticalGaps.length > 0) {
    summary.push('CRITICAL GAPS (ask for these first):');
    criticalGaps.forEach(gap => {
      summary.push(`\n${gap.dimensionName} (${gap.currentScore}% → ${gap.targetScore}%)`);
      summary.push(`  Missing: ${gap.missingInfo.join(', ')}`);
      summary.push(`  Documents needed: ${gap.suggestedDocuments.join(', ')}`);
      summary.push(`  Ask: ${gap.questions[0]}`);
    });
  }

  // List high-priority gaps
  const highGaps = gapAnalysis.gaps.filter(g => g.priority === 'high').slice(0, 3);
  if (highGaps.length > 0) {
    summary.push('\n\nHIGH PRIORITY GAPS:');
    highGaps.forEach(gap => {
      summary.push(`- ${gap.dimensionName}: ${gap.missingInfo[0]} (ask: "${gap.questions[0]}")`);
    });
  }

  summary.push(`\n\nINSTRUCTIONS FOR FREJA:`);
  summary.push(`1. Ask for ONE data gap at a time (start with critical)`);
  summary.push(`2. Guide the user on HOW to get the data if they don't have it`);
  summary.push(`3. Accept file uploads directly in chat (drag & drop or upload)`);
  summary.push(`4. When user provides data/uploads file → confirm and move to next gap`);
  summary.push(`5. Show progress: "X of Y data gaps remaining"`);

  return summary.join('\n');
}

/**
 * Estimate time to complete all gaps
 */
function estimateCompletionTime(gaps: DataGap[]): string {
  const criticalCount = gaps.filter(g => g.priority === 'critical').length;
  const highCount = gaps.filter(g => g.priority === 'high').length;
  
  // Assume: critical = 10min, high = 5min, medium = 3min, low = 2min
  const totalMinutes = (criticalCount * 10) + (highCount * 5) + 
                       (gaps.filter(g => g.priority === 'medium').length * 3) +
                       (gaps.filter(g => g.priority === 'low').length * 2);
  
  if (totalMinutes < 15) return '10-15 minutes';
  if (totalMinutes < 30) return '15-30 minutes';
  if (totalMinutes < 60) return '30-60 minutes';
  return '1-2 hours';
}

/**
 * Mark a gap as completed when user provides data
 */
export async function markGapCompleted(sessionId: string, dimensionId: string): Promise<void> {
  // This will trigger a targeted re-analysis of the dimension
  // which will update the score and remove it from gaps
  console.log(`Gap completed for dimension ${dimensionId} in session ${sessionId}`);
}

