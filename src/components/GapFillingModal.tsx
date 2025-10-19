'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, TrendingUp, Check, AlertCircle } from 'lucide-react';

interface Gap {
  id: string;
  dimensionId: string;
  title: string;
  description: string;
  currentScore: number;
  potentialScore: number;
  inputType: 'text' | 'file' | 'number' | 'url';
  placeholder?: string;
  helpText?: string;
  category: string;
}

interface GapFillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gaps: Gap[];
  onSubmit: (responses: Record<string, any>) => Promise<void>;
}

export default function GapFillingModal({ isOpen, onClose, gaps, onSubmit }: GapFillingModalProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  const handleFileUpload = (gapId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [gapId]: file }));
    setResponses((prev) => ({ ...prev, [gapId]: file.name }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Combine text responses and files
      const fullResponses = { ...responses };
      Object.entries(uploadedFiles).forEach(([gapId, file]) => {
        fullResponses[gapId] = file;
      });

      await onSubmit(fullResponses);
      onClose();
    } catch (error) {
      console.error('Failed to submit gaps:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPotentialImprovement = gaps.reduce(
    (sum, gap) => sum + (gap.potentialScore - gap.currentScore),
    0,
  );

  const filledGaps = Object.keys(responses).length;
  const progress = (filledGaps / gaps.length) * 100;

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
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    Complete Your Investment Profile
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Fill in the missing information to increase your readiness score by up to{' '}
                    {totalPotentialImprovement} points
                  </p>
                </div>
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
                {filledGaps} of {gaps.length} gaps filled
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gaps.map((gap) => (
                  <motion.div
                    key={gap.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-xl p-4 transition-all ${
                      responses[gap.id]
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Gap Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black">{gap.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{gap.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          +{gap.potentialScore - gap.currentScore}
                        </div>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3">{gap.description}</p>

                    {/* Input Field */}
                    {gap.inputType === 'text' && (
                      <textarea
                        value={responses[gap.id] || ''}
                        onChange={(e) =>
                          setResponses((prev) => ({ ...prev, [gap.id]: e.target.value }))
                        }
                        placeholder={gap.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm"
                        rows={3}
                      />
                    )}

                    {gap.inputType === 'number' && (
                      <input
                        type="number"
                        value={responses[gap.id] || ''}
                        onChange={(e) =>
                          setResponses((prev) => ({ ...prev, [gap.id]: e.target.value }))
                        }
                        placeholder={gap.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      />
                    )}

                    {gap.inputType === 'url' && (
                      <input
                        type="url"
                        value={responses[gap.id] || ''}
                        onChange={(e) =>
                          setResponses((prev) => ({ ...prev, [gap.id]: e.target.value }))
                        }
                        placeholder={gap.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      />
                    )}

                    {gap.inputType === 'file' && (
                      <div>
                        <input
                          ref={(el) => {
                            if (el) fileInputRefs.current[gap.id] = el;
                          }}
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(gap.id, file);
                          }}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        />
                        <button
                          onClick={() => fileInputRefs.current[gap.id]?.click()}
                          className={`w-full px-4 py-3 border-2 border-dashed rounded-lg transition-all flex items-center justify-center gap-2 ${
                            uploadedFiles[gap.id]
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400 text-gray-600'
                          }`}
                        >
                          {uploadedFiles[gap.id] ? (
                            <>
                              <FileText className="w-4 h-4" />
                              <span className="text-sm truncate">{uploadedFiles[gap.id].name}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">Upload Document</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Help Text */}
                    {gap.helpText && (
                      <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {gap.helpText}
                      </p>
                    )}

                    {/* Completion Indicator */}
                    {responses[gap.id] && (
                      <div className="mt-2 flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">
                    Potential score increase:{' '}
                    <strong className="text-black">+{totalPotentialImprovement} points</strong>
                  </span>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-6 py-2 text-gray-600 hover:text-black transition-colors"
                  >
                    Save for Later
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={submitting || filledGaps === 0}
                    className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        Update Analysis
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
