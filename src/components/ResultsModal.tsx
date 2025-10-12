'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, TrendingUp, Users, DollarSign, Target, Brain, Shield, 
  ChevronRight, AlertTriangle, CheckCircle, Clock, Star,
  Download, Share2, BarChart3, Lightbulb
} from 'lucide-react';
import { BusinessAnalysisResult, BusinessInfo } from '@/types/business';

interface ResultsModalProps {
  result: BusinessAnalysisResult;
  businessInfo: BusinessInfo;
  onClose: () => void;
}

export default function ResultsModal({ result, businessInfo, onClose }: ResultsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'scores' | 'risks'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'scores', label: 'Scores', icon: Star },
    { id: 'risks', label: 'Risks', icon: AlertTriangle }
  ];

  const scoreData = [
    { label: 'Problem-Solution Fit', value: result.scores.problemSolutionFit, color: 'blue' },
    { label: 'Market & Timing', value: result.scores.marketTiming, color: 'green' },
    { label: 'Competitive Moat', value: result.scores.competitiveMoat, color: 'purple' },
    { label: 'Business Model', value: result.scores.businessModel, color: 'orange' },
    { label: 'Team Execution', value: result.scores.teamExecution, color: 'red' },
    { label: 'Traction', value: result.scores.traction, color: 'indigo' },
    { label: 'Financial Health', value: result.scores.financialHealth, color: 'pink' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Derive founder-facing improvement suggestions from weaker score areas
  const getImprovementSuggestions = (): string[] => {
    const s = result.scores;
    const suggestions: Array<{ area: string; score: number; text: string }> = [];
    if (typeof s.problemSolutionFit === 'number' && s.problemSolutionFit < 70) {
      suggestions.push({ area: 'Problem-Solution Fit', score: s.problemSolutionFit, text: 'Tighten ICP and refine the pain → solution story. Add 3 concrete use-cases and before/after metrics.' });
    }
    if (typeof s.marketTiming === 'number' && s.marketTiming < 70) {
      suggestions.push({ area: 'Market & Timing', score: s.marketTiming, text: 'Show demand signals: waitlist size, inbound rate, pilot requests. Add trend data and “why now”.' });
    }
    if (typeof s.competitiveMoat === 'number' && s.competitiveMoat < 70) {
      suggestions.push({ area: 'Competitive Moat', score: s.competitiveMoat, text: 'Strengthen moat via data assets, distribution partnerships, switching costs or IP. Add a clear moat slide.' });
    }
    if (typeof s.businessModel === 'number' && s.businessModel < 70) {
      suggestions.push({ area: 'Business Model', score: s.businessModel, text: 'Clarify unit economics: target CAC/LTV, payback, pricing tiers. Add 12–18m monetization plan.' });
    }
    if (typeof s.teamExecution === 'number' && s.teamExecution < 70) {
      suggestions.push({ area: 'Team Execution', score: s.teamExecution, text: 'Close key gaps (e.g., sales/ops). Add advisors with credibility and list shipped milestones last 90 days.' });
    }
    if (typeof s.traction === 'number' && s.traction < 70) {
      suggestions.push({ area: 'Traction', score: s.traction, text: 'Prioritize proof: 3 pilots, first $10k MRR, or 10 paying logos. Add retention or usage graphs.' });
    }
    if (typeof s.financialHealth === 'number' && s.financialHealth < 70) {
      suggestions.push({ area: 'Financial Health', score: s.financialHealth, text: 'Show runway, planned burn, and use of funds tied to milestones. Include contingency plan.' });
    }
    // Sort by lowest score first and return top 3
    return suggestions.sort((a, b) => a.score - b.score).slice(0, 3).map(sug => `${sug.text}`);
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Company Context */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Context</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Stage:</span>
            <div className="font-medium text-gray-900 capitalize">{result.companyContext.stage}</div>
          </div>
          <div>
            <span className="text-gray-600">Industry:</span>
            <div className="font-medium text-gray-900">{result.companyContext.industry}</div>
          </div>
          <div>
            <span className="text-gray-600">Target Market:</span>
            <div className="font-medium text-gray-900">{result.companyContext.targetMarket}</div>
          </div>
          <div>
            <span className="text-gray-600">Business Model:</span>
            <div className="font-medium text-gray-900">{result.companyContext.businessModel}</div>
          </div>
          <div>
            <span className="text-gray-600">Revenue:</span>
            <div className="font-medium text-gray-900">{result.companyContext.revenue}</div>
          </div>
          <div>
            <span className="text-gray-600">Team Size:</span>
            <div className="font-medium text-gray-900">{result.companyContext.team}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.scores.overallScore)}`}>
              {result.scores.overallScore}/100
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
          <p className="text-sm text-gray-600">Investment readiness assessment</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
              {result.accuracy}%
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Analysis Accuracy</h3>
          <p className="text-sm text-gray-600">Data quality confidence</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
              {result.actionableInsights.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
          <p className="text-sm text-gray-600">Actionable recommendations</p>
        </motion.div>
      </div>

      {/* Investment Thesis */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Thesis</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Market Opportunity</h4>
            <p className="text-sm text-gray-600">{result.investmentThesis.opportunitySize}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Market Validation</h4>
            <p className="text-sm text-gray-600">{result.investmentThesis.marketValidation}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Competitive Advantage</h4>
            <p className="text-sm text-gray-600">{result.investmentThesis.competitiveAdvantage}</p>
          </div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">Scalability Factor:</h4>
            <div className="flex items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < result.investmentThesis.scalabilityFactor
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {result.investmentThesis.scalabilityFactor}/10
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderInsights = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* How to improve your score */}
      {(() => {
        const improvements = getImprovementSuggestions();
        if (improvements.length === 0) return null;
        return (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900">How to improve your score</h3>
              <p className="text-sm text-gray-600">High-impact, low-regret actions to move the needle</p>
            </div>
            <ul className="space-y-2">
              {improvements.map((tip, i) => (
                <li key={i} className="flex items-start space-x-2 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Actionable Insights</h3>
        <p className="text-gray-600">Personalized recommendations to improve your investment readiness</p>
      </div>

      <div className="space-y-4">
        {result.actionableInsights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                      {insight.priority.toUpperCase()}
                    </span>
                    <span className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {insight.timeline}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">{insight.description}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h5 className="font-medium text-gray-900 mb-2">Expected Impact:</h5>
              <p className="text-sm text-gray-600">{insight.expectedImpact}</p>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-2">Action Steps:</h5>
              <ul className="space-y-2">
                {insight.specificSteps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Funding Strategy</h4>
            <p className="text-sm text-gray-600">{result.recommendations.fundingStrategy}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Next Milestones</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {result.recommendations.nextMilestones.map((milestone, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Team Gaps</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {result.recommendations.teamGaps.map((gap, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Market Approach</h4>
            <p className="text-sm text-gray-600">{result.recommendations.marketApproach}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderScores = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Investment Scores</h3>
        <p className="text-gray-600">Detailed breakdown across key evaluation criteria</p>
      </div>

      <div className="space-y-4">
        {scoreData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{item.label}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(item.value)}`}>
                {item.value}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`bg-${item.color}-600 h-2 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {result.scores.overallScore}/100
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Investment Score</h3>
          <p className="text-sm text-gray-600">
            Based on analysis of {Object.keys(result.scores).length - 1} key investment criteria
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderRisks = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Risk Assessment</h3>
        <p className="text-gray-600">Key risks and mitigation strategies for your business</p>
      </div>

      <div className="space-y-4">
        {result.riskFactors.map((risk, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                risk.severity === 'high' ? 'bg-red-100' :
                risk.severity === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  risk.severity === 'high' ? 'text-red-600' :
                  risk.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{risk.risk}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-600' :
                    risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {risk.severity.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Mitigation Strategy:</h5>
                  <p className="text-sm text-gray-600">{risk.mitigation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {result.followUpQuestions && result.followUpQuestions.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Questions</h3>
          <p className="text-sm text-gray-600 mb-4">
            To provide even more specific insights, I'd like to know:
          </p>
          <ul className="space-y-2">
            {result.followUpQuestions.map((question, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Business Analysis Results</h1>
            <p className="text-sm text-gray-600">{businessInfo.name} • {businessInfo.industry}</p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'insights' && renderInsights()}
            {activeTab === 'scores' && renderScores()}
            {activeTab === 'risks' && renderRisks()}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
