'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Brain, TrendingUp, Users, FileText, Sparkles, X, ArrowRight, CheckCircle2, Upload, Target } from 'lucide-react';
import { BusinessInfo, Message } from '@/types/business';
import { demoCompany, demoWebsiteText, demoEmails, demoKpiCsv } from '@/lib/demo-case';
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
      {/* How It Works Popup */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowHowItWorks(false);
              setUserType(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-black p-6 text-white relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-10"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }}
                />
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">How FrejFund Works</h2>
                    <p className="text-gray-300 text-sm">Choose your path</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowHowItWorks(false);
                      setUserType(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* User Type Selection */}
                {!userType ? (
                  <div className="space-y-4 pt-2">
                    <p className="text-center text-gray-600 mb-6">I am a...</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setUserType('entrepreneur')}
                        className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-black hover:shadow-lg transition-all text-left"
                      >
                        <div className="w-14 h-14 bg-gray-100 group-hover:bg-black rounded-xl flex items-center justify-center mb-4 transition-colors">
                          <TrendingUp className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">Entrepreneur / Founder</h3>
                        <p className="text-gray-600 text-sm">
                          Raising capital, building your company, looking for investors
                        </p>
                        <div className="mt-4 text-black font-medium text-sm inline-flex items-center space-x-1">
                          <span>Learn more</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setUserType('vc')}
                        className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-black hover:shadow-lg transition-all text-left"
                      >
                        <div className="w-14 h-14 bg-gray-100 group-hover:bg-black rounded-xl flex items-center justify-center mb-4 transition-colors">
                          <Users className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">Investor / VC</h3>
                        <p className="text-gray-600 text-sm">
                          Sourcing deals, finding qualified founders, managing pipeline
                        </p>
                        <div className="mt-4 text-black font-medium text-sm inline-flex items-center space-x-1">
                          <span>Learn more</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>
                    </div>
                  </div>
                ) : userType === 'entrepreneur' ? (
                  /* Entrepreneur Flow */
                  <div className="space-y-6 pt-2">
                    <button
                      onClick={() => setUserType(null)}
                      className="text-sm text-gray-600 hover:text-black inline-flex items-center space-x-1"
                    >
                      <span>← Back</span>
                    </button>

                    <div className="space-y-5">
                      {[
                        {
                          icon: <FileText />,
                          title: "1. Share Your Story",
                          description: "Quick 2-minute form about your company, stage, and goals. No fluff, just the essentials."
                        },
                        {
                          icon: <Upload />,
                          title: "2. Drop Your Documents",
                          description: "Drag & drop pitch deck, financials, or screenshots. We support 15+ formats (Keynote, PowerPoint, Excel, images with OCR)."
                        },
                        {
                          icon: <Brain />,
                          title: "3. AI Extracts Your Metrics",
                          description: "Our AI reads your documents and automatically finds MRR, growth rate, customers, team size, etc. You just confirm."
                        },
                        {
                          icon: <Users />,
                          title: "4. Get Matched to 91+ VCs",
                          description: "AI matches you to perfect investors based on stage, industry, and geography. See top 5 matches instantly."
                        },
                        {
                          icon: <MessageCircle />,
                          title: "5. Draft Personalized Emails",
                          description: "Ask Freja: 'Draft email to Creandum' and get investor-specific outreach in seconds. Includes warm intro guidance."
                        },
                        {
                          icon: <CheckCircle2 />,
                          title: "6. Share Profile with VCs",
                          description: "VCs swipe on blind profiles (no name shown). When they're interested, you get notified and can accept the intro."
                        }
                      ].map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="flex gap-4"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                            {React.cloneElement(step.icon, { className: "w-6 h-6" })}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1 text-black">{step.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="pt-6 text-center border-t border-gray-200"
                    >
                      <button
                        onClick={() => {
                          setShowHowItWorks(false);
                          setUserType(null);
                          handleStartAnalysis();
                        }}
                        className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 group"
                      >
                        <span>Get Started Free</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </div>
                ) : (
                  /* VC Flow */
                  <div className="space-y-6 pt-2">
                    <button
                      onClick={() => setUserType(null)}
                      className="text-sm text-gray-600 hover:text-black inline-flex items-center space-x-1"
                    >
                      <span>← Back</span>
                    </button>

                    <div className="space-y-5">
                      {[
                        {
                          icon: <Target />,
                          title: "1. AI-Matched Deal Flow",
                          description: "Get founders matched to YOUR thesis (stage, industry, geography, check size). No more sifting through cold emails."
                        },
                        {
                          icon: <FileText />,
                          title: "2. Blind Profile Swiping",
                          description: "Tinder-style interface shows metrics first, name second. Reduce bias, focus on fundamentals. MRR, growth, team - all verified."
                        },
                        {
                          icon: <Brain />,
                          title: "3. AI Investment Memos",
                          description: "Every profile includes AI-generated analysis: strengths, risks, portfolio fit, and recommendation."
                        },
                        {
                          icon: <Users />,
                          title: "4. Swipe & Reveal",
                          description: "❤️ Like a profile → Company name revealed. Request intro with 1 click. 60%+ meeting acceptance rate."
                        },
                        {
                          icon: <TrendingUp />,
                          title: "5. Track Performance",
                          description: "Analytics dashboard shows time saved, conversion rates, ROI. See how you compare to other VCs."
                        },
                        {
                          icon: <Sparkles />,
                          title: "6. Smart Learning Algorithm",
                          description: "AI learns your preferences from swipes. Over time, shows better matches first. Gets smarter every day."
                        }
                      ].map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="flex gap-4"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                            {React.cloneElement(step.icon, { className: "w-6 h-6" })}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1 text-black">{step.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <h4 className="font-semibold text-black mb-2">Pricing</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Free Trial</div>
                            <div className="text-xl font-bold text-black">3 intros</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Starter</div>
                            <div className="text-xl font-bold text-black">$2k/mo</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Pro</div>
                            <div className="text-xl font-bold text-black">$5k/mo</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={() => {
                            setShowHowItWorks(false);
                            setUserType(null);
                            router.push('/vc');
                          }}
                          className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 group"
                        >
                          <span>Access VC Dashboard</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
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
                onClick={() => router.push('/login')}
                className="px-6 py-2.5 text-gray-700 hover:text-black rounded-full text-sm font-medium transition-colors"
              >
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowHowItWorks(true)}
                className="relative px-6 py-2.5 bg-gray-700 text-white rounded-full text-sm font-medium overflow-hidden group"
              >
                <span className="relative z-10">How it works</span>
                <motion.div
                  className="absolute inset-0 bg-gray-800"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center px-8 pt-20 overflow-hidden"
      >
        {/* Background Image - Desktop */}
        <div className="absolute inset-0 hidden md:block">
          <img 
            src="/world.png" 
            alt="" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/80" />
        </div>
        
        {/* Background Image - Mobile */}
        <div className="absolute inset-0 md:hidden">
          <img 
            src="/worldmobile.png" 
            alt="" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/80" />
        </div>
        
        {/* Content with higher z-index */}
        <div className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl">
                <MessageCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-[3rem] -z-10"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-12 leading-[1.2] tracking-tight max-w-4xl mx-auto"
          >
            Your idea. Their belief.{' '}
            <span className="text-gray-600">One match away.</span>
          </motion.h1>



          {/* Dual CTAs - Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12"
          >
            {/* For Founders */}
            <motion.div
              whileHover={{ y: -8 }}
              className="group bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-black hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">For Founders</h3>
              <p className="text-gray-600 text-sm mb-6">
                Find investors. Get intros. Raise faster.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartAnalysis}
                className="w-full px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2 mb-3"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <button
                onClick={() => {
                  setUserType('entrepreneur');
                  setShowHowItWorks(true);
                }}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                How it works →
              </button>
            </motion.div>

            {/* For VCs */}
            <motion.div
              whileHover={{ y: -8 }}
              className="group bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-black hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">For Investors</h3>
              <p className="text-gray-600 text-sm mb-6">
                Swipe qualified deals. Save 15+ hours/week.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/vc/onboarding')}
                className="w-full px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2 mb-3"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <button
                onClick={() => {
                  setUserType('vc');
                  setShowHowItWorks(true);
                }}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                How it works →
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 justify-center items-center"
          >
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
              const info: BusinessInfo = {
                name: demoCompany.name,
                email: demoCompany.email,
                website: demoCompany.website,
                linkedinProfiles: '',
                stage: 'early-revenue',
                industry: 'SaaS',
                targetMarket: 'SMBs',
                businessModel: 'B2B Subscription',
                monthlyRevenue: '18000',
                teamSize: '6-10',
                uploadedFiles: [],
                preScrapedText: demoWebsiteText,
                preScrapedSources: [{ url: demoCompany.website, snippet: demoWebsiteText.slice(0,200) }],
                demoKpiCsv: demoKpiCsv
              };
              setBusinessInfo(info);
              setCurrentView('chat');
              // Welcome message is now handled in ChatInterface
              }}
              className="px-8 py-3 text-gray-600 rounded-full text-base font-medium hover:text-black hover:bg-gray-50 transition-all"
            >
              View Demo
            </motion.button>
          </motion.div>
        </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section 
        className="py-24 px-8 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-black mb-4 tracking-tight">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Powered by advanced AI to analyze every aspect of your business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-semibold text-black mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-32 px-8 bg-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-semibold text-black mb-6 tracking-tight"
          >
            Ready to transform your startup?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-light"
          >
            Join hundreds of founders who've accelerated their growth with AI-powered insights.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartAnalysis}
            className="relative px-12 py-5 bg-black text-white rounded-full text-lg font-medium overflow-hidden group"
          >
            <span className="relative z-10">Get Started Today</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900"
              initial={{ scale: 0, borderRadius: "100%" }}
              whileHover={{ scale: 2, borderRadius: "0%" }}
              transition={{ type: "spring", stiffness: 200 }}
            />
          </motion.button>
        </div>
      </motion.section>

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