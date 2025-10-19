'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';

interface KpiUploadModalProps {
  onClose: () => void;
  initialCsv?: string;
}

type KpiRow = {
  date: string;
  mrr: number;
  new_customers: number;
  churned_customers: number;
  arpa: number;
  cac: number;
  marketing_spend: number;
};

export default function KpiUploadModal({ onClose, initialCsv }: KpiUploadModalProps) {
  const [rows, setRows] = useState<KpiRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Parse initial CSV on mount if provided
  useState(() => {
    if (initialCsv) {
      try {
        const r = Papa.parse(initialCsv, { header: true, skipEmptyLines: true }) as any;
        const data = (r.data as any[])
          .map((d: any) => ({
            date: String(d.date || ''),
            mrr: Number(d.mrr || 0),
            new_customers: Number(d.new_customers || 0),
            churned_customers: Number(d.churned_customers || 0),
            arpa: Number(d.arpa || 0),
            cac: Number(d.cac || 0),
            marketing_spend: Number(d.marketing_spend || 0),
          }))
          .filter((x: any) => x.date);
        setRows(data);
      } catch {}
    }
  });

  const parseFile = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        try {
          const r = (res.data as any[]).map((d) => ({
            date: String(d.date || d.Date || ''),
            mrr: Number(d.mrr || d.MRR || 0),
            new_customers: Number(d.new_customers || d.New || d.new || 0),
            churned_customers: Number(d.churned_customers || d.Churn || d.churn || 0),
            arpa: Number(d.arpa || d.ARPA || 0),
            cac: Number(d.cac || d.CAC || 0),
            marketing_spend: Number(d.marketing_spend || d.Marketing || 0),
          }));
          setRows(r.filter((x) => x.date));
        } catch (e) {
          setError('Could not parse CSV');
        }
      },
      error: () => setError('CSV read error'),
    });
  };

  const metrics = computeMetrics(rows);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-lg"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-black">KPI CSV</div>
            <button onClick={onClose} className="text-xs text-gray-600 hover:text-black">
              Close
            </button>
          </div>
          <div className="p-5 space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseFile(f);
              }}
              className="text-sm"
            />
            {error && <div className="text-xs text-red-600">{error}</div>}
            {rows.length > 0 && (
              <div>
                <div className="text-xs text-gray-700 mb-2">Computed metrics</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <Metric label="MRR (last)" value={`€${metrics.lastMRR.toLocaleString()}`} />
                  <Metric label="Churn % (avg)" value={`${(metrics.avgChurn * 100).toFixed(1)}%`} />
                  <Metric label="CAC (avg)" value={`€${metrics.avgCAC.toFixed(0)}`} />
                  <Metric label="ARPA (avg)" value={`€${metrics.avgARPA.toFixed(0)}`} />
                  <Metric label="LTV (est)" value={`€${metrics.ltv.toFixed(0)}`} />
                  <Metric label="Payback (mo)" value={`${metrics.paybackMonths.toFixed(1)}`} />
                  <Metric label="New/mo (avg)" value={`${metrics.avgNew.toFixed(1)}`} />
                  <Metric label="Churn/mo (avg)" value={`${metrics.avgChurnCount.toFixed(1)}`} />
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  <button
                    className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                    onClick={() => downloadCSV(rows)}
                  >
                    Export CSV
                  </button>
                  <button
                    className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                    onClick={() => downloadJSON(rows)}
                  >
                    Export JSON
                  </button>
                </div>
                <div className="mt-3 max-h-56 overflow-y-auto border border-gray-200 rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        {[
                          'date',
                          'mrr',
                          'new_customers',
                          'churned_customers',
                          'arpa',
                          'cac',
                          'marketing_spend',
                        ].map((h) => (
                          <th key={h} className="px-2 py-1 border-b text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="odd:bg-white even:bg-gray-50">
                          <td className="px-2 py-1 border-b">{r.date}</td>
                          <td className="px-2 py-1 border-b">{r.mrr}</td>
                          <td className="px-2 py-1 border-b">{r.new_customers}</td>
                          <td className="px-2 py-1 border-b">{r.churned_customers}</td>
                          <td className="px-2 py-1 border-b">{r.arpa}</td>
                          <td className="px-2 py-1 border-b">{r.cac}</td>
                          <td className="px-2 py-1 border-b">{r.marketing_spend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded p-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-black">{value}</div>
    </div>
  );
}

function computeMetrics(rows: KpiRow[]) {
  if (rows.length === 0)
    return {
      lastMRR: 0,
      avgChurn: 0,
      avgCAC: 0,
      avgARPA: 0,
      ltv: 0,
      paybackMonths: 0,
      avgNew: 0,
      avgChurnCount: 0,
    };
  const lastMRR = rows[rows.length - 1].mrr || 0;
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const avgChurnCount = avg(rows.map((r) => r.churned_customers));
  const avgNew = avg(rows.map((r) => r.new_customers));
  const avgARPA = avg(rows.map((r) => r.arpa));
  const avgCAC = avg(rows.map((r) => r.cac));
  const avgCustomers = avg(rows.map((r) => r.mrr / (r.arpa || 1)));
  const avgChurnRate = avgCustomers > 0 ? avgChurnCount / avgCustomers : 0;
  const ltv = avgARPA * (1 / (avgChurnRate || 0.0001));
  const paybackMonths = avgCAC / (avgARPA || 1);
  return {
    lastMRR,
    avgChurn: avgChurnRate,
    avgCAC,
    avgARPA,
    ltv,
    paybackMonths,
    avgNew,
    avgChurnCount,
  };
}

function downloadCSV(rows: KpiRow[]) {
  const headers = [
    'date',
    'mrr',
    'new_customers',
    'churned_customers',
    'arpa',
    'cac',
    'marketing_spend',
  ];
  const table = [headers, ...rows.map((r) => headers.map((h) => (r as any)[h]))];
  const csv = table
    .map((r) => r.map((x) => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kpi.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(rows: KpiRow[]) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kpi.json';
  a.click();
  URL.revokeObjectURL(url);
}
