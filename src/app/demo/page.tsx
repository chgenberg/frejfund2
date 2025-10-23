'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, ChevronRight, 
  AlertCircle, CheckCircle, XCircle, Info,
  Building2, Rocket, Briefcase, Target,
  Users, Globe, DollarSign, BarChart3,
  Zap, Shield, Brain, Sparkles,
  FileText, ExternalLink, Download, Share2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Static demo data - always available
const DEMO_ANALYSIS = {
  id: 'demo-001',
  overallScore: 72,
  confidenceWeightedScore: 68,
  dataCompleteness: 85,
  investmentReadiness: 7,
  companyStage: 'startup',
  businessInfo: {
    name: 'TechVenture AB',
    website: 'https://techventure.se',
    industry: 'SaaS',
    stage: 'Pre-seed',
    monthlyRevenue: '25000',
    teamSize: '5'
  },
  ocrMetrics: {
    cac: 1200,
    ltv: 3600,
    mrr: 25000,
    churnRate: 5,
    grossMargin: 78,
    runway: 18
  },
  dimensions: [
    {
      id: '1',
      name: 'Problem Clarity',
      category: 'Product & Technology',
      score: 85,
      importance: 'critical',
      status: 'strong',
      insights: [
        'Clear problem definition targeting SME market inefficiencies',
        'Validated through 50+ customer interviews',
        'Addresses a €2.5B addressable market in Nordics'
      ],
      recommendations: [
        'Document specific pain points with quantitative metrics',
        'Expand validation to enterprise segment'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '2',
      name: 'Solution Uniqueness',
      category: 'Product & Technology',
      score: 72,
      importance: 'high',
      status: 'moderate',
      insights: [
        'AI-powered automation provides competitive edge',
        'Patent pending on core algorithm',
        'Limited differentiation in UI/UX compared to competitors'
      ],
      recommendations: [
        'Strengthen IP portfolio with additional patents',
        'Invest in distinctive user experience design',
        'Develop proprietary data moat'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '3',
      name: 'Market Size & Growth',
      category: 'Market & Competition',
      score: 78,
      importance: 'critical',
      status: 'strong',
      insights: [
        'TAM of €12B globally with 22% CAGR',
        'Strong tailwinds from digital transformation',
        'Early market with room for multiple winners'
      ],
      recommendations: [
        'Develop market entry strategy for UK and DACH',
        'Create detailed market sizing for each vertical'
      ],
      confidence: 'medium',
      isApplicable: true
    },
    {
      id: '4',
      name: 'Competitive Landscape',
      category: 'Market & Competition',
      score: 65,
      importance: 'high',
      status: 'moderate',
      insights: [
        '3 direct competitors with €10M+ funding',
        'First mover in Nordic market',
        'Risk of US competitors entering market'
      ],
      recommendations: [
        'Build strategic partnerships to create barriers',
        'Accelerate product development to maintain lead',
        'Consider defensive IP strategy'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '5',
      name: 'Revenue Model',
      category: 'Business Model',
      score: 82,
      importance: 'critical',
      status: 'strong',
      insights: [
        'SaaS model with €2k-10k ACV',
        'Negative churn through upsells',
        '90% gross margins on software'
      ],
      recommendations: [
        'Test enterprise pricing tiers',
        'Develop usage-based pricing option'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '6',
      name: 'Unit Economics',
      category: 'Business Model',
      score: 74,
      importance: 'critical',
      status: 'moderate',
      insights: [
        'LTV/CAC ratio of 3.0x',
        'Payback period of 12 months',
        'Improving with scale'
      ],
      recommendations: [
        'Reduce CAC through product-led growth',
        'Increase ACV to improve unit economics'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '7',
      name: 'Team Experience',
      category: 'Team & Execution',
      score: 68,
      importance: 'critical',
      status: 'moderate',
      insights: [
        'Strong technical team with AI expertise',
        'CEO has previous startup experience',
        'Limited sales and marketing experience'
      ],
      recommendations: [
        'Hire experienced VP Sales',
        'Add board advisor with SaaS scaling experience',
        'Build out marketing team'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '8',
      name: 'Execution Track Record',
      category: 'Team & Execution',
      score: 70,
      importance: 'high',
      status: 'moderate',
      insights: [
        'Delivered MVP 2 months ahead of schedule',
        'Hit 80% of Q3 milestones',
        'Customer acquisition slower than projected'
      ],
      recommendations: [
        'Implement OKR framework',
        'Increase sprint velocity by 20%'
      ],
      confidence: 'medium',
      isApplicable: true
    },
    {
      id: '9',
      name: 'Customer Traction',
      category: 'Traction & Metrics',
      score: 62,
      importance: 'high',
      status: 'weak',
      insights: [
        '25 paying customers in 6 months',
        'NPS score of 72',
        'Strong product-market fit signals in SME segment'
      ],
      recommendations: [
        'Accelerate customer acquisition',
        'Develop case studies from top customers',
        'Launch referral program'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '10',
      name: 'Growth Metrics',
      category: 'Traction & Metrics',
      score: 58,
      importance: 'high',
      status: 'weak',
      insights: [
        '15% MoM revenue growth',
        'Pipeline growing 25% monthly',
        'Conversion rate improving'
      ],
      recommendations: [
        'Target 20%+ MoM growth',
        'Implement growth experiments',
        'Optimize conversion funnel'
      ],
      confidence: 'medium',
      isApplicable: true
    },
    {
      id: '11',
      name: 'Regulatory Compliance',
      category: 'Risk & Compliance',
      score: 88,
      importance: 'medium',
      status: 'strong',
      insights: [
        'GDPR compliant with DPA',
        'ISO 27001 certification in progress',
        'Clear data governance policies'
      ],
      recommendations: [
        'Complete SOC 2 certification',
        'Prepare for AI Act compliance'
      ],
      confidence: 'high',
      isApplicable: true
    },
    {
      id: '12',
      name: 'Financial Risk',
      category: 'Risk & Compliance',
      score: 72,
      importance: 'high',
      status: 'moderate',
      insights: [
        '18 months runway at current burn',
        'Revenue growing faster than costs',
        'Need to raise Series A in 9 months'
      ],
      recommendations: [
        'Extend runway to 24 months',
        'Start Series A conversations early',
        'Build relationships with target investors'
      ],
      confidence: 'high',
      isApplicable: true
    }
  ]
};

interface AnalysisDimension {
  id: string;
  name: string;
  category: string;
  score: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: 'strong' | 'moderate' | 'weak' | 'critical';
  insights: string[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  isApplicable: boolean;
}

export default function DemoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Product & Technology': Zap,
      'Market & Competition': Globe,
      'Business Model': DollarSign,
      'Team & Execution': Users,
      'Traction & Metrics': BarChart3,
      'Risk & Compliance': Shield,
    };
    return icons[category] || Briefcase;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'strong': return CheckCircle;
      case 'moderate': return AlertCircle;
      case 'weak': return XCircle;
      case 'critical': return XCircle;
      default: return Info;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'strong': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'weak': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatMetric = (key: string, value: number) => {
    const formatters: Record<string, (v: number) => string> = {
      cac: (v) => `$${v.toLocaleString()}`,
      ltv: (v) => `$${v.toLocaleString()}`,
      mrr: (v) => `$${v.toLocaleString()}/mo`,
      arr: (v) => `$${v.toLocaleString()}/yr`,
      churnRate: (v) => `${v}%`,
      growthRate: (v) => `${v}%`,
      grossMargin: (v) => `${v}%`,
      burnRate: (v) => `$${v.toLocaleString()}/mo`,
      runway: (v) => `${v} months`,
      employees: (v) => v.toString(),
      customers: (v) => v.toLocaleString(),
      conversion: (v) => `${v}%`,
    };
    return formatters[key] ? formatters[key](value) : value.toString();
  };

  const categories = [...new Set(DEMO_ANALYSIS.dimensions.map(d => d.category))];
  const businessInfo = DEMO_ANALYSIS.businessInfo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {businessInfo.name} - Investment Analysis
              </h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Demo View
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run Your Own Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Investment Score</h3>
              <Rocket className="w-5 h-5 text-blue-600" />
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(DEMO_ANALYSIS.confidenceWeightedScore)}`}>
              {DEMO_ANALYSIS.confidenceWeightedScore}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Confidence-weighted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Data Quality</h3>
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {DEMO_ANALYSIS.dataCompleteness}%
            </p>
            <p className="text-xs text-gray-500 mt-1">High-confidence data</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Stage</h3>
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {DEMO_ANALYSIS.companyStage}
            </p>
            <p className="text-xs text-gray-500 mt-1">Auto-detected</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Readiness</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {DEMO_ANALYSIS.investmentReadiness}/10
            </p>
            <p className="text-xs text-gray-500 mt-1">Investment readiness</p>
          </motion.div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimensions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {DEMO_ANALYSIS.dimensions
            .filter(d => !selectedCategory || d.category === selectedCategory)
            .map((dimension, index) => {
              const StatusIcon = getStatusIcon(dimension.status);
              const CategoryIcon = getCategoryIcon(dimension.category);
              
              return (
                <motion.div
                  key={dimension.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className={`p-6 ${dimension.isApplicable ? '' : 'opacity-60'}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">{dimension.category}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dimension.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(dimension.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-xs font-medium capitalize">{dimension.status}</span>
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                          {dimension.score}%
                        </div>
                      </div>
                    </div>

                    {/* Insights */}
                    {dimension.insights.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
                        <ul className="space-y-1">
                          {dimension.insights.map((insight, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {dimension.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {dimension.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence & Importance */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <span className={`text-xs font-medium ${
                          dimension.confidence === 'high' ? 'text-green-600' :
                          dimension.confidence === 'medium' ? 'text-yellow-600' :
                          'text-orange-600'
                        }`}>
                          {dimension.confidence}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Importance:</span>
                        <span className={`text-xs font-medium ${
                          dimension.importance === 'critical' ? 'text-red-600' :
                          dimension.importance === 'high' ? 'text-orange-600' :
                          dimension.importance === 'medium' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {dimension.importance}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* OCR Metrics */}
        {DEMO_ANALYSIS.ocrMetrics && Object.keys(DEMO_ANALYSIS.ocrMetrics).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Metrics from Pitch Deck
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(DEMO_ANALYSIS.ocrMetrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatMetric(key, value as number)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Unit Economics:</strong> LTV/CAC ratio of 3.0x with 12-month payback period indicates healthy fundamentals
              </p>
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">
            Ready to Get Your Own Investment Analysis?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Get detailed insights about your startup's investment readiness in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Start Free Analysis
            </button>
            <button
              onClick={() => router.push('/vc/login')}
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              I'm an Investor
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}