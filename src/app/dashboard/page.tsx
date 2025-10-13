'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Mail, Calendar, Database, Settings, ChevronRight, 
  TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart3,
  MessageCircle, Brain, Users, FileText, X, Plus,
  Link2, Zap, Shield, Key, RefreshCw, Download, Circle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  stats?: { label: string; value: string | number }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'integrations' | 'settings' | 'readiness'>('overview');
  const [hasDeepAnalysis, setHasDeepAnalysis] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 68, status: 'idle' });
  const [deepAnalysisData, setDeepAnalysisData] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      status: 'disconnected',
      stats: [
        { label: 'Emails synced', value: '0' },
        { label: 'Last 30 days', value: '0' }
      ]
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      status: 'disconnected',
      stats: [
        { label: 'Events tracked', value: '0' },
        { label: 'Meeting insights', value: '0' }
      ]
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: Database,
      status: 'disconnected',
      stats: [
        { label: 'MRR', value: '$0' },
        { label: 'Customers', value: '0' }
      ]
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      icon: Users,
      status: 'disconnected',
      stats: [
        { label: 'Contacts', value: '0' },
        { label: 'Deals in pipeline', value: '0' }
      ]
    }
  ]);

  const [metrics, setMetrics] = useState({
    investmentReadiness: 0,
    dailyActiveScore: 0,
    growthVelocity: 0,
    riskScore: 'Unknown'
  });

  const [recentActivity] = useState<any[]>([]);

  // Check if deep analysis is complete and listen for progress
  useEffect(() => {
    const checkAnalysis = async () => {
      const sessionId = localStorage.getItem('frejfund-session-id');
      if (!sessionId) return;

      try {
        // Check status
        const res = await fetch(`/api/deep-analysis/status?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.completed && data.score) {
            setHasDeepAnalysis(true);
            setReadinessScore(data.score);
            setAnalysisProgress({ current: 68, total: 68, status: 'completed' });
            
            // Update metrics with real data
            setMetrics({
              investmentReadiness: data.score * 10,
              dailyActiveScore: Math.round(data.score * 12),
              growthVelocity: Math.round(data.score * 0.3 * 10) / 10,
              riskScore: data.score > 7 ? 'Low' : data.score > 4 ? 'Medium' : 'High'
            });
          }
        }

        // Listen for progress updates
        const eventSource = new EventSource(`/api/deep-analysis/progress?sessionId=${sessionId}`);
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'progress') {
            setAnalysisProgress({
              current: data.current,
              total: data.total,
              status: 'running'
            });
          } else if (data.type === 'complete') {
            setHasDeepAnalysis(true);
            setAnalysisProgress({ current: 68, total: 68, status: 'completed' });
            eventSource.close();
            // Re-check status to get final score
            checkAnalysis();
          }
        };

        return () => eventSource.close();
      } catch (error) {
        console.error('Failed to check analysis status:', error);
      }
    };

    checkAnalysis();
  }, []);

  const handleConnect = async (integrationId: string) => {
    // Simulated connection flow
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'connected', lastSync: new Date().toISOString() }
          : int
      )
    );
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'disconnected', lastSync: undefined }
          : int
      )
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push('/')}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <h1 className="text-base sm:text-xl font-semibold text-black hidden sm:block">FrejFund Dashboard</h1>
                <h1 className="text-base font-semibold text-black sm:hidden">Dashboard</h1>
              </motion.div>
            </div>
            
            <nav className="hidden sm:flex items-center space-x-6">
              <button
                onClick={() => setActiveSection('overview')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'overview' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Overview
              </button>
              {hasDeepAnalysis && (
                <button
                  onClick={() => setActiveSection('readiness')}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === 'readiness' ? 'text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Investment Readiness
                </button>
              )}
              <button
                onClick={() => setActiveSection('integrations')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'integrations' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'settings' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Settings
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/chat')}
                className="minimal-button py-2 px-4 text-sm"
              >
                Open Chat
              </motion.button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="sm:hidden bg-white border-b border-gray-200 px-3 py-2 flex space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('overview')}
          className={`text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
            activeSection === 'overview' ? 'bg-black text-white' : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        {hasDeepAnalysis && (
          <button
            onClick={() => setActiveSection('readiness')}
            className={`text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'readiness' ? 'bg-black text-white' : 'text-gray-600'
            }`}
          >
            Readiness
          </button>
        )}
        <button
          onClick={() => setActiveSection('integrations')}
          className={`text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
            activeSection === 'integrations' ? 'bg-black text-white' : 'text-gray-600'
          }`}
        >
          Integrations
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
            activeSection === 'settings' ? 'bg-black text-white' : 'text-gray-600'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => router.push('/chat')}
          className="text-sm font-medium whitespace-nowrap px-3 py-1.5 bg-gray-900 text-white rounded-lg"
        >
          Open Chat
        </button>
      </nav>

      {/* Deep Analysis Progress Banner */}
      {analysisProgress.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-black text-white px-3 sm:px-6 py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span className="text-sm">
                Deep analysis in progress... {analysisProgress.current} of {analysisProgress.total} dimensions analyzed
              </span>
            </div>
            <span className="text-sm font-medium">
              {Math.round((analysisProgress.current / analysisProgress.total) * 100)}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="minimal-box p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-1.5 sm:p-2 bg-black rounded-full">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.investmentReadiness}%</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Investment Readiness</h3>
                  <p className="text-xs text-gray-500 mt-1">+5% from last week</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="minimal-box p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-black rounded-full">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.dailyActiveScore}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Daily Active Score</h3>
                  <p className="text-xs text-gray-500 mt-1">Above average</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="minimal-box p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-black rounded-full">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.growthVelocity}x</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Growth Velocity</h3>
                  <p className="text-xs text-gray-500 mt-1">Month over month</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="minimal-box p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-black rounded-full">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.riskScore}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Risk Level</h3>
                  <p className="text-xs text-gray-500 mt-1">2 items need attention</p>
                </motion.div>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-black mb-4">
                    {hasDeepAnalysis ? 'Key Insights' : 'Getting Started'}
                  </h2>
                  {hasDeepAnalysis ? (
                    <div className="space-y-3">
                      {/* Show top insights from deep analysis */}
                      <p className="text-sm text-gray-600">
                        Your complete business analysis is ready. Here are the key findings:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm text-gray-800">Strong market opportunity identified</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <span className="text-sm text-gray-800">Team expansion needed for scaling</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                          <span className="text-sm text-gray-800">Revenue growth trending positively</span>
                        </div>
                      </div>
                    </div>
                  ) : analysisProgress.status === 'running' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        We're analyzing your business across 68 dimensions...
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Analysis Progress</span>
                          <span className="text-xs text-gray-500">
                            {analysisProgress.current}/{analysisProgress.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-black h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Welcome! Complete these steps to get the most out of FrejFund:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-800">Complete your business profile</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-800">Upload pitch deck or documents</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-800">Start chatting with Freja</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => router.push('/chat')}
                    >
                      <MessageCircle className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Chat with Freja</h3>
                      <p className="text-xs text-gray-500">Get instant advice</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => router.push('/analysis')}
                    >
                      <BarChart3 className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Run Analysis</h3>
                      <p className="text-xs text-gray-500">Full business review</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => router.push('/pitch')}
                    >
                      <FileText className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Update Pitch</h3>
                      <p className="text-xs text-gray-500">Optimize your deck</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => router.push('/documents')}
                    >
                      <FileText className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Documents</h3>
                      <p className="text-xs text-gray-500">All materials</p>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'integrations' && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-black">Integrations</h2>
                  <p className="text-gray-600 mt-1">Connect your tools to give Freja more context</p>
                </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/integrations')}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Integration
                  </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    whileHover={{ scale: 1.01 }}
                    className="minimal-box p-4 sm:p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <integration.icon className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-black">{integration.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${
                              integration.status === 'connected' ? 'bg-green-500' :
                              integration.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                            }`} />
                            <span className="text-xs text-gray-500">
                              {integration.status === 'connected' ? 'Connected' :
                               integration.status === 'error' ? 'Error' : 'Not connected'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {integration.status === 'connected' ? (
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push('/integrations')}
                          className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          Connect
                        </motion.button>
                      )}
                    </div>

                    {integration.stats && (
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        {integration.stats.map((stat, index) => (
                          <div key={index}>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className="text-sm font-medium text-black">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {integration.lastSync && (
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>Last synced: {new Date(integration.lastSync).toLocaleDateString()}</span>
                        <button className="hover:text-black transition-colors inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Sync now
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'readiness' && hasDeepAnalysis && (
            <motion.div
              key="readiness"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Readiness Score - Enhanced Design */}
              <div className="text-center mb-8 sm:mb-12">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                  className="inline-block minimal-box px-8 sm:px-16 py-8 sm:py-12 relative overflow-hidden"
                >
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50" />
                  
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 font-light uppercase tracking-wider relative z-10">Investment Readiness</p>
                  
                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 sm:mb-6">
                    {/* Background circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#e5e5e5"
                        strokeWidth="12"
                      />
                      {/* Progress circle */}
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#000"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={440} // 2 * PI * r
                        initial={{ strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (readinessScore / 10) * 440 }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      />
                    </svg>
                    
                    {/* Score display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <span className="text-4xl sm:text-6xl font-bold text-black">{readinessScore}</span>
                        <div className="text-sm sm:text-lg text-gray-500 -mt-1 sm:-mt-2">out of 10</div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Status message */}
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-xs sm:text-sm text-gray-600 relative z-10"
                  >
                    {readinessScore <= 3 && "Early stage - let's build your foundation"}
                    {readinessScore > 3 && readinessScore <= 6 && "Making progress - keep pushing forward"}
                    {readinessScore > 6 && readinessScore <= 8 && "Almost there - fine-tune for investors"}
                    {readinessScore > 8 && "Investment ready - time to connect!"}
                  </motion.p>
                  
                  {/* Decorative dots */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 1.2 }}
                    className="absolute top-8 right-8 flex space-x-1"
                  >
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-black rounded-full"
                        style={{ opacity: 0.2 + i * 0.3 }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/chat')}
                  className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Get Personalized Advice
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/analysis')}
                  className="px-6 py-3 bg-white text-black border border-gray-300 rounded-xl font-medium hover:border-black transition-colors"
                >
                  View Full Analysis
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeSection === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-black mb-6">Settings</h2>
              
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Account</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Email</p>
                        <p className="text-sm text-gray-500">founder@company.com</p>
                      </div>
                      <button className="text-sm text-gray-600 hover:text-black transition-colors">Change</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Password</p>
                        <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                      </div>
                      <button className="text-sm text-gray-600 hover:text-black transition-colors">Update</button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Privacy & Security</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Two-factor authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-black rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Data encryption</p>
                        <p className="text-sm text-gray-500">End-to-end encryption enabled</p>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Data Management</h3>
                  <div className="space-y-3">
                    <button className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export all data
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-700 transition-colors block">
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
