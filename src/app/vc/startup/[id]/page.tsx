'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Globe, Linkedin, FileText, TrendingUp, Users, 
  Target, DollarSign, Calendar, MapPin, CheckCircle, AlertCircle,
  BarChart3, Briefcase, Brain, Shield, Download, Mail, Clock,
  Building2, Sparkles, ChevronRight, Activity, Zap
} from 'lucide-react';

interface StartupProfile {
  id: string;
  name: string;
  companyName: string;
  location: {
    city: string;
    country: string;
  };
  industry: string;
  stage: string;
  raised: number;
  seeking: number;
  monthlyRevenue: number;
  teamSize: number;
  foundedYear: number;
  readinessScore: number;
  overallScore: number;
  oneLiner: string;
  website?: string;
  linkedIn?: string;
  pitchDeck?: string;
  metrics: {
    growth: number;
    retention: number;
    burnRate: number;
    unitEconomics: number;
    marketSize: number;
    productMarketFit: number;
  };
  dimensions: Array<{
    category: string;
    name: string;
    score: number;
    findings: string[];
    strengths: string[];
    redFlags: string[];
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
  traction: any;
}

export default function StartupProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [startup, setStartup] = useState<StartupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStartupProfile();
  }, [params.id]);

  const loadStartupProfile = async () => {
    try {
      const response = await fetch(`/api/vc/startup/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setStartup(data.startup);
      }
    } catch (error) {
      console.error('Error loading startup:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading startup profile...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Startup not found</p>
          <button
            onClick={() => router.push('/vc')}
            className="mt-4 text-black hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'analysis', label: 'Deep Analysis', icon: Brain },
    { id: 'team', label: 'Team & Execution', icon: Users },
    { id: 'risks', label: 'Risks & Insights', icon: Shield }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/vc')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-black">{startup.companyName}</h1>
                <p className="text-sm text-gray-600">{startup.oneLiner}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Action Buttons */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Request Intro</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Key Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(startup.readinessScore)}`}>
                {startup.readinessScore}
              </div>
              <div className="text-xs text-gray-600">Investment Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">
                ${(startup.seeking / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-gray-600">Seeking</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">
                ${(startup.monthlyRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-gray-600">MRR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{startup.metrics.growth}%
              </div>
              <div className="text-xs text-gray-600">Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{startup.stage}</div>
              <div className="text-xs text-gray-600">Stage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{startup.teamSize}</div>
              <div className="text-xs text-gray-600">Team Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Company Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Company Overview</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                      <p className="text-gray-600">{startup.oneLiner}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Industry</h3>
                        <p className="text-black font-medium">{startup.industry}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Founded</h3>
                        <p className="text-black font-medium">{startup.foundedYear}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Location</h3>
                        <p className="text-black font-medium flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {startup.location.city}, {startup.location.country}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Team Size</h3>
                        <p className="text-black font-medium">{startup.teamSize} people</p>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      {startup.website && (
                        <a
                          href={startup.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {startup.linkedIn && (
                        <a
                          href={startup.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {startup.pitchDeck && (
                        <a
                          href={startup.pitchDeck}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Pitch Deck</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Traction */}
                {startup.traction && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-black mb-4">Traction Highlights</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(startup.traction).map(([key, value]) => (
                        <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-black">{value as string}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Funding Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Funding Details</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Current Round</div>
                      <div className="text-xl font-bold text-black">{startup.stage}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Seeking</div>
                      <div className="text-xl font-bold text-black">
                        ${(startup.seeking / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    {startup.raised > 0 && (
                      <div>
                        <div className="text-sm text-gray-600">Previously Raised</div>
                        <div className="text-xl font-bold text-black">
                          ${(startup.raised / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Scores */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Key Scores</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Product-Market Fit</span>
                        <span className={`font-bold ${getScoreColor(startup.metrics.productMarketFit)}`}>
                          {startup.metrics.productMarketFit}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all"
                          style={{ width: `${startup.metrics.productMarketFit}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Unit Economics</span>
                        <span className={`font-bold ${getScoreColor(startup.metrics.unitEconomics)}`}>
                          {startup.metrics.unitEconomics}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all"
                          style={{ width: `${startup.metrics.unitEconomics}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Market Size</span>
                        <span className={`font-bold ${getScoreColor(startup.metrics.marketSize)}`}>
                          {startup.metrics.marketSize}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all"
                          style={{ width: `${startup.metrics.marketSize}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Financial Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-black mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Metrics
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Monthly Revenue (MRR)</div>
                    <div className="text-2xl font-bold text-black">
                      ${(startup.monthlyRevenue / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Burn Rate</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${(startup.metrics.burnRate / 1000).toFixed(0)}k/mo
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Runway</div>
                    <div className="text-2xl font-bold text-black">
                      {Math.round(startup.raised / startup.metrics.burnRate)} months
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-black mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Growth Metrics
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Monthly Growth</div>
                    <div className="text-2xl font-bold text-green-600">
                      +{startup.metrics.growth}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Customer Retention</div>
                    <div className="text-2xl font-bold text-black">
                      {startup.metrics.retention}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">CAC Payback</div>
                    <div className="text-2xl font-bold text-black">
                      {Math.round(12 / (startup.metrics.unitEconomics / 10))} months
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-black mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Market Position
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">TAM Score</div>
                    <div className="text-2xl font-bold text-black">
                      {startup.metrics.marketSize}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Competition Level</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      Medium
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Market Timing</div>
                    <div className="text-2xl font-bold text-green-600">
                      Good
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-black mb-4">
                  95-Point Deep Analysis Results
                </h2>
                <p className="text-gray-600 mb-6">
                  Comprehensive AI analysis across all business dimensions
                </p>
                
                {/* Analysis categories would go here */}
                <div className="text-center py-8">
                  <p className="text-gray-500">Full analysis breakdown coming soon...</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Team & Execution</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-black mb-2">Founder</h3>
                    <p className="text-gray-600">{startup.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-black mb-2">Team Size</h3>
                    <p className="text-gray-600">{startup.teamSize} full-time employees</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'risks' && (
            <motion.div
              key="risks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Critical Insights */}
              {startup.insights && startup.insights.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Key Insights</h2>
                  <div className="space-y-4">
                    {startup.insights.map((insight, index) => (
                      <div key={index} className="border-l-4 border-gray-300 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-black">{insight.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            insight.priority === 'high' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {insight.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
