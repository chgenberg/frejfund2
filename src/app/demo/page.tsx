'use client';

import { useState } from 'react';
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

// Static demo data - Real analysis from We Are Bryssel
const DEMO_ANALYSIS = {
  id: 'cmh3fjhtp0001rz4rhbjcvoxl',
  overallScore: 22,
  confidenceWeightedScore: 22,
  dataCompleteness: 65,
  investmentReadiness: 2,
  companyStage: 'startup',
  businessInfo: {
    name: 'We Are Bryssel',
    website: 'https://wearebryssel.se',
    industry: 'Event Production & Experiential Marketing',
    stage: 'MVP',
    monthlyRevenue: '10-50k',
    teamSize: '2-5'
  },
  ocrMetrics: null,
  dimensions: [
    {
      id: '1',
      name: 'Funding Stage Appropriateness',
      category: 'Fundraising',
      score: 48,
      importance: 'high' as const,
      status: 'weak' as const,
      findings: [
        "Event production company 'Bryssel' focused on experiences and storytelling",
        'Stage: MVP with revenue 10-50k per period',
        'Clear positioning in events, music and media production'
      ],
      strengths: [
        'Clear business focus',
        'Existing revenue generation',
        'Defined market positioning'
      ],
      redFlags: [
        'Limited financial information',
        'No team information provided',
        'Unclear funding stage fit'
      ],
      recommendations: [
        'Provide detailed team information and organizational structure',
        'Document traction: revenue trends, customer list, repeat business',
        'Define unit economics, pricing model, margins and runway'
      ],
      confidence: 'high' as const,
      dataSources: ['Website content', 'Business model analysis']
    },
    {
      id: '2',
      name: 'Solution-Problem Fit',
      category: 'Problem & Solution',
      score: 45,
      importance: 'critical' as const,
      status: 'weak' as const,
      findings: [
        'Offers event production to strengthen brands and drive sales through experiences',
        'Positions work as creating stories and word-of-mouth',
        'Serves music and media projects with broad event production spectrum'
      ],
      strengths: [
        'Clear value proposition',
        'Focus on experiential marketing',
        'Multi-industry capability'
      ],
      redFlags: [
        'No quantifiable problem statement',
        'Missing customer validation data',
        'Unclear differentiation'
      ],
      recommendations: [
        'Document measurable outcomes, KPIs, or case studies',
        'Define target customer segments and core problem explicitly',
        'Establish pricing model, repeatability metrics and scalability path'
      ],
      confidence: 'high' as const,
      dataSources: ['Website analysis', 'Service offering review']
    },
    {
      id: '3',
      name: 'Competitive Moat/Defensibility',
      category: 'Market & Competition',
      score: 28,
      importance: 'high' as const,
      status: 'critical' as const,
      findings: [
        'Production company creating brand experiences and stories',
        'Works across events, music, and media industries',
        'No proprietary technology, data, patents mentioned'
      ],
      strengths: [
        'Cross-industry experience',
        'Creative storytelling focus',
        'Brand experience expertise'
      ],
      redFlags: [
        'No clear competitive moat',
        'Easily replicable services',
        'No proprietary assets'
      ],
      recommendations: [
        'Build network effects or platform-based approach',
        'Develop proprietary data assets or unique IP',
        'Create high switching costs through long-term contracts'
      ],
      confidence: 'high' as const,
      dataSources: ['Competitive analysis', 'Business model review']
    },
    {
      id: '4',
      name: 'Unit Economics',
      category: 'Business Model',
      score: 25,
      importance: 'critical' as const,
      status: 'critical' as const,
      findings: [
        'Revenue band 10-50k with no period specified',
        'Events/production company focused on experiences',
        'No data on pricing, costs, marketing spend, or customer metrics'
      ],
      strengths: [
        'Generating revenue',
        'Active business operations',
        'Multiple service lines'
      ],
      redFlags: [
        'No unit economics data',
        'Missing cost structure',
        'Unclear profitability'
      ],
      recommendations: [
        'Establish LTV, CAC, LTV:CAC ratio, and CAC payback metrics',
        'Track per-event profitability and margin structure',
        'Define marketing/sales costs and customer acquisition efficiency'
      ],
      confidence: 'high' as const,
      dataSources: ['Financial data analysis', 'Business model assessment']
    },
    {
      id: '5',
      name: 'Customer Acquisition Strategy',
      category: 'Go-to-Market',
      score: 25,
      importance: 'high' as const,
      status: 'critical' as const,
      findings: [
        'Event/production agency for branded experiences',
        'No explicit acquisition channels mentioned',
        'No evidence of repeatable/scalable acquisition model'
      ],
      strengths: [
        'Clear service offering',
        'Industry positioning',
        'Experience-focused approach'
      ],
      redFlags: [
        'No acquisition strategy',
        'Missing channel metrics',
        'Unclear growth model'
      ],
      recommendations: [
        'Define sales motion and channel strategy for repeatability',
        'Document performance metrics, case studies, pricing',
        'Establish target customer segments and acquisition funnel'
      ],
      confidence: 'high' as const,
      dataSources: ['Go-to-market analysis', 'Sales strategy review']
    },
    {
      id: '6',
      name: 'Competitive Landscape',
      category: 'Market & Competition',
      score: 25,
      importance: 'medium' as const,
      status: 'critical' as const,
      findings: [
        'No competitor analysis or references in materials',
        'Clear service focus on event production and storytelling',
        'Active in music and media industries'
      ],
      strengths: [
        'Defined service niche',
        'Industry experience',
        'Creative positioning'
      ],
      redFlags: [
        'No competitive analysis',
        'Missing market context',
        'Unclear differentiation'
      ],
      recommendations: [
        'Develop competitor mapping and market positioning analysis',
        'Create case studies, client lists and performance metrics',
        'Establish market context and competitive differentiation'
      ],
      confidence: 'high' as const,
      dataSources: ['Market research', 'Competitive intelligence']
    },
    {
      id: '7',
      name: 'Founder-Market Fit',
      category: 'Team & Execution',
      score: 22,
      importance: 'critical' as const,
      status: 'critical' as const,
      findings: [
        'Events production firm focused on brand experiences',
        'Claims in music and media with sales-driven approach',
        'No founder names, bios, or LinkedIn profiles provided'
      ],
      strengths: [
        'Industry focus clear',
        'Sales-driven approach',
        'Creative positioning'
      ],
      redFlags: [
        'No founder information',
        'Missing team credentials',
        'Unclear experience levels'
      ],
      recommendations: [
        'Provide founder backgrounds and relevant experience',
        'Document past clients, case studies and outcomes',
        'Add LinkedIn profiles and team credentials'
      ],
      confidence: 'high' as const,
      dataSources: ['Team analysis', 'Founder research']
    },
    {
      id: '8',
      name: 'Revenue Growth Rate',
      category: 'Traction & Growth',
      score: 20,
      importance: 'high' as const,
      status: 'critical' as const,
      findings: [
        'MRR range 10-50k with high uncertainty',
        'No MoM or YoY growth rates available',
        'No historical revenue data or growth charts'
      ],
      strengths: [
        'Active revenue generation',
        'Operating business',
        'Multiple revenue streams'
      ],
      redFlags: [
        'No growth metrics',
        'Wide revenue range',
        'Missing historical data'
      ],
      recommendations: [
        'Track and report explicit MoM/YoY growth metrics',
        'Narrow down current MRR with precise figures',
        'Provide historical revenue series to show trajectory'
      ],
      confidence: 'high' as const,
      dataSources: ['Financial analysis', 'Growth metrics review']
    },
    {
      id: '9',
      name: 'Revenue Model Clarity',
      category: 'Business Model',
      score: 15,
      importance: 'critical' as const,
      status: 'critical' as const,
      findings: [
        'No explicit revenue model disclosed',
        'Event production company across events, music, media',
        'Value prop focuses on experiences driving brand and sales'
      ],
      strengths: [
        'Clear value proposition',
        'Multi-service capability',
        'Experience focus'
      ],
      redFlags: [
        'No revenue model details',
        'Missing pricing structure',
        'Unclear monetization'
      ],
      recommendations: [
        'Define monetization mechanisms (service fees, ticketing, sponsorships)',
        'Establish pricing structure and payment terms',
        'Document client structure and revenue predictability'
      ],
      confidence: 'high' as const,
      dataSources: ['Business model analysis', 'Revenue assessment']
    },
    {
      id: '10',
      name: 'Product-Market Fit Signals',
      category: 'Traction & Growth',
      score: 15,
      importance: 'high' as const,
      status: 'critical' as const,
      findings: [
        'Event production focused on shareable experiences',
        'Involvement across events, music and media sectors',
        'No quantitative customer, growth, or retention data'
      ],
      strengths: [
        'Clear service focus',
        'Multi-sector presence',
        'Experience orientation'
      ],
      redFlags: [
        'No PMF metrics',
        'Missing customer data',
        'No retention metrics'
      ],
      recommendations: [
        'Track organic growth, referrals, and word-of-mouth metrics',
        'Gather customer testimonials and case studies',
        'Monitor churn, retention and feature-request patterns'
      ],
      confidence: 'medium' as const,
      dataSources: ['Traction analysis', 'Customer research']
    },
    {
      id: '11',
      name: 'Market Size (TAM/SAM/SOM)',
      category: 'Market & Competition',
      score: 12,
      importance: 'high' as const,
      status: 'critical' as const,
      findings: [
        'Events/production company for experiences and storytelling',
        'No market size or TAM/SAM/SOM figures provided',
        'Industry focus on events, music and media'
      ],
      strengths: [
        'Large addressable markets',
        'Multiple industry exposure',
        'Growing sectors'
      ],
      redFlags: [
        'No market sizing',
        'Missing TAM/SAM/SOM',
        'No growth projections'
      ],
      recommendations: [
        'Research and document TAM/SAM/SOM for event production',
        'Align market sizing with revenue potential and geography',
        'Include industry reports and market growth projections'
      ],
      confidence: 'high' as const,
      dataSources: ['Market research', 'Industry analysis']
    },
    {
      id: '12',
      name: 'Problem Clarity',
      category: 'Problem & Solution',
      score: 12,
      importance: 'critical' as const,
      status: 'critical' as const,
      findings: [
        'Marketing copy describing services, not problem statement',
        'No customer pain points or urgency mentioned',
        'No customer quotes or demand validation'
      ],
      strengths: [
        'Service clarity',
        'Industry positioning',
        'Creative approach'
      ],
      redFlags: [
        'No problem definition',
        'Missing pain points',
        'No validation data'
      ],
      recommendations: [
        'Articulate explicit problem statement for investors',
        'Quantify customer pain and market urgency',
        'Include testimonials and real-world problem validation'
      ],
      confidence: 'high' as const,
      dataSources: ['Problem analysis', 'Customer research']
    },
    {
      id: '13',
      name: 'Retention & Churn',
      category: 'Traction & Growth',
      score: 10,
      importance: 'medium' as const,
      status: 'critical' as const,
      findings: [
        'No NRR, GRR, churn or customer lifetime metrics',
        'Focus on event production and brand experiences',
        'No retention KPIs or client success data'
      ],
      strengths: [
        'B2B focus',
        'Relationship-based model',
        'Experience delivery'
      ],
      redFlags: [
        'No retention metrics',
        'Missing churn data',
        'No lifetime value'
      ],
      recommendations: [
        'Implement retention/churn tracking for B2B clients',
        'Document repeat business rates and client lifetime value',
        'Build case studies showing long-term client relationships'
      ],
      confidence: 'high' as const,
      dataSources: ['Customer analysis', 'Retention metrics']
    },
    {
      id: '14',
      name: 'Runway & Burn Rate',
      category: 'Fundraising',
      score: 10,
      importance: 'high' as const,
      status: 'critical' as const,
      findings: [
        'Events/production firm building brands through experiences',
        'No financial data: burn rate, cash, revenue, runway',
        'Unable to determine financial sustainability'
      ],
      strengths: [
        'Revenue generating',
        'Active operations',
        'Service business model'
      ],
      redFlags: [
        'No financial metrics',
        'Missing burn rate',
        'Unknown runway'
      ],
      recommendations: [
        'Document monthly burn rate and current cash position',
        'Calculate runway based on current burn and revenue',
        'Provide team size, traction, and contract pipeline'
      ],
      confidence: 'high' as const,
      dataSources: ['Financial analysis', 'Burn rate assessment']
    }
  ]
};

