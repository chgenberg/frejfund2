'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, FileText, HelpCircle, Sparkles } from 'lucide-react';

interface GapQuestion {
  id: string;
  dimensionId: string;
  question: string;
  helpText: string;
  inputType: 'text' | 'number' | 'select' | 'file';
  options?: string[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
}

interface AnalysisGap {
  dimensionId: string;
  dimensionName: string;
  category: string;
  gapType: 'missing_data' | 'low_confidence' | 'needs_clarification';
  requiredSources: string[];
  suggestedQuestions: string[];
  potentialDocuments: string[];
}

interface GapQAModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onComplete?: () => void;
}

export default function GapQAModal({ isOpen, onClose, sessionId, onComplete }: GapQAModalProps) {
  const [gaps, setGaps] = useState<AnalysisGap[]>([]);
  const [questions, setQuestions] = useState<GapQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadGaps();
    }
  }, [isOpen, sessionId]);

  const loadGaps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gaps?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to load gaps');

      const data = await response.json();
      setGaps(data.gaps || []);
      setQuestions(data.questions || []);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error loading gaps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers }),
      });

      if (!response.ok) throw new Error('Failed to save answers');

      const data = await response.json();
      console.log('Answers saved:', data);

      onComplete?.();
      onClose();
    } catch (err) {
      setError('Failed to save answers. Please try again.');
      console.error('Error saving answers:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = currentQuestion && answers[currentQuestion.id];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Complete Your Analysis</h2>
                <p className="text-sm text-gray-600">
                  {questions.length > 0
                    ? `Answer ${questions.length} questions to unlock deeper insights`
                    : 'Loading questions...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-medium text-black">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Analyzing your data gaps...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={loadGaps}
                className="mt-4 px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">Analysis Complete!</h3>
              <p className="text-gray-600 text-center max-w-md">
                Your analysis is comprehensive. No additional information needed at this time.
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No questions available</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Question */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold text-gray-700">
                        {currentQuestionIndex + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {currentQuestion?.question}
                      </h3>
                      {currentQuestion?.helpText && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          💡 {currentQuestion.helpText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                  {currentQuestion?.inputType === 'text' && (
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                      rows={4}
                      required={currentQuestion.validation?.required}
                    />
                  )}

                  {currentQuestion?.inputType === 'number' && (
                    <input
                      type="number"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Enter a number..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      min={currentQuestion.validation?.min}
                      max={currentQuestion.validation?.max}
                      required={currentQuestion.validation?.required}
                    />
                  )}

                  {currentQuestion?.inputType === 'select' && currentQuestion.options && (
                    <select
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      required={currentQuestion.validation?.required}
                    >
                      <option value="">Select an option...</option>
                      {currentQuestion.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Suggested Documents */}
                {gaps[currentQuestionIndex]?.potentialDocuments &&
                  gaps[currentQuestionIndex].potentialDocuments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-sm font-medium text-blue-900">Helpful documents:</p>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {gaps[currentQuestionIndex].potentialDocuments.map((doc, i) => (
                          <li key={i} className="text-sm text-blue-700">
                            • {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && questions.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed || isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Complete & Re-analyze'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next Question
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              Your answers will improve the analysis accuracy
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
