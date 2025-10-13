/**
 * Freja Intelligence System
 * Smart prompts and data requirements for comprehensive business analysis
 */

import { BusinessInfo } from '@/types/business';

export interface DataRequirement {
  category: string;
  items: RequirementItem[];
  priority: 'critical' | 'important' | 'helpful';
}

export interface RequirementItem {
  name: string;
  description: string;
  dataType: 'number' | 'document' | 'text' | 'url';
  required: boolean;
  followUp?: string;
}

export interface AnalysisGap {
  category: string;
  missing: string[];
  impact: string;
  questions: string[];
}

// Critical data requirements for investment readiness
export const DATA_REQUIREMENTS: DataRequirement[] = [
  {
    category: 'Financial Metrics',
    priority: 'critical',
    items: [
      {
        name: 'Monthly Revenue (MRR)',
        description: 'Current monthly recurring revenue',
        dataType: 'number',
        required: true,
        followUp: 'What is your revenue growth rate month-over-month?'
      },
      {
        name: 'Burn Rate',
        description: 'Monthly cash burn',
        dataType: 'number',
        required: true,
        followUp: 'How many months of runway do you have?'
      },
      {
        name: 'Customer Acquisition Cost (CAC)',
        description: 'Cost to acquire one customer',
        dataType: 'number',
        required: true,
        followUp: 'What is your CAC payback period?'
      },
      {
        name: 'Lifetime Value (LTV)',
        description: 'Average customer lifetime value',
        dataType: 'number',
        required: true,
        followUp: 'What is your LTV:CAC ratio?'
      },
      {
        name: 'Gross Margin',
        description: 'Gross profit margin percentage',
        dataType: 'number',
        required: true,
        followUp: 'How has this trended over the last 6 months?'
      }
    ]
  },
  {
    category: 'Traction & Growth',
    priority: 'critical',
    items: [
      {
        name: 'Total Customers',
        description: 'Number of paying customers',
        dataType: 'number',
        required: true,
        followUp: 'What is your customer growth rate?'
      },
      {
        name: 'Churn Rate',
        description: 'Monthly customer churn percentage',
        dataType: 'number',
        required: true,
        followUp: 'What are the main reasons for churn?'
      },
      {
        name: 'Sales Pipeline',
        description: 'Value of deals in pipeline',
        dataType: 'number',
        required: false,
        followUp: 'What is your average sales cycle length?'
      },
      {
        name: 'Market TAM',
        description: 'Total addressable market size',
        dataType: 'number',
        required: true,
        followUp: 'What percentage can you realistically capture?'
      }
    ]
  },
  {
    category: 'Documents & Materials',
    priority: 'important',
    items: [
      {
        name: 'Pitch Deck',
        description: 'Latest investor pitch deck',
        dataType: 'document',
        required: true,
        followUp: 'When was this last updated?'
      },
      {
        name: 'Financial Model',
        description: '3-year financial projections',
        dataType: 'document',
        required: true,
        followUp: 'What are your key assumptions?'
      },
      {
        name: 'Cap Table',
        description: 'Current ownership structure',
        dataType: 'document',
        required: false,
        followUp: 'How much equity is available for investors?'
      },
      {
        name: 'Product Demo',
        description: 'Link to product demo or video',
        dataType: 'url',
        required: false,
        followUp: 'Can investors try the product themselves?'
      }
    ]
  },
  {
    category: 'Team & Execution',
    priority: 'important',
    items: [
      {
        name: 'Founder Background',
        description: 'LinkedIn profiles of founders',
        dataType: 'url',
        required: true,
        followUp: 'What relevant experience do you bring?'
      },
      {
        name: 'Key Hires Plan',
        description: 'Next 3-5 critical hires',
        dataType: 'text',
        required: false,
        followUp: 'What roles are most critical for growth?'
      },
      {
        name: 'Advisory Board',
        description: 'Current advisors and their expertise',
        dataType: 'text',
        required: false,
        followUp: 'What expertise gaps do you need to fill?'
      }
    ]
  }
];

// Analyze what data is missing
export function analyzeDataGaps(businessInfo: BusinessInfo): AnalysisGap[] {
  const gaps: AnalysisGap[] = [];

  // Financial gaps
  const financialMissing = [];
  if (!businessInfo.monthlyRevenue || businessInfo.monthlyRevenue === '0') {
    financialMissing.push('Monthly Revenue');
  }
  if (!businessInfo.burnRate) {
    financialMissing.push('Burn Rate');
  }
  if (!businessInfo.cac) {
    financialMissing.push('Customer Acquisition Cost');
  }
  
  if (financialMissing.length > 0) {
    gaps.push({
      category: 'Financial Metrics',
      missing: financialMissing,
      impact: 'Cannot accurately assess unit economics and growth efficiency',
      questions: [
        'What is your current monthly revenue?',
        'How much are you spending each month (burn rate)?',
        'What does it cost to acquire each customer?'
      ]
    });
  }

  // Document gaps
  const documentMissing = [];
  if (!businessInfo.pitchDeckUrl) {
    documentMissing.push('Pitch Deck');
  }
  if (!businessInfo.financialModelUrl) {
    documentMissing.push('Financial Model');
  }
  
  if (documentMissing.length > 0) {
    gaps.push({
      category: 'Investment Materials',
      missing: documentMissing,
      impact: 'Investors expect these materials for due diligence',
      questions: [
        'Do you have a pitch deck I can review?',
        'Can you share your financial projections?'
      ]
    });
  }

  return gaps;
}

