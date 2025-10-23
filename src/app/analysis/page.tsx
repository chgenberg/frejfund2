'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Users,
  TrendingUp,
  Zap,
  Shield,
  Brain,
  ArrowLeft,
  Circle,
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
  FileDown,
  X,
  Lightbulb,
} from 'lucide-react';
import Header from '@/components/Header';
import ImprovementGuide from '@/components/ImprovementGuide';
import DocumentUploadModal from '@/components/DocumentUploadModal';

export const dynamic = 'force-dynamic';

interface AnalysisDimension {
  id: string;
  name: string;
  category: string;
  score: number;
  status: 'pending' | 'analyzing' | 'completed';
  findings: string[];
  strengths: string[];
  redFlags: string[];
  recommendations?: string[];
  suggestions?: string[];
  questions?: string[];
  evidence?: string[];
  confidence?: 'high' | 'medium' | 'low';
  dataSources?: string[];
}

const CATEGORIES = [
  { id: 'Problem & Solution', label: 'Problem & Solution', icon: Target, count: 6 },
  { id: 'Market & Competition', label: 'Market & Competition', icon: Target, count: 8 },
  { id: 'Business Model', label: 'Business Model', icon: Brain, count: 9 },
  { id: 'Product & Technology', label: 'Product & Technology', icon: Zap, count: 5 },
  { id: 'Team & Execution', label: 'Team & Execution', icon: Users, count: 6 },
  { id: 'Traction & Growth', label: 'Traction & Growth', icon: TrendingUp, count: 7 },
  { id: 'Customer Acquisition', label: 'Customer Acquisition', icon: Users, count: 5 },
  { id: 'Financial Health', label: 'Financial Health', icon: TrendingUp, count: 5 },
  { id: 'Fundraising', label: 'Fundraising', icon: Brain, count: 5 },
  { id: 'Risks', label: 'Risks', icon: Shield, count: 5 },
  { id: 'All', label: 'All Dimensions', icon: Brain, count: 95 },
];

// Example data (overrides) for specific dimensions
const DIMENSION_EXAMPLES: Record<
  string,
  { description: string; examples: string[]; dataNeeded: string[] }
> = {
  'Market Size (TAM/SAM/SOM)': {
    description:
      'Total Addressable Market, Serviceable Addressable Market, and Serviceable Obtainable Market.',
    examples: [
      'TAM: €100M - Total market for all CRM software in Europe',
      'SAM: €20M - SMB segment we can realistically serve',
      'SOM: €2M - What we can capture in year 3 (10% of SAM)',
    ],
    dataNeeded: [
      'Industry reports',
      'Competitor revenues',
      'Customer surveys',
      'Market research data',
    ],
  },
  'Business Model Clarity': {
    description: 'How you make money - pricing, revenue streams, and unit economics.',
    examples: [
      'SaaS: €99/month per seat, 3-year average customer lifetime',
      'Marketplace: 15% take rate on €500 average transaction',
      'Freemium: 3% conversion rate, €50/month average revenue per user',
    ],
    dataNeeded: ['Pricing strategy', 'Revenue breakdown', 'Customer segments', 'Cost structure'],
  },
  'Monthly Recurring Revenue': {
    description: 'Predictable revenue that comes in every month.',
    examples: [
      'Current MRR: €25,000',
      'Growth rate: 15% month-over-month',
      'Churn rate: 3% monthly',
    ],
    dataNeeded: ['Subscription data', 'Payment processor exports', 'Customer contracts'],
  },
  'Team Completeness': {
    description: 'Key roles filled and experience levels.',
    examples: [
      'CEO: 10 years industry experience, 2 exits',
      'CTO: Ex-Google engineer, AI/ML expertise',
      'Missing: Head of Sales (hiring Q2)',
    ],
    dataNeeded: ['Team bios', 'LinkedIn profiles', 'Org chart', 'Hiring roadmap'],
  },
  'Product-Market Fit Signals': {
    description: 'Evidence that customers love and need your product.',
    examples: ['NPS score: 72', '40% of new users from referrals', 'Daily active usage: 65%'],
    dataNeeded: ['User surveys', 'Usage analytics', 'Customer testimonials', 'Retention data'],
  },
};

