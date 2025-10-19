'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Target, CheckCircle, Sparkles } from 'lucide-react';

interface MetricCollectorProps {
  extractedMetrics?: any;
  onComplete: (metrics: any) => void;
  onSkip: () => void;
}

export default function MetricCollector({
  extractedMetrics,
  onComplete,
  onSkip,
}: MetricCollectorProps) {
  const [metrics, setMetrics] = useState({
    mrr: extractedMetrics?.mrr || '',
    users: extractedMetrics?.users || '',
    growth: extractedMetrics?.growth || '',
    churn: extractedMetrics?.churn || '',
    teamSize: extractedMetrics?.teamSize || '',
    fundingAsk: extractedMetrics?.fundingAsk || '',
  });

  const [currentStep, setCurrentStep] = useState(0);

  const questions = [
    {
      key: 'mrr',
      icon: DollarSign,
      question: "What's your current MRR or monthly revenue?",
      placeholder: 'e.g., $87k or $87,000',
      hint: "Rough number is fine. We'll verify later.",
      optional: false,
    },
    {
      key: 'growth',
      icon: TrendingUp,
      question: "What's your month-over-month growth rate?",
      placeholder: 'e.g., +18% MoM',
      hint: 'This helps VCs understand your momentum',
      optional: false,
    },
    {
      key: 'users',
      icon: Users,
      question: 'How many paying customers do you have?',
      placeholder: 'e.g., 342',
      hint: 'Helps VCs see your traction',
      optional: false,
    },
    {
      key: 'fundingAsk',
      icon: Target,
      question: 'How much are you raising?',
      placeholder: 'e.g., 2000000 (for $2M)',
      hint: "We'll match you with VCs who write checks of this size",
      optional: false,
    },
    {
      key: 'churn',
      icon: TrendingUp,
      question: "What's your churn rate? (Optional)",
      placeholder: 'e.g., <2% or 1.5%',
      hint: 'Shows retention quality',
      optional: true,
    },
    {
      key: 'teamSize',
      icon: Users,
      question: 'How many people on your team? (Optional)',
      placeholder: 'e.g., 4',
      hint: 'VCs like to know team size',
      optional: true,
    },
  ];

  const currentQ = questions[currentStep];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Complete!
      onComplete(metrics);
    }
  };

  const handleSkip = () => {
    if (currentQ.optional) {
      handleNext();
    } else {
      // Can't skip required fields
      return;
    }
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-2xl w-full"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-bold text-black">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-black h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <currentQ.icon className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-black mb-1">{currentQ.question}</h2>
              <p className="text-sm text-gray-600">{currentQ.hint}</p>
            </div>
          </div>

          <input
            type="text"
            value={metrics[currentQ.key as keyof typeof metrics]}
            onChange={(e) => setMetrics((prev) => ({ ...prev, [currentQ.key]: e.target.value }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && metrics[currentQ.key as keyof typeof metrics]) {
                handleNext();
              }
            }}
            placeholder={currentQ.placeholder}
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-lg transition-colors"
          />

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={currentQ.optional ? handleSkip : onSkip}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {currentQ.optional ? 'Skip this one' : 'Skip all for now'}
            </button>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {currentStep + 1} of {questions.length}
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!currentQ.optional && !metrics[currentQ.key as keyof typeof metrics]}
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
              >
                <span>{currentStep === questions.length - 1 ? 'Complete' : 'Next'}</span>
                {currentStep === questions.length - 1 && <CheckCircle className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Extracted Metrics Preview */}
        {extractedMetrics && extractedMetrics.confidence > 50 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-black" />
              <span className="text-sm font-semibold text-black">
                AI-extracted from your documents
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Pre-filled values were found in your pitch deck. You can edit them above.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
