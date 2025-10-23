'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, BarChart3, Users, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';

interface UploadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadGuideModal({ isOpen, onClose }: UploadGuideModalProps) {
  const documents = [
    {
      icon: FileText,
      title: 'Pitch Deck',
      description: 'Your investor presentation (PDF or PPT)',
      benefits: [
        'Auto-extracts metrics (CAC, LTV, MRR, churn)',
        'Validates your business model',
        'Improves 8-12 dimensions instantly'
      ],
      priority: 'High'
    },
    {
      icon: BarChart3,
      title: 'Financial Statements',
      description: 'P&L, balance sheet, or financial projections',
      benefits: [
        'Validates unit economics',
        'Shows runway and burn rate',
        'Strengthens investor confidence'
      ],
      priority: 'High'
    },
    {
      icon: TrendingUp,
      title: 'KPI Dashboard Export',
      description: 'CSV/Excel from analytics tools (Mixpanel, Amplitude, etc.)',
      benefits: [
        'Real traction data',
        'Growth trajectory analysis',
        'User engagement metrics'
      ],
      priority: 'Medium'
    },
    {
      icon: DollarSign,
      title: 'Cap Table',
      description: 'Current ownership structure and previous rounds',
      benefits: [
        'Valuation transparency',
        'Funding history',
        'Investor-ready documentation'
      ],
      priority: 'Medium'
    },
    {
      icon: Users,
      title: 'Team Bios / LinkedIn',
      description: 'Founder backgrounds and key team members',
      benefits: [
        'Domain expertise validation',
        'Track record assessment',
        'Network strength analysis'
      ],
      priority: 'Low'
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pt-20 pb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">What Should I Upload?</h2>
                  <p className="text-gray-300 text-sm mt-1">
                    Upload these documents to maximize your investment readiness score
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <div className="grid gap-4">
                  {documents.map((doc, index) => {
                    const Icon = doc.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className="p-3 bg-gray-100 rounded-lg flex-shrink-0">
                            <Icon className="w-6 h-6 text-gray-700" />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                  doc.priority === 'High'
                                    ? 'bg-red-100 text-red-700'
                                    : doc.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {doc.priority} Priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                            
                            {/* Benefits */}
                            <div className="space-y-1.5">
                              {doc.benefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Pro Tips */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Pro Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <span>Upload multiple formats - PDFs are best for pitch decks, CSV/Excel for data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <span>More data = better analysis - but quality over quantity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <span>All documents are analyzed securely and never shared without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <span>You can always re-run analysis after uploading more documents</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Got it, thanks!
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

