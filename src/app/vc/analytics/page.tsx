'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Clock, DollarSign, Users, Target,
  CheckCircle, XCircle, Calendar, ArrowLeft, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function VCAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const vcEmail = localStorage.getItem('vc-email');
    
    if (!vcEmail) {
      router.push('/vc');
      return;
    }

    try {
      const response = await fetch('/api/vc/analytics', {
        headers: { 'x-vc-email': vcEmail }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/vc')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black">Your Analytics</h1>
              <p className="text-sm text-gray-600">Performance metrics & ROI</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold text-black">{analytics.overview.totalSwipes}</span>
            </div>
            <div className="text-sm text-gray-600">Profiles Viewed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{analytics.overview.likes}</span>
            </div>
            <div className="text-sm text-gray-600">Liked ({analytics.overview.likeRate})</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">{analytics.meetings.scheduled}</span>
            </div>
            <div className="text-sm text-gray-600">Meetings Booked</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-3xl font-bold text-purple-600">{analytics.efficiency.timeSavedHours}h</span>
            </div>
            <div className="text-sm text-gray-600">Time Saved</div>
          </motion.div>
        </div>

        {/* ROI Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
          className="bg-black rounded-xl p-8 text-white mb-8 relative overflow-hidden border-2 border-gray-800"
        >
          {/* Subtle animated background */}
          <motion.div
            className="absolute inset-0 opacity-5"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
              backgroundSize: '40px 40px'
            }}
          />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Value Generated</h2>
              </div>
              <p className="text-gray-400 mb-4 relative z-10">
                Estimated time saved based on manual screening
              </p>
              <motion.div 
                className="text-5xl font-bold mb-2 relative z-10"
                animate={{ 
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {analytics.efficiency.valueSaved}
              </motion.div>
              <div className="text-sm text-gray-400 relative z-10">
                {analytics.efficiency.timeSavedHours} hours @ $500/hour partner time
              </div>
            </div>
            <div className="text-right relative z-10">
              <div className="text-sm text-gray-400 mb-1">Avg screening time</div>
              <div className="text-2xl font-bold">{analytics.efficiency.avgSwipeTime}</div>
              <div className="text-xs text-gray-500">vs {analytics.efficiency.vsManualScreening} manually</div>
            </div>
          </div>
        </motion.div>

        {/* Performance vs Benchmarks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Like Rate</h3>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-3xl font-bold text-black">{analytics.benchmarks.yourLikeRate}%</div>
                <div className="text-xs text-gray-500">Your rate</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-gray-400">{analytics.benchmarks.avgLikeRate}%</div>
                <div className="text-xs text-gray-500">Average</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              {analytics.benchmarks.yourLikeRate > analytics.benchmarks.avgLikeRate ? '↑ Above average' : '→ On par'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Acceptance Rate</h3>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-3xl font-bold text-black">{analytics.benchmarks.yourAcceptanceRate}%</div>
                <div className="text-xs text-gray-500">Your rate</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-gray-400">{analytics.benchmarks.avgAcceptanceRate}%</div>
                <div className="text-xs text-gray-500">Average</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              {analytics.benchmarks.yourAcceptanceRate > analytics.benchmarks.avgAcceptanceRate ? '↑ Above average' : '↓ Room to improve'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Meeting Rate</h3>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-3xl font-bold text-black">{analytics.benchmarks.yourMeetingRate}%</div>
                <div className="text-xs text-gray-500">Your rate</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-gray-400">{analytics.benchmarks.avgMeetingRate}%</div>
                <div className="text-xs text-gray-500">Average</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              {analytics.benchmarks.yourMeetingRate > analytics.benchmarks.avgMeetingRate ? '↑ Excellent' : '→ Good'}
            </div>
          </motion.div>
        </div>

        {/* Pipeline Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-black mb-4">Intro Pipeline</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-900">Pending Response</span>
                <span className="text-2xl font-bold text-yellow-700">{analytics.intros.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Accepted</span>
                <span className="text-2xl font-bold text-green-700">{analytics.intros.accepted}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Meetings Scheduled</span>
                <span className="text-2xl font-bold text-blue-700">{analytics.meetings.scheduled}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Declined</span>
                <span className="text-2xl font-bold text-gray-500">{analytics.intros.declined}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-black mb-4">ROI Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Time saved per profile</span>
                  <span className="text-sm font-bold text-black">14.25 min</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">95% faster than manual</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Quality of matches</span>
                  <span className="text-sm font-bold text-black">{analytics.overview.likeRate}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${parseInt(analytics.overview.likeRate)}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Of profiles match your criteria</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Founder acceptance</span>
                  <span className="text-sm font-bold text-black">{analytics.intros.acceptanceRate}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${parseInt(analytics.intros.acceptanceRate)}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Founders accept your intro requests</div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total Value</span>
                  <span className="text-2xl font-bold text-green-600">{analytics.efficiency.valueSaved}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Based on {analytics.efficiency.timeSavedHours} hours saved</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.01 }}
          className="bg-gray-900 rounded-xl p-6 text-white border-2 border-gray-800 relative overflow-hidden"
        >
          {/* Animated corner accent */}
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-2 relative z-10">AI Insights</h3>
              <ul className="space-y-1 text-sm text-gray-300 relative z-10">
                <li>• You're {analytics.benchmarks.yourLikeRate > analytics.benchmarks.avgLikeRate ? 'more selective' : 'less selective'} than average VCs</li>
                <li>• Your acceptance rate is {analytics.benchmarks.yourAcceptanceRate}% ({analytics.benchmarks.yourAcceptanceRate > analytics.benchmarks.avgAcceptanceRate ? 'above' : 'below'} average)</li>
                <li>• FrejFund saves you ~{Math.round(analytics.efficiency.timeSavedHours / 4)} hours per week</li>
                <li>• That's equivalent to {Math.round(analytics.efficiency.timeSavedHours / 40)} full work weeks saved</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
