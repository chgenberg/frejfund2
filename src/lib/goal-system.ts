/**
 * Goal System for FrejFund
 *
 * Generates personalized roadmaps and tracks progress towards fundraising goals
 */

import { BusinessInfo } from '@/types/business';

export type UserGoal =
  | 'find-investors-3m'
  | 'improve-pitch'
  | 'get-bank-loan'
  | 'build-investment-ready'
  | 'custom';

export interface GoalOption {
  id: UserGoal;
  title: string;
  description: string;
  icon: string;
  timeline: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  tasks: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    dueDate?: Date;
  }[];
  completed: boolean;
}

export interface UserRoadmap {
  goal: UserGoal;
  goalTitle: string;
  customGoal?: string;
  milestones: RoadmapMilestone[];
  startDate: Date;
  targetDate: Date;
  estimatedWeeks: number;
}

/**
 * Available goal options
 */
export const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'find-investors-3m',
    title: 'Find investors within 3 months',
    description: 'Raise capital from angels or VCs in the next quarter',
    icon: '○',
    timeline: '3 months',
    difficulty: 'hard',
  },
  {
    id: 'improve-pitch',
    title: 'Improve my pitch deck',
    description: 'Create an investor-ready pitch that converts',
    icon: '□',
    timeline: '2-4 weeks',
    difficulty: 'easy',
  },
  {
    id: 'get-bank-loan',
    title: 'Get a bank loan',
    description: 'Secure debt financing for growth',
    icon: '△',
    timeline: '1-2 months',
    difficulty: 'medium',
  },
  {
    id: 'build-investment-ready',
    title: 'Build an investment-ready business',
    description: 'Improve fundamentals before fundraising',
    icon: '◇',
    timeline: '6-12 months',
    difficulty: 'medium',
  },
  {
    id: 'custom',
    title: 'Other goal',
    description: 'Set a custom goal for your business',
    icon: '+',
    timeline: 'Custom',
    difficulty: 'medium',
  },
];

/**
 * Generate personalized roadmap based on goal and business info
 */
export function generateRoadmap(
  goal: UserGoal,
  customGoal: string | undefined,
  businessInfo: BusinessInfo,
  readinessScore: number,
): UserRoadmap {
  const now = new Date();

  switch (goal) {
    case 'find-investors-3m':
      return {
        goal,
        goalTitle: 'Find investors within 3 months',
        milestones: generateFundraisingMilestones(businessInfo, readinessScore),
        startDate: now,
        targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        estimatedWeeks: 12,
      };

    case 'improve-pitch':
      return {
        goal,
        goalTitle: 'Improve my pitch deck',
        milestones: generatePitchMilestones(businessInfo, readinessScore),
        startDate: now,
        targetDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        estimatedWeeks: 4,
      };

    case 'get-bank-loan':
      return {
        goal,
        goalTitle: 'Get a bank loan',
        milestones: generateBankLoanMilestones(businessInfo, readinessScore),
        startDate: now,
        targetDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        estimatedWeeks: 8,
      };

    case 'build-investment-ready':
      return {
        goal,
        goalTitle: 'Build an investment-ready business',
        milestones: generateInvestmentReadyMilestones(businessInfo, readinessScore),
        startDate: now,
        targetDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        estimatedWeeks: 26,
      };

    case 'custom':
      return {
        goal,
        goalTitle: customGoal || 'Custom goal',
        customGoal,
        milestones: generateCustomMilestones(customGoal, businessInfo, readinessScore),
        startDate: now,
        targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        estimatedWeeks: 12,
      };

    default:
      return generateRoadmap('find-investors-3m', undefined, businessInfo, readinessScore);
  }
}

/**
 * Generate milestones for fundraising goal
 */
