'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Brain, TrendingUp, Users, FileText, Sparkles, X, ArrowRight, CheckCircle2, Upload } from 'lucide-react';
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
    
    // For real users, go to onboarding. For demo, go to chat.
    if (info.demoKpiCsv) {
      setCurrentView('chat');
    } else {
      // Store business info for later use
      if (typeof window !== 'undefined') {
        // Save to localStorage for persistence
        localStorage.setItem('frejfund-business-info', JSON.stringify(info));
        // Also save to sessionStorage for onboarding
        sessionStorage.setItem('businessInfo', JSON.stringify(info));
        window.location.href = '/onboarding';
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-8 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl sm:text-3xl font-bold">How FrejFund Works</h2>
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-8 overflow-y-auto max-h-[calc(85vh-80px)] sm:max-h-[calc(90vh-120px)]">
                <div className="space-y-4 sm:space-y-8">
                  {[
                    {
                      icon: <FileText />,
                      title: "1. Tell us about your business",
                      description: "Share your company details, revenue, team size, and growth plans through our simple wizard."
                    },
                    {
                      icon: <Upload />,
                      title: "2. Upload your materials",
                      description: "Add pitch decks, financial data, business plans - anything that helps us understand your venture."
                    },
                    {
                      icon: <Brain />,
                      title: "3. AI analyzes everything",
                      description: "Freja, your AI advisor, analyzes your business model, market, and growth potential in seconds."
                    },
                    {
                      icon: <MessageCircle />,
                      title: "4. Get personalized guidance",
                      description: "Chat with Freja to get specific advice, investor-ready materials, and growth strategies."
                    },
                    {
                      icon: <CheckCircle2 />,
                      title: "5. Become investment-ready",
                      description: "Follow the roadmap to strengthen your business and attract the right investors."
                    }
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-3 sm:gap-6"
                    >
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white">
                        {React.cloneElement(step.icon, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">{step.title}</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 text-center"
                >
                  <button
                    onClick={() => {
                      setShowHowItWorks(false);
                      handleStartAnalysis();
                    }}
                    className="group px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                  >
                    Start Your Analysis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
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
                <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  className="absolute inset-0 w-11 h-11 bg-black rounded-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <h1 className="text-xl font-semibold text-black tracking-tight">FrejFund</h1>
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
            className="text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-6 leading-[1.1] tracking-tight"
          >
              <motion.span
                animate={{ 
                  scale: [1, 1.02, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block"
              >
                BUILD THE FUTURE.
              </motion.span>
              <br />
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900 inline-block"
                animate={{ 
                  scale: [1, 1.03, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
              >
                WE'LL HELP YOU FUND IT.
              </motion.span>
          </motion.h1>



          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartAnalysis}
              className="group relative px-12 py-5 bg-black text-white rounded-full text-xl font-semibold overflow-hidden shadow-2xl hover:shadow-3xl transition-all"
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started
                <motion.span
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl"
                >
                  →
                </motion.span>
              </span>
            </motion.button>
            
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