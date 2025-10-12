'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [funnel, setFunnel] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [boostInvestorId, setBoostInvestorId] = useState('');
  const [boostRanking, setBoostRanking] = useState<number | ''>('');
  const [status, setStatus] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setFunnel(data.funnel);
      }
    } catch {}
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'intro_requests.csv'; a.click(); URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const doBoost = async () => {
    if (!boostInvestorId || typeof boostRanking !== 'number') { setStatus('Provide investorId and ranking'); return; }
    setStatus('Boosting...');
    try {
      const res = await fetch('/api/admin/boost', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorId: boostInvestorId, ranking: boostRanking })
      });
      setStatus(res.ok ? 'Boosted!' : 'Failed to boost');
    } catch {
      setStatus('Failed to boost');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-black">Admin Dashboard</h1>
          <button onClick={load} className="px-4 py-2 bg-black text-white rounded-lg">Refresh</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-black mb-3">Funnel</h2>
          {!funnel ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(funnel).map(([k,v]) => (
                <div key={k} className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-xs text-gray-500">{k}</div>
                  <div className="text-2xl font-bold text-black">{v as any}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-black mb-2">Export Intro Requests</div>
            <button onClick={doExport} disabled={exporting} className={`px-4 py-2 rounded-lg ${exporting ? 'bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'}`}>{exporting ? 'Exporting…' : 'Export CSV'}</button>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg">
            <div className="text-sm font-semibold text-black mb-2">Manual Boost (Investor Ranking)</div>
            <div className="flex items-center gap-2">
              <input value={boostInvestorId} onChange={e=>setBoostInvestorId(e.target.value)} placeholder="Investor ID" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" value={boostRanking} onChange={e=>setBoostRanking(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Ranking" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-28" />
              <button onClick={doBoost} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">Boost</button>
            </div>
            <div className="text-xs text-gray-600 mt-2">{status}</div>
          </div>
        </section>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building2, TrendingUp, Heart, Mail, Calendar,
  DollarSign, Target, RefreshCw, Eye
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading platform metrics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>Error loading stats</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">FrejFund Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform health & success metrics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold text-black">{stats.totalFounders}</span>
            </div>
            <div className="text-sm text-gray-600">Total Founders</div>
            <div className="text-xs text-green-600 mt-1">
              {stats.publicProfiles} public profiles
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold text-black">{stats.totalVCs}</span>
            </div>
            <div className="text-sm text-gray-600">Active VCs</div>
            <div className="text-xs text-blue-600 mt-1">
              {stats.activeVCs} swiped this week
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold text-black">{stats.totalSwipes}</span>
            </div>
            <div className="text-sm text-gray-600">Total Swipes</div>
            <div className="text-xs text-purple-600 mt-1">
              {stats.swipesThisWeek} this week
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold text-black">{stats.totalIntros}</span>
            </div>
            <div className="text-sm text-gray-600">Intro Requests</div>
            <div className="text-xs text-green-600 mt-1">
              {stats.acceptedIntros} accepted ({Math.round((stats.acceptedIntros / stats.totalIntros) * 100)}%)
            </div>
          </motion.div>
        </div>

        {/* Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Conversion Funnel</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Profiles Viewed</span>
                  <span className="text-sm font-bold text-black">{stats.totalSwipes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-black h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Liked</span>
                  <span className="text-sm font-bold text-black">{stats.totalLikes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-700 h-2 rounded-full" style={{ width: `${(stats.totalLikes / stats.totalSwipes) * 100}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{Math.round((stats.totalLikes / stats.totalSwipes) * 100)}% like rate</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Intro Requested</span>
                  <span className="text-sm font-bold text-black">{stats.totalIntros}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(stats.totalIntros / stats.totalSwipes) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Accepted</span>
                  <span className="text-sm font-bold text-green-700">{stats.acceptedIntros}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.acceptedIntros / stats.totalIntros) * 100}%` }}></div>
                </div>
                <div className="text-xs text-green-600 mt-1">{Math.round((stats.acceptedIntros / stats.totalIntros) * 100)}% acceptance rate</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Meetings Scheduled</span>
                  <span className="text-sm font-bold text-blue-700">{stats.meetingsScheduled}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.meetingsScheduled / stats.acceptedIntros) * 100}%` }}></div>
                </div>
                <div className="text-xs text-blue-600 mt-1">{Math.round((stats.meetingsScheduled / stats.acceptedIntros) * 100)}% meeting rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Revenue Potential</h3>
              <button
                onClick={loadStats}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue (MRR)</div>
                <div className="text-3xl font-bold text-black">${stats.mrr?.toLocaleString() || '0'}</div>
                <div className="text-xs text-gray-500 mt-1">Based on {stats.totalVCs} VCs @ avg $5k/mo</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">Annual Run Rate (ARR)</div>
                <div className="text-3xl font-bold text-green-600">${stats.arr?.toLocaleString() || '0'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Avg Deal Value</div>
                  <div className="text-lg font-bold text-black">$5k</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Potential ARR</div>
                  <div className="text-lg font-bold text-black">${(stats.totalVCs * 60).toLocaleString()}k</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-black mb-4">Platform Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg Session Length</div>
              <div className="text-2xl font-bold text-black">{stats.avgSessionMinutes || 0} min</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Swipes per VC</div>
              <div className="text-2xl font-bold text-black">{stats.avgSwipesPerVC || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Profile Completion</div>
              <div className="text-2xl font-bold text-black">{stats.avgProfileCompletion || 0}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Daily Active Users</div>
              <div className="text-2xl font-bold text-black">{stats.dailyActiveUsers || 0}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
