'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Info, CheckCircle2, X, ArrowUpRight, Sparkles, Target, Brain, TrendingUp, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState(0);

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
                onClick={() => router.push('/login')}
                className="px-3 sm:px-4 py-2 text-gray-600 hover:text-black text-xs sm:text-sm font-medium transition-colors"
              >
                Log in
              </motion.button>
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
            
            {/* How it works button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowHowItWorks(true)}
              className="mt-4 bg-white border-2 border-black text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-gray-50 transition-all inline-flex items-center gap-2 relative overflow-hidden group"
            >
              {/* Pulsing effect */}
              <motion.div
                className="absolute inset-0 bg-black opacity-5"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.05, 0, 0.05],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <Info className="w-4 h-4 relative z-10" />
              <span className="relative z-10">How it works</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* (Intentionally minimalist: one pulsing card) */}

      {/* How it Works Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-black">How FrejFund Works</h2>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {[
                  { icon: Sparkles, label: "Get Started" },
                  { icon: Brain, label: "Deep Analysis" },
                  { icon: Target, label: "AI Coaching" },
                  { icon: Users, label: "Investor Matching" },
                  { icon: TrendingUp, label: "Get Funded" }
                ].map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                      activeTab === index
                        ? 'text-black border-b-2 border-black bg-gray-50'
                        : 'text-gray-500 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh]">
                <AnimatePresence mode="wait">
                  {activeTab === 0 && (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Start Your Journey in 60 Seconds</h3>
                        <p className="text-gray-600">No credit card required. No spam. Just results.</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">1</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Click "Get Started Free"</h4>
                            <p className="text-sm text-gray-600">Begin your investment readiness journey instantly</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">2</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Tell us about your business</h4>
                            <p className="text-sm text-gray-600">Company name, website, stage, and industry</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">3</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Upload documents (optional)</h4>
                            <p className="text-sm text-gray-600">Pitch deck, financials, or any business documents</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 mt-6">
                        <p className="text-sm text-gray-700">
                          <strong>💡 Pro tip:</strong> The more information you provide, the better our AI can help you. We analyze your website, LinkedIn, GitHub, and Product Hunt automatically!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 1 && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">68-Point Deep Analysis</h3>
                        <p className="text-gray-600">More insights than you knew existed about your business</p>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Market & Competition
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Market size & growth potential</li>
                            <li>• Competitive landscape mapping</li>
                            <li>• Unique value proposition</li>
                            <li>• Market timing analysis</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Team & Execution
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Team completeness</li>
                            <li>• Technical capability</li>
                            <li>• Industry expertise</li>
                            <li>• Execution track record</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Traction & Metrics
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Revenue growth rate</li>
                            <li>• Customer acquisition</li>
                            <li>• Product-market fit signals</li>
                            <li>• Key performance indicators</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Investment Readiness
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Financial projections</li>
                            <li>• Use of funds clarity</li>
                            <li>• Risk mitigation</li>
                            <li>• Exit strategy</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-black text-white rounded-xl p-4 mt-6">
                        <p className="text-sm">
                          <strong>🚀 Powered by GPT-5:</strong> Our analysis uses the most advanced AI to give you investor-grade insights in 15-30 minutes. You'll discover strengths and gaps you didn't know existed.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 2 && (
                    <motion.div
                      key="coaching"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">AI Investment Coach - Freja</h3>
                        <p className="text-gray-600">Your personal fundraising advisor, available 24/7</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">🎯 Personalized Guidance</h4>
                          <p className="text-sm text-gray-600">
                            Freja analyzes your entire business context and provides specific, actionable advice tailored to your situation.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">💡 Strategic Questions</h4>
                          <p className="text-sm text-gray-600">
                            She asks the tough questions investors will ask, helping you prepare and strengthen your pitch.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">📈 Growth Strategies</h4>
                          <p className="text-sm text-gray-600">
                            Get specific advice on improving metrics, refining your business model, and accelerating growth.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">🔥 Pitch Optimization</h4>
                          <p className="text-sm text-gray-600">
                            Refine your story, strengthen your financials, and create a compelling narrative that resonates with investors.
                          </p>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-xl p-4 mt-6">
                        <p className="text-sm text-gray-700">
                          <strong>Example:</strong> "Based on your SaaS metrics, you should focus on reducing churn from 8% to 5%. Here's how..."
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 3 && (
                    <motion.div
                      key="matching"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Smart Investor Matching</h3>
                        <p className="text-gray-600">Connect with investors who actually invest in businesses like yours</p>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">🎯 Precision Matching</h4>
                          <p className="text-sm text-gray-600">
                            We match based on industry, stage, check size, geography, and investment thesis alignment.
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">📊 500+ Active Investors</h4>
                          <p className="text-sm text-gray-600">
                            Angels, VCs, corporate investors, and impact funds across Europe and globally.
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">🤝 Warm Introductions</h4>
                          <p className="text-sm text-gray-600">
                            We facilitate proper introductions with context, increasing your response rate by 4x.
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-xl p-4">
                          <h4 className="font-semibold mb-2">⚡ Fast Process</h4>
                          <p className="text-sm text-gray-600">
                            From analysis to investor conversations in days, not months.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Match Quality Score</span>
                          <span className="text-sm text-gray-600">Based on 15+ factors</span>
                        </div>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map((i) => (
                            <div key={i} className={`h-2 flex-1 rounded-full ${i <= 4 ? 'bg-black' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 4 && (
                    <motion.div
                      key="funding"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">From First Meeting to Funding</h3>
                        <p className="text-gray-600">We support you through the entire fundraising journey</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1">Meeting Preparation</h4>
                            <p className="text-sm text-gray-600">
                              Investor-specific insights, likely questions, and negotiation strategies
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1">Due Diligence Support</h4>
                            <p className="text-sm text-gray-600">
                              Help organizing data rooms, answering investor questions, and managing the process
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1">Term Sheet Guidance</h4>
                            <p className="text-sm text-gray-600">
                              Understanding valuations, deal terms, and negotiation tactics
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1">Closing the Deal</h4>
                            <p className="text-sm text-gray-600">
                              Navigate legal processes and celebrate your success! 🎉
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-xl p-6 mt-6">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <ArrowUpRight className="w-5 h-5" />
                          Success Stories
                        </h4>
                        <p className="text-sm opacity-90">
                          Our founders have raised €50M+ from top-tier investors. Average time from first analysis to funding: 3.5 months.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Ready to transform your fundraising journey?
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowHowItWorks(false);
                      handleStartAnalysis();
                    }}
                    className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}