const CATEGORIES = [
  { id: 'Problem & Solution', label: 'Problem & Solution', icon: Target, count: 6 },
  { id: 'Market & Competition', label: 'Market & Competition', icon: Target, count: 8 },
  { id: 'Business Model', label: 'Business Model', icon: Brain, count: 9 },
  { id: 'Product & Technology', label: 'Product & Technology', icon: Zap, count: 5 },
  { id: 'Team & Execution', label: 'Team & Execution', icon: Users, count: 6 },
  { id: 'Traction & Growth', label: 'Traction & Growth', icon: TrendingUp, count: 7 },
  { id: 'Go-to-Market', label: 'Go-to-Market', icon: Users, count: 5 },
  { id: 'Financial Health', label: 'Financial Health', icon: TrendingUp, count: 5 },
  { id: 'Fundraising', label: 'Fundraising', icon: Brain, count: 5 },
  { id: 'Risks', label: 'Risks', icon: Shield, count: 5 },
  { id: 'All', label: 'All Dimensions', icon: Brain, count: 95 },
];

export default function DemoPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showInfoPopup, setShowInfoPopup] = useState<string | null>(null);

  const getCategoryDimensions = (categoryId: string) => {
    if (categoryId === 'All') return DEMO_ANALYSIS.dimensions;
    return DEMO_ANALYSIS.dimensions.filter((d) => d.category === categoryId);
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
    const lowScoreDimensions = DEMO_ANALYSIS.dimensions
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
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header with Overall Score */}
        <div className="minimal-box minimal-box-shadow mb-8 p-8 sm:p-12 text-center">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Deep Business Analysis - Demo
              </h1>
              <p className="text-gray-600 mb-2 max-w-2xl mx-auto">
                Analysis of {DEMO_ANALYSIS.businessInfo.name} - {DEMO_ANALYSIS.businessInfo.industry}
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Your business analyzed across 95 dimensions using advanced AI reasoning (gpt-5)
              </p>
            </div>
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
                      animate={{ strokeDashoffset: 534 - (DEMO_ANALYSIS.confidenceWeightedScore / 100) * 534 }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl sm:text-6xl font-bold text-black">{DEMO_ANALYSIS.confidenceWeightedScore}</span>
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
                      animate={{ strokeDashoffset: 534 - (DEMO_ANALYSIS.dataCompleteness / 100) * 534 }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl sm:text-6xl font-bold text-gray-700">{DEMO_ANALYSIS.dataCompleteness}%</span>
                    <span className="text-sm text-gray-500 mt-1">Complete</span>
                  </div>
                </div>
                <p className="text-center text-base font-semibold text-black">Data Quality</p>
                <p className="text-center text-sm text-gray-500 mt-1">High-confidence data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Improvement Recommendations Box */}
        <div className="minimal-box minimal-box-shadow mb-8 p-4 sm:p-6 md:p-8">
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
            onClick={() => router.push('/')}
            className="mt-6 w-full px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Get AI-Powered Suggestions</span>
          </motion.button>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      selectedCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {category.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {getCategoryDimensions(selectedCategory).map((dimension, index) => {
              const ScoreIcon = getScoreIcon(dimension.score);
              return (
                <motion.div
                  key={dimension.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="minimal-box minimal-box-shadow hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black flex items-center gap-2">
                          {dimension.name}
                          <button
                            onClick={() => setShowInfoPopup(dimension.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{dimension.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                            {dimension.score}
                          </div>
                          <div className="text-xs text-gray-500">/ 100</div>
                        </div>
                        <ScoreIcon
                          className={`w-8 h-8 ${getScoreColor(dimension.score)}`}
                        />
                      </div>
                    </div>

                    {/* Findings */}
                    {dimension.findings && dimension.findings.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Key Findings
                        </h4>
                        <ul className="space-y-1">
                          {dimension.findings.slice(0, 3).map((finding, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {dimension.recommendations && dimension.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {dimension.recommendations.slice(0, 2).map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence & Importance */}
                    <div className="flex items-center gap-3 pt-3 border-t">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(
                          dimension.confidence
                        )}`}
                      >
                        {dimension.confidence}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          dimension.importance === 'critical'
                            ? 'bg-red-50 text-red-600'
                            : dimension.importance === 'high'
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {dimension.importance}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center minimal-box minimal-box-shadow p-8"
        >
          <h2 className="text-2xl font-bold text-black mb-4">
            Ready to Analyze Your Own Business?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get a comprehensive 95-dimension analysis of your startup with actionable insights and recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Start Your Analysis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/vc/login')}
              className="px-8 py-3 bg-white text-black border-2 border-black rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              I'm an Investor
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Info Popup */}
      <AnimatePresence>
        {showInfoPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInfoPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-black">
                  {DEMO_ANALYSIS.dimensions.find((d) => d.id === showInfoPopup)?.name}
                </h3>
                <button
                  onClick={() => setShowInfoPopup(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                This dimension evaluates how well your business performs in this specific area. 
                The score is based on multiple factors and data points analyzed by our AI system.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}