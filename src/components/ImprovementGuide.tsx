'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, FileText, Download, ChevronRight, CheckCircle } from 'lucide-react';

interface Dimension {
  id: string;
  name: string;
  category: string;
  score: number;
  findings: string[];
  redFlags: string[];
  strengths: string[];
  recommendations?: string[];
}

interface ImprovementGuideProps {
  isOpen: boolean;
  onClose: () => void;
  dimension: Dimension;
}

const IMPROVEMENT_TEMPLATES: Record<string, any> = {
  'Unit Economics': {
    steps: [
      'Calculate your Customer Acquisition Cost (CAC) across all channels',
      'Measure Customer Lifetime Value (LTV) based on actual retention data',
      'Document your LTV/CAC ratio with cohort analysis',
      'Identify top 3 channels with best unit economics',
    ],
    template: 'financial-model',
    resources: [
      { label: 'Unit Economics Calculator (Excel)', url: '/templates/unit-economics.xlsx' },
      { label: 'Cohort Analysis Guide', url: '/templates/cohort-guide.pdf' },
    ],
  },
  'Market Size': {
    steps: [
      'Define your TAM (Total Addressable Market) with credible sources',
      'Calculate SAM (Serviceable Addressable Market) based on your go-to-market',
      'Estimate SOM (Serviceable Obtainable Market) for next 3 years',
      'Document market growth rate and key trends',
    ],
    template: 'market-sizing',
    resources: [
      { label: 'TAM/SAM/SOM Template', url: '/templates/market-sizing.xlsx' },
      { label: 'Market Research Sources', url: '/templates/market-research.pdf' },
    ],
  },
  'Team Strength': {
    steps: [
      'Document each founder's relevant experience and achievements',
      'Highlight complementary skills and gaps',
      'List key hires and their backgrounds',
      'Add advisors with credible track records',
    ],
    template: 'team-slide',
    resources: [
      { label: 'Team Slide Template (PPTX)', url: '/templates/team-slide.pptx' },
      { label: 'Advisor Agreement Template', url: '/templates/advisor-agreement.pdf' },
    ],
  },
  'Revenue Growth': {
    steps: [
      'Export MRR data from Stripe/billing system',
      'Calculate month-over-month and quarter-over-quarter growth',
      'Identify growth drivers and seasonal patterns',
      'Project next 6-12 months based on pipeline',
    ],
    template: 'growth-metrics',
    resources: [
      { label: 'SaaS Metrics Dashboard (Excel)', url: '/templates/saas-metrics.xlsx' },
      { label: 'Growth Projection Model', url: '/templates/growth-model.xlsx' },
    ],
  },
};

export default function ImprovementGuide({ isOpen, onClose, dimension }: ImprovementGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const guide = IMPROVEMENT_TEMPLATES[dimension.name] || {
    steps: [
      'Review your current data and documentation',
      'Identify specific gaps or missing information',
      'Gather evidence and supporting materials',
      'Update your analysis with new information',
    ],
    template: 'generic',
    resources: [],
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const progress = (completedSteps.length / guide.steps.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                    <Lightbulb className="w-6 h-6" />
                    Improve: {dimension.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Current score: <strong>{dimension.score}/100</strong> • Target: 80+
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-green-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {completedSteps.length} of {guide.steps.length} steps completed
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Current Issues */}
              {(dimension.redFlags.length > 0 || dimension.findings.length > 0) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-2">📋 What We Found</h3>
                  <ul className="space-y-1">
                    {dimension.redFlags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                    {dimension.findings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span>•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step-by-step Guide */}
              <div className="mb-6">
                <h3 className="font-semibold text-black mb-3">🎯 Step-by-Step Improvement Plan</h3>
                <div className="space-y-2">
                  {guide.steps.map((step: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        completedSteps.includes(idx)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleStep(idx)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            completedSteps.includes(idx)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {completedSteps.includes(idx) ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 flex-1">{step}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Templates & Resources */}
              {guide.resources.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">📁 Templates & Resources</h3>
                  <div className="space-y-2">
                    {guide.resources.map((resource: any, idx: number) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-black transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600 group-hover:text-black" />
                          <span className="text-sm text-gray-700 group-hover:text-black">
                            {resource.label}
                          </span>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-black" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Freja Coaching CTA */}
              <div className="bg-gradient-to-r from-black to-gray-800 text-white p-4 rounded-xl">
                <h3 className="font-semibold mb-2">💬 Need personalized guidance?</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Chat with Freja for step-by-step coaching on improving {dimension.name.toLowerCase()}.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    window.location.href = `/chat?topic=${encodeURIComponent(dimension.name)}`;
                  }}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  Ask Freja for Help
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

