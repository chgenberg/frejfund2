'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailIngestModalProps {
  sessionId: string;
  onClose: () => void;
  onIngest?: (email: {
    subject?: string;
    from?: string;
    to?: string;
    date?: string;
    body?: string;
  }) => void;
}

export default function EmailIngestModal({ sessionId, onClose, onIngest }: EmailIngestModalProps) {
  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [body, setBody] = useState('');
  const [timeline, setTimeline] = useState<
    Array<{ subject?: string; from?: string; body?: string; date?: string }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const submitEmail = async () => {
    if (!subject && !body) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/ingest/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, emails: [{ subject, from, to, date, body }] }),
      });
      if (res.ok) {
        setTimeline((t) => [{ subject, from, body, date }, ...t]);
        onIngest?.({ subject, from, to, date, body });
        setSubject('');
        setFrom('');
        setTo('');
        setDate('');
        setBody('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-2xl border border-gray-200 shadow-lg"
        >
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-black">Inbox ingest</div>
            <button onClick={onClose} className="text-xs text-gray-600 hover:text-black">
              Close
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 gap-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="From"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
              />
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="To"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
              />
            </div>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Body"
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={submitEmail}
                disabled={submitting}
                className="text-xs bg-black text-white rounded px-3 py-2 hover:bg-gray-800 disabled:opacity-50"
              >
                Ingest
              </button>
            </div>
            <div className="mt-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">Timeline</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {timeline.length === 0 && (
                  <div className="text-xs text-gray-500">No messages ingested yet.</div>
                )}
                {timeline.map((m, i) => (
                  <div key={i} className="border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-900 font-medium">
                      {m.subject || '(no subject)'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {m.from} • {m.date}
                    </div>
                    <div className="text-[12px] text-gray-700 mt-1 line-clamp-3">{m.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
