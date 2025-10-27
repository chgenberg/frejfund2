/**
 * Readiness Tree Builder
 * 
 * Converts flat 68-dimension analysis into hierarchical "Readiness Tree"
 * guiding founders exactly what they need to reach "investor ready" status
 * 
 * Tree Structure:
 * Company
 *  ├── 📋 Documents & Materials
 *  ├── 📊 Traction & Metrics  
 *  ├── 👥 Team & Experience
 *  ├── 🎯 Market & Business Model
 *  └── 🚀 Go-to-Market & Execution
 */

import { prisma } from '@/lib/prisma';
import { ReadinessBranchData, ReadinessItemData, ReadinessTreeData } from '@/types/business';

/**
 * Define the 5 main branches of investor readiness
 */
const READINESS_TREE_STRUCTURE = {
  documents: {
    displayName: '📋 Documents & Materials',
    description: 'Essential materials every investor needs to see',
    sequence: 1,
    isRequired: true,
    items: [
      {
        itemType: 'pitch_deck',
        displayName: 'Pitch Deck',
        importance: 'critical',
        guidancePrompt: 'What is your 10-15 slide pitch deck? Cover problem, solution, market, team, financials, and ask.',
        exampleAnswer: 'A professional deck with clear value prop, showing 2-3 year projections and team backgrounds.',
      },
      {
        itemType: 'financial_model',
        displayName: 'Financial Model',
        importance: 'high',
        guidancePrompt: 'Share your financial projections (3-5 years with monthly detail for year 1)',
        exampleAnswer: 'Spreadsheet with revenue forecast, CAC, LTV, burn rate, and unit economics',
      },
      {
        itemType: 'cap_table',
        displayName: 'Capitalization Table',
        importance: 'high',
        guidancePrompt: 'Who owns what % of the company? Include founders, investors, and option pools',
        exampleAnswer: 'Clear cap table showing ownership percentages post-funding',
      },
      {
        itemType: 'one_pager',
        displayName: '1-Pager Summary',
        importance: 'medium',
        guidancePrompt: 'Executive summary: problem, solution, traction, team, ask in 1 page',
        exampleAnswer: 'Professional 1-page PDF ready to forward to investors',
      },
      {
        itemType: 'due_diligence_doc',
        displayName: 'DD Document',
        importance: 'medium',
        guidancePrompt: 'Comprehensive doc with team bios, customer list, IP/legal status',
        exampleAnswer: '10-15 page document addressing common investor questions',
      },
    ],
  },
  
  traction: {
    displayName: '📊 Traction & Metrics',
    description: 'Hard evidence of market fit and growth',
    sequence: 2,
    isRequired: true,
    items: [
      {
        itemType: 'revenue',
        displayName: 'Revenue & MRR',
        importance: 'critical',
        guidancePrompt: 'What is your current MRR/ARR? Monthly growth rate?',
        exampleAnswer: '$45k MRR, growing 12% month-over-month',
      },
      {
        itemType: 'customers',
        displayName: 'Customer Count & Growth',
        importance: 'critical',
        guidancePrompt: 'How many paying customers? How fast growing?',
        exampleAnswer: '127 customers, acquired 15 this month',
      },
      {
        itemType: 'retention',
        displayName: 'Retention & Churn',
        importance: 'high',
        guidancePrompt: 'What % of customers stay? Monthly churn rate?',
        exampleAnswer: '95% monthly retention, 5% churn',
      },
      {
        itemType: 'unit_economics',
        displayName: 'Unit Economics',
        importance: 'high',
        guidancePrompt: 'LTV (lifetime value), CAC (customer acquisition cost), LTV/CAC ratio',
        exampleAnswer: 'LTV $8,500, CAC $1,200, Ratio 7:1 (healthy)',
      },
      {
        itemType: 'product_metrics',
        displayName: 'Product Metrics',
        importance: 'medium',
        guidancePrompt: 'DAU/MAU, engagement, activation rate, other key metrics',
        exampleAnswer: '2,400 monthly active users, 8% daily activation',
      },
    ],
  },

  team: {
    displayName: '👥 Team & Experience',
    description: 'Investor confidence in who will execute',
    sequence: 3,
    isRequired: true,
    items: [
      {
        itemType: 'founder_background',
        displayName: 'Founder Experience',
        importance: 'critical',
        guidancePrompt: 'What is your background? Relevant wins? Why you?',
        exampleAnswer: 'Ex-Google PM (8 years), built product from 0→$50M+ revenue',
      },
      {
        itemType: 'cofounder_fit',
        displayName: 'Co-founder Fit',
        importance: 'high',
        guidancePrompt: 'Why is your co-founder the right partner?',
        exampleAnswer: 'Ex-Stripe engineer, deep expertise in payments infrastructure',
      },
      {
        itemType: 'team_size',
        displayName: 'Team Size & Hiring',
        importance: 'high',
        guidancePrompt: 'How many people on team? Hiring plans for next 12 months?',
        exampleAnswer: '8 people today, planning to hire 6 more engineers',
      },
      {
        itemType: 'advisors',
        displayName: 'Advisors & Board',
        importance: 'medium',
        guidancePrompt: 'Who advises you? Industry veterans, domain experts?',
        exampleAnswer: 'Y Combinator alumni CEO, ex-Airbnb growth lead',
      },
      {
        itemType: 'culture',
        displayName: 'Culture & Diversity',
        importance: 'medium',
        guidancePrompt: 'What is your culture? Diversity metrics?',
        exampleAnswer: '50% women in leadership, strong bias for execution',
      },
    ],
  },

  market: {
    displayName: '🎯 Market & Business Model',
    description: 'Is the market big enough and your approach defensible?',
    sequence: 4,
    isRequired: true,
    items: [
      {
        itemType: 'problem_clarity',
        displayName: 'Problem Clarity',
        importance: 'critical',
        guidancePrompt: 'What problem do you solve? How big is it? Who suffers most?',
        exampleAnswer: 'IT teams waste 40% of time on manual patching. $200B+ market opportunity.',
      },
      {
        itemType: 'market_size',
        displayName: 'TAM/SAM/SOM',
        importance: 'critical',
        guidancePrompt: 'Total addressable market? Serviceable available? Serviceable obtainable?',
        exampleAnswer: 'TAM: $50B, SAM: $5B, SOM Year 3: $100M',
      },
      {
        itemType: 'competitive_advantage',
        displayName: 'Competitive Advantage',
        importance: 'high',
        guidancePrompt: 'What is your defensible moat? Why can\'t competitors copy you?',
        exampleAnswer: 'Proprietary dataset + 3-year head start. Switching costs are high.',
      },
      {
        itemType: 'business_model',
        displayName: 'Business Model',
        importance: 'high',
        guidancePrompt: 'How do you make money? Subscription? Licensing? Usage-based?',
        exampleAnswer: '$99/user/month SaaS with 3-year contracts',
      },
      {
        itemType: 'market_validation',
        displayName: 'Market Validation',
        importance: 'medium',
        guidancePrompt: 'Evidence that customers actually want this?',
        exampleAnswer: 'Pre-sold $500k in annual contracts before launch',
      },
    ],
  },

  execution: {
    displayName: '🚀 Go-to-Market & Execution',
    description: 'How will you acquire customers and scale?',
    sequence: 5,
    isRequired: true,
    items: [
      {
        itemType: 'gtm_strategy',
        displayName: 'GTM Strategy',
        importance: 'critical',
        guidancePrompt: 'How will you acquire your first 1,000 customers?',
        exampleAnswer: 'Direct sales to enterprises via LinkedIn + partnerships with systems integrators',
      },
      {
        itemType: 'customer_acquisition',
        displayName: 'Customer Acquisition Proof',
        importance: 'critical',
        guidancePrompt: 'Show me your CAC. How did you get your first customers?',
        exampleAnswer: 'CAC: $1,200 via direct sales. Proven repeatable channel.',
      },
      {
        itemType: 'product_roadmap',
        displayName: '12-Month Roadmap',
        importance: 'high',
        guidancePrompt: 'What are you building in the next 12 months?',
        exampleAnswer: 'Q1: API, Q2: Mobile app, Q3: Enterprise SSO, Q4: Analytics dashboard',
      },
      {
        itemType: 'partnership_strategy',
        displayName: 'Partnerships',
        importance: 'medium',
        guidancePrompt: 'Strategic partners accelerating your growth?',
        exampleAnswer: 'Partnerships with 3 major software providers for resale',
      },
      {
        itemType: 'risk_mitigation',
        displayName: 'Risk Awareness',
        importance: 'medium',
        guidancePrompt: 'What could go wrong? How do you mitigate key risks?',
        exampleAnswer: 'Customer concentration risk mitigated via diversification strategy',
      },
    ],
  },
};

