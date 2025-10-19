'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Brain,
  ChevronRight,
  Sparkles,
  Download,
  CheckCircle,
} from 'lucide-react';
import DeckSummaryModal from '@/components/DeckSummaryModal';
import { BusinessInfo } from '@/types/business';

export const dynamic = 'force-dynamic';

export default function PitchPage() {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const savedInfo = localStorage.getItem('frejfund-business-info');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setBusinessInfo(parsed);
      } catch (e) {
        console.error('Failed to parse business info:', e);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(
      (file) =>
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        file.type === 'application/vnd.ms-powerpoint',
    );

    if (validFile) {
      setUploadedFile(validFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAnalyzeDeck = () => {
    setShowDeckModal(true);
  };

  if (!businessInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Consistent with landing page */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <div className="container mx-auto px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400 }}
              onClick={() => router.push('/')}
            >
              <div className="relative">
                <img
                  src="/FREJFUND-logo.png"
                  alt="FrejFund"
                  className="h-10 sm:h-12 md:h-14 w-auto"
                />
              </div>
            </motion.div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/login')}
                className="px-3 sm:px-4 py-2 text-gray-600 hover:text-black text-xs sm:text-sm font-medium transition-colors"
              >
                Log in
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/vc')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Investors
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 sm:pt-28">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Perfect Your Pitch</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your pitch deck and get AI-powered suggestions to make it investor-ready
          </p>
        </div>

        {/* Upload Area */}
        <div className="max-w-3xl mx-auto mb-12">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'
            } ${uploadedFile ? 'border-green-500' : ''}`}
          >
            {uploadedFile ? (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-black">{uploadedFile.name}</h3>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                >
                  Upload different file
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2">Drop your pitch deck here</h3>
                <p className="text-gray-600 mb-4">or click to browse (PDF, PPT, PPTX)</p>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="deck-upload"
                />
                <label
                  htmlFor="deck-upload"
                  className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer inline-block"
                >
                  Choose File
                </label>
              </>
            )}
          </div>
        </div>

        {/* Analysis Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center"
          >
            <Target className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-black">Story Flow</h3>
            <p className="text-xs text-gray-600 mt-1">Optimize narrative structure</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center"
          >
            <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-black">Financials</h3>
            <p className="text-xs text-gray-600 mt-1">Validate projections</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center"
          >
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-black">Team</h3>
            <p className="text-xs text-gray-600 mt-1">Highlight strengths</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center"
          >
            <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-black">Metrics</h3>
            <p className="text-xs text-gray-600 mt-1">Present data effectively</p>
          </motion.div>
        </div>

        {/* CTA */}
        {uploadedFile && (
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAnalyzeDeck}
              className="px-8 py-4 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-3"
            >
              <Brain className="w-6 h-6" />
              Analyze Pitch Deck
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* Templates */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-black mb-6">Pitch Deck Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm cursor-pointer"
            >
              <FileText className="w-10 h-10 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold text-black mb-2">Seed Stage Template</h3>
              <p className="text-sm text-gray-600 mb-4">Perfect for pre-seed and seed rounds</p>
              <button className="text-sm text-black font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                Download <Download className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm cursor-pointer"
            >
              <FileText className="w-10 h-10 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold text-black mb-2">Series A Template</h3>
              <p className="text-sm text-gray-600 mb-4">For established startups scaling up</p>
              <button className="text-sm text-black font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                Download <Download className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm cursor-pointer"
            >
              <FileText className="w-10 h-10 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold text-black mb-2">One-Pager Template</h3>
              <p className="text-sm text-gray-600 mb-4">Quick overview for initial meetings</p>
              <button className="text-sm text-black font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                Download <Download className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showDeckModal && businessInfo && (
        <DeckSummaryModal businessInfo={businessInfo} onClose={() => setShowDeckModal(false)} />
      )}
    </div>
  );
}