function generateFundraisingMilestones(
  businessInfo: BusinessInfo,
  readinessScore: number,
): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = [];

  // Month 1: Foundation
  milestones.push({
    id: 'foundation',
    title: 'Month 1 - Foundation',
    description: 'Get your materials and strategy ready',
    timeframe: 'Weeks 1-4',
    completed: false,
    tasks: [
      {
        id: 'pitch-deck',
        title: 'Create investor-ready pitch deck',
        description: '10-15 slides covering problem, solution, market, traction, team, ask',
        completed: false,
      },
      {
        id: 'financial-model',
        title: 'Build 3-year financial model',
        description: 'Revenue projections, costs, runway, use of funds',
        completed: false,
      },
      {
        id: 'one-pager',
        title: 'Create one-pager',
        description: 'Single page summary for cold outreach',
        completed: false,
      },
      {
        id: 'target-vcs',
        title: 'List 20-30 target investors',
        description: 'Research VCs/angels who invest in your stage and industry',
        completed: false,
      },
      {
        id: 'fundraising-strategy',
        title: 'Define fundraising strategy',
        description: 'How much to raise, at what valuation, and why',
        completed: false,
      },
    ],
  });

  // Month 2: Outreach
  milestones.push({
    id: 'outreach',
    title: 'Month 2 - Outreach',
    description: 'Start conversations and book meetings',
    timeframe: 'Weeks 5-8',
    completed: false,
    tasks: [
      {
        id: 'warm-intros',
        title: 'Find 10 warm introductions',
        description: 'Leverage LinkedIn 2nd connections and your network',
        completed: false,
      },
      {
        id: 'cold-emails',
        title: 'Send 20 personalized cold emails',
        description: 'Research each investor and customize your pitch',
        completed: false,
      },
      {
        id: 'practice-pitch',
        title: 'Practice pitch 5+ times',
        description: 'Mock sessions with advisors, friends, or Freja',
        completed: false,
      },
      {
        id: 'investor-meetings',
        title: 'Book 5-10 first meetings',
        description: 'Initial calls with interested investors',
        completed: false,
      },
      {
        id: 'follow-ups',
        title: 'Follow up within 24h',
        description: 'Send thank you + materials after every meeting',
        completed: false,
      },
    ],
  });

  // Month 3: Close
  milestones.push({
    id: 'close',
    title: 'Month 3 - Close',
    description: 'Negotiate and close your round',
    timeframe: 'Weeks 9-12',
    completed: false,
    tasks: [
      {
        id: 'second-meetings',
        title: 'Have 5-10 second meetings',
        description: 'Deep dives with seriously interested investors',
        completed: false,
      },
      {
        id: 'term-sheet',
        title: 'Receive term sheet(s)',
        description: 'Get at least one formal offer',
        completed: false,
      },
      {
        id: 'negotiate',
        title: 'Negotiate terms',
        description: 'Valuation, board seats, liquidation preferences',
        completed: false,
      },
      {
        id: 'create-fomo',
        title: 'Create FOMO',
        description: 'Let other investors know you have interest',
        completed: false,
      },
      {
        id: 'close-round',
        title: 'Close the round',
        description: 'Sign docs and get funds in the bank',
        completed: false,
      },
    ],
  });

  return milestones;
}

/**
 * Generate milestones for pitch improvement goal
 */
function generatePitchMilestones(
  businessInfo: BusinessInfo,
  readinessScore: number,
): RoadmapMilestone[] {
  return [
    {
      id: 'research',
      title: 'Week 1 - Research & Structure',
      description: 'Study great pitches and build your structure',
      timeframe: 'Week 1',
      completed: false,
      tasks: [
        {
          id: 'study-decks',
          title: 'Study 10 successful pitch decks',
          description: 'Analyze decks from similar companies (Y Combinator library)',
          completed: false,
        },
        {
          id: 'define-narrative',
          title: 'Define your narrative',
          description: 'Problem → Solution → Why now → Why you',
          completed: false,
        },
        {
          id: 'gather-data',
          title: 'Gather all key data',
          description: 'Market size, traction, financials, competitive landscape',
          completed: false,
        },
      ],
    },
    {
      id: 'create',
      title: 'Week 2 - Create First Draft',
      description: 'Build your deck',
      timeframe: 'Week 2',
      completed: false,
      tasks: [
        {
          id: 'slide-structure',
          title: 'Create 10-15 slide structure',
          description: 'Problem, Solution, Market, Product, Traction, Team, Financials, Ask',
          completed: false,
        },
        {
          id: 'design',
          title: 'Design slides (simple & clean)',
          description: 'Use Pitch, Canva, or PowerPoint',
          completed: false,
        },
        {
          id: 'write-script',
          title: 'Write presenter notes',
          description: "What you'll say for each slide",
          completed: false,
        },
      ],
    },
    {
      id: 'refine',
      title: 'Week 3 - Get Feedback & Refine',
      description: 'Iterate based on feedback',
      timeframe: 'Week 3',
      completed: false,
      tasks: [
        {
          id: 'get-feedback',
          title: 'Get feedback from 5 people',
          description: 'Advisors, other founders, potential investors',
          completed: false,
        },
        {
          id: 'freja-review',
          title: 'Have Freja review your deck',
          description: 'Upload to chat and get AI analysis',
          completed: false,
        },
        {
          id: 'iterate',
          title: 'Make 2-3 iterations',
          description: 'Simplify, clarify, strengthen weak slides',
          completed: false,
        },
      ],
    },
    {
      id: 'practice',
      title: 'Week 4 - Practice & Polish',
      description: 'Perfect your delivery',
      timeframe: 'Week 4',
      completed: false,
      tasks: [
        {
          id: 'practice-10x',
          title: 'Practice pitch 10 times',
          description: 'Out loud, ideally to real people',
          completed: false,
        },
        {
          id: 'record-yourself',
          title: 'Record yourself pitching',
          description: 'Watch it back and identify improvements',
          completed: false,
        },
        {
          id: 'final-deck',
          title: 'Finalize investor-ready deck',
          description: 'PDF version + editable version',
          completed: false,
        },
      ],
    },
  ];
}

