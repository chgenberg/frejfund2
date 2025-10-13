'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Header from '@/components/Header';
import { BusinessInfo } from '@/types/business';
import { GOAL_OPTIONS, UserGoal, generateRoadmap } from '@/lib/goal-system';

export const dynamic = 'force-dynamic';

export default function GoalSettingPage() {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
  const [customGoalText, setCustomGoalText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load business info from sessionStorage
    const stored = sessionStorage.getItem('businessInfo');
    if (!stored) {
      // If no business info, redirect to home
      router.push('/');
      return;
    }

    const info = JSON.parse(stored) as BusinessInfo;
    setBusinessInfo(info);
  }, [router]);

  const handleSetGoal = async () => {
    if (!selectedGoal || !businessInfo) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Generate roadmap (we'll calculate score on the fly)
      const roadmap = generateRoadmap(
        selectedGoal,
        selectedGoal === 'custom' ? customGoalText : undefined,
        businessInfo,
        5 // Default score until deep analysis is complete
      );

      // Save goal and roadmap to database
      const sessionId = localStorage.getItem('frejfund-session-id') || `sess-${Date.now()}`;
      await fetch('/api/session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessInfo.email,
          sessionId,
          businessInfo,
          goal: selectedGoal,
          customGoal: selectedGoal === 'custom' ? customGoalText : undefined,
          roadmap
        })
      });

      // Save to localStorage for immediate access
      localStorage.setItem('frejfund-goal', selectedGoal);
      if (selectedGoal === 'custom') {
        localStorage.setItem('frejfund-custom-goal', customGoalText);
      }
      localStorage.setItem('frejfund-roadmap', JSON.stringify(roadmap));

      // Redirect to roadmap page
      router.push('/roadmap');
    } catch (error) {
      console.error('Failed to save goal:', error);
      setError('Failed to save your goal. Please try again.');
      setIsGenerating(false);
    }
  };

  if (!businessInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-24" />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Goal Selection */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 sm:mb-3">
              What's your primary goal?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-light px-4 sm:px-0">
              Choose your main objective and I'll create a personalized roadmap to help you achieve it
            </p>
          </div>

          {/* Goal Options */}
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {GOAL_OPTIONS.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => setSelectedGoal(option.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative p-4 sm:p-6 rounded-2xl border transition-all text-left ${
                  selectedGoal === option.id
                    ? 'border-black bg-white shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                {/* Selection Indicator */}
                <AnimatePresence>
                  {selectedGoal === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 font-light">{option.icon}</div>

                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-semibold text-black mb-1 sm:mb-2">
                  {option.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  {option.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs text-gray-500">
                  <span>{option.timeline}</span>
                  <span className="text-gray-300">•</span>
                  <span className={
                    option.difficulty === 'easy' ? 'text-gray-600' :
                    option.difficulty === 'medium' ? 'text-gray-700' :
                    'text-black'
                  }>
                    {option.difficulty.charAt(0).toUpperCase() + option.difficulty.slice(1)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Custom Goal Input */}
          <AnimatePresence>
            {selectedGoal === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 sm:mb-8"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2 px-1">
                  Describe your custom goal:
                </label>
                <textarea
                  value={customGoalText}
                  onChange={(e) => setCustomGoalText(e.target.value)}
                  placeholder="E.g., Launch my product in 3 markets, hire a CTO, reach $50k MRR..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm sm:text-base"
                  rows={3}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <div className="text-center">
            <motion.button
              onClick={handleSetGoal}
              disabled={!selectedGoal || (selectedGoal === 'custom' && !customGoalText.trim()) || isGenerating}
              whileHover={{ scale: selectedGoal ? 1.05 : 1 }}
              whileTap={{ scale: selectedGoal ? 0.95 : 1 }}
              className={`group relative px-8 sm:px-12 py-4 sm:py-5 rounded-full text-base sm:text-lg font-semibold transition-all ${
                !selectedGoal || (selectedGoal === 'custom' && !customGoalText.trim())
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:shadow-2xl'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Generating your roadmap...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>Set Goal & Continue</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </motion.button>

            {error && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
              You can always change your goal later
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
