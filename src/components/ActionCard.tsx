'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  BarChart3, 
  Target, 
  BookOpen,
  ChevronRight,
  Upload,
  Check,
  X
} from 'lucide-react';

export type ActionCardType = 'critical' | 'quickwin' | 'missing' | 'redflag' | 'milestone' | 'learn';

interface ActionCardProps {
  type: ActionCardType;
  title: string;
  description: string;
  impact?: string; // e.g., "+12 pts"
  progress?: number; // 0-100 for milestone cards
  details?: string[];
  onAction?: () => void;
  actionLabel?: string;
  onComplete?: (data?: any) => void;
  expandable?: boolean;
  uploadEnabled?: boolean;
}

const typeConfig = {
  critical: {
    icon: Target,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    impactColor: 'text-red-600',
    label: 'CRITICAL'
  },
  quickwin: {
    icon: Lightbulb,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    impactColor: 'text-yellow-600',
    label: 'QUICK WIN'
  },
  missing: {
    icon: BarChart3,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    impactColor: 'text-blue-600',
    label: 'MISSING DATA'
  },
  redflag: {
    icon: AlertCircle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    impactColor: 'text-orange-600',
    label: 'RED FLAG'
  },
  milestone: {
    icon: TrendingUp,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    impactColor: 'text-green-600',
    label: 'MILESTONE'
  },
  learn: {
    icon: BookOpen,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    impactColor: 'text-purple-600',
    label: 'LEARN'
  }
};

export default function ActionCard({
  type,
  title,
  description,
  impact,
  progress,
  details = [],
  onAction,
  actionLabel = 'Fix Now',
  onComplete,
  expandable = true,
  uploadEnabled = false
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFile(file);

    // Simulate upload and processing
    setTimeout(() => {
      setIsUploading(false);
      setIsProcessing(true);
      
      // Simulate processing complete
      setTimeout(() => {
        setIsProcessing(false);
        onComplete?.({ file: file.name, type: file.type });
      }, 2000);
    }, 1500);
  };

  const handleExpand = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-full flex flex-col"
      whileHover={{ scale: 1.02, shadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Header */}
      <div className={`p-6 ${config.bgColor} border-b ${config.borderColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 bg-white rounded-lg ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold ${config.iconColor}`}>{config.label}</span>
          </div>
          {impact && (
            <span className={`text-lg font-bold ${config.impactColor}`}>{impact}</span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>

        {/* Progress bar for milestone type */}
        {type === 'milestone' && progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content - Fixed height to ensure cards are same size */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <AnimatePresence>
          {isExpanded && details.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <ul className="space-y-2">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload section */}
        {uploadEnabled && isExpanded && (
          <div className="mb-4">
            {!uploadedFile ? (
              <label className="block">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.xlsx,.csv"
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX, CSV</p>
                </motion.div>
              </label>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isUploading ? (
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : isProcessing ? (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {isUploading ? 'Uploading...' : isProcessing ? 'Extracting data...' : 'Complete'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setIsUploading(false);
                      setIsProcessing(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExpand}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            isExpanded 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isExpanded ? (
            <>
              <span>Close</span>
              <X className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>{actionLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