// Generate smart questions based on business stage and data
export function generateSmartQuestions(businessInfo: BusinessInfo): string[] {
  const questions: string[] = [];
  const gaps = analyzeDataGaps(businessInfo);

  // Stage-specific questions
  switch (businessInfo.stage) {
    case 'idea':
      questions.push(
        'Have you validated the problem with potential customers?',
        'What is your plan to build an MVP?',
        'Who is your ideal first customer?'
      );
      break;
    case 'mvp':
      questions.push(
        'How many beta users do you have?',
        'What is the feedback been like?',
        'When do you plan to start charging?'
      );
      break;
    case 'revenue':
      questions.push(
        'What is your current MRR and growth rate?',
        'What is your customer acquisition strategy?',
        'How sticky is your product (what is the churn)?'
      );
      break;
    case 'growth':
      questions.push(
        'What is your path to profitability?',
        'How will you scale customer acquisition?',
        'What is your competitive moat?'
      );
      break;
  }

  // Add gap-specific questions
  gaps.forEach(gap => {
    questions.push(...gap.questions.slice(0, 2));
  });

  // Industry-specific questions
  if (businessInfo.industry) {
    const industryQuestions = getIndustrySpecificQuestions(businessInfo.industry);
    questions.push(...industryQuestions.slice(0, 2));
  }

  return questions.slice(0, 5); // Return top 5 most relevant
}

// Get industry-specific questions
function getIndustrySpecificQuestions(industry: string): string[] {
  const questions: { [key: string]: string[] } = {
    'SaaS': [
      'What is your net revenue retention rate?',
      'How long is your average customer contract?',
      'What is your magic number (sales efficiency)?'
    ],
    'Marketplace': [
      'What is your take rate?',
      'How do you solve the chicken-and-egg problem?',
      'What is your GMV growth rate?'
    ],
    'FinTech': [
      'How do you handle regulatory compliance?',
      'What is your fraud rate?',
      'Do you have necessary licenses?'
    ],
    'HealthTech': [
      'What is your regulatory pathway (FDA, CE, etc)?',
      'How long is your sales cycle to healthcare providers?',
      'Do you have clinical validation?'
    ],
    'E-commerce': [
      'What is your customer acquisition cost vs AOV?',
      'How do you differentiate from Amazon?',
      'What is your repeat purchase rate?'
    ],
    'Hardware': [
      'What is your gross margin per unit?',
      'How do you handle manufacturing and supply chain?',
      'What is your warranty/return rate?'
    ]
  };

  return questions[industry] || [
    'What makes your solution 10x better than alternatives?',
    'Who are your main competitors and how do you differentiate?'
  ];
}

// Generate proactive insights and warnings
export function generateProactiveInsights(businessInfo: BusinessInfo): string[] {
  const insights: string[] = [];
  
  // Revenue vs stage mismatch
  if (businessInfo.stage === 'growth' && (!businessInfo.monthlyRevenue || parseInt(businessInfo.monthlyRevenue) < 50000)) {
    insights.push('⚠️ Your revenue seems low for a growth-stage company. Most investors expect $50K+ MRR at this stage.');
  }

  // Team size concerns
  if (businessInfo.teamSize === '1' && businessInfo.stage !== 'idea') {
    insights.push('⚠️ Solo founders often struggle to raise funding. Consider finding a co-founder or explaining why you can execute alone.');
  }

  // Missing critical data
  const gaps = analyzeDataGaps(businessInfo);
  if (gaps.length > 0) {
    insights.push(`📊 I need more data to properly assess your investment readiness. Missing: ${gaps[0].missing.join(', ')}`);
  }

  // Positive insights
  if (businessInfo.monthlyRevenue && parseInt(businessInfo.monthlyRevenue) > 10000) {
    insights.push('✅ Great to see you have revenue traction! This significantly improves your fundraising chances.');
  }

  return insights;
}

// Determine next best action
export function getNextBestAction(businessInfo: BusinessInfo): {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
} {
  const gaps = analyzeDataGaps(businessInfo);
  
  // Critical missing: financial data
  if (gaps.some(g => g.category === 'Financial Metrics')) {
    return {
      action: 'Share your key financial metrics (MRR, burn rate, CAC)',
      reason: 'Investors need these numbers to evaluate your business',
      priority: 'high'
    };
  }

  // Missing pitch deck
  if (!businessInfo.pitchDeckUrl) {
    return {
      action: 'Upload your pitch deck for review',
      reason: 'I can provide specific feedback to improve your investor pitch',
      priority: 'high'
    };
  }

  // No website but has revenue
  if (!businessInfo.websiteUrl && businessInfo.monthlyRevenue && parseInt(businessInfo.monthlyRevenue) > 0) {
    return {
      action: 'Add your website URL',
      reason: 'Investors will want to see your product in action',
      priority: 'medium'
    };
  }

  // Default action
  return {
    action: 'Tell me about your biggest challenge right now',
    reason: 'I can provide targeted advice based on your specific situation',
    priority: 'medium'
  };
}
