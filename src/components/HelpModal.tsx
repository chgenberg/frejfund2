'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Target, FileText, Mail, TrendingUp, Zap, Users } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const capabilities = [
    {
      icon: Target,
      title: 'Find Perfect Investors',
      description: 'AI matches you with 91+ VCs based on your stage, industry, and goals',
      example: "Ask: 'Who should I contact for funding?'",
    },
    {
      icon: Mail,
      title: 'Draft Personalized Emails',
      description: "Generate investor-ready emails tailored to each VC's thesis and portfolio",
      example: "Ask: 'Draft email to Creandum'",
    },
    {
      icon: Users,
      title: 'Warm Intro Guidance',
      description: 'Step-by-step help finding mutual connections and requesting introductions',
      example: "Ask: 'How do I get a warm intro?'",
    },
    {
      icon: FileText,
      title: 'Generate Documents',
      description: 'Auto-create pitch decks, one-pagers, and investor updates from your data',
      example: "Ask: 'Create my pitch deck'",
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Investment readiness score, goal tracking, and personalized roadmaps',
      example: "Ask: 'How ready am I?'",
    },
    {
      icon: Zap,
      title: 'Daily Coaching',
      description: 'Proactive tips, risk alerts, and action items based on your journey',
      example: "Ask: 'What should I focus on today?'",
    },
  ];

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      What can Freja help you with?
                    </h2>
                    <p className="text-sm text-gray-300">Your AI fundraising coach</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {/* Intro */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Freja is your personal fundraising coach. Just chat naturally - ask questions,
                    request help, or tell me what you need. I'll understand and help you every step
                    of your fundraising journey.
                  </p>
                </div>

                {/* Capabilities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {capabilities.map((capability, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <capability.icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-black mb-1">
                            {capability.title}
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {capability.description}
                          </p>
                        </div>
                      </div>
                      <div className="pl-12">
                        <div className="inline-block px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                          <code className="text-xs text-gray-700 font-mono">
                            {capability.example}
                          </code>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Tips */}
                <div className="mt-6 p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white">
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Quick Tips</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>
                      ✓ Be specific - "Draft email to Creandum" works better than "Help with emails"
                    </li>
                    <li>✓ Upload documents - pitch decks, KPIs, financials for better advice</li>
                    <li>✓ Set your goal - I'll tailor coaching to your specific objective</li>
                    <li>✓ Ask follow-ups - "Make it shorter", "Add more metrics", etc.</li>
                    <li>✓ Use feedback buttons - Help me learn what's helpful</li>
                  </ul>
                </div>

                {/* CTA */}
                <div className="mt-6 text-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Start Chatting</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
