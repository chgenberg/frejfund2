'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Header from '@/components/Header';
import { BusinessInfo } from '@/types/business';
import { calculateReadinessScore } from '@/lib/coaching-prompts';
import { GOAL_OPTIONS, UserGoal, generateRoadmap } from '@/lib/goal-system';

export const dynamic = 'force-dynamic';

export default function GoalSettingPage() {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [readinessScore, setReadinessScore] = useState(0);
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

    // Calculate readiness score
    const readiness = calculateReadinessScore(info);
    setReadinessScore(readiness.score);
  }, [router]);

  const handleSetGoal = async () => {
    if (!selectedGoal || !businessInfo) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Generate roadmap
      const roadmap = generateRoadmap(
        selectedGoal,
        selectedGoal === 'custom' ? customGoalText : undefined,
        businessInfo,
        readinessScore
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
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Badge */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white border border-black rounded-full px-6 py-3 flex items-center space-x-2">
              <Check className="w-5 h-5 text-black" />
              <span className="text-black font-medium">Profile Created</span>
            </div>
          </div>

          {/* Readiness Score - Enhanced Design */}
          <div className="text-center mb-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="inline-block minimal-box px-16 py-12 relative overflow-hidden"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50" />
              
              <p className="text-sm text-gray-600 mb-6 font-light uppercase tracking-wider relative z-10">Investment Readiness</p>
              
              {/* Circular Progress */}
              <div className="relative w-40 h-40 mx-auto mb-6">
                {/* Background circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#000"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={440} // 2 * PI * r
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ strokeDashoffset: 440 - (readinessScore / 10) * 440 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  />
                </svg>
                
                {/* Score display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <span className="text-6xl font-bold text-black">{readinessScore}</span>
                    <div className="text-lg text-gray-500 -mt-2">out of 10</div>
                  </motion.div>
                </div>
              </div>
              
              {/* Status message */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-gray-600 relative z-10"
              >
                {readinessScore <= 3 && "Early stage - let's build your foundation"}
                {readinessScore > 3 && readinessScore <= 6 && "Making progress - keep pushing forward"}
                {readinessScore > 6 && readinessScore <= 8 && "Almost there - fine-tune for investors"}
                {readinessScore > 8 && "Investment ready - time to connect!"}
              </motion.p>
              
              {/* Decorative dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1.2 }}
                className="absolute top-8 right-8 flex space-x-1"
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-black rounded-full"
                    style={{ opacity: 0.2 + i * 0.3 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Goal Selection */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-3">
              What's your primary goal?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-light">
              Choose your main objective and I'll create a personalized roadmap to help you achieve it
            </p>
          </div>

          {/* Goal Options */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {GOAL_OPTIONS.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => setSelectedGoal(option.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative p-6 rounded-2xl border transition-all text-left ${
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
                      className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div className="text-3xl mb-3 font-light">{option.icon}</div>

                {/* Title & Description */}
                <h3 className="text-lg font-semibold text-black mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {option.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center space-x-3 text-xs text-gray-500">
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
                className="mb-8"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your custom goal:
                </label>
                <textarea
                  value={customGoalText}
                  onChange={(e) => setCustomGoalText(e.target.value)}
                  placeholder="E.g., Launch my product in 3 markets, hire a CTO, reach $50k MRR..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
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
              className={`group relative px-12 py-5 rounded-full text-lg font-semibold transition-all ${
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
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </motion.button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              You can always change your goal later
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
