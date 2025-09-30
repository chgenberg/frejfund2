'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Share2, Eye, RefreshCw, Calendar,
  TrendingUp, Mail, BarChart3, CheckCircle2, Clock,
  Sparkles, ArrowLeft, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Document {
  id: string;
  type: 'pitch_deck' | 'one_pager' | 'investor_update' | 'financial_model' | 'due_diligence' | 'email_template';
  title: string;
  description: string;
  status: 'ready' | 'draft' | 'generating' | 'outdated';
  lastUpdated: string;
  version?: string;
  metrics?: {
    views?: number;
    avgTime?: string;
    shares?: number;
  };
  url?: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    
    // Mock data for now - will connect to API later
    const mockDocs: Document[] = [
      {
        id: '1',
        type: 'pitch_deck',
        title: 'Pitch Deck',
        description: 'Latest investor pitch presentation',
        status: 'ready',
        lastUpdated: new Date().toISOString(),
        version: 'v3.2',
        metrics: {
          views: 127,
          avgTime: '12 min',
          shares: 8
        }
      },
      {
        id: '2',
        type: 'one_pager',
        title: 'One-Pager',
        description: 'Executive summary for quick investor review',
        status: 'ready',
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        version: 'v2.1',
        metrics: {
          views: 43,
          shares: 5
        }
      },
      {
        id: '3',
        type: 'investor_update',
        title: 'Monthly Investor Update',
        description: 'March 2025 update',
        status: 'draft',
        lastUpdated: new Date().toISOString(),
        version: 'Draft'
      },
      {
        id: '4',
        type: 'financial_model',
        title: 'Financial Projections',
        description: '3-year forecast with scenarios',
        status: 'ready',
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        version: 'v1.5'
      },
      {
        id: '5',
        type: 'due_diligence',
        title: 'Due Diligence Room',
        description: '24 documents ready for investor review',
        status: 'ready',
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setDocuments(mockDocs);
    setLoading(false);
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pitch_deck': return FileText;
      case 'one_pager': return FileText;
      case 'investor_update': return Mail;
      case 'financial_model': return BarChart3;
      case 'due_diligence': return CheckCircle2;
      case 'email_template': return Mail;
      default: return FileText;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'generating': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'outdated': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredDocuments = selectedType === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === selectedType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </motion.button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-semibold text-black">Documents</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">All your fundraising materials</p>
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/chat')}
              className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Ask Freja
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === 'all' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setSelectedType('pitch_deck')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === 'pitch_deck' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pitch Materials
          </button>
          <button
            onClick={() => setSelectedType('investor_update')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === 'investor_update' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Updates
          </button>
          <button
            onClick={() => setSelectedType('financial_model')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === 'financial_model' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Financials
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          </div>
        )}

        {/* Document Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc, index) => {
                const Icon = getDocumentIcon(doc.type);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-black">{doc.title}</h3>
                            {doc.version && (
                              <span className="text-xs text-gray-500">{doc.version}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(doc.status)}`}>
                          {doc.status === 'ready' && 'Ready'}
                          {doc.status === 'draft' && 'Draft'}
                          {doc.status === 'generating' && 'Generating...'}
                          {doc.status === 'outdated' && 'Outdated'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">{doc.description}</p>

                      {/* Metrics */}
                      {doc.metrics && (
                        <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
                          {doc.metrics.views !== undefined && (
                            <div>
                              <div className="flex items-center space-x-1 mb-1">
                                <Eye className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">Views</span>
                              </div>
                              <p className="text-sm sm:text-base font-semibold text-black">{doc.metrics.views}</p>
                            </div>
                          )}
                          {doc.metrics.avgTime && (
                            <div>
                              <div className="flex items-center space-x-1 mb-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">Avg Time</span>
                              </div>
                              <p className="text-sm sm:text-base font-semibold text-black">{doc.metrics.avgTime}</p>
                            </div>
                          )}
                          {doc.metrics.shares !== undefined && (
                            <div>
                              <div className="flex items-center space-x-1 mb-1">
                                <Share2 className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">Shares</span>
                              </div>
                              <p className="text-sm sm:text-base font-semibold text-black">{doc.metrics.shares}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Updated */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {new Date(doc.lastUpdated).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center space-x-1"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Download</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4 text-gray-700" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-700" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Start by chatting with Freja to generate your first documents</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/chat')}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Chat with Freja</span>
            </motion.button>
          </div>
        )}

        {/* AI Assistant Tip */}
        {!loading && filteredDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white"
          >
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Need help with your documents?</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Ask Freja to improve your pitch deck, generate investor updates, or create custom materials.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/chat')}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
                >
                  <span>Ask Freja</span>
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