/**
 * Map 68 analysis dimensions to readiness tree branches
 */
const DIMENSION_TO_BRANCH_MAPPING: Record<string, string> = {
  'problem-clarity': 'market',
  'solution-fit': 'market',
  'market-size': 'market',
  'market-research': 'market',
  'industry-trends': 'market',
  'competitive-landscape': 'market',
  'competitive-positioning': 'market',
  'unique-value-proposition': 'market',
  'business-model-clarity': 'market',
  'revenue-model': 'market',
  'unit-economics': 'traction',
  'pricing-strategy': 'market',
  'product-market-fit': 'traction',
  'traction-evidence': 'traction',
  'revenue-growth': 'traction',
  'customer-acquisition': 'execution',
  'retention-metrics': 'traction',
  'founder-experience': 'team',
  'team-quality': 'team',
  'team-size': 'team',
  'technical-capability': 'team',
  'domain-expertise': 'team',
  'fundraising-experience': 'team',
  'go-to-market-strategy': 'execution',
  'sales-capability': 'execution',
  'marketing-effectiveness': 'execution',
  'product-development': 'execution',
  'operational-maturity': 'execution',
  'financial-planning': 'documents',
  'financial-controls': 'documents',
  'accounting-quality': 'documents',
  'pitch-deck-quality': 'documents',
  'storytelling': 'documents',
  'investor-communication': 'documents',
  'legal-structure': 'documents',
  'ip-protection': 'documents',
  'risk-management': 'execution',
};

