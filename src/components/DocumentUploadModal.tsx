'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  suggestedDocuments?: string[];
  dimensionNames?: string[];
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  suggestedDocuments = [
    'Pitch Deck',
    'Financial Model',
    'KPI Dashboard',
    'Annual Report',
    'Customer Testimonials',
    'Market Research',
  ],
  dimensionNames = [],
}: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const sessionId = localStorage.getItem('frejfund-session-id');
      if (!sessionId) throw new Error('No session ID');

      // 1. Extract text from files
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      setUploadProgress(30);

      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) throw new Error('File extraction failed');

      const { texts } = await extractResponse.json();
      setUploadProgress(60);

      // 2. Trigger re-analysis with uploaded documents
      const reanalysisResponse = await fetch('/api/deep-analysis/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          uploadedDocuments: texts,
          specificDimensions: dimensionNames, // Re-run only these dimensions if provided
        }),
      });

      if (!reanalysisResponse.ok) throw new Error('Re-analysis failed');

      setUploadProgress(100);
      setCompleted(true);

      // Wait a bit then close and refresh
      setTimeout(() => {
        onUploadComplete?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload and process documents. Please try again.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Upload Documents</h2>
                <p className="text-gray-600 text-sm">
                  Upload documents to improve your analysis score and data completeness
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!completed ? (
              <>
                {/* Suggested Documents */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">Suggested Documents:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {suggestedDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 text-center"
                      >
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Files to Upload
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Supported: PDF, DOCX, XLSX, CSV, TXT
                    </p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.docx,.xlsx,.csv,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-black text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      Choose Files
                    </label>
                  </div>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-black mb-3">
                      Selected Files ({files.length})
                    </h3>
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <FileText className="w-5 h-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Processing...</span>
                      <span className="text-sm text-gray-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-black h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {uploadProgress < 40
                        ? 'Extracting text from documents...'
                        : uploadProgress < 80
                          ? 'Running targeted re-analysis...'
                          : 'Finalizing updated scores...'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload & Improve Score
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={uploading}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">Upload Complete!</h3>
                <p className="text-gray-600">
                  Your analysis has been updated with the new information.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

