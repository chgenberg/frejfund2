'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, DollarSign, Building2, Calendar,
  ChevronLeft, Target, Activity, Globe, BarChart3
} from 'lucide-react';

export default function VCAnalytics() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30d');
  const [stats, setStats] = useState({
    totalDeals: 142,
    qualifiedDeals: 89,
    avgReadiness: 74,
    totalSeeking: 285000000,
    industries: [
      { name: 'B2B SaaS', count: 45, percentage: 32 },
      { name: 'Fintech', count: 28, percentage: 20 },
      { name: 'Health Tech', count: 23, percentage: 16 },
      { name: 'Climate Tech', count: 18, percentage: 13 },
      { name: 'E-commerce', count: 15, percentage: 11 },
      { name: 'Other', count: 13, percentage: 8 }
    ],
    stages: [
      { name: 'Pre-seed', count: 34, percentage: 24 },
      { name: 'Seed', count: 52, percentage: 37 },
      { name: 'Series A', count: 41, percentage: 29 },
      { name: 'Series B+', count: 15, percentage: 10 }
    ],
    countries: [
      { name: 'Sweden', count: 38 },
      { name: 'Germany', count: 31 },
      { name: 'UK', count: 27 },
      { name: 'France', count: 19 },
      { name: 'Netherlands', count: 14 },
      { name: 'Others', count: 13 }
    ]
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/vc')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-black">Deal Flow Analytics</h1>
                <p className="text-sm text-gray-600">Overview of investment opportunities</p>
              </div>
            </div>
            
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent appearance-none cursor-pointer hover:border-gray-400 transition-colors"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-green-600 font-medium">+12%</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.totalDeals}</div>
            <div className="text-sm text-gray-600">Total Companies</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-green-600 font-medium">+8%</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.qualifiedDeals}</div>
            <div className="text-sm text-gray-600">Qualified (70+ score)</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-green-600 font-medium">+5</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.avgReadiness}</div>
            <div className="text-sm text-gray-600">Avg Readiness Score</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-green-600 font-medium">+23%</span>
            </div>
            <div className="text-2xl font-bold text-black">
              ${(stats.totalSeeking / 1000000).toFixed(0)}M
            </div>
            <div className="text-sm text-gray-600">Total Seeking</div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Industry Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-black mb-4">Industries</h3>
            <div className="space-y-3">
              {stats.industries.map(industry => (
                <div key={industry.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{industry.name}</span>
                    <span className="font-medium">{industry.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-500"
                      style={{ width: `${industry.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stage Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-black mb-4">Funding Stages</h3>
            <div className="space-y-3">
              {stats.stages.map(stage => (
                <div key={stage.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{stage.name}</span>
                    <span className="font-medium">{stage.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gray-800 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Geographic Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="font-semibold text-black mb-4">Geography</h3>
            <div className="space-y-2">
              {stats.countries.map((country, index) => (
                <div key={country.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm text-gray-700">{country.name}</span>
                  </div>
                  <span className="text-sm font-medium text-black">{country.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Readiness Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="font-semibold text-black mb-4">Readiness Score Distribution</h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { range: '0-20', count: 8, color: 'bg-red-500' },
              { range: '21-40', count: 15, color: 'bg-orange-500' },
              { range: '41-60', count: 28, color: 'bg-yellow-500' },
              { range: '61-80', count: 52, color: 'bg-green-500' },
              { range: '81-100', count: 39, color: 'bg-green-600' }
            ].map(bucket => (
              <div key={bucket.range} className="text-center">
                <div className="relative h-32 flex items-end justify-center mb-2">
                  <div
                    className={`w-full ${bucket.color} rounded-t transition-all duration-500`}
                    style={{ height: `${(bucket.count / 52) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600">{bucket.range}</div>
                <div className="text-sm font-medium text-black">{bucket.count}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}