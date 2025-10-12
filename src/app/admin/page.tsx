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