function getAutoExample(dimensionName: string): {
  description: string;
  examples: string[];
  dataNeeded: string[];
} {
  const n = dimensionName.toLowerCase();

  // Market & Competition
  if (n.includes('market size') || n.includes('tam') || n.includes('sam') || n.includes('som')) {
    return DIMENSION_EXAMPLES['Market Size (TAM/SAM/SOM)'];
  }
  if (n.includes('market growth')) {
    return {
      description: 'Annual growth rate of the target market (CAGR) and momentum.',
      examples: [
        'Target market CAGR: 18% (2024-2029)',
        'Segment growth: SMB HR tech +24% YoY',
        'Key drivers: AI adoption, regulation, remote work',
      ],
      dataNeeded: ['Industry reports', 'Analyst notes', 'Public company filings'],
    };
  }
  if (n.includes('competitive landscape')) {
    return {
      description: 'Overview of primary competitors and market crowdedness.',
      examples: [
        'Top competitors: Company A, Company B, Company C',
        'Positioning: We serve SMBs; incumbents focus on Enterprise',
        'Differentiation: 10x faster onboarding, usage-based pricing',
      ],
      dataNeeded: ['Competitor websites', 'G2/Capterra', 'Customer interviews'],
    };
  }
  if (n.includes('moat') || n.includes('defensibility')) {
    return {
      description: 'Defensible advantages that are hard to copy.',
      examples: [
        'Network effects: each new customer improves recommendations',
        'Data moat: 3 years of proprietary transaction data',
        'Switching costs: embedded into customers’ workflows',
      ],
      dataNeeded: ['Product architecture', 'Usage telemetry', 'Patent filings'],
    };
  }

  // Business Model & Economics
  if (n.includes('unit economics')) {
    return {
      description: 'LTV/CAC, payback, margins, retention – core profitability drivers.',
      examples: [
        'LTV: €1,800  |  CAC: €300  →  LTV:CAC = 6:1',
        'CAC payback: 5.5 months',
        'Gross margin: 82%',
      ],
      dataNeeded: ['Cohort retention', 'Pricing/ARPA', 'Paid spend by channel'],
    };
  }
  if (n.includes('revenue predict')) {
    return {
      description: 'Degree of recurring/contracted revenue and forecast accuracy.',
      examples: [
        'Revenue mix: 92% subscription, 8% services',
        'NRR: 112%, GRR: 94%',
        '90% of ARR under annual contracts',
      ],
      dataNeeded: ['Billing exports', 'Contract terms', 'Renewal metrics'],
    };
  }
  if (n.includes('pricing')) {
    return {
      description: 'Price levels, value metric, and ability to raise prices.',
      examples: [
        'Plan tiers: €49/€99/€249 per seat',
        'Value metric: tracked projects per month',
        'Price test: +15% with no impact on conversion',
      ],
      dataNeeded: ['Pricing page history', 'Win/loss data', 'Customer interviews'],
    };
  }
  if (n.includes('gross margin')) {
    return {
      description: 'Contribution margin after COGS; software vs services profile.',
      examples: [
        'Gross margin: 81% last quarter',
        'COGS: hosting 7%, support 5%, integrations 7%',
        'Target margin: 85%+',
      ],
      dataNeeded: ['P/L by function', 'COGS breakdown', 'Hosting invoices'],
    };
  }
  if (n.includes('profit')) {
    return {
      description: 'Path, milestones, and timeline to reach profitability.',
      examples: [
        'Breakeven at €350k MRR (Q2 2026)',
        'Plan: reduce CAC by 20% and lift ARPA by 10% via packaging',
        'Hiring plan aligned with unit economics',
      ],
      dataNeeded: ['Financial model', 'Hiring plan', 'Pricing strategy'],
    };
  }

  // Traction & Growth
  if (n.includes('retention') || n.includes('churn')) {
    return {
      description: 'Customer retention quality and churn dynamics.',
      examples: [
        'Logo churn: 2.8%/mo, Revenue churn: 1.2%/mo',
        'NRR: 118% driven by seat expansion',
        'Cohort month 6 retention: 72%',
      ],
      dataNeeded: ['Cohort tables', 'Subscription events', 'MRR movements'],
    };
  }
  if (n.includes('product-market fit')) {
    return DIMENSION_EXAMPLES['Product-Market Fit Signals'];
  }
  if (n.includes('sales efficiency') || n.includes('magic number')) {
    return {
      description: 'Revenue growth relative to sales & marketing spend.',
      examples: [
        'Magic Number: 0.82 (good)',
        'S&M spend last quarter: €240k; Net new ARR: €197k',
        'Target: >0.75 sustained over 2+ quarters',
      ],
      dataNeeded: ['ARR movements', 'S&M spend by month', 'Attribution model'],
    };
  }

  // Team & Execution
  if (n.includes('founder-market fit') || n.includes('founder')) {
    return {
      description: 'Founder backgrounds aligned with the space and problem.',
      examples: [
        'CEO: 8 yrs in logistics; built routing engine at prior startup',
        'CTO: ex-Stripe; scaled payments infra',
        'Advisors: former DHL ops lead',
      ],
      dataNeeded: ['LinkedIn profiles', 'Past projects', 'Case studies'],
    };
  }
  if (n.includes('team completeness')) {
    return DIMENSION_EXAMPLES['Team Completeness'];
  }

  // Go-to-Market
  if (n.includes('customer acquisition strategy')) {
    return {
      description: 'How you reliably acquire customers – channels and playbooks.',
      examples: [
        'Core channels: SEO + outbound SDRs + partner referrals',
        'Playbook: ICP → sequence → demo → pilot → close',
        'Benchmarks: 22% SQL→Win, 35-day cycle',
      ],
      dataNeeded: ['CRM pipeline', 'Channel performance', 'Playbooks'],
    };
  }
  if (n.includes('icp')) {
    return {
      description: 'Ideal customer profile: industry, size, pain, budget, tech.',
      examples: [
        'ICP: EU B2B SaaS, 20-200 FTE, rev ops pain, HubSpot stack',
        'Budget: €5k-€50k ARR; Decision-maker: Head of Sales Ops',
        'Buying triggers: moving from spreadsheets to automation',
      ],
      dataNeeded: ['Won deals analysis', 'Firmographic data', 'Tech stack data'],
    };
  }

  // Product & Technology
  if (n.includes('technical differentiation')) {
    return {
      description: 'Unique technical edge beyond UI – algorithms, data, IP.',
      examples: [
        'Proprietary forecasting model with 15% lower MAPE',
        'Vector search on 10M docs with sub-100ms latency',
        'Fine-tuned LLM for industry taxonomy',
      ],
      dataNeeded: ['Architecture docs', 'Benchmarks', 'Patents/whitepapers'],
    };
  }
  if (n.includes('platform') && n.includes('feature')) {
    return {
      description: 'Risk that product is a feature vs a defensible platform.',
      examples: [
        'Breadth: 4 modules integrated (ingest → analyze → act → report)',
        'Ecosystem: 12 integrations; embedded across workflows',
        'Moat: proprietary datasets only available here',
      ],
      dataNeeded: ['Product map', 'Integration list', 'Customer workflows'],
    };
  }

  // Fundraising & Capital
  if (n.includes('runway') || n.includes('burn')) {
    return {
      description: 'Cash runway and burn health relative to milestones.',
      examples: [
        'Cash: €1.2M; Burn: €120k/mo → Runway: 10 months',
        'Default alive at €180k MRR by Mar 2026',
        'Plan: reduce burn by €20k with infra savings',
      ],
      dataNeeded: ['Bank balance', 'Monthly burn', 'Hiring plan'],
    };
  }
  if (n.includes('valuation')) {
    return {
      description: 'Fair valuation range given stage, traction and comps.',
      examples: [
        'Seed valuation range: €8–12M pre (based on €40k MRR, 8x–12x ARR)',
        'Comps: ACME (€1.2M ARR, €12M pre); Bravo (€800k ARR, €8M pre)',
      ],
      dataNeeded: ['ARR/MRR', 'Growth rate', 'Market comps'],
    };
  }

  // Customer Validation / Social Proof
  if (n.includes('nps') || n.includes('customer love')) {
    return {
      description: 'Customer advocacy signals and satisfaction (NPS/CSAT).',
      examples: [
        'NPS: 62 (last 90 days)',
        'CSAT: 4.6/5 over 1,200 tickets',
        'Testimonials: 25 curated quotes on website',
      ],
      dataNeeded: ['NPS tool exports', 'Support CSAT', 'Review sites'],
    };
  }
  if (n.includes('press') || n.includes('media')) {
    return {
      description: 'External validation via credible press or analysts.',
      examples: [
        'Featured in Sifted: “Top 10 Nordic AI Startups to watch”',
        'TechCrunch mention (Feb 2025): Seed round coverage',
        'Category mention in Gartner Market Guide',
      ],
      dataNeeded: ['Press links', 'Analyst notes', 'PR summaries'],
    };
  }

  // Operations & Risks
  if (n.includes('metrics') || n.includes('dashboard')) {
    return {
      description: 'KPI discipline and reporting cadence.',
      examples: [
        'Weekly exec dashboard (MRR, NRR, churn, CAC payback)',
        'Monthly board updates with forecast vs actuals',
        'Single source of truth in BI tool',
      ],
      dataNeeded: ['KPI definitions', 'BI screenshots', 'Board decks'],
    };
  }
  if (n.includes('regulatory') || n.includes('compliance')) {
    return {
      description: 'Regulatory exposure and compliance posture.',
      examples: [
        'SOC2 Type II in progress (target Q3)',
        'GDPR DPA in place; ISO 27001 planned',
        'No licensing required for target markets',
      ],
      dataNeeded: ['Compliance roadmap', 'Security policies', 'Vendor audits'],
    };
  }

  // Default generic template
  return {
    description: 'Provide specific, verifiable data that allows a clear assessment.',
    examples: [
      'State current baseline metric and recent trend',
      'Add one piece of evidence (screenshot, link, export)',
      'Define your target benchmark for next 1–2 quarters',
    ],
    dataNeeded: ['Internal reports', 'Exports (CSV/PDF)', 'External benchmarks'],
  };
}

