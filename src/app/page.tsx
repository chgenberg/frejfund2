'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { BusinessInfo, Message } from '@/types/business';
import { demoCompany, demoWebsiteText, demoKpiCsv } from '@/lib/demo-case';
import ChatInterface from '@/components/ChatInterface';
import BusinessWizard from '@/components/BusinessWizard';
import Footer from '@/components/Footer';

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

  // Minimal landing – features removed

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
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md"
      >
        <div className="container mx-auto px-4 sm:px-8 py-3 sm:py-4">
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
                  className="h-10 sm:h-12 md:h-14 w-auto"
                />
              </div>
            </motion.div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/vc')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Investors
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Centered Pulsing Box */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative max-w-3xl w-full"
        >
          <div className="minimal-box minimal-box-shadow text-center px-6 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 tracking-tight leading-tight">
              Because great ideas<br className="hidden sm:block" />
              <span className="sm:hidden">deserve a chance.</span>
              <span className="hidden sm:inline">deserve a chance.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-10 font-light px-4 sm:px-0">
              We connect founders and investors who believe in building a better future
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartAnalysis}
              className="minimal-button inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* (Intentionally minimalist: one pulsing card) */}

      {/* Footer */}
      <Footer />
    </div>
  );
}