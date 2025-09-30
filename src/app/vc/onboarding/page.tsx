'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, Building2, MapPin, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function VCOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    vcEmail: '',
    vcFirm: '',
    stages: [] as string[],
    industries: [] as string[],
    geographies: [] as string[],
    checkSizeMin: '',
    checkSizeMax: ''
  });

  const handleComplete = () => {
    // Save preferences
    localStorage.setItem('vc-email', preferences.vcEmail);
    localStorage.setItem('vc-firm', preferences.vcFirm);
    localStorage.setItem('vc-preferences', JSON.stringify(preferences));
    
    // Redirect to dashboard
    router.push('/vc/swipe');
  };

  const toggleSelection = (field: 'stages' | 'industries' | 'geographies', value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm font-bold text-black">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-black h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Steps */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
        >
          {step === 1 && (
            <div>
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Welcome to FrejFund</h2>
              <p className="text-gray-600 mb-6">Let's set up your account</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={preferences.vcEmail}
                    onChange={(e) => setPreferences(prev => ({ ...prev, vcEmail: e.target.value }))}
                    placeholder="partner@vc-firm.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    value={preferences.vcFirm}
                    onChange={(e) => setPreferences(prev => ({ ...prev, vcFirm: e.target.value }))}
                    placeholder="e.g., Creandum, Northzone"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Investment Stage</h2>
              <p className="text-gray-600 mb-6">What stages do you typically invest in?</p>
              
              <div className="grid grid-cols-2 gap-3">
                {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'].map(stage => (
                  <motion.button
                    key={stage}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSelection('stages', stage)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${
                      preferences.stages.includes(stage)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {stage}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Industries</h2>
              <p className="text-gray-600 mb-6">Which sectors interest you most?</p>
              
              <div className="grid grid-cols-2 gap-3">
                {['SaaS', 'Fintech', 'Health Tech', 'Marketplace', 'Deep Tech', 'Climate', 'Consumer', 'B2B'].map(industry => (
                  <motion.button
                    key={industry}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSelection('industries', industry)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${
                      preferences.industries.includes(industry)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {industry}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Geography & Check Size</h2>
              <p className="text-gray-600 mb-6">Where do you invest and how much?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Geographic Focus
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Nordics', 'Europe', 'US', 'Global'].map(geo => (
                      <motion.button
                        key={geo}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleSelection('geographies', geo)}
                        className={`p-3 rounded-xl border-2 font-medium transition-all text-sm ${
                          preferences.geographies.includes(geo)
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {geo}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Check Size
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={preferences.checkSizeMin}
                        onChange={(e) => setPreferences(prev => ({ ...prev, checkSizeMin: e.target.value }))}
                        placeholder="500k"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Check Size
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={preferences.checkSizeMax}
                        onChange={(e) => setPreferences(prev => ({ ...prev, checkSizeMax: e.target.value }))}
                        placeholder="5M"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 && (
              <button
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
              >
                ← Back
              </button>
            )}
            <div className="flex-1"></div>
            {step < 4 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(prev => prev + 1)}
                disabled={
                  (step === 1 && (!preferences.vcEmail || !preferences.vcFirm)) ||
                  (step === 2 && preferences.stages.length === 0) ||
                  (step === 3 && preferences.industries.length === 0)
                }
                className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleComplete}
                disabled={preferences.geographies.length === 0}
                className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 disabled:opacity-50"
              >
                <span>Start Swiping</span>
                <Sparkles className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