/**
 * Generate milestones for bank loan goal
 */
function generateBankLoanMilestones(
  businessInfo: BusinessInfo,
  readinessScore: number,
): RoadmapMilestone[] {
  return [
    {
      id: 'preparation',
      title: 'Weeks 1-2 - Preparation',
      description: 'Gather required documents',
      timeframe: 'Weeks 1-2',
      completed: false,
      tasks: [
        {
          id: 'business-plan',
          title: 'Create business plan',
          description: '15-20 pages covering market, operations, financials',
          completed: false,
        },
        {
          id: 'financial-statements',
          title: 'Prepare financial statements',
          description: 'P&L, balance sheet, cash flow (last 2 years)',
          completed: false,
        },
        {
          id: 'projections',
          title: 'Build 3-year projections',
          description: 'Revenue, costs, loan repayment schedule',
          completed: false,
        },
        {
          id: 'collateral',
          title: 'Identify collateral',
          description: 'Assets you can use to secure the loan',
          completed: false,
        },
      ],
    },
    {
      id: 'research',
      title: 'Weeks 3-4 - Research Lenders',
      description: 'Find the right lender for you',
      timeframe: 'Weeks 3-4',
      completed: false,
      tasks: [
        {
          id: 'list-banks',
          title: 'List 10 potential lenders',
          description: 'Banks, credit unions, SBA lenders, online lenders',
          completed: false,
        },
        {
          id: 'understand-terms',
          title: 'Understand loan terms',
          description: 'Interest rates, repayment periods, fees',
          completed: false,
        },
        {
          id: 'check-credit',
          title: 'Check your credit score',
          description: 'Personal and business credit',
          completed: false,
        },
      ],
    },
    {
      id: 'apply',
      title: 'Weeks 5-6 - Apply',
      description: 'Submit applications',
      timeframe: 'Weeks 5-6',
      completed: false,
      tasks: [
        {
          id: 'submit-3-apps',
          title: 'Submit 3-5 loan applications',
          description: "Don't put all eggs in one basket",
          completed: false,
        },
        {
          id: 'follow-up',
          title: 'Follow up weekly',
          description: 'Stay on top of each application',
          completed: false,
        },
        {
          id: 'answer-questions',
          title: 'Answer lender questions',
          description: 'Provide additional docs as requested',
          completed: false,
        },
      ],
    },
    {
      id: 'close',
      title: 'Weeks 7-8 - Close',
      description: 'Review and accept offer',
      timeframe: 'Weeks 7-8',
      completed: false,
      tasks: [
        {
          id: 'compare-offers',
          title: 'Compare offers',
          description: 'APR, fees, terms, flexibility',
          completed: false,
        },
        {
          id: 'negotiate',
          title: 'Negotiate best terms',
          description: 'Ask for lower rates or better conditions',
          completed: false,
        },
        {
          id: 'close-loan',
          title: 'Close the loan',
          description: 'Sign documents and receive funds',
          completed: false,
        },
      ],
    },
  ];
}

/**
 * Generate milestones for investment-ready goal
 */
