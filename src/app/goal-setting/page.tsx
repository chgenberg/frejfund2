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
    // Immediately redirect to dashboard with analysis overlay
    const stored = sessionStorage.getItem('businessInfo');
    if (!stored) {
      router.replace('/');
      return;
    }
    const info = JSON.parse(stored) as BusinessInfo;
    setBusinessInfo(info);

    const sessionId = localStorage.getItem('frejfund-session-id') || `sess-${Date.now()}`;
    localStorage.setItem('frejfund-session-id', sessionId);
    // Signal dashboard to start analysis right away
    sessionStorage.setItem('frejfund-start-analysis', '1');
    router.replace('/dashboard');
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
        5, // Default score until deep analysis is complete
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
          roadmap,
        }),
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

  // Immediately redirect; render nothing
  return null;
}
