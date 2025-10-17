'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface InvestmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preferences: InvestmentPreferences) => void;
}

interface InvestmentPreferences {
  industries: string[];
  stages: string[];
  ticketSize: { min: number; max: number };
  geography: string[];
  greenInvestments: boolean;
  impactFocus: boolean;
  b2bOnly: boolean;
  technicalFounders: boolean;
  minimumTraction: string;
  timeToExit: string;
}

const QUESTIONS = [
  {
    id: 'industries',
    title: 'Which industries interest you?',
    subtitle: 'Select all that apply',
    type: 'multi-select',
    options: [
      'B2B SaaS', 'Fintech', 'Health Tech', 'Climate Tech', 
      'E-commerce', 'AI/ML', 'Cybersecurity', 'EdTech',
      'Logistics', 'Biotech', 'Gaming', 'Consumer'
    ]
  },
  {
    id: 'stages',
    title: 'What stages do you invest in?',
    subtitle: 'Select your preferred stages',
    type: 'multi-select',
    options: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+']
  },
  {
    id: 'ticketSize',
    title: 'What is your typical ticket size?',
    subtitle: 'Your investment range',
    type: 'range',
    min: 50000,
    max: 10000000,
    step: 50000
  },
  {
    id: 'geography',
    title: 'Geographic preferences?',
    subtitle: 'Where do you invest?',
    type: 'multi-select',
    options: ['Europe', 'North America', 'Asia', 'LATAM', 'Africa', 'Global']
  },
  {
    id: 'greenInvestments',
    title: 'Interested in green investments?',
    subtitle: 'ESG and climate-focused startups',
    type: 'boolean'
  },
  {
    id: 'impactFocus',
    title: 'Focus on social impact?',
    subtitle: 'Companies with positive societal impact',
    type: 'boolean'
  },
  {
    id: 'b2bOnly',
    title: 'B2B companies only?',
    subtitle: 'Exclude B2C opportunities',
    type: 'boolean'
  },
  {
    id: 'technicalFounders',
    title: 'Require technical founders?',
    subtitle: 'At least one technical co-founder',
    type: 'boolean'
  },
  {
    id: 'minimumTraction',
    title: 'Minimum traction required?',
    subtitle: 'Monthly recurring revenue',
    type: 'single-select',
    options: ['No revenue required', '$10k+ MRR', '$50k+ MRR', '$100k+ MRR', '$500k+ MRR']
  },
  {
    id: 'timeToExit',
    title: 'Expected time to exit?',
    subtitle: 'Your investment horizon',
    type: 'single-select',
    options: ['3-5 years', '5-7 years', '7-10 years', '10+ years', 'No preference']
  }
];

export default function InvestmentWizard({ isOpen, onClose, onComplete }: InvestmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({
    industries: [],
    stages: [],
    ticketSize: { min: 100000, max: 1000000 },
    geography: [],
    greenInvestments: false,
    impactFocus: false,
    b2bOnly: false,
    technicalFounders: false,
    minimumTraction: 'No revenue required',
    timeToExit: '5-7 years'
  });

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = (key: string, value: any) => {
    setAnswers({ ...answers, [key]: value });
  };

  const toggleMultiSelect = (key: string, value: string) => {
    const current = answers[key] || [];
    if (current.includes(value)) {
      updateAnswer(key, current.filter((v: string) => v !== value));
    } else {
      updateAnswer(key, [...current, value]);
    }
  };

  const question = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

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
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">Investment Preferences</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-black h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Question {currentStep + 1} of {QUESTIONS.length}
              </p>
            </div>

            {/* Question Content */}
            <div className="p-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-black mb-2">{question.title}</h3>
                <p className="text-gray-600 mb-6">{question.subtitle}</p>

                {/* Multi-select Options */}
                {question.type === 'multi-select' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options?.map((option) => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleMultiSelect(question.id, option)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          answers[question.id]?.includes(option)
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          {option}
                          {answers[question.id]?.includes(option) && (
                            <Check className="w-4 h-4 ml-2" />
                          )}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Single-select Options */}
                {question.type === 'single-select' && (
                  <div className="space-y-3">
                    {question.options?.map((option) => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateAnswer(question.id, option)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          answers[question.id] === option
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Boolean Options */}
                {question.type === 'boolean' && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateAnswer(question.id, true)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        answers[question.id] === true
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Yes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateAnswer(question.id, false)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        answers[question.id] === false
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      No
                    </motion.button>
                  </div>
                )}

                {/* Range Selector */}
                {question.type === 'range' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Investment
                      </label>
                      <input
                        type="range"
                        min={question.min}
                        max={question.max}
                        step={question.step}
                        value={answers[question.id]?.min || question.min}
                        onChange={(e) => updateAnswer(question.id, {
                          ...answers[question.id],
                          min: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                      <p className="text-center mt-2 font-bold">
                        ${(answers[question.id]?.min || question.min).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Investment
                      </label>
                      <input
                        type="range"
                        min={question.min}
                        max={question.max}
                        step={question.step}
                        value={answers[question.id]?.max || question.max}
                        onChange={(e) => updateAnswer(question.id, {
                          ...answers[question.id],
                          max: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                      <p className="text-center mt-2 font-bold">
                        ${(answers[question.id]?.max || question.max).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                {currentStep === QUESTIONS.length - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
