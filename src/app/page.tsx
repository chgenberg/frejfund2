'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BusinessInfo, Message } from '@/types/business';
import { demoCompany, demoWebsiteText, demoKpiCsv } from '@/lib/demo-case';
import ChatInterface from '@/components/ChatInterface';
import BusinessWizard from '@/components/BusinessWizard';

// Disable prerendering; this page depends on client-only state/localStorage and async flows
export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'landing' | 'wizard' | 'chat'>('landing');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [userType, setUserType] = useState<'entrepreneur' | 'vc' | null>(null);

  const handleStartAnalysis = () => {
    setCurrentView('wizard');
  };

  const handleWizardComplete = async (info: BusinessInfo) => {
    setBusinessInfo(info);
    
    // Save to database if email provided
    if (info.email && typeof window !== 'undefined') {
      try {
        const sessionId = localStorage.getItem('frejfund-session-id') || `sess-${Date.now()}`;
        await fetch('/api/session/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: info.email,
            sessionId,
            businessInfo: info,
            scrapedText: info.preScrapedText,
            scrapedSources: info.preScrapedSources
          })
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
    
    // For real users, go to goal-setting. For demo, go to chat.
    if (info.demoKpiCsv) {
      setCurrentView('chat');
    } else {
      // Store business info for later use
      if (typeof window !== 'undefined') {
        // Save to localStorage for persistence
        localStorage.setItem('frejfund-business-info', JSON.stringify(info));
        // Also save to sessionStorage for goal-setting
        sessionStorage.setItem('businessInfo', JSON.stringify(info));
        window.location.href = '/goal-setting';
      }
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced algorithms analyze your business model, market fit, and growth potential'
    },
    {
      icon: TrendingUp,
      title: 'Investment Readiness',
      description: 'Get specific recommendations to improve your pitch and attract investors'
    },
    {
      icon: Users,
      title: 'Team Assessment',
      description: 'Evaluate team strengths and identify key hiring priorities'
    },
    {
      icon: FileText,
      title: 'Pitch Optimization',
      description: 'Analyze your pitch deck and business documents for maximum impact'
    }
  ];

  if (currentView === 'wizard') {
    return <BusinessWizard onComplete={handleWizardComplete} />;
  }

  if (currentView === 'chat' && businessInfo) {
    // For authenticated flow, redirect to dashboard
    if (typeof window !== 'undefined' && !businessInfo.demoKpiCsv) {
      window.location.href = '/dashboard';
    }
    return (
      <ChatInterface 
        businessInfo={businessInfo} 
        messages={messages}
        setMessages={setMessages}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="relative">
                <img 
                  src="/FREJFUND-logo.png" 
                  alt="FrejFund" 
                  className="h-12 sm:h-14 w-auto"
                />
              </div>
            </motion.div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/vc')}
                className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Investors
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Centered Pulsing Box */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-3xl w-full"
        >
          <motion.div
            animate={{
              scale: [1, 1.01, 1],
              boxShadow: [
                '0 20px 40px rgba(0,0,0,0.15)',
                '0 35px 80px rgba(0,0,0,0.28)',
                '0 20px 40px rgba(0,0,0,0.15)'
              ]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-white border border-gray-200 rounded-3xl p-10 text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-3 tracking-tight">
              Turning ambition into opportunity.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Helping founders meet the investors who can make it real.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleStartAnalysis}
              className="px-8 py-4 bg-black text-white rounded-full font-semibold inline-flex items-center gap-2 hover:bg-gray-800"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* (Intentionally minimalist: one pulsing card) */}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-black">FrejFund</span>
          </div>
          <p className="text-gray-500 font-light">
            © 2024 FrejFund. Empowering startups with intelligent insights.
          </p>
        </div>
      </footer>
    </div>
  );
}