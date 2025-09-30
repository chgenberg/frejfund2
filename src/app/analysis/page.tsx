'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign, Target, Shield, Brain, ChevronRight, Sparkles } from 'lucide-react';
import BusinessAnalysisModal from '@/components/BusinessAnalysisModal';
import ResultsModal from '@/components/ResultsModal';
import { BusinessInfo, BusinessAnalysisResult } from '@/types/business';

export default function AnalysisPage() {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BusinessAnalysisResult | null>(null);

  useEffect(() => {
    const savedInfo = localStorage.getItem('frejfund-business-info');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setBusinessInfo(parsed);
      } catch (e) {
        console.error('Failed to parse business info:', e);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const handleStartAnalysis = () => {
    setShowAnalysisModal(true);
  };

  const handleAnalysisComplete = (result: BusinessAnalysisResult) => {
    setShowAnalysisModal(false);
    setAnalysisResult(result);
    setTimeout(() => {
      setShowResultsModal(true);
    }, 500);
  };

  if (!businessInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push('/dashboard')}
              >
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-black">FrejFund Analysis</h1>
              </motion.div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Business Analysis</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get a comprehensive analysis of your {businessInfo.industry} business with AI-powered insights
          </p>
        </div>

        {/* Analysis Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <TrendingUp className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Market Analysis</h3>
            <p className="text-gray-600 text-sm">Understand your position in the {businessInfo.targetMarket} market</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <DollarSign className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Financial Health</h3>
            <p className="text-gray-600 text-sm">Deep dive into revenue, burn rate, and growth metrics</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <Shield className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Risk Assessment</h3>
            <p className="text-gray-600 text-sm">Identify and mitigate potential business risks</p>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartAnalysis}
            className="px-8 py-4 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-3"
          >
            <Brain className="w-6 h-6" />
            Start Full Analysis
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          <p className="text-sm text-gray-500 mt-4">Takes approximately 2-3 minutes</p>
        </div>

        {/* Recent Analyses */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-black mb-6">Previous Analyses</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-gray-500 text-center">No previous analyses yet. Run your first analysis above!</p>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAnalysisModal && businessInfo && (
        <BusinessAnalysisModal
          businessInfo={businessInfo}
          onComplete={handleAnalysisComplete}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}
      
      {showResultsModal && analysisResult && businessInfo && (
        <ResultsModal
          result={analysisResult}
          businessInfo={businessInfo}
          onClose={() => setShowResultsModal(false)}
        />
      )}
    </div>
  );
}