/**
 * Build a readiness tree from deep analysis dimensions
 */
export async function buildReadinessTree(sessionId: string): Promise<ReadinessTreeData> {
  // Fetch the deep analysis
  const { prisma } = await import('@/lib/prisma');
  const analysis = await prisma.deepAnalysis.findUnique({
    where: { sessionId },
    include: { dimensions: true },
  });

  if (!analysis) {
    throw new Error(`No analysis found for session ${sessionId}`);
  }

  // Initialize branches
  const branches: Record<string, ReadinessBranchData> = {};
  
  for (const [branchKey, config] of Object.entries(READINESS_TREE_STRUCTURE)) {
    branches[branchKey] = {
      id: `branch-${branchKey}`,
      branchType: branchKey,
      displayName: config.displayName,
      description: config.description,
      sequence: config.sequence,
      isRequired: config.isRequired,
      completionPercent: 0,
      confidence: 'low',
      items: config.items.map(item => ({
        id: `item-${branchKey}-${item.itemType}`,
        itemType: item.itemType,
        displayName: item.displayName,
        importance: item.importance,
        status: 'missing' as const,
        completionPercent: 0,
        guidancePrompt: item.guidancePrompt,
        exampleAnswer: item.exampleAnswer,
      })),
      recommendations: [],
    };
  }

  // Map analysis dimensions to branches
  let totalScore = 0;
  let branchCount = 0;

  for (const dimension of analysis.dimensions) {
    const branchKey = DIMENSION_TO_BRANCH_MAPPING[dimension.dimensionId] || 'execution';
    if (branches[branchKey]) {
      // Update branch score (weighted average)
      if (!branches[branchKey].score) branches[branchKey].score = 0;
      branches[branchKey].score = (branches[branchKey].score! + (dimension.score || 0)) / 2;
      branches[branchKey].confidence = dimension.confidence || 'low';
      
      totalScore += dimension.score || 0;
      branchCount++;
    }
  }

  // Calculate completion percent for each branch
  for (const branchKey in branches) {
    const branch = branches[branchKey];
    
    // Completion = average of item completion + dimension coverage
    const dimensionsInBranch = analysis.dimensions.filter(
      d => DIMENSION_TO_BRANCH_MAPPING[d.dimensionId] === branchKey
    );
    
    const dimensionCoverage = dimensionsInBranch.length > 0
      ? (dimensionsInBranch.filter(d => d.analyzed).length / dimensionsInBranch.length) * 100
      : 0;
    
    branch.completionPercent = Math.round(dimensionCoverage);
    
    // Update items based on dimension analysis
    for (const item of branch.items) {
      // Find related dimensions
      const relatedDims = dimensionsInBranch.filter(d => 
        d.name.toLowerCase().includes(item.itemType.replace(/_/g, ' '))
      );
      
      if (relatedDims.length > 0) {
        const avgScore = relatedDims.reduce((sum, d) => sum + (d.score || 0), 0) / relatedDims.length;
        item.score = Math.round(avgScore);
        item.completionPercent = relatedDims[0].analyzed ? 100 : 50;
        item.status = avgScore > 70 ? 'complete' : avgScore > 40 ? 'partial' : 'missing';
      }
    }
  }

  // Generate recommendations for each branch
  for (const branchKey in branches) {
    const branch = branches[branchKey];
    const missingItems = branch.items.filter(i => i.status === 'missing');
    const lowScoreItems = branch.items.filter(i => i.score && i.score < 50);

    if (missingItems.length > 0) {
      branch.recommendations.push(
        `Get started with: ${missingItems.slice(0, 2).map(i => i.displayName).join(', ')}`
      );
    }
    if (lowScoreItems.length > 0) {
      branch.recommendations.push(
        `Improve: ${lowScoreItems.slice(0, 2).map(i => i.displayName).join(', ')}`
      );
    }
  }

  // Calculate overall readiness
  const completionScore = Math.round(
    Object.values(branches).reduce((sum, b) => sum + b.completionPercent, 0) / Object.keys(branches).length
  );
  
  const avgBranchScore = branchCount > 0 ? Math.round(totalScore / branchCount) : 0;
  
  let overallReadiness: 'investor_ready' | 'needs_work' | 'early_stage' | 'incomplete';
  if (avgBranchScore >= 80 && completionScore >= 90) {
    overallReadiness = 'investor_ready';
  } else if (avgBranchScore >= 60 && completionScore >= 70) {
    overallReadiness = 'needs_work';
  } else if (completionScore >= 50) {
    overallReadiness = 'early_stage';
  } else {
    overallReadiness = 'incomplete';
  }

  const treeData: ReadinessTreeData = {
    id: `tree-${sessionId}`,
    sessionId,
    branches: Object.values(branches).sort((a, b) => a.sequence - b.sequence),
    totalScore: avgBranchScore,
    completionScore,
    overallReadiness,
    lastEvaluatedAt: new Date(),
  };

  return treeData;
}