export default function AnalysisPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Problem & Solution');
  const [dimensions, setDimensions] = useState<AnalysisDimension[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [confidenceWeightedScore, setConfidenceWeightedScore] = useState(0);
  const [dataCompleteness, setDataCompleteness] = useState(0);
  const [companyStage, setCompanyStage] = useState<string>('startup');
  const [isLoading, setIsLoading] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    status: 'idle' | 'running' | 'completed';
  }>({ current: 0, total: 95, status: 'idle' });
  const [showInfoPopup, setShowInfoPopup] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [selectedDimensionForGuide, setSelectedDimensionForGuide] =
    useState<AnalysisDimension | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    // Ensure we never regenerate a new session id here; rely on existing one
    const sid = localStorage.getItem('frejfund-session-id');
    if (!sid) {
      router.push('/');
      return;
    }
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    const sessionId = localStorage.getItem('frejfund-session-id');
    if (!sessionId) {
      router.push('/');
      return;
    }

    try {
      // Fetch from API endpoint instead of direct database access
      const response = await fetch(`/api/deep-analysis?sessionId=${sessionId}`);
      if (response.ok) {
        const analysis = await response.json();
        if (analysis && analysis.dimensions && analysis.dimensions.length > 0) {
          setDimensions(analysis.dimensions);
          setOverallScore(analysis.overallScore || 0);
          setConfidenceWeightedScore(analysis.confidenceWeightedScore || analysis.overallScore || 0);
          setDataCompleteness(analysis.dataCompleteness || 0);
          setCompanyStage(analysis.companyStage || 'startup');
        } else {
          // Keep dimensions empty while loading
          setDimensions([]);
          setOverallScore(0);
          setConfidenceWeightedScore(0);
          setDataCompleteness(0);
        }
      } else {
        console.error('Failed to load analysis:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to progress via SSE (matches dashboard)
  useEffect(() => {
    const sessionId = localStorage.getItem('frejfund-session-id');
    if (!sessionId) return;
    let es: EventSource | null = null;
    let retries = 0;
    const connect = () => {
      if (!(window as any).__ff_es) (window as any).__ff_es = {};
      if ((window as any).__ff_es[sessionId]) {
        es = (window as any).__ff_es[sessionId];
        return;
      }
      es = new EventSource(`/api/deep-analysis/progress?sessionId=${sessionId}`);
      (window as any).__ff_es[sessionId] = es;
      es.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type === 'progress') {
          setAnalysisProgress({ current: data.current, total: data.total, status: 'running' });
        }
        if (data.type === 'complete')
          setAnalysisProgress({ current: 95, total: 95, status: 'completed' });
      };
      es.onerror = () => {
        try {
          es && es.close();
        } catch {}
        if (retries < 5) {
          retries += 1;
          setTimeout(connect, 1000 * retries); // backoff
        }
      };
    };
    connect();
    return () => {
      try {
        es && es.close();
        (window as any).__ff_es[sessionId] = null;
      } catch {}
    };
  }, []);

  const getCategoryDimensions = (categoryId: string) => {
    if (categoryId === 'All') return dimensions;
    return dimensions.filter((d) => d.category === categoryId);
  };

  const getCategoryScore = (categoryId: string) => {
    const catDimensions = getCategoryDimensions(categoryId);
    if (catDimensions.length === 0) return 0;
    return Math.round(catDimensions.reduce((sum, d) => sum + d.score, 0) / catDimensions.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return Info;
    return AlertCircle;
  };

  const handleRerunAnalysis = async () => {
    const sessionId = localStorage.getItem('frejfund-session-id');
    if (!sessionId) return;

    setIsRerunning(true);
    try {
      const response = await fetch('/api/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        // Reset dimensions to show loading state
        setDimensions([]);
        setAnalysisProgress({ current: 0, total: 95, status: 'running' });
        // Reload data will happen via SSE updates
      } else {
        console.error('Failed to restart analysis');
      }
    } catch (error) {
      console.error('Error restarting analysis:', error);
    } finally {
      setIsRerunning(false);
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTopImprovements = () => {
    // Find dimensions with lowest scores to suggest improvements
    const lowScoreDimensions = dimensions
      .filter((dim) => dim.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    return lowScoreDimensions.map((dim) => {
      const impact = Math.round((100 - dim.score) * 0.3); // Potential score improvement
      const priority = dim.score < 30 ? 'critical' : dim.score < 50 ? 'high' : 'medium';

      return {
        title: `Improve ${dim.name}`,
        description:
          dim.recommendations?.[0] ||
          dim.suggestions?.[0] ||
          `Focus on strengthening your ${dim.name.toLowerCase()} to boost investor confidence.`,
        impact,
        priority,
        timeframe:
          priority === 'critical' ? '1-2 weeks' : priority === 'high' ? '1 month' : '2-3 months',
      };
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20 sm:pt-24" />

      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-8 mt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header with Overall Score */}
        <div className="minimal-box minimal-box-shadow mb-8 p-8 sm:p-12 text-center">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Deep Business Analysis
              </h1>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Your business analyzed across 95 dimensions using advanced AI reasoning (gpt-5)
              </p>
            </div>
            {/* Re-run Analysis Button */}
            {analysisProgress.status === 'completed' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRerunAnalysis}
                disabled={isRerunning}
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRerunning ? (
                  <>
                    <Circle className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Re-run Analysis</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Score Display - Confidence Weighted + Data Completeness */}
          <div className="inline-block">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 max-w-2xl mx-auto">
              {/* Confidence-Weighted Score (Primary) */}
              <div>
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="#e5e5e5" strokeWidth="14" />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#000"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={534}
                      initial={{ strokeDashoffset: 534 }}
                      animate={{ strokeDashoffset: 534 - (confidenceWeightedScore / 100) * 534 }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl sm:text-6xl font-bold text-black">{confidenceWeightedScore}</span>
                    <span className="text-sm text-gray-500 mt-1">Score</span>
                  </div>
                </div>
                <p className="text-center text-base font-semibold text-black">Investment Score</p>
                <p className="text-center text-sm text-gray-500 mt-1">Confidence-weighted</p>
              </div>

              {/* Data Completeness */}
              <div>
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="#e5e5e5" strokeWidth="14" />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={534}
                      initial={{ strokeDashoffset: 534 }}
                      animate={{ strokeDashoffset: 534 - (dataCompleteness / 100) * 534 }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl sm:text-6xl font-bold text-gray-700">{dataCompleteness}%</span>
                    <span className="text-sm text-gray-500 mt-1">Complete</span>
                  </div>
                </div>
                <p className="text-center text-base font-semibold text-black">Data Quality</p>
                <p className="text-center text-sm text-gray-500 mt-1">High-confidence data</p>
                {dataCompleteness < 70 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadModal(true)}
                    className="mt-3 w-full px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Upload Documents
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unit Economics Card (Derived + OCR) */}
        {analysisProgress.status === 'completed' && (
          <div className="minimal-box mb-8 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-black mb-4">Unit Economics (Estimated)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                const d = (analysisData as any)?.derivedUnitEconomics || {};
                const items = [
                  { k: 'LTV/CAC', v: d.ltvCac != null ? d.ltvCac : '—' },
                  { k: 'Payback (mo)', v: d.paybackMonths != null ? d.paybackMonths : '—' },
                  { k: 'ARPU', v: d.arpu != null ? `$${Number(d.arpu).toLocaleString()}` : '—' },
                  { k: 'Gross Margin', v: d.grossMargin != null ? `${d.grossMargin}%` : '—' },
                ];
                return items.map(({ k, v }) => (
                  <div key={k} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{k}</div>
                    <div className="text-base font-semibold text-black">{v}</div>
                  </div>
                ));
              })()}
            </div>
            {(analysisData as any)?.ocrMetrics && (
              <>
                <h3 className="text-sm font-semibold text-black mt-6 mb-2">From Pitch Deck (OCR)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries((analysisData as any).ocrMetrics).map(([key, value]) => (
                    <div key={key} className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{key}</div>
                      <div className="text-base font-semibold text-black">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">Est. values. Parsed automatically from uploaded PDFs.</p>
              </>
            )}
            {/* Future: Add an Edit button to override metrics manually */}
          </div>
        )}

        {/* Improvement Recommendations Box (pulsing shadow) */}
        <div className="minimal-box minimal-box-shadow mb-8 p-4 sm:p-6 md:p-8 animate-[pulseShadow_2.5s_ease-in-out_infinite]">
          <h2 className="text-lg sm:text-xl font-bold text-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">How to Improve Your Score</span>
            <span className="sm:hidden">Improve Score</span>
          </h2>
          <div className="space-y-3">
            {getTopImprovements().map((improvement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 ${
                    improvement.priority === 'critical'
                      ? 'bg-red-500'
                      : improvement.priority === 'high'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black text-sm sm:text-base">
                    {improvement.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{improvement.description}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 sm:py-1 bg-gray-100 rounded-full">
                      +{improvement.impact} points
                    </span>
                    <span className="text-xs text-gray-500">{improvement.timeframe}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/chat')}
            className="mt-6 w-full px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Get Personalized Guidance from Freja
          </motion.button>
        </div>

        {/* Category Tabs */}
        <div className="minimal-box p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              const categoryScore = getCategoryScore(category.id);

              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-3 px-4 sm:px-6 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">{category.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-gray-100'
                    }`}
                  >
                    {category.count}
                  </span>
                  {categoryScore > 0 && (
                    <span
                      className={`text-xs font-bold ${
                        isActive ? 'text-white' : getScoreColor(categoryScore)
                      }`}
                    >
                      {categoryScore}%
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Progress Banner (mirrors dashboard) */}
        {analysisProgress && analysisProgress.status === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black text-white rounded-xl px-4 py-3 mb-4"
          >
            <div className="flex items-center justify-between">
              <span>
                Deep analysis in progress… {analysisProgress.current}/{analysisProgress.total}
              </span>
              <span className="text-sm">
                {Math.round((analysisProgress.current / analysisProgress.total) * 100)}%
              </span>
            </div>
          </motion.div>
        )}

        {/* Dimension Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="minimal-box p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading analysis data...</p>
              </div>
            ) : getCategoryDimensions(activeCategory).length === 0 ? (
              <div className="minimal-box p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Circle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">Analysis in progress</p>
                <p className="text-sm text-gray-500">This category is being analyzed by GPT-5</p>
              </div>
            ) : (
              getCategoryDimensions(activeCategory).map((dimension, index) => {
                const ScoreIcon = getScoreIcon(dimension.score);

                return (
                  <motion.div
                    key={dimension.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="minimal-box p-6 hover:shadow-lg transition-shadow"
                  >
                    {/* Dimension Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-black">{dimension.name}</h3>
                          {(DIMENSION_EXAMPLES[dimension.name] ||
                            getAutoExample(dimension.name)) && (
                            <button
                              onClick={() => setShowInfoPopup(dimension.name)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <ScoreIcon className={`w-5 h-5 ${getScoreColor(dimension.score)}`} />
                            {dimension.score > 0 ? (
                              <span
                                className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}
                              >
                                {dimension.score}%
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-gray-500">
                                Pending – Not enough data
                              </span>
                            )}
                          </div>
                          {dimension.status === 'completed' && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              Analyzed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Findings Grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Strengths */}
                      {dimension.strengths.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {dimension.strengths.map((strength, i) => (
                              <li key={i} className="text-sm text-gray-600 pl-5 relative">
                                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-green-600 rounded-full" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Red Flags */}
                      {dimension.redFlags.length > 0 && (
                        <div className="space-y-2">
                          {dimension.score === 0 &&
                            dimension.strengths.length === 0 &&
                            dimension.redFlags.length === 0 && (
                              <div className="col-span-2">
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-700 mb-2">
                                    What’s needed to assess this:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {(
                                      DIMENSION_EXAMPLES[dimension.name] ||
                                      getAutoExample(dimension.name)
                                    ).dataNeeded.map((d, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-full"
                                      >
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            Red Flags
                          </h4>
                          <ul className="space-y-1">
                            {dimension.redFlags.map((flag, i) => (
                              <li key={i} className="text-sm text-gray-600 pl-5 relative">
                                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-red-600 rounded-full" />
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Evidence & Confidence */}
                    {dimension.confidence && (
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Confidence:</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(dimension.confidence)}`}
                          >
                            {dimension.confidence}
                          </span>
                        </div>
                        {dimension.evidence && dimension.evidence.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Sources:</span>
                            <span className="text-xs text-gray-600">
                              {dimension.evidence.length} data points
                            </span>
                          </div>
                        )}
                        {dimension.score < 70 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedDimensionForGuide(dimension)}
                            className="ml-auto text-xs px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3" />
                            Get Help
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {(dimension.recommendations && dimension.recommendations.length > 0) ||
                    (dimension.suggestions && dimension.suggestions.length > 0) ? (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {(dimension.recommendations || dimension.suggestions || []).map(
                            (rec, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-black rounded-full mt-2" />
                                <p className="text-sm text-gray-600">{rec}</p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* Export & Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/chat')}
            className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Discuss with Freja
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-white text-black border border-gray-300 rounded-xl font-medium hover:border-black transition-colors"
          >
            Export Analysis
          </motion.button>
        </div>
      </div>

      {/* Info Popup Modal */}
      <AnimatePresence>
        {showInfoPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoPopup(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-black">{showInfoPopup}</h3>
                  <button
                    onClick={() => setShowInfoPopup(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-600 mb-6">
                  {(DIMENSION_EXAMPLES[showInfoPopup] || getAutoExample(showInfoPopup)).description}
                </p>

                <div className="mb-6">
                  <h4 className="font-semibold text-black mb-3">Perfect Examples:</h4>
                  <div className="space-y-2">
                    {(
                      DIMENSION_EXAMPLES[showInfoPopup] || getAutoExample(showInfoPopup)
                    ).examples.map((example, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{example}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-black mb-3">Data Sources Needed:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(
                      DIMENSION_EXAMPLES[showInfoPopup] || getAutoExample(showInfoPopup)
                    ).dataNeeded.map((data, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {data}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Create a simple Word template
                      const template = `
${showInfoPopup} - Data Collection Template

Description:
${(DIMENSION_EXAMPLES[showInfoPopup] || getAutoExample(showInfoPopup)).description}

Please fill in your data below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Current Situation:
   _________________________________
   _________________________________
   _________________________________

2. Key Metrics:
   _________________________________
   _________________________________
   _________________________________

3. Supporting Evidence:
   _________________________________
   _________________________________
   _________________________________

Examples for reference:
${(DIMENSION_EXAMPLES[showInfoPopup] || getAutoExample(showInfoPopup)).examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

Data sources to check:
${(DIMENSION_EXAMPLES[showInfoPopup] || getAutoExample(showInfoPopup)).dataNeeded.join(', ')}
`;
                      const blob = new Blob([template], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${showInfoPopup.replace(/[^a-z0-9]/gi, '_')}_template.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Template
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInfoPopup(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Improvement Guide Modal */}
      {selectedDimensionForGuide && (
        <ImprovementGuide
          isOpen={!!selectedDimensionForGuide}
          onClose={() => setSelectedDimensionForGuide(null)}
          dimension={selectedDimensionForGuide}
        />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={() => {
          loadAnalysisData();
        }}
      />
    </div>
  );
}
