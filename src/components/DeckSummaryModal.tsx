'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeckSummaryModalProps {
  businessInfo: any;
  onClose: () => void;
}

export default function DeckSummaryModal({ businessInfo, onClose }: DeckSummaryModalProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/pitch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessInfo, deckText: text })
      });
      if (!res.ok) throw new Error('Pitch API failed');
      const json = await res.json(); setResult(json);
    } catch (e:any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const downloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='deck-summary.json'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <motion.div className="bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-lg" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}>
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-black">Pitch deck summary</div>
            <button onClick={onClose} className="text-xs text-gray-600 hover:text-black">Close</button>
          </div>
          <div className="p-5 space-y-4">
            <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Paste deck text or key slide content here..." className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black" rows={8} />
            <div className="flex justify-end gap-2">
              <button onClick={summarize} disabled={loading || !text.trim()} className="text-xs bg-black text-white rounded px-3 py-2 hover:bg-gray-800 disabled:opacity-50">Summarize</button>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            {result && (
              <div>
                <div className="text-xs text-gray-700 mb-2">Summary</div>
                <div className="text-sm text-gray-900 border border-gray-200 rounded p-3 whitespace-pre-wrap">{result.summary}</div>
                {Array.isArray(result.highlights) && result.highlights.length>0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-700 mb-1">Highlights</div>
                    <ul className="list-disc ml-5 text-sm text-gray-800">
                      {result.highlights.map((h:string,i:number)=>(<li key={i}>{h}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(result.faq) && result.faq.length>0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-700 mb-1">Investor FAQ</div>
                    <div className="space-y-2">
                      {result.faq.map((f:any,i:number)=>(
                        <div key={i} className="border border-gray-200 rounded p-2">
                          <div className="text-xs font-semibold text-black">Q: {f.q}</div>
                          <div className="text-sm text-gray-800">A: {f.a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  <button onClick={downloadJSON} className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50">Export JSON</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