/**
 * Get personalized guidance for a specific branch
 */
export function getBranchGuidance(branch: ReadinessBranchData) {
  const topPriorities = branch.items
    .filter(i => i.importance === 'critical' && i.status !== 'complete')
    .map(i => `📌 ${i.displayName}: ${i.guidancePrompt}`);

  const quickWins = branch.items
    .filter(i => i.status === 'partial' && i.completionPercent > 50)
    .map(i => `⚡ Finish ${i.displayName} - already at ${i.completionPercent}%`);

  const timeline = branch.completionPercent < 50 
    ? '2-4 weeks to get branch investment-ready'
    : branch.completionPercent < 80
    ? '1-2 weeks for polish'
    : 'Nearly ready!';

  return {
    branch,
    topPriorities,
    quickWins,
    timeline,
  };
}

/**
 * Summarize tree for founder (what to focus on first)
 */
export function summarizeReadinessTree(tree: ReadinessTreeData): {
  headline: string;
  keyMesssage: string;
  topActions: string[];
  estimatedTimeToReady: string;
} {
  const incompleteBranches = tree.branches.filter(b => b.completionPercent < 70);
  const strongBranches = tree.branches.filter(b => b.completionPercent >= 90);

  let headline = '';
  let keyMessage = '';
  
  if (tree.overallReadiness === 'investor_ready') {
    headline = '🎉 You\'re Investor Ready!';
    keyMessage = 'Your company profile is complete. Time to start pitching.';
  } else if (tree.overallReadiness === 'needs_work') {
    headline = '🔨 You\'re Close!';
    keyMessage = `${incompleteBranches.length} area(s) need polish to be investor-ready.`;
  } else if (tree.overallReadiness === 'early_stage') {
    headline = '📈 Building Your Profile';
    keyMessage = `Focus on ${incompleteBranches[0]?.displayName || 'core documents'} first.`;
  } else {
    headline = '🌱 Just Getting Started?';
    keyMessage = 'Let\'s build your investor profile from scratch.';
  }

  const topActions = incompleteBranches
    .slice(0, 3)
    .flatMap(b => b.recommendations.slice(0, 2));

  const estimatedTimeToReady = incompleteBranches.length > 3
    ? '4-6 weeks'
    : incompleteBranches.length > 1
    ? '2-3 weeks'
    : '1 week';

  return {
    headline,
    keyMessage,
    topActions,
    estimatedTimeToReady,
  };
}
