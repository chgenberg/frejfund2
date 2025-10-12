'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STAGES = ['pre_seed','seed','series_a','series_b','growth'];
const INDUSTRIES = ['saas','fintech','health tech','marketplace','deep_tech','consumer'];
const GEOS = ['nordics','europe','us','global'];

export default function VCPreferencesPage() {
  const [vcEmail, setVcEmail] = useState('');
  const [vcFirm, setVcFirm] = useState('');
  const [stages, setStages] = useState<string[]>(['seed','series_a']);
  const [industries, setIndustries] = useState<string[]>(['saas']);
  const [geographies, setGeographies] = useState<string[]>(['europe']);
  const [checkMin, setCheckMin] = useState<number | ''>('');
  const [checkMax, setCheckMax] = useState<number | ''>('');
  const [dealCriteria, setDealCriteria] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('vc-email') || '';
    const firm = localStorage.getItem('vc-firm') || '';
    setVcEmail(email);
    setVcFirm(firm);
    if (email) loadExisting(email);
  }, []);

  const loadExisting = async (email: string) => {
    try {
      const res = await fetch('/api/vc/preferences', { headers: { 'x-vc-email': email } });
      if (res.ok) {
        const data = await res.json();
        const p = data.preferences;
        if (p) {
          setVcFirm(p.vcFirm || '');
          setStages(p.stages || []);
          setIndustries(p.industries || []);
          setGeographies(p.geographies || []);
          setCheckMin(p.checkSizeMin ? Number(p.checkSizeMin) : '');
          setCheckMax(p.checkSizeMax ? Number(p.checkSizeMax) : '');
          setDealCriteria(p.dealCriteria || '');
        }
      }
    } catch {}
  };

  const toggle = (list: string[], val: string, setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val]);
  };

  const save = async () => {
    if (!vcEmail) { setStatus('Please login as VC first'); return; }
    setStatus('Saving...');
    try {
      const res = await fetch('/api/vc/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vcEmail,
          vcFirm,
          stages,
          industries,
          geographies,
          checkSizeMin: typeof checkMin === 'number' ? checkMin : undefined,
          checkSizeMax: typeof checkMax === 'number' ? checkMax : undefined,
          dealCriteria
        })
      });
      if (res.ok) {
        setStatus('Saved! Your deal flow will now be tailored.');
      } else {
        setStatus('Failed to save');
      }
    } catch {
      setStatus('Failed to save');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">Investment Preferences</h1>
            <p className="text-sm text-gray-600">Tune your deal flow</p>
          </div>
          <button onClick={()=>window.location.href='/vc'} className="px-4 py-2 bg-black text-white rounded-lg">Back</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input value={vcEmail} onChange={e=>setVcEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="you@vc.com" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Firm</label>
            <input value={vcFirm} onChange={e=>setVcFirm(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Your VC firm" />
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-black mb-2">Stages <span className="text-xs text-gray-500">(pick 1–3)</span></div>
          <div className="flex flex-wrap gap-2">
            {STAGES.map(s => (
              <button key={s} onClick={()=>toggle(stages, s, setStages)} className={`px-3 py-1.5 rounded-full border ${stages.includes(s)?'bg-black text-white border-black':'bg-white text-gray-700 border-gray-300 hover:border-black'}`}>{s}</button>
            ))}
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-black mb-2">Industries <span className="text-xs text-gray-500">(max 5)</span></div>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(s => (
              <button key={s} onClick={()=>toggle(industries, s, setIndustries)} className={`px-3 py-1.5 rounded-full border ${industries.includes(s)?'bg-black text-white border-black':'bg-white text-gray-700 border-gray-300 hover:border-black'}`}>{s}</button>
            ))}
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-black mb-2">Geography <span className="text-xs text-gray-500">(your focus)</span></div>
          <div className="flex flex-wrap gap-2">
            {GEOS.map(s => (
              <button key={s} onClick={()=>toggle(geographies, s, setGeographies)} className={`px-3 py-1.5 rounded-full border ${geographies.includes(s)?'bg-black text-white border-black':'bg-white text-gray-700 border-gray-300 hover:border-black'}`}>{s}</button>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600">Minimum check size (USD) <span className="text-xs text-gray-400">(e.g. 250000)</span></label>
            <input type="number" value={checkMin} onChange={e=>setCheckMin(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="250000" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Maximum check size (USD) <span className="text-xs text-gray-400">(e.g. 2000000)</span></label>
            <input type="number" value={checkMax} onChange={e=>setCheckMax(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="2000000" />
          </div>
        </section>

        <section>
          <label className="text-sm text-gray-600">Deal criteria</label>
          <textarea value={dealCriteria} onChange={e=>setDealCriteria(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Brief outline: team, traction, vertical, go-to-market…" />
          <div className="text-[11px] text-gray-500 mt-1">Tip: The clearer your criteria, the better the matching (e.g. "B2B SaaS, seed-A, EU, &gt;$50k MRR, sales-led").</div>
        </section>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">{status}</div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={save} className="px-6 py-3 bg-black text-white rounded-lg">Save Preferences</motion.button>
        </div>

        <div className="pt-6 border-t border-gray-200 text-sm text-gray-600">
          Your swipe feed will be filtered by these preferences.
        </div>
      </main>
    </div>
  );
}


