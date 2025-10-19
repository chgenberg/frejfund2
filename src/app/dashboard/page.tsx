'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Mail,
  Calendar,
  Database,
  Settings,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  MessageCircle,
  Brain,
  Users,
  FileText,
  X,
  Plus,
  Link2,
  Zap,
  Shield,
  Key,
  RefreshCw,
  Download,
  Circle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

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
  const [activeSection, setActiveSection] = useState<
    'overview' | 'integrations' | 'settings' | 'readiness'
  >('overview');
  const [hasDeepAnalysis, setHasDeepAnalysis] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState({
    current: 0,
    total: 95,
    status: 'idle',
  });
  const [deepAnalysisData, setDeepAnalysisData] = useState<any>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [publishingProfile, setPublishingProfile] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    company: '',
    industry: '',
    stage: '',
    website: '',
    logo: '',
  });
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      status: 'disconnected',
      stats: [
        { label: 'Emails synced', value: '0' },
        { label: 'Last 30 days', value: '0' },
      ],
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      status: 'disconnected',
      stats: [
        { label: 'Events tracked', value: '0' },
        { label: 'Meeting insights', value: '0' },
      ],
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: Database,
      status: 'disconnected',
      stats: [
        { label: 'MRR', value: '$0' },
        { label: 'Customers', value: '0' },
      ],
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      icon: Users,
      status: 'disconnected',
      stats: [
        { label: 'Contacts', value: '0' },
        { label: 'Deals in pipeline', value: '0' },
      ],
    },
  ]);

  const [metrics, setMetrics] = useState({
    investmentReadiness: 0,
    dailyActiveScore: 0,
    growthVelocity: 0,
    riskScore: 'Unknown',
  });

  const [showMetrics, setShowMetrics] = useState(false);

  const [recentActivity] = useState<any[]>([]);
  const [dataGaps, setDataGaps] = useState<any>(null);
  const [loadingGaps, setLoadingGaps] = useState(false);

  // Load data gaps
  const loadDataGaps = async (sessionId: string) => {
    setLoadingGaps(true);
    try {
      const response = await fetch(`/api/gaps?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDataGaps(data);
      }
    } catch (error) {
      console.error('Failed to load data gaps:', error);
    } finally {
      setLoadingGaps(false);
    }
  };

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const sessionId =
        localStorage.getItem('frejfund-session-id') || localStorage.getItem('sessionId');
      if (!sessionId) return;

      try {
        const response = await fetch(`/api/session/get?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const businessInfo = data.businessInfo || {};

          setUserEmail(businessInfo.email || '');
          setProfileForm({
            name: businessInfo.founderName || '',
            company: businessInfo.name || '',
            industry: businessInfo.industry || '',
            stage: businessInfo.stage || '',
            website: businessInfo.website || '',
            logo: businessInfo.logo || '',
          });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Start analysis if coming from wizard
  useEffect(() => {
    const shouldStartAnalysis = sessionStorage.getItem('frejfund-start-analysis');
    if (shouldStartAnalysis === 'true') {
      sessionStorage.removeItem('frejfund-start-analysis');
      const triggerAnalysis = async () => {
        const sessionId = localStorage.getItem('frejfund-session-id');
        const businessInfo = localStorage.getItem('frejfund-business-info');
        
        if (sessionId && businessInfo) {
          try {
            setAnalysisProgress({ current: 0, total: 95, status: 'running' });
            const response = await fetch('/api/deep-analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                businessInfo: JSON.parse(businessInfo),
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to start analysis');
              setAnalysisProgress({ current: 0, total: 95, status: 'idle' });
            }
          } catch (error) {
            console.error('Error starting analysis:', error);
            setAnalysisProgress({ current: 0, total: 95, status: 'idle' });
          }
        }
      };
      
      triggerAnalysis();
    }
  }, []);

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
            setAnalysisProgress({ current: 95, total: 95, status: 'completed' });
            setShowMetrics(true);

            // Load data gaps when analysis is complete
            loadDataGaps(sessionId);

            // Update metrics with real data
            setMetrics({
              investmentReadiness: data.score * 10,
              dailyActiveScore: Math.round(data.score * 12),
              growthVelocity: Math.round(data.score * 0.3 * 10) / 10,
              riskScore: data.score > 7 ? 'Low' : data.score > 4 ? 'Medium' : 'High',
            });
          }
        }

        // Listen for progress updates (single instance with reconnect)
        if (!(window as any).__ff_es) (window as any).__ff_es = {};

        let eventSource: EventSource | null = null;
        let retries = 0;
        let offline = !navigator.onLine;

        const connect = () => {
          if ((window as any).__ff_es[sessionId]) {
            eventSource = (window as any).__ff_es[sessionId];
            return;
          }

          if (offline) return; // don't connect while offline
          eventSource = new EventSource(`/api/deep-analysis/progress?sessionId=${sessionId}`);
          (window as any).__ff_es[sessionId] = eventSource;

          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            retries = 0; // reset on successful message
            if (data.type === 'progress') {
              // Clamp so progress never goes backwards
              setAnalysisProgress((prev) => {
                const clampedCurrent = Math.max(prev.current || 0, data.current || 0);
                const total = data.total || prev.total || 95;
                return { current: clampedCurrent, total, status: 'running' };
              });
            } else if (data.type === 'complete') {
              setHasDeepAnalysis(true);
              setAnalysisProgress({ current: 95, total: 95, status: 'completed' });
              try {
                eventSource && eventSource.close();
              } catch {}
              (window as any).__ff_es[sessionId] = null;
              checkAnalysis();
            }
          };

          eventSource.onerror = () => {
            try {
              eventSource && eventSource.close();
            } catch {}
            (window as any).__ff_es[sessionId] = null;
            if (offline) return; // wait for online event
            if (retries < 5) {
              retries++;
              setTimeout(connect, 1000 * retries);
            }
          };
        };

        const handleOnline = () => {
          offline = false;
          retries = 0;
          connect();
        };
        const handleOffline = () => {
          offline = true;
          try {
            eventSource && eventSource.close();
          } catch {}
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        connect();

        return () => {
          try {
            if (eventSource) eventSource.close();
            (window as any).__ff_es[sessionId] = null;
          } catch {}
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      } catch (error) {
        console.error('Failed to check analysis status:', error);
      }
    };

    checkAnalysis();
  }, []);

  const handleConnect = async (integrationId: string) => {
    // Simulated connection flow
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integrationId
          ? { ...int, status: 'connected', lastSync: new Date().toISOString() }
          : int,
      ),
    );
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integrationId ? { ...int, status: 'disconnected', lastSync: undefined } : int,
      ),
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
                <h1 className="text-base sm:text-xl font-semibold text-black hidden sm:block">
                  FrejFund Dashboard
                </h1>
                <h1 className="text-base font-semibold text-black sm:hidden">Dashboard</h1>
              </motion.div>
            </div>

            <nav className="hidden sm:flex items-center space-x-6">
              <NotificationBell userId={undefined} />
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
                whileHover={{ scale: analysisProgress.status === 'running' ? 1 : 1.02 }}
                whileTap={{ scale: analysisProgress.status === 'running' ? 1 : 0.98 }}
                onClick={() => analysisProgress.status !== 'running' && router.push('/chat')}
                className={`py-2 px-4 text-sm rounded-lg font-medium transition-all ${
                  analysisProgress.status === 'running' 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'minimal-button'
                }`}
                disabled={analysisProgress.status === 'running'}
              >
                {analysisProgress.status === 'running' ? 'Chat Available After Analysis' : 'Open Chat'}
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

      {/* Slim banner removed to avoid duplicating progress on Dashboard */}

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
              {/* Analysis Progress Bar - Show when analysis is running */}
              {analysisProgress.status === 'running' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-black to-gray-800 text-white rounded-2xl p-6 sm:p-8 mb-6"
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    Analyzing Your Business...
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Freja is conducting a deep analysis across 95 dimensions. This typically takes 2-3 minutes.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{analysisProgress.current} of {analysisProgress.total} dimensions</span>
                    </div>
                    
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(analysisProgress.current / analysisProgress.total) * 100}%` 
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center font-semibold">
                        {Math.round((analysisProgress.current / analysisProgress.total) * 100)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analysis in progress...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Metrics Grid - Only show when analysis is complete */}
              {showMetrics && analysisProgress.status !== 'running' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} className="minimal-box p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-1.5 sm:p-2 bg-black rounded-full">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-black">
                        {metrics.investmentReadiness}%
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Investment Readiness</h3>
                    <p className="text-xs text-gray-500 mt-1">Based on deep analysis</p>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="minimal-box p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-black rounded-full">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-black">
                        {metrics.dailyActiveScore}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Overall Score</h3>
                    <p className="text-xs text-gray-500 mt-1">Across 95 dimensions</p>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="minimal-box p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-black rounded-full">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-black">
                        {metrics.growthVelocity}x
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Growth Potential</h3>
                    <p className="text-xs text-gray-500 mt-1">Projected trajectory</p>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="minimal-box p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-black rounded-full">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-black">{metrics.riskScore}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Risk Level</h3>
                    <p className="text-xs text-gray-500 mt-1">Overall assessment</p>
                  </motion.div>
                </div>
              ) : analysisProgress.status === 'completed' && dataGaps ? (
                <div className="minimal-box p-6 sm:p-8">
                  <h3 className="text-base sm:text-lg font-semibold text-black mb-2">
                    Analysis Summary
                  </h3>
                  {dataGaps.totalGaps > 0 ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        We found {dataGaps.totalGaps} missing items that would significantly improve
                        the accuracy of your score.
                      </p>
                      <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                        {dataGaps.gaps.slice(0, 3).map((g: any) => (
                          <li key={g.dimensionId}>
                            <span className="font-medium">{g.dimensionName}:</span>{' '}
                            {g.missingInfo[0]}
                          </li>
                        ))}
                      </ul>
                      {dataGaps.totalGaps > 3 && (
                        <p className="text-xs text-gray-500 mt-2">
                          +{dataGaps.totalGaps - 3} more gaps
                        </p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push('/chat')}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
                        >
                          Fix Gaps with Freja
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push('/analysis')}
                          className="px-4 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:border-black"
                        >
                          View Full Analysis
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Your deep analysis is complete and no critical gaps were detected. Explore all
                      95 dimensions or chat with Freja for next steps.
                    </p>
                  )}
                </div>
              ) : (
                <div className="minimal-box p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-2">
                    Deep Analysis in Progress
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your business is being analyzed across 95 dimensions. Metrics will appear here
                    once complete.
                  </p>
                  <p className="text-sm text-gray-500">This typically takes 15-30 minutes</p>
                </div>
              )}

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-black mb-4">
                    {hasDeepAnalysis ? 'Key Insights' : 'Getting Started'}
                  </h2>
                  {hasDeepAnalysis ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-4">
                        Your complete business analysis is ready. View detailed insights:
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/analysis')}
                        className="w-full px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <Brain className="w-4 h-4" />
                        View All 95 Dimensions
                      </motion.button>
                    </div>
                  ) : analysisProgress.status === 'running' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        We're analyzing your business across 95 dimensions...
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">
                            Analysis Progress
                          </span>
                          <span className="text-xs text-gray-500">
                            {analysisProgress.current}/{analysisProgress.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-black h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                            }}
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
                          <span className="text-sm text-gray-800">
                            Complete your business profile
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-800">
                            Upload pitch deck or documents
                          </span>
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
                  {/* Data Gaps Widget (if analysis complete) */}
                  {hasDeepAnalysis && dataGaps && dataGaps.totalGaps > 0 && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-black">Missing Information</h3>
                        <span className="text-xs text-gray-500">
                          {dataGaps.totalGaps} {dataGaps.totalGaps === 1 ? 'gap' : 'gaps'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {dataGaps.gaps.slice(0, 3).map((gap: any) => (
                          <div
                            key={gap.dimensionId}
                            className="flex items-start justify-between p-3 bg-yellow-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-black">
                                  {gap.dimensionName}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    gap.priority === 'critical'
                                      ? 'bg-red-100 text-red-700'
                                      : gap.priority === 'high'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {gap.priority}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{gap.missingInfo[0]}</p>
                            </div>
                            <div className="text-xs text-gray-500 ml-2">
                              +{gap.potentialScoreIncrease}%
                            </div>
                          </div>
                        ))}
                        {dataGaps.totalGaps > 3 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{dataGaps.totalGaps - 3} more gaps
                          </p>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/chat')}
                        className="w-full mt-3 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                      >
                        Complete Missing Info
                      </motion.button>
                    </div>
                  )}

                  <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: analysisProgress.status === 'running' ? 1 : 1.02 }}
                      whileTap={{ scale: analysisProgress.status === 'running' ? 1 : 0.98 }}
                      className={`p-4 rounded-lg transition-colors text-left ${
                        analysisProgress.status === 'running'
                          ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => analysisProgress.status !== 'running' && router.push('/chat')}
                      disabled={analysisProgress.status === 'running'}
                    >
                      <MessageCircle className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Chat with Freja</h3>
                      <p className="text-xs text-gray-500">
                        {analysisProgress.status === 'running' ? 'Available after analysis' : 'Get instant advice'}
                      </p>
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
                  <p className="text-gray-600 mt-1">
                    Connect your tools to give Freja more context
                  </p>
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
                            <div
                              className={`w-2 h-2 rounded-full ${
                                integration.status === 'connected'
                                  ? 'bg-green-500'
                                  : integration.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-gray-300'
                              }`}
                            />
                            <span className="text-xs text-gray-500">
                              {integration.status === 'connected'
                                ? 'Connected'
                                : integration.status === 'error'
                                  ? 'Error'
                                  : 'Not connected'}
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
                        <span>
                          Last synced: {new Date(integration.lastSync).toLocaleDateString()}
                        </span>
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
                  transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                  className="inline-block minimal-box px-8 sm:px-16 py-8 sm:py-12 relative overflow-hidden"
                >
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50" />

                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 font-light uppercase tracking-wider relative z-10">
                    Investment Readiness
                  </p>

                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 sm:mb-6">
                    {/* Background circle */}
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 160 160"
                    >
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
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                      />
                    </svg>

                    {/* Score display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <span className="text-4xl sm:text-6xl font-bold text-black">
                          {readinessScore}
                        </span>
                        <div className="text-sm sm:text-lg text-gray-500 -mt-1 sm:-mt-2">
                          out of 10
                        </div>
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
                    {readinessScore > 3 &&
                      readinessScore <= 6 &&
                      'Making progress - keep pushing forward'}
                    {readinessScore > 6 &&
                      readinessScore <= 8 &&
                      'Almost there - fine-tune for investors'}
                    {readinessScore > 8 && 'Investment ready - time to connect!'}
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
                  className="px-6 py-3 bg-white text-black border border-gray-300 rounded-xl font-medium hover:border-black transition-colors inline-flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  View All 95 Dimensions
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
                  <h3 className="text-lg font-medium text-black mb-4">Profile Visibility</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-black">
                          Make profile visible to investors
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Allow verified VCs to see your company profile and analysis results
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          setPublishingProfile(true);
                          try {
                            const sessionId =
                              localStorage.getItem('frejfund-session-id') ||
                              localStorage.getItem('sessionId');
                            const response = await fetch('/api/profile/publish', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                sessionId,
                                isPublic: !isProfilePublic,
                              }),
                            });
                            if (response.ok) {
                              setIsProfilePublic(!isProfilePublic);
                            }
                          } catch (error) {
                            console.error('Failed to update profile visibility:', error);
                          } finally {
                            setPublishingProfile(false);
                          }
                        }}
                        disabled={publishingProfile}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          isProfilePublic ? 'bg-black' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            isProfilePublic ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </motion.button>
                    </div>
                    {isProfilePublic && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Your profile is now visible to investors on the VC dashboard
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Account</h3>
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      {editingEmail ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-800">New Email</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="new@email.com"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                            <button
                              onClick={async () => {
                                const sessionId =
                                  localStorage.getItem('frejfund-session-id') ||
                                  localStorage.getItem('sessionId');
                                const response = await fetch('/api/user/update-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ sessionId, newEmail }),
                                });
                                if (response.ok) {
                                  setUserEmail(newEmail);
                                  setEditingEmail(false);
                                  setNewEmail('');
                                }
                              }}
                              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingEmail(false);
                                setNewEmail('');
                              }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Email</p>
                            <p className="text-sm text-gray-500">{userEmail || 'Loading...'}</p>
                          </div>
                          <button
                            onClick={() => setEditingEmail(true)}
                            className="text-sm text-gray-600 hover:text-black transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Password (Magic Link Info) */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Authentication</p>
                        <p className="text-sm text-gray-500">Magic link login (passwordless)</p>
                      </div>
                      <button
                        onClick={() => router.push('/login')}
                        className="text-sm text-gray-600 hover:text-black transition-colors"
                      >
                        Send Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-black">Company Information</h3>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="text-sm text-gray-600 hover:text-black transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {editingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Founder Name</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Company Name</label>
                        <input
                          type="text"
                          value={profileForm.company}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, company: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Industry</label>
                          <input
                            type="text"
                            value={profileForm.industry}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, industry: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Stage</label>
                          <select
                            value={profileForm.stage}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, stage: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent mt-1"
                          >
                            <option value="">Select stage</option>
                            <option value="Idea">Idea</option>
                            <option value="Pre-seed">Pre-seed</option>
                            <option value="Seed">Seed</option>
                            <option value="Series A">Series A</option>
                            <option value="Series B+">Series B+</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Website</label>
                        <input
                          type="url"
                          value={profileForm.website}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, website: e.target.value })
                          }
                          placeholder="https://yourcompany.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Company Logo URL
                        </label>
                        <input
                          type="url"
                          value={profileForm.logo}
                          onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })}
                          placeholder="https://yourcompany.com/logo.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent mt-1"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={async () => {
                            const sessionId =
                              localStorage.getItem('frejfund-session-id') ||
                              localStorage.getItem('sessionId');
                            const response = await fetch('/api/user/update-profile', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId, updates: profileForm }),
                            });
                            if (response.ok) {
                              setEditingProfile(false);
                              // Refresh page to show updates
                              window.location.reload();
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingProfile(false)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Founder</span>
                        <span className="font-medium text-black">
                          {profileForm.name || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company</span>
                        <span className="font-medium text-black">
                          {profileForm.company || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Industry</span>
                        <span className="font-medium text-black">
                          {profileForm.industry || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stage</span>
                        <span className="font-medium text-black">
                          {profileForm.stage || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Website</span>
                        <span className="font-medium text-black truncate max-w-xs">
                          {profileForm.website || 'Not set'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Privacy & Security</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Two-factor authentication
                        </p>
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
