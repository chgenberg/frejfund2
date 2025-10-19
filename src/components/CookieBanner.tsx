'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Consent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = 'ff_cookie_consent_v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState<Consent>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const save = (value: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, ts: Date.now() }));
      window.dispatchEvent(new Event('ff_cookie_consent_changed'));
    } catch {}
  };

  const acceptAll = () => {
    const v = { necessary: true, analytics: true, marketing: true };
    setConsent(v);
    save(v);
    setVisible(false);
  };

  const saveSelection = () => {
    save(consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-0 bottom-0 z-50"
      >
        <div className="mx-auto max-w-5xl m-4 p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              We use cookies to make FrejFund work and to improve it with analytics and marketing
              (optional). You can change your preferences anytime.
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 flex items-center gap-2">
                <input type="checkbox" checked disabled /> Necessary
              </label>
              <label className="text-xs text-gray-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent((c) => ({ ...c, analytics: e.target.checked }))}
                />
                Analytics
              </label>
              <label className="text-xs text-gray-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent((c) => ({ ...c, marketing: e.target.checked }))}
                />
                Marketing
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              onClick={saveSelection}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Save selection
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Accept all
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
