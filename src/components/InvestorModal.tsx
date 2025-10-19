'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Users,
  Shield,
  Info,
  Brain,
  Target,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hoist VC tabs to avoid any TDZ issues across branches of rendering
const VC_TABS = [
  {
    title: 'Get Started',
    icon: <Sparkles className="w-5 h-5" />,
    content:
      'Create an investor account (or use demo), set your thesis, and access a curated feed of startups that match your preferences.',
  },
  {
    title: 'Deep Analysis',
    icon: <Brain className="w-5 h-5" />,
    content:
      'Every startup is analyzed across 95 dimensions (market, team, traction, financials, risks) so you can make fast, confident decisions.',
  },
  {
    title: 'Smart Matching',
    icon: <Target className="w-5 h-5" />,
    content:
      'We match by stage, industry, geography, check size and thesis signals. Prioritized feed with high-fit deals first.',
  },
  {
    title: 'Due Diligence',
    icon: <Briefcase className="w-5 h-5" />,
    content:
      'One-click access to pitch decks, metrics, and references. Track red flags, strengths and follow-ups directly in the profile.',
  },
  {
    title: 'Invest & Track',
    icon: <TrendingUp className="w-5 h-5" />,
    content:
      'Request intros, collaborate with your team, and track portfolio metrics post-investment with automated updates.',
  },
];

export default function InvestorModal({ isOpen, onClose }: InvestorModalProps) {
  const router = useRouter();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Timeout guard so UI never spins forever
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/vc/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      }).catch((e) => {
        throw e;
      });

      clearTimeout(timer);

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        router.push('/vc');
      } else {
        setError(data?.error || 'Login failed (server error). Please try again.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Login timed out. Please check your connection and try again.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const vcTabs = VC_TABS;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {!showHowItWorks ? (
              /* Login View */
              <div className="p-6 sm:p-8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-black mb-2">Investor Access</h2>
                  <p className="text-gray-600">Access deal flow from investment-ready startups</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@vcfirm.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    disabled={!email || !password || loading}
                    className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </motion.button>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">New to FrejFund?</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:border-black transition-colors"
                    onClick={() =>
                      (window.location.href = 'mailto:vcs@frejfund.com?subject=VC Access Request')
                    }
                  >
                    Request Access
                  </motion.button>

                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="w-full text-sm text-gray-600 hover:text-black transition-colors flex items-center justify-center gap-2 py-2"
                  >
                    <Info className="w-4 h-4" />
                    How it works for investors
                  </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-6">
                  Demo access: vc@demo.com / demo123
                </p>
              </div>
            ) : (
              /* How It Works View */
              <div className="p-0 sm:p-8">
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mt-4 mb-2 sm:mb-6">
                  <h2 className="text-2xl font-bold text-black mb-2">How FrejFund Works for VCs</h2>
                  <p className="text-gray-600">
                    Evaluate, decide and act faster with investor-grade AI insights
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-4 sm:px-8">
                  {vcTabs.map((tab, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index)}
                      className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                        activeTab === index
                          ? 'text-black border-b-2 border-black bg-gray-50'
                          : 'text-gray-500 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.title}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 p-6 sm:p-8 max-h-[60vh] overflow-y-auto"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                        {vcTabs[activeTab]?.icon}
                        {vcTabs[activeTab]
                          ? React.cloneElement(vcTabs[activeTab].icon, {
                              className: 'w-10 h-10 text-white',
                            })
                          : null}
                      </div>
                      <h3 className="text-xl font-bold text-black mb-3">
                        {vcTabs[activeTab]?.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{vcTabs[activeTab]?.content}</p>
                    </div>

                    {activeTab === 0 && (
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0" />
                          <span>500+ pre-screened startups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0" />
                          <span>Advanced filters and search</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0" />
                          <span>Real-time metrics and updates</span>
                        </li>
                      </ul>
                    )}

                    {activeTab === 1 && (
                      <div className="bg-gray-50 rounded-xl p-4 text-sm">
                        <p className="font-semibold text-black mb-2">
                          95 Analysis Dimensions Include:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          <span>• Market Opportunity</span>
                          <span>• Team Experience</span>
                          <span>• Business Model</span>
                          <span>• Traction Metrics</span>
                          <span>• Financial Health</span>
                          <span>• Competition</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 2 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">Investment Focus</span>
                          <span className="text-sm font-medium">B2B SaaS, Fintech</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">Stage Preference</span>
                          <span className="text-sm font-medium">Seed, Series A</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">Check Size</span>
                          <span className="text-sm font-medium">$500K - $5M</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 3 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-gray-700">Pitch decks and financials</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-gray-700">Cap tables and legal docs</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-gray-700">Direct founder contact</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Ready to discover high-fit deals?</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowHowItWorks(false)}
                    className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    Sign In to View Startups
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