function generateInvestmentReadyMilestones(
  businessInfo: BusinessInfo,
  readinessScore: number,
): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = [];

  // Customize based on readiness score
  if (readinessScore < 4) {
    milestones.push({
      id: 'foundation',
      title: 'Months 1-2 - Business Foundation',
      description: 'Build the fundamentals',
      timeframe: 'Months 1-2',
      completed: false,
      tasks: [
        {
          id: 'business-model',
          title: 'Refine business model',
          description: 'Clear value prop, revenue streams, target customers',
          completed: false,
        },
        {
          id: 'mvp',
          title: 'Build/improve MVP',
          description: 'Core product that solves the problem',
          completed: false,
        },
        {
          id: 'first-customers',
          title: 'Get 5-10 paying customers',
          description: 'Validate product-market fit',
          completed: false,
        },
        {
          id: 'team',
          title: 'Build core team',
          description: 'Co-founder or key hires',
          completed: false,
        },
      ],
    });
  }

  milestones.push({
    id: 'traction',
    title: 'Months 3-4 - Build Traction',
    description: 'Grow your metrics',
    timeframe: 'Months 3-4',
    completed: false,
    tasks: [
      {
        id: 'revenue-goal',
        title: 'Reach $10k MRR',
        description: 'Consistent recurring revenue',
        completed: false,
      },
      {
        id: 'customer-growth',
        title: 'Grow to 20+ customers',
        description: 'Prove repeatable sales',
        completed: false,
      },
      {
        id: 'track-metrics',
        title: 'Track key metrics',
        description: 'CAC, LTV, churn, growth rate',
        completed: false,
      },
      {
        id: 'case-studies',
        title: 'Create 3 case studies',
        description: 'Customer success stories',
        completed: false,
      },
    ],
  });

  milestones.push({
    id: 'materials',
    title: 'Month 5 - Prepare Materials',
    description: 'Create investor materials',
    timeframe: 'Month 5',
    completed: false,
    tasks: [
      {
        id: 'pitch-deck',
        title: 'Create pitch deck',
        description: 'Investor-ready presentation',
        completed: false,
      },
      {
        id: 'financial-model',
        title: 'Build financial model',
        description: '3-year projections',
        completed: false,
      },
      {
        id: 'data-room',
        title: 'Set up data room',
        description: 'Organized folder with all docs',
        completed: false,
      },
    ],
  });

  milestones.push({
    id: 'ready',
    title: 'Month 6 - Investment Ready',
    description: 'Final polish',
    timeframe: 'Month 6',
    completed: false,
    tasks: [
      {
        id: 'practice-pitch',
        title: 'Practice pitch 10+ times',
        description: 'Perfect your delivery',
        completed: false,
      },
      {
        id: 'advisor-feedback',
        title: 'Get feedback from 3 advisors',
        description: 'People who have raised before',
        completed: false,
      },
      {
        id: 'investor-list',
        title: 'List 30 target investors',
        description: 'Ready to start outreach',
        completed: false,
      },
      {
        id: 'readiness-8+',
        title: 'Reach 8+ readiness score',
        description: 'Ready to fundraise',
        completed: false,
      },
    ],
  });

  return milestones;
}

/**
 * Generate custom milestones
 */
function generateCustomMilestones(
  customGoal: string | undefined,
  businessInfo: BusinessInfo,
  readinessScore: number,
): RoadmapMilestone[] {
  // Default generic milestones for custom goals
  return [
    {
      id: 'plan',
      title: 'Phase 1 - Planning',
      description: 'Break down your goal and make a plan',
      timeframe: 'Weeks 1-2',
      completed: false,
      tasks: [
        {
          id: 'define-success',
          title: 'Define what success looks like',
          description: 'Clear, measurable outcome',
          completed: false,
        },
        {
          id: 'identify-steps',
          title: 'Identify key steps',
          description: 'What needs to happen to achieve the goal?',
          completed: false,
        },
        {
          id: 'set-timeline',
          title: 'Set realistic timeline',
          description: 'When do you want to achieve this?',
          completed: false,
        },
      ],
    },
    {
      id: 'execute',
      title: 'Phase 2 - Execute',
      description: 'Take action on your plan',
      timeframe: 'Weeks 3-8',
      completed: false,
      tasks: [
        {
          id: 'weekly-progress',
          title: 'Make weekly progress',
          description: 'Complete at least one key step each week',
          completed: false,
        },
        {
          id: 'track-metrics',
          title: 'Track progress',
          description: 'Measure how close you are to your goal',
          completed: false,
        },
        {
          id: 'adjust-plan',
          title: 'Adjust plan as needed',
          description: 'Be flexible and iterate',
          completed: false,
        },
      ],
    },
    {
      id: 'achieve',
      title: 'Phase 3 - Achieve Goal',
      description: 'Final push to completion',
      timeframe: 'Weeks 9-12',
      completed: false,
      tasks: [
        {
          id: 'final-steps',
          title: 'Complete final steps',
          description: 'Finish what you started',
          completed: false,
        },
        {
          id: 'celebrate',
          title: 'Celebrate and reflect',
          description: 'What did you learn?',
          completed: false,
        },
        {
          id: 'next-goal',
          title: 'Set next goal',
          description: "What's next for your business?",
          completed: false,
        },
      ],
    },
  ];
}

/**
 * Calculate roadmap progress percentage
 */
export function calculateRoadmapProgress(roadmap: UserRoadmap): number {
  const totalTasks = roadmap.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const completedTasks = roadmap.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.completed).length,
    0,
  );

  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Get current milestone (first uncompleted)
 */
export function getCurrentMilestone(roadmap: UserRoadmap): RoadmapMilestone | null {
  return roadmap.milestones.find((m) => !m.completed) || null;
}

/**
 * Get next task to complete
 */
export function getNextTask(
  roadmap: UserRoadmap,
): { milestone: RoadmapMilestone; task: RoadmapMilestone['tasks'][0] } | null {
  for (const milestone of roadmap.milestones) {
    if (milestone.completed) continue;
    const nextTask = milestone.tasks.find((t) => !t.completed);
    if (nextTask) {
      return { milestone, task: nextTask };
    }
  }
  return null;
}
