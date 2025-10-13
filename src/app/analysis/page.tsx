'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Users, TrendingUp, Zap, Shield, Brain,
  ArrowLeft, Circle, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import Header from '@/components/Header';
import { getDeepAnalysis } from '@/lib/deep-analysis-runner';

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
  recommendations: string[];
}

const CATEGORIES = [
  { id: 'market', label: 'Market & Competition', icon: Target, count: 20 },
  { id: 'team', label: 'Team & Execution', icon: Users, count: 15 },
  { id: 'product', label: 'Product & Technology', icon: Zap, count: 12 },
  { id: 'traction', label: 'Traction & Growth', icon: TrendingUp, count: 11 },
  { id: 'financials', label: 'Financial Health', icon: Brain, count: 10 }
];

export default function AnalysisPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('market');
  const [dimensions, setDimensions] = useState<AnalysisDimension[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    const sessionId = localStorage.getItem('frejfund-session-id');
    if (!sessionId) {
      router.push('/');
      return;
    }

    try {
      const analysis = await getDeepAnalysis(sessionId);
      if (analysis && analysis.dimensions && analysis.dimensions.length > 0) {
        setDimensions(analysis.dimensions);
        setOverallScore(analysis.overallScore || 0);
      } else {
        // Show example data while analysis is running
        setDimensions([
          {
            id: 'market-size',
            name: 'Market Size & Growth Potential',
            category: 'market',
            score: 0,
            status: 'analyzing',
            findings: [],
            strengths: [],
            redFlags: [],
            recommendations: []
          },
          {
            id: 'competitive-landscape',
            name: 'Competitive Landscape Analysis',
            category: 'market',
            score: 0,
            status: 'pending',
            findings: [],
            strengths: [],
            redFlags: [],
            recommendations: []
          },
          {
            id: 'team-completeness',
            name: 'Team Completeness & Skills',
            category: 'team',
            score: 0,
            status: 'pending',
            findings: [],
            strengths: [],
            redFlags: [],
            recommendations: []
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryDimensions = (categoryId: string) => {
    return dimensions.filter(d => d.category === categoryId);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
            Deep Business Analysis
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Your business analyzed across 68 critical dimensions using advanced AI reasoning
          </p>
          
          {/* Overall Score */}
          <div className="inline-block">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e5e5e5"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#000"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={440}
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (overallScore / 100) * 440 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-bold text-black">{overallScore}</span>
                <span className="text-sm text-gray-500">Overall Score</span>
              </div>
            </div>
          </div>
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
                    isActive 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">{category.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {category.count}
                  </span>
                  {categoryScore > 0 && (
                    <span className={`text-xs font-bold ${
                      isActive ? 'text-white' : getScoreColor(categoryScore)
                    }`}>
                      {categoryScore}%
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

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
                        <h3 className="text-lg font-semibold text-black mb-1">
                          {dimension.name}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <ScoreIcon className={`w-5 h-5 ${getScoreColor(dimension.score)}`} />
                            <span className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                              {dimension.score}%
                            </span>
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

                    {/* Recommendations */}
                    {dimension.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {dimension.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-black rounded-full mt-2" />
                              <p className="text-sm text-gray-600">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
    </div>
  );
}