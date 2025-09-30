'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, TrendingUp, Users, DollarSign, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { BusinessInfo, BusinessAnalysisResult, AnalysisState } from '@/types/business';
import { BusinessAnalyzer } from '@/lib/business-analyzer';

interface BusinessAnalysisModalProps {
  businessInfo: BusinessInfo;
  onComplete: (result: BusinessAnalysisResult) => void;
  onClose: () => void;
}

export default function BusinessAnalysisModal({ businessInfo, onComplete, onClose }: BusinessAnalysisModalProps) {
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.START);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BusinessAnalysisResult | null>(null);

  const analyzer = new BusinessAnalyzer();

  // Extended durations for higher-quality analysis (≈ 2–3 minutes total)
  const analysisSteps = [
    { id: 'context', label: 'Analyzing business context and stage', icon: Target, duration: 20000 },
    { id: 'market', label: 'Evaluating market opportunity and timing', icon: TrendingUp, duration: 25000 },
    { id: 'competition', label: 'Assessing competitive landscape', icon: Users, duration: 20000 },
    { id: 'team', label: 'Analyzing team capabilities', icon: Users, duration: 15000 },
    { id: 'financials', label: 'Reviewing financial metrics and unit economics', icon: DollarSign, duration: 25000 },
    { id: 'insights', label: 'Generating recommendations and next steps', icon: Brain, duration: 20000 }
  ];

  const waitingTips = [
    'Tip: Clarify your ICP (industry, size, buyer persona) for sharper GTM.',
    'Tip: Track CAC, LTV and payback to prove efficient growth.',
    'Tip: Add customer quotes/use-cases on the site for trust.',
    'Tip: Define 90‑day goals with weekly leading indicators.',
    'Tip: Instrument onboarding and measure Day‑7 activation.',
    'Tip: Draft a lightweight investor FAQ from common questions.'
  ];
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (analysisState === AnalysisState.ANALYZING) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [analysisState]);

  useEffect(() => {
    if (analysisState !== AnalysisState.ANALYZING) return;
    const t = setInterval(() => setTipIndex(i => (i + 1) % waitingTips.length), 5000);
    return () => clearInterval(t);
  }, [analysisState]);

  const startAnalysis = async () => {
    setAnalysisState(AnalysisState.ANALYZING);
    setProgress(0);
    setElapsedTime(0);

    try {
      // If there are uploaded files, extract their text content first
      let extractedTexts: string[] | undefined = undefined;
      if ((businessInfo as any).uploadedFiles && (businessInfo as any).uploadedFiles.length > 0) {
        try {
          setCurrentStep('Extracting uploaded documents');
          setProgress(10);
          const formData = new FormData();
          ((businessInfo as any).uploadedFiles as File[]).forEach((f, idx) => {
            formData.append(`file_${idx}`, f, f.name);
          });
          const sessionId = localStorage.getItem('frejfund-session-id') || '';
          const extractRes = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'x-session-id': sessionId },
            body: formData
          });
          if (extractRes.ok) {
            const { documents } = await extractRes.json();
            extractedTexts = (documents || []).map((d: { text: string }) => d.text).filter(Boolean);
          }
        } catch (e) {
          // Fail silently; analysis can proceed without docs
        }
      }

      // Use pre-scraped website content if available; otherwise scrape now
      let websiteContent: string | undefined = businessInfo.preScrapedText;
      if (!websiteContent && businessInfo.website) {
        try {
          setCurrentStep('Scraping website content');
          setProgress(15);
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: businessInfo.website })
          });
          if (res.ok) {
            const { result } = await res.json();
            websiteContent = String(result?.text || '').slice(0, 200000);
          }
        } catch {}
      }

      const result = await analyzer.analyzeBusinessComprehensively(
        businessInfo,
        websiteContent,
        extractedTexts, // Upload-extracted texts
        (step: string, progressValue: number) => {
          setCurrentStep(step);
          setProgress(progressValue);
        }
      );

      setAnalysisResult(result);
      setAnalysisState(AnalysisState.RESULTS);
      
      setTimeout(() => {
        onComplete(result);
      }, 2000);

    } catch (err) {
      setError('Analysis failed. Please try again.');
      setAnalysisState(AnalysisState.ERROR);
    }
  };

  const getCurrentStepIcon = () => {
    const currentStepData = analysisSteps.find(step => step.label === currentStep);
    return currentStepData?.icon || Brain;
  };

  const renderStartScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <Brain className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-black mb-4">
        Comprehensive Business Analysis
      </h2>
      
      <p className="text-gray-600 mb-8 leading-relaxed">
        I'll analyze your <strong>{businessInfo.industry}</strong> business across 10 key investment criteria. 
        This deep analysis will take about 2-3 minutes and will provide personalized insights based on your 
        <strong> {businessInfo.stage}</strong> stage and <strong>{businessInfo.targetMarket}</strong> focus.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-black mb-4">Analysis includes:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {analysisSteps.map((step) => (
            <div key={step.id} className="flex items-center space-x-2">
              <step.icon className="w-4 h-4 text-black" />
              <span className="text-gray-700">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startAnalysis}
          className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
        >
          Start Analysis
        </motion.button>
      </div>
    </motion.div>
  );

  const renderAnalyzing = () => {
    const CurrentIcon = getCurrentStepIcon();
    const totalMs = analysisSteps.reduce((s, st) => s + st.duration, 0);
    const etaSec = Math.max(0, Math.round((totalMs * (1 - (progress/100))) / 1000));
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center"
        >
          <CurrentIcon className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className="text-2xl font-bold text-black mb-2">
          Analyzing Your Business
        </h2>
        
        <p className="text-gray-600 mb-8">
          {currentStep || 'Initializing analysis...'}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-black h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Timer / ETA and rotating tip */}
        <div className="text-sm text-gray-500">Elapsed: {elapsedTime.toFixed(1)}s • ETA ~{etaSec}s</div>
        <div className="text-xs text-gray-600 mb-8 mt-1">{waitingTips[tipIndex]}</div>

        {/* Step Progress */}
        <div className="space-y-3">
          {analysisSteps.map((step, index) => {
            const isCompleted = progress > ((index + 1) / analysisSteps.length) * 100;
            const isCurrent = step.label === currentStep;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isCurrent ? 'bg-blue-50 border border-blue-200' : 
                  isCompleted ? 'bg-green-50 border border-green-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-600' : 
                  isCurrent ? 'bg-blue-600' : 
                  'bg-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <step.icon className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-900' : 
                  isCompleted ? 'text-green-900' : 
                  'text-gray-600'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderResults = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center"
      >
        <CheckCircle className="w-10 h-10 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Analysis Complete!
      </h2>

      {analysisResult && (
        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {analysisResult.scores.overallScore}
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {analysisResult.accuracy}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {analysisResult.actionableInsights.length}
                </div>
                <div className="text-sm text-gray-600">Key Insights</div>
              </div>
            </div>
          </div>

          <p className="text-gray-600">
            I've analyzed your business across {Object.keys(analysisResult.scores).length - 1} key dimensions 
            and generated {analysisResult.actionableInsights.length} personalized recommendations 
            to improve your investment readiness.
          </p>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => analysisResult && onComplete(analysisResult)}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
      >
        View Detailed Results
      </motion.button>
    </motion.div>
  );

  const renderError = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Analysis Failed
      </h2>

      <p className="text-gray-600 mb-8">
        {error || 'Something went wrong during the analysis. Please try again.'}
      </p>

      <div className="flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setError(null);
            setAnalysisState(AnalysisState.START);
          }}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Try Again
        </motion.button>
      </div>
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
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-gray-900">Business Analysis</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {analysisState === AnalysisState.START && renderStartScreen()}
          {analysisState === AnalysisState.ANALYZING && renderAnalyzing()}
          {analysisState === AnalysisState.RESULTS && renderResults()}
          {analysisState === AnalysisState.ERROR && renderError()}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